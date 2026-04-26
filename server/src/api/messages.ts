/**
 * /api/rooms/:id/messages — list (paginated) + post.
 * Phase 1 minimal: text messages from authenticated humans.
 * WebSocket broadcast handled in ws/handler.ts.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { randomToken } from '../lib/crypto.js';
import { emitAudit } from '../middleware/audit.js';
import { broadcastToRoom } from '../ws/rooms.js';

export function mountMessages(app: Hono, _env: AppEnv, db: DbConn): void {
  // List messages (newest first, cursor pagination)
  app.get('/api/rooms/:id/messages', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const roomId = c.req.param('id');

    // Membership check
    const member = db.prepare(`
      SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
    `).get(roomId, s.user_id);
    if (!member) return c.json({ error: 'not_a_member' }, 403);

    const limit = Math.min(100, parseInt(c.req.query('limit') ?? '50', 10));
    const beforeSeq = c.req.query('before_seq') ? parseInt(c.req.query('before_seq')!, 10) : null;

    const messages = beforeSeq != null
      ? db.prepare(`
          SELECT m.id, m.room_id, m.sender_user_id, m.sender_bot_id, m.kind, m.body, m.reply_to, m.seq, m.created_at, m.edited_at, m.deleted_at,
                 u.email AS sender_email, u.name AS sender_name,
                 b.name AS sender_bot_name
          FROM messages m
          LEFT JOIN users u ON m.sender_user_id = u.id
          LEFT JOIN bots b ON m.sender_bot_id = b.id
          WHERE m.room_id = ? AND m.seq < ? AND m.deleted_at IS NULL
          ORDER BY m.seq DESC LIMIT ?
        `).all(roomId, beforeSeq, limit)
      : db.prepare(`
          SELECT m.id, m.room_id, m.sender_user_id, m.sender_bot_id, m.kind, m.body, m.reply_to, m.seq, m.created_at, m.edited_at, m.deleted_at,
                 u.email AS sender_email, u.name AS sender_name,
                 b.name AS sender_bot_name
          FROM messages m
          LEFT JOIN users u ON m.sender_user_id = u.id
          LEFT JOIN bots b ON m.sender_bot_id = b.id
          WHERE m.room_id = ? AND m.deleted_at IS NULL
          ORDER BY m.seq DESC LIMIT ?
        `).all(roomId, limit);

    return c.json({ messages, has_more: messages.length === limit });
  });

  // Post a message
  app.post('/api/rooms/:id/messages', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const roomId = c.req.param('id');

    const member = db.prepare(`
      SELECT role FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
    `).get(roomId, s.user_id) as { role: string } | undefined;
    if (!member) return c.json({ error: 'not_a_member' }, 403);
    if (member.role === 'READONLY') return c.json({ error: 'readonly' }, 403);

    let body: { body?: string; reply_to?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    if (!body.body || body.body.length < 1 || body.body.length > 8000) {
      return c.json({ error: 'invalid_body' }, 400);
    }

    const id = randomToken(16);
    // Compute next seq
    const maxSeq = (db.prepare('SELECT COALESCE(MAX(seq), 0) as m FROM messages WHERE room_id = ?').get(roomId) as { m: number }).m;
    const seq = maxSeq + 1;

    db.prepare(`
      INSERT INTO messages (id, room_id, sender_user_id, kind, body, reply_to, seq)
      VALUES (?, ?, ?, 'TEXT', ?, ?, ?)
    `).run(id, roomId, s.user_id, body.body, body.reply_to ?? null, seq);

    const message = db.prepare(`
      SELECT m.id, m.room_id, m.sender_user_id, m.sender_bot_id, m.kind, m.body, m.reply_to, m.seq, m.created_at,
             u.email AS sender_email, u.name AS sender_name,
             b.name AS sender_bot_name
      FROM messages m
      LEFT JOIN users u ON m.sender_user_id = u.id
      LEFT JOIN bots b ON m.sender_bot_id = b.id
      WHERE m.id = ?
    `).get(id);

    // Broadcast to WS subscribers
    broadcastToRoom(roomId, { op: 'message', message });

    emitAudit(db, c, {
      action: 'message.post',
      actor_user_id: s.user_id,
      target_type: 'room',
      target_id: roomId,
      payload: { message_id: id, kind: 'TEXT', length: body.body.length },
    });

    return c.json({ message });
  });
}
