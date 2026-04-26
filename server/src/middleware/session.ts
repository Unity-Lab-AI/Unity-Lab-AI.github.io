/**
 * Session middleware — parses session JWT from cookie, populates c.var.session if valid.
 * Routes that REQUIRE auth check c.var.session presence and 401 if absent.
 * Verifies JWT signature + checks the server-side `sessions` row is not revoked.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { verifySessionJwt, type SessionClaims } from '../lib/jwt.js';
import { logger } from '../lib/logger.js';

export interface SessionContext {
  user_id: string;
  session_id: string;
  email: string;
  role: SessionClaims['role'];
}

declare module 'hono' {
  interface ContextVariableMap {
    session?: SessionContext;
  }
}

export function mountSessionMiddleware(app: Hono, env: AppEnv, db: DbConn): void {
  app.use('*', async (c, next) => {
    const cookie = c.req.header('cookie') ?? '';
    const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
    if (!m || !m[1]) {
      return next();
    }
    try {
      const claims = await verifySessionJwt(m[1], env.JWT_ISSUER, env.JWT_AUDIENCE);

      // Server-side revocation check
      const row = db.prepare(
        'SELECT id, revoked_at, expires_at FROM sessions WHERE jwt_id = ? LIMIT 1',
      ).get(claims.sid) as { id: string; revoked_at: string | null; expires_at: string } | undefined;

      // For any "valid JWT but unusable session" case, clear the cookie so the browser
      // stops sending it. Otherwise the browser keeps re-sending stale cookies until JWT TTL.
      const clearCookie = () => {
        c.header('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict', { append: true });
      };

      if (!row) {
        // Common after a DB wipe in dev — log at trace, not debug, to avoid spam
        logger.trace({ sid: claims.sid }, 'session: jwt valid but no server-side row, clearing cookie');
        clearCookie();
        return next();
      }
      if (row.revoked_at) {
        logger.debug({ sid: claims.sid }, 'session: revoked, clearing cookie');
        clearCookie();
        return next();
      }
      if (new Date(row.expires_at).getTime() < Date.now()) {
        logger.debug({ sid: claims.sid }, 'session: expired, clearing cookie');
        clearCookie();
        return next();
      }

      // Update last_seen_at (best-effort, fire-and-forget)
      try {
        db.prepare("UPDATE sessions SET last_seen_at = datetime('now') WHERE id = ?").run(row.id);
      } catch {
        // ignore
      }

      c.set('session', {
        user_id: claims.sub,
        session_id: claims.sid,
        email: claims.email,
        role: claims.role,
      });
    } catch (err) {
      logger.debug({ err }, 'session: jwt verify failed');
    }
    return next();
  });
}

/** Helper: assert session exists, else throw 401 */
export function requireSession(c: import('hono').Context): SessionContext {
  const s = c.get('session');
  if (!s) {
    throw new Response(JSON.stringify({ error: 'auth_required' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }
  return s;
}
