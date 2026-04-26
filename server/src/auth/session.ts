/**
 * Session lifecycle: create + revoke.
 * Issues server-side session row + signed JWT, sets HttpOnly cookie.
 */

import type { Context } from 'hono';
import type { DbConn } from '../db/connection.js';
import { issueSessionJwt, type SessionClaims } from '../lib/jwt.js';
import { randomToken } from '../lib/crypto.js';
import type { AppEnv } from '../config/env.js';

export async function createSession(
  c: Context,
  db: DbConn,
  env: AppEnv,
  user: { id: string; email: string; role: SessionClaims['role'] },
  opts: { rememberMe?: boolean } = {},
): Promise<string> {
  const sessionId = randomToken(16);
  const jwtId = sessionId; // jti = session_id for simplicity
  // Remember-me extends session to 30 days; default is JWT_TTL_SECONDS (12h)
  const ttl = opts.rememberMe ? 30 * 24 * 60 * 60 : env.JWT_TTL_SECONDS;
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + ttl * 1000);

  db.prepare(`
    INSERT INTO sessions (id, user_id, jwt_id, issued_at, expires_at, last_seen_at, ip, user_agent)
    VALUES (?, ?, ?, datetime('now'), ?, datetime('now'), ?, ?)
  `).run(
    sessionId,
    user.id,
    jwtId,
    expiresAt.toISOString(),
    c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    c.req.header('user-agent') ?? null,
  );

  // Update users.last_login_at
  db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

  const jwt = await issueSessionJwt(
    { sub: user.id, sid: sessionId, email: user.email, role: user.role },
    ttl,
    env.JWT_ISSUER,
    env.JWT_AUDIENCE,
  );

  // Set HttpOnly cookie
  const cookieAttrs = [
    `session=${jwt}`,
    'HttpOnly',
    env.NODE_ENV === 'production' ? 'Secure' : '',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${ttl}`,
  ].filter(Boolean).join('; ');
  c.header('Set-Cookie', cookieAttrs, { append: true });

  return jwt;
}

export function revokeSession(db: DbConn, sessionId: string, reason = 'user_logout'): void {
  db.prepare(`
    UPDATE sessions SET revoked_at = datetime('now'), revoke_reason = ?
    WHERE id = ? AND revoked_at IS NULL
  `).run(reason, sessionId);
}

export function clearSessionCookie(c: Context): void {
  c.header('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict', { append: true });
}
