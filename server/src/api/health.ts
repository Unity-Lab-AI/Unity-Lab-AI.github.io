/**
 * /healthz (liveness) and /readyz (readiness).
 * Healthz returns 200 if process up.
 * Readyz returns 200 only if DB is reachable + secrets loaded.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';

export function mountHealth(app: Hono, env: AppEnv, db: DbConn): void {
  app.get('/healthz', (c) =>
    c.json({
      status: 'ok',
      time: new Date().toISOString(),
      mode: env.NODE_ENV,
    }),
  );

  app.get('/readyz', (c) => {
    const checks: Record<string, boolean> = {};
    try {
      db.prepare('SELECT 1').get();
      checks.db = true;
    } catch {
      checks.db = false;
    }
    checks.jwt_key = !!process.env.JWT_SIGNING_KEY;
    checks.csrf_secret = !!process.env.CSRF_COOKIE_SECRET;
    const ready = Object.values(checks).every(Boolean);
    return c.json({ ready, checks }, ready ? 200 : 503);
  });
}
