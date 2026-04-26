/**
 * /api/me — current user with extra context (bot count, room count, etc.)
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';

export function mountMe(app: Hono, _env: AppEnv, db: DbConn): void {
  app.get('/api/me', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);

    const user = db.prepare(
      'SELECT id, email, name, role, status, created_at, last_login_at FROM users WHERE id = ?',
    ).get(s.user_id) as Record<string, unknown> | undefined;

    if (!user) return c.json({ error: 'user_not_found' }, 404);

    const botCount = (db.prepare(
      'SELECT COUNT(*) as n FROM bots WHERE owner_user_id = ? AND revoked_at IS NULL',
    ).get(s.user_id) as { n: number }).n;

    const roomCount = (db.prepare(
      'SELECT COUNT(*) as n FROM room_members WHERE user_id = ? AND left_at IS NULL',
    ).get(s.user_id) as { n: number }).n;

    return c.json({ user, stats: { bot_count: botCount, room_count: roomCount } });
  });
}
