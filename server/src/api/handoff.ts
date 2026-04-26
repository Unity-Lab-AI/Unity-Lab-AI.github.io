/**
 * /api/auth/handoff — single-use browser handoff for CLI-authenticated sessions.
 *
 * Use case: the .claude/ setup wizard claims an account via /api/auth/claim, gets a
 * session cookie, but the cookie is in the CLI's HTTP client — not in the user's browser.
 * The setup wizard calls POST /api/auth/handoff to mint a one-shot token, then
 * shell-opens GET /api/auth/handoff/:token in the user's default browser. The GET
 * exchanges the token for a fresh browser session cookie + 302-redirects to the dashboard.
 *
 * Token TTL: 60 seconds, single-use, bound to the originating user.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { createSession } from '../auth/session.js';
import { emitAudit } from '../middleware/audit.js';
import { logger } from '../lib/logger.js';

interface PendingHandoff {
  token_hash: string;
  user_id: string;
  email: string;
  role: 'OWNER' | 'SUPERVISOR' | 'WORKER' | 'OBSERVER';
  expires_at: number;
}

// In-memory store (60s TTL, low volume — no DB needed)
const pending = new Map<string, PendingHandoff>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pending.entries()) {
    if (v.expires_at < now) pending.delete(k);
  }
}, 30_000).unref();

export function mountHandoff(app: Hono, env: AppEnv, db: DbConn): void {
  // Mint a handoff URL — requires existing session (the CLI's session)
  app.post('/api/auth/handoff', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);

    const rawToken = randomToken(32);
    const tokenHash = sha256(rawToken);
    pending.set(tokenHash, {
      token_hash: tokenHash,
      user_id: s.user_id,
      email: s.email,
      role: s.role,
      expires_at: Date.now() + 60_000,
    });

    emitAudit(db, c, {
      action: 'handoff.mint',
      actor_user_id: s.user_id,
      payload: { ttl_sec: 60 },
    });

    const url = `${env.PUBLIC_BASE_URL}/api/auth/handoff/${rawToken}`;
    return c.json({ url, expires_in_sec: 60 });
  });

  // Consume — user clicks the URL in their browser, gets a session cookie + redirect
  app.get('/api/auth/handoff/:token', async (c) => {
    const raw = c.req.param('token');
    if (!raw) return c.text('missing token', 400);
    const hash = sha256(raw);
    const entry = pending.get(hash);
    if (!entry) return c.text('handoff token invalid or expired', 401);
    pending.delete(hash); // single-use
    if (entry.expires_at < Date.now()) return c.text('handoff token expired', 401);

    await createSession(c, db, env, {
      id: entry.user_id,
      email: entry.email,
      role: entry.role,
    }, { rememberMe: true });

    emitAudit(db, c, {
      action: 'handoff.consume',
      actor_user_id: entry.user_id,
      payload: { from: 'browser_landing' },
    });

    logger.info({ user_id: entry.user_id }, 'handoff consumed; browser session issued');
    return c.redirect('/admin/dashboard.html');
  });
}
