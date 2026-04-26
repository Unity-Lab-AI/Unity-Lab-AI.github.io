/**
 * Global security headers.
 * - CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
 * - CSP varies dev vs prod (dev allows Vite's HMR origin via 'unsafe-inline' for the script tag injection)
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';

export function mountSecurityMiddleware(app: Hono, env: AppEnv): void {
  const isProd = env.NODE_ENV === 'production';

  app.use('*', async (c, next) => {
    await next();

    // HSTS — prod only (would 308 the local dev to https otherwise)
    if (isProd) {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    // Frame options
    c.header('X-Frame-Options', 'DENY');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

    // CSP — strict in prod, slightly relaxed in dev for Vite HMR
    if (isProd) {
      c.header(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' wss:",
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; '),
      );
    } else {
      // Dev: allow inline + eval for Vite HMR
      c.header(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https: http:",
          "font-src 'self' data:",
          "connect-src 'self' ws: wss: http: https:",
          "frame-ancestors 'none'",
          "base-uri 'self'",
        ].join('; '),
      );
    }
  });
}
