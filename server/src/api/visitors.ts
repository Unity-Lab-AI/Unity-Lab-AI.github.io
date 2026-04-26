/**
 * /api/visitors — visitor counter endpoint (existing public marketing-site API).
 * In dev: just stores a count locally so the existing JS works.
 * In prod: same — replaces the previous proxy to users.unityailab.com (per user requirement
 * that "npm run dev hosts it all even the visitor counter").
 *
 * Schema is intentionally simple — no PII, just aggregate counts.
 * Future: per-page counts, geo bucketing, etc.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';

let inMemoryCount = 0; // simple session-scoped counter; survives until restart

export function mountVisitors(app: Hono, _env: AppEnv, _db: DbConn): void {
  // POST: increment + record
  app.post('/api/visitors', async (c) => {
    inMemoryCount += 1;
    return c.json({ ok: true, count: inMemoryCount });
  });

  // GET: read current count
  app.get('/api/visitors', (c) => c.json({ count: inMemoryCount }));
}
