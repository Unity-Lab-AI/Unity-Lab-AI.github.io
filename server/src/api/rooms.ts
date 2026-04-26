/**
 * /api/rooms/* — list, create, get details, clear chat.
 * Phase 1 minimal: list rooms user is in, create new CHANNEL room (OWNER only),
 * clear all messages in a room (room ADMIN or system OWNER only).
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { randomToken } from '../lib/crypto.js';
import { emitAudit } from '../middleware/audit.js';
import { broadcastToRoom } from '../ws/rooms.js';

export function mountRooms(app: Hono, _env: AppEnv, db: DbConn): void {
  app.get('/api/rooms', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const rooms = db.prepare(`
      SELECT r.id, r.name, r.kind, r.description, r.created_at, rm.role as member_role
      FROM rooms r
      INNER JOIN room_members rm ON rm.room_id = r.id
      WHERE rm.user_id = ? AND rm.left_at IS NULL AND r.archived_at IS NULL
      ORDER BY r.created_at DESC
    `).all(s.user_id);
    return c.json({ rooms });
  });

  app.post('/api/rooms', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    if (s.role !== 'OWNER') return c.json({ error: 'forbidden' }, 403);

    let body: { name?: string; kind?: 'CHANNEL' | 'BOT_BUS' | 'DIRECT'; description?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    if (!body.name || body.name.length < 1 || body.name.length > 100) {
      return c.json({ error: 'invalid_name' }, 400);
    }
    const kind = body.kind ?? 'CHANNEL';
    if (!['CHANNEL', 'BOT_BUS', 'DIRECT'].includes(kind)) {
      return c.json({ error: 'invalid_kind' }, 400);
    }

    const id = randomToken(16);
    db.transaction(() => {
      db.prepare(`
        INSERT INTO rooms (id, name, kind, description, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, body.name, kind, body.description ?? null, s.user_id);
      // Creator auto-joins as ADMIN
      db.prepare(`
        INSERT INTO room_members (room_id, user_id, role) VALUES (?, ?, 'ADMIN')
      `).run(id, s.user_id);
    })();

    emitAudit(db, c, {
      action: 'room.create',
      actor_user_id: s.user_id,
      target_type: 'room',
      target_id: id,
      payload: { name: body.name, kind },
    });

    return c.json({ id, name: body.name, kind });
  });

  // Clear all messages in a room (soft delete — sets deleted_at on every non-deleted
  // message). Allowed for: system OWNER, or a room member with role ADMIN.
  // Broadcasts a 'room_cleared' WS event so other admins' chat panes refresh.
  app.post('/api/rooms/:id/clear', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const roomId = c.req.param('id');

    const room = db.prepare('SELECT id, name, kind FROM rooms WHERE id = ? AND archived_at IS NULL LIMIT 1').get(roomId) as { id: string; name: string; kind: string } | undefined;
    if (!room) return c.json({ error: 'room_not_found' }, 404);

    // Authorization: system OWNER OR room member with role ADMIN
    if (s.role !== 'OWNER') {
      const member = db.prepare(`
        SELECT role FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
      `).get(roomId, s.user_id) as { role: string } | undefined;
      if (!member || member.role !== 'ADMIN') {
        return c.json({ error: 'forbidden', message: 'system OWNER or room ADMIN role required' }, 403);
      }
    }

    const result = db.prepare(`
      UPDATE messages
      SET deleted_at = datetime('now')
      WHERE room_id = ? AND deleted_at IS NULL
    `).run(roomId);
    const cleared = (result as unknown as { changes: number }).changes ?? 0;

    broadcastToRoom(roomId, { op: 'room_cleared', room_id: roomId, cleared_count: cleared, by_user_id: s.user_id });

    emitAudit(db, c, {
      action: 'room.clear',
      actor_user_id: s.user_id,
      target_type: 'room',
      target_id: roomId,
      payload: { cleared_count: cleared, room_name: room.name },
    });

    return c.json({ ok: true, cleared_count: cleared });
  });

  // Soft-delete a room (sets archived_at). The GET /api/rooms list filters out archived
  // rooms so it disappears from sidebars; messages and members stay in DB for audit.
  // Allowed for: system OWNER, or a room member with role ADMIN. Same auth as clear.
  app.post('/api/rooms/:id/delete', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const roomId = c.req.param('id');

    const room = db.prepare('SELECT id, name, kind FROM rooms WHERE id = ? AND archived_at IS NULL LIMIT 1').get(roomId) as { id: string; name: string; kind: string } | undefined;
    if (!room) return c.json({ error: 'room_not_found' }, 404);

    if (s.role !== 'OWNER') {
      const member = db.prepare(`
        SELECT role FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
      `).get(roomId, s.user_id) as { role: string } | undefined;
      if (!member || member.role !== 'ADMIN') {
        return c.json({ error: 'forbidden', message: 'system OWNER or room ADMIN role required' }, 403);
      }
    }

    db.prepare(`UPDATE rooms SET archived_at = datetime('now') WHERE id = ?`).run(roomId);

    broadcastToRoom(roomId, { op: 'room_deleted', room_id: roomId, by_user_id: s.user_id });

    emitAudit(db, c, {
      action: 'room.delete',
      actor_user_id: s.user_id,
      target_type: 'room',
      target_id: roomId,
      payload: { room_name: room.name, kind: room.kind },
    });

    return c.json({ ok: true });
  });
}
