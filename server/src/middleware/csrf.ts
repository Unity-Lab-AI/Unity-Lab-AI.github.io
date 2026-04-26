/**
 * CSRF: double-submit cookie pattern.
 * - Cookie `csrf` is set on first GET — readable by JS.
 * - State-changing requests must echo the value in `X-CSRF-Token` header.
 * - Server constant-time compares.
 *
 * Skipped for: /webhooks/* (HMAC-verified instead), WS upgrade (uses Sec-WebSocket-Protocol).
 */

import type { Hono, Context } from 'hono';
import { randomToken, constantTimeEqual } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

const CSRF_COOKIE_NAME = 'csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_EXEMPT_PATHS = ['/webhooks/', '/ws', '/healthz', '/readyz', '/api/auth/google/callback'];

export function ensureCsrfCookie(c: Context): string {
  const cookie = c.req.header('cookie') ?? '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`));
  if (m && m[1]) return m[1];
  const token = randomToken(32);
  c.header(
    'Set-Cookie',
    `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Secure; Max-Age=86400`,
    { append: true },
  );
  return token;
}

export function mountCsrfMiddleware(app: Hono): void {
  app.use('*', async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;

    // Set/refresh cookie on safe requests
    if (SAFE_METHODS.has(method)) {
      ensureCsrfCookie(c);
      return next();
    }

    // Exempt paths
    if (CSRF_EXEMPT_PATHS.some((p) => path.startsWith(p))) {
      return next();
    }

    // Validate CSRF for state-changing requests
    const cookie = c.req.header('cookie') ?? '';
    const m = cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`));
    const cookieToken = m ? m[1] : null;
    const headerToken = c.req.header('X-CSRF-Token');

    if (!cookieToken || !headerToken || !constantTimeEqual(cookieToken, headerToken)) {
      logger.warn({ path, method, hasCookie: !!cookieToken, hasHeader: !!headerToken }, 'csrf: validation failed');
      return c.json({ error: 'csrf_failed' }, 403);
    }

    return next();
  });
}
