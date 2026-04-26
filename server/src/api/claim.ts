/**
 * /api/auth/claim — universal admin account claim flow.
 *
 * Trust model (per founder decision 2026-04-25, "I trust everyone"):
 *
 *   - The universal `.claude/` template is distributed PRIVATELY to the 4 trusted admins
 *     (Signal/in-person). It is NEVER on the public GitHub repo (.claude/ is gitignored).
 *   - On first run, the .claude/ setup wizard asks "which admin are you?" then "set password",
 *     then calls POST /api/auth/claim with email + password.
 *   - The backend allows the claim if EITHER:
 *       (a) ADMIN_CLAIM_OPEN=true (founder's claim window is open), OR
 *       (b) it's the bootstrap claim (no users exist in DB yet — founder's first claim)
 *     AND email is in ADMIN_ALLOWLIST AND no ACTIVE user already holds that email.
 *   - Founder turns ADMIN_CLAIM_OPEN OFF after all 4 admins are enrolled.
 *
 * Why no per-admin token: with 4 trusted people and a privately-distributed `.claude/`,
 * the act of receiving + running `.claude/` IS the trust gate. No additional secret to manage.
 *
 * Why a window-toggle instead of leaving it open forever: defense-in-depth. If the .claude/
 * template ever leaks publicly AND ADMIN_CLAIM_OPEN is true, an attacker could race to claim
 * an unclaimed identity. Closing the window after enrollment shuts that path entirely.
 *
 * Browser portal does NOT show a claim form. Claim is .claude/-only.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { isAllowedAdmin, ADMIN_DISPLAY } from '../config/admin_allowlist.js';
import { randomToken } from '../lib/crypto.js';
import { createSession } from '../auth/session.js';
import { setUserPassword, validatePasswordStrength } from '../auth/password.js';
import { emitAudit } from '../middleware/audit.js';
import { logger } from '../lib/logger.js';

export function mountClaim(app: Hono, env: AppEnv, db: DbConn): void {
  // Status endpoint — UI uses this to know whether claiming is currently allowed
  app.get('/api/auth/claim/status', (c) => {
    const userCount = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
    const isBootstrap = userCount === 0;
    const claimAllowed = env.ADMIN_CLAIM_OPEN || env.DEV_AUTH_BYPASS || isBootstrap;
    return c.json({
      claim_allowed: claimAllowed,
      bootstrap_mode: isBootstrap,
      window_open: env.ADMIN_CLAIM_OPEN,
      dev_bypass: env.DEV_AUTH_BYPASS,
      unclaimed_admins: getUnclaimedAdmins(db),
    });
  });

  // CLAIM: bootstrap-or-window-open + email in allowlist + email unclaimed
  app.post('/api/auth/claim', async (c) => {
    let body: { email?: string; password?: string; remember_me?: boolean };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password) return c.json({ error: 'missing_email_or_password' }, 400);
    if (!isAllowedAdmin(email)) return c.json({ error: 'email_not_allowed' }, 400);
    const v = validatePasswordStrength(password);
    if (!v.ok) return c.json({ error: 'weak_password', reason: v.reason }, 400);

    // Check if email already claimed FIRST — return 'already_claimed' regardless of window
    // state so the .claude/ claim script can fall through to /api/auth/password/login.
    // (Otherwise an enrolled admin re-running setup would get blocked by the closed window.)
    const existing = db.prepare('SELECT id, status FROM users WHERE email = ? LIMIT 1').get(email) as { id: string; status: string } | undefined;
    if (existing && existing.status === 'ACTIVE') {
      return c.json({ error: 'already_claimed', message: 'This admin is already enrolled. Use Sign in instead.' }, 409);
    }

    // Determine if a NEW claim is allowed (window open / dev bypass / first-ever claim)
    const userCount = (db.prepare('SELECT COUNT(*) as n FROM users').get() as { n: number }).n;
    const isBootstrap = userCount === 0;
    const claimAllowed = env.ADMIN_CLAIM_OPEN || env.DEV_AUTH_BYPASS || isBootstrap;

    if (!claimAllowed) {
      emitAudit(db, c, { action: 'claim.window_closed', payload: { email } });
      return c.json({
        error: 'claim_window_closed',
        message: 'Account claiming is disabled. Ask the founder admin to set ADMIN_CLAIM_OPEN=true.',
      }, 403);
    }

    let userId: string;
    if (existing) {
      // Re-activate suspended user (rare, OWNER decision implied via opening claim window)
      userId = existing.id;
      db.prepare(`UPDATE users SET status = 'ACTIVE', removed_at = NULL, suspended_at = NULL WHERE id = ?`).run(userId);
    } else {
      userId = randomToken(16);
      const handle = ADMIN_DISPLAY[email as keyof typeof ADMIN_DISPLAY]?.handle ?? email.split('@')[0];
      db.prepare(`
        INSERT INTO users (id, email, name, role, status) VALUES (?, ?, ?, 'OWNER', 'ACTIVE')
      `).run(userId, email, handle);
    }

    // Set their password
    setUserPassword(db, userId, password);

    // Issue session
    const user = { id: userId, email, role: 'OWNER' as const };
    await createSession(c, db, env, user, { rememberMe: !!body.remember_me });

    emitAudit(db, c, {
      action: isBootstrap ? 'claim.bootstrap_success' : 'claim.success',
      actor_user_id: userId,
      payload: { email, bootstrap: isBootstrap, window_open: env.ADMIN_CLAIM_OPEN },
    });

    logger.info({ email, bootstrap: isBootstrap }, 'admin account claimed');

    return c.json({
      ok: true,
      bootstrap: isBootstrap,
      user: { id: userId, email, role: 'OWNER' },
      next: 'session_issued',
    });
  });

  // Toggle claim window (OWNER only) — UI button for founder to open/close
  app.post('/api/auth/claim/window', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    if (s.role !== 'OWNER') return c.json({ error: 'forbidden_owner_only' }, 403);
    let body: { open?: boolean };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    // We can't actually mutate process.env permanently from a request — this is a session-lifetime toggle.
    // For persistence across restarts, founder must edit server/.env.
    // This endpoint changes runtime behaviour by writing to process.env (which env.ts re-reads as needed).
    process.env.ADMIN_CLAIM_OPEN = body.open ? 'true' : 'false';
    env.ADMIN_CLAIM_OPEN = !!body.open;
    emitAudit(db, c, {
      action: body.open ? 'claim.window_opened' : 'claim.window_closed_by_owner',
      actor_user_id: s.user_id,
    });
    return c.json({
      ok: true,
      window_open: env.ADMIN_CLAIM_OPEN,
      reminder: 'Edit server/.env to make this persistent across restarts.',
    });
  });
}

function getUnclaimedAdmins(db: DbConn): string[] {
  const claimed = new Set(
    db.prepare("SELECT email FROM users WHERE status = 'ACTIVE'").all().map((r: any) => r.email as string),
  );
  // Reference the allowlist directly by importing — avoid circular import by just enumerating known emails
  return ['sponge@unityailab.com', 'gee@unityailab.com', 'red@unityailab.com', 'alfreddo@unityailab.com']
    .filter((e) => !claimed.has(e));
}
