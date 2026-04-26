/**
 * /api/auth/* — login, callback, logout, whoami.
 * Dev mode: dev-bypass picker. Prod mode: Google OAuth + WebAuthn.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { listDevAdmins, getOrCreateDevUser } from '../auth/dev_bypass.js';
import { createSession, revokeSession, clearSessionCookie } from '../auth/session.js';
import { initiateGoogleOAuth, handleGoogleCallback } from '../auth/oauth.js';
import { setUserPassword, attemptPasswordLogin, validatePasswordStrength } from '../auth/password.js';
import { emitAudit } from '../middleware/audit.js';
import { logger } from '../lib/logger.js';

/**
 * Dev-bypass MUST be gated on TWO conditions:
 *   1. DEV_AUTH_BYPASS=true (env var)
 *   2. Request comes from localhost (no Cloudflare/proxy headers indicating tunneled traffic)
 *
 * Reason: even if env var is left on by mistake when the backend is exposed via a Cloudflare
 * Tunnel (or any reverse proxy), the dev login picker MUST NOT be reachable from the public
 * internet. Anyone who finds the URL would otherwise be able to log in as any of the 4 admins.
 */
function isLocalhostRequest(c: import('hono').Context): boolean {
  // If any of these headers are present, the request came through a proxy/tunnel — NOT localhost.
  const proxyHeaders = ['cf-connecting-ip', 'cf-ray', 'x-forwarded-for', 'x-real-ip', 'x-forwarded-host'];
  for (const h of proxyHeaders) {
    if (c.req.header(h)) return false;
  }
  // Host header should be localhost or 127.0.0.1
  const host = (c.req.header('host') ?? '').toLowerCase();
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('[::1]')) {
    return true;
  }
  return false;
}

export function mountAuth(app: Hono, env: AppEnv, db: DbConn): void {
  // Dev-bypass: list available admins for the dev login picker.
  // Gated on env var AND localhost-only request.
  app.get('/api/auth/dev/admins', (c) => {
    if (!env.DEV_AUTH_BYPASS) return c.json({ error: 'dev_bypass_disabled' }, 404);
    if (!isLocalhostRequest(c)) return c.json({ error: 'dev_bypass_localhost_only' }, 403);
    return c.json({ admins: listDevAdmins() });
  });

  // Dev-bypass: log in as a chosen admin (localhost-only)
  app.post('/api/auth/dev/login', async (c) => {
    if (!env.DEV_AUTH_BYPASS) return c.json({ error: 'dev_bypass_disabled' }, 404);
    if (!isLocalhostRequest(c)) return c.json({ error: 'dev_bypass_localhost_only' }, 403);
    let body: { email?: string; remember_me?: boolean };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    if (!body.email) return c.json({ error: 'email_required' }, 400);
    try {
      const user = getOrCreateDevUser(db, body.email);
      await createSession(c, db, env, user, { rememberMe: !!body.remember_me });
      emitAudit(db, c, {
        action: 'login.dev_bypass.success',
        actor_user_id: user.id,
        payload: { email: user.email, remember_me: !!body.remember_me },
      });
      return c.json({ ok: true, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'dev_bypass login failed');
      return c.json({ error: 'login_failed', message: (err as Error).message }, 400);
    }
  });

  // Password fallback: SET (requires existing session)
  app.post('/api/auth/password/set', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    let body: { password?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.password) return c.json({ error: 'password_required' }, 400);
    const v = validatePasswordStrength(body.password);
    if (!v.ok) return c.json({ error: 'weak_password', reason: v.reason }, 400);
    try {
      setUserPassword(db, s.user_id, body.password);
      emitAudit(db, c, { action: 'password.set', actor_user_id: s.user_id });
      return c.json({ ok: true });
    } catch (err) {
      return c.json({ error: 'set_failed', message: (err as Error).message }, 400);
    }
  });

  // Password fallback: LOGIN
  app.post('/api/auth/password/login', async (c) => {
    let body: { email?: string; password?: string; remember_me?: boolean };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.email || !body.password) return c.json({ error: 'missing_credentials' }, 400);
    const result = attemptPasswordLogin(db, body.email, body.password);
    if (!result.ok) {
      emitAudit(db, c, {
        action: 'login.password.failure',
        payload: { email: body.email, reason: result.reason },
      });
      return c.json({ error: result.reason }, 401);
    }
    await createSession(c, db, env, result.user, { rememberMe: !!body.remember_me });
    emitAudit(db, c, {
      action: 'login.password.success',
      actor_user_id: result.user.id,
      payload: { email: result.user.email, remember_me: !!body.remember_me },
    });
    return c.json({ ok: true, user: { id: result.user.id, email: result.user.email, role: result.user.role } });
  });

  // Check whether the current user has a password set (UI hint)
  app.get('/api/auth/password/status', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const row = db.prepare('SELECT user_id, set_at FROM user_passwords WHERE user_id = ?').get(s.user_id);
    return c.json({ password_set: !!row });
  });

  // Real OAuth: initiate
  app.get('/api/auth/login', async (c) => {
    if (env.DEV_AUTH_BYPASS) {
      // In dev, redirect to the frontend's dev-login picker
      return c.redirect('/admin/login.html?dev=1');
    }
    try {
      const { url } = await initiateGoogleOAuth(env);
      return c.redirect(url);
    } catch (err) {
      return c.json({ error: 'oauth_init_failed', message: (err as Error).message }, 500);
    }
  });

  // Real OAuth: callback
  app.get('/api/auth/google/callback', async (c) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    if (!code || !state) return c.json({ error: 'missing_params' }, 400);
    try {
      const profile = await handleGoogleCallback(env, code, state);
      // Get-or-create user (using dev-bypass helper for now — real impl will be in oauth.ts)
      const user = getOrCreateDevUser(db, profile.email);
      await createSession(c, db, env, user);
      emitAudit(db, c, {
        action: 'login.google.success',
        actor_user_id: user.id,
        payload: { email: user.email },
      });
      return c.redirect('/admin/dashboard.html');
    } catch (err) {
      emitAudit(db, c, {
        action: 'login.google.failure',
        payload: { error: (err as Error).message },
      });
      return c.json({ error: 'oauth_callback_failed', message: (err as Error).message }, 400);
    }
  });

  // Logout
  app.post('/api/auth/logout', (c) => {
    const s = c.get('session');
    if (s) {
      revokeSession(db, s.session_id, 'user_logout');
      emitAudit(db, c, {
        action: 'logout',
        actor_user_id: s.user_id,
      });
    }
    clearSessionCookie(c);
    return c.json({ ok: true });
  });

  // Whoami
  app.get('/api/auth/whoami', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ authenticated: false }, 401);
    return c.json({
      authenticated: true,
      user: { id: s.user_id, email: s.email, role: s.role },
    });
  });
}
