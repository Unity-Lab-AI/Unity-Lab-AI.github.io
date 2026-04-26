/**
 * Password reset flow.
 *
 *   1. Founder OWNER mints a reset for another admin via POST /api/auth/password/reset
 *      → returns one-shot URL (24h TTL)
 *   2. Founder shares URL out-of-band (Signal/in-person)
 *   3. Target admin opens URL in browser → loads /admin/reset.html?token=...
 *   4. reset.html GETs /api/auth/password/reset/:token/check to learn whose account
 *      it's for + verify token still valid
 *   5. Admin enters new password → POST /api/auth/password/reset/:token/consume
 *      → password updated + session issued + redirected to dashboard
 *
 * The reset path also INVALIDATES all existing sessions for that user (force re-login on
 * other devices) — covers the compromise-recovery use case.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { isAllowedAdmin } from '../config/admin_allowlist.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { setUserPassword, validatePasswordStrength } from '../auth/password.js';
import { createSession } from '../auth/session.js';
import { emitAudit } from '../middleware/audit.js';
import { logger } from '../lib/logger.js';

export function mountPasswordReset(app: Hono, env: AppEnv, db: DbConn): void {
  // OWNER mints a reset URL for a target admin
  app.post('/api/auth/password/reset', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    if (s.role !== 'OWNER') return c.json({ error: 'forbidden_owner_only' }, 403);

    let body: { email?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    const email = body.email?.trim().toLowerCase();
    if (!email || !isAllowedAdmin(email)) return c.json({ error: 'email_not_allowed' }, 400);

    const target = db.prepare('SELECT id, email FROM users WHERE email = ? LIMIT 1').get(email) as { id: string; email: string } | undefined;
    if (!target) return c.json({ error: 'user_not_found', message: 'That admin has not been claimed yet.' }, 404);

    // Invalidate any outstanding resets for this user
    db.prepare('UPDATE password_resets SET consumed_at = datetime(\'now\'), consumed_ip = \'superseded\' WHERE target_user_id = ? AND consumed_at IS NULL').run(target.id);

    const id = randomToken(16);
    const rawToken = randomToken(32);
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO password_resets (id, target_user_id, token_hash, minted_by, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, target.id, tokenHash, s.user_id, expiresAt);

    emitAudit(db, c, {
      action: 'password_reset.mint',
      actor_user_id: s.user_id,
      target_type: 'user',
      target_id: target.id,
      payload: { for_email: target.email },
    });

    const url = `${env.PUBLIC_BASE_URL}/admin/reset.html?token=${encodeURIComponent(rawToken)}`;
    return c.json({
      url,
      target_email: target.email,
      expires_at: expiresAt,
      message: 'Share this URL with the target admin out-of-band. Single-use, 24h TTL.',
    });
  });

  // Check a token's validity + return whose account it's for (used by reset.html)
  app.get('/api/auth/password/reset/:token/check', (c) => {
    const raw = c.req.param('token');
    if (!raw) return c.json({ error: 'missing_token' }, 400);
    const row = db.prepare(`
      SELECT pr.id, pr.target_user_id, pr.expires_at, pr.consumed_at, u.email
      FROM password_resets pr
      JOIN users u ON u.id = pr.target_user_id
      WHERE pr.token_hash = ? LIMIT 1
    `).get(sha256(raw)) as { id: string; target_user_id: string; expires_at: string; consumed_at: string | null; email: string } | undefined;
    if (!row) return c.json({ valid: false, reason: 'invalid_token' });
    if (row.consumed_at) return c.json({ valid: false, reason: 'already_used' });
    if (new Date(row.expires_at).getTime() < Date.now()) return c.json({ valid: false, reason: 'expired' });
    return c.json({ valid: true, email: row.email });
  });

  // Consume the reset: validate, update password, invalidate other sessions, issue new session
  app.post('/api/auth/password/reset/:token/consume', async (c) => {
    const raw = c.req.param('token');
    if (!raw) return c.json({ error: 'missing_token' }, 400);
    let body: { password?: string; remember_me?: boolean };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.password) return c.json({ error: 'password_required' }, 400);
    const v = validatePasswordStrength(body.password);
    if (!v.ok) return c.json({ error: 'weak_password', reason: v.reason }, 400);

    const row = db.prepare(`
      SELECT pr.id, pr.target_user_id, pr.expires_at, pr.consumed_at, u.email, u.role
      FROM password_resets pr
      JOIN users u ON u.id = pr.target_user_id
      WHERE pr.token_hash = ? LIMIT 1
    `).get(sha256(raw)) as { id: string; target_user_id: string; expires_at: string; consumed_at: string | null; email: string; role: 'OWNER'|'SUPERVISOR'|'WORKER'|'OBSERVER' } | undefined;

    if (!row) return c.json({ error: 'invalid_token' }, 401);
    if (row.consumed_at) return c.json({ error: 'already_used' }, 401);
    if (new Date(row.expires_at).getTime() < Date.now()) return c.json({ error: 'expired' }, 401);

    db.transaction(() => {
      // Mark token consumed
      db.prepare(`
        UPDATE password_resets SET consumed_at = datetime('now'), consumed_ip = ?, consumed_ua = ?
        WHERE id = ?
      `).run(
        c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
        c.req.header('user-agent') ?? null,
        row.id,
      );

      // Update password
      setUserPassword(db, row.target_user_id, body.password!);

      // Invalidate ALL existing sessions for this user (force other devices to re-login)
      db.prepare(`
        UPDATE sessions SET revoked_at = datetime('now'), revoke_reason = 'password_reset'
        WHERE user_id = ? AND revoked_at IS NULL
      `).run(row.target_user_id);
    })();

    // Issue a fresh session for the user who just reset
    await createSession(c, db, env, {
      id: row.target_user_id,
      email: row.email,
      role: row.role,
    }, { rememberMe: !!body.remember_me });

    emitAudit(db, c, {
      action: 'password_reset.consume',
      actor_user_id: row.target_user_id,
      target_type: 'user',
      target_id: row.target_user_id,
    });

    logger.info({ user_id: row.target_user_id }, 'password reset consumed');

    return c.json({
      ok: true,
      user: { id: row.target_user_id, email: row.email, role: row.role },
    });
  });

  // List outstanding resets (OWNER only — for the dashboard)
  app.get('/api/auth/password/reset', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    if (s.role !== 'OWNER') return c.json({ error: 'forbidden_owner_only' }, 403);
    const resets = db.prepare(`
      SELECT pr.id, u.email, pr.minted_at, pr.expires_at, pr.consumed_at
      FROM password_resets pr
      JOIN users u ON u.id = pr.target_user_id
      ORDER BY pr.minted_at DESC LIMIT 50
    `).all();
    return c.json({ resets });
  });
}
