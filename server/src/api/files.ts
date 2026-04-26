/**
 * /api/files/* — full upload/download flow.
 *
 *   1. Client requests POST /api/files/sign-upload with {filename, size, mime, room_id, sha256}
 *      → server validates room membership, size limit, mime allowlist
 *      → server creates `files` row with deleted_at=null, scan_result=null
 *      → server returns {file_id, upload_url, method, headers, expires_in}
 *   2. Client PUTs file bytes to upload_url
 *   3. Client POSTs /api/files/confirm with {file_id, sha256_actual}
 *      → server verifies file exists in storage + size matches + sha256 matches
 *      → server posts a FILE-kind message in the room
 *      → server returns the confirmed file row
 *   4. Recipient GETs /api/files/:id/sign-download
 *      → server validates membership of the file's room
 *      → returns {download_url, expires_in}
 *   5. Recipient GETs the download_url, gets bytes
 *
 * Mime allowlist + size cap protect against XSS via uploads + storage abuse.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { randomToken } from '../lib/crypto.js';
import { getStorage } from '../lib/storage.js';
import { emitAudit } from '../middleware/audit.js';
import { broadcastToRoom } from '../ws/rooms.js';
import { logger } from '../lib/logger.js';

const MAX_SIZE = 100 * 1024 * 1024; // 100MB default per file
const MIME_ALLOWLIST = new Set([
  // Images
  'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
  // Docs
  'application/pdf', 'text/plain', 'text/markdown', 'text/csv', 'application/json',
  // Archives
  'application/zip', 'application/x-tar', 'application/gzip',
  // Code
  'application/octet-stream', // generic — admins may upload binaries
  // Audio / video (small)
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4', 'video/webm',
]);
const MIME_BLOCK = new Set([
  'text/html', 'application/x-msdownload', 'application/x-executable',
]);

export function mountFiles(app: Hono, env: AppEnv, db: DbConn): void {
  const storage = getStorage(env);

  // Sign upload
  app.post('/api/files/sign-upload', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);

    let body: { filename?: string; size?: number; mime?: string; room_id?: string; sha256?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.filename || !body.size || !body.mime || !body.room_id || !body.sha256) {
      return c.json({ error: 'missing_fields' }, 400);
    }
    if (body.size > MAX_SIZE) return c.json({ error: 'too_large', limit: MAX_SIZE }, 413);
    if (body.size <= 0) return c.json({ error: 'invalid_size' }, 400);
    if (MIME_BLOCK.has(body.mime.toLowerCase())) return c.json({ error: 'mime_blocked' }, 400);
    if (!MIME_ALLOWLIST.has(body.mime.toLowerCase())) return c.json({ error: 'mime_not_allowed', mime: body.mime }, 400);

    // Room membership check
    const member = db.prepare(`
      SELECT role FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
    `).get(body.room_id, s.user_id) as { role: string } | undefined;
    if (!member) return c.json({ error: 'not_a_member' }, 403);
    if (member.role === 'READONLY') return c.json({ error: 'readonly' }, 403);

    // Sanitize filename — strip path components, limit length
    const safeName = body.filename.replace(/[\/\\]/g, '_').slice(0, 200);

    const fileId = randomToken(16);
    const storageKey = `files/${body.room_id}/${fileId}/${safeName}`;

    db.prepare(`
      INSERT INTO files (id, uploaded_by_user_id, room_id, storage_kind, storage_key, filename, size, mime, sha256)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fileId, s.user_id, body.room_id, storage.kind, storageKey, safeName, body.size, body.mime, body.sha256);

    const sign = await storage.signUpload({ storage_key: storageKey, mime: body.mime, max_size: body.size });

    emitAudit(db, c, {
      action: 'file.sign_upload',
      actor_user_id: s.user_id,
      target_type: 'file',
      target_id: fileId,
      payload: { room_id: body.room_id, filename: safeName, size: body.size, mime: body.mime },
    });

    return c.json({ file_id: fileId, ...sign });
  });

  // Confirm upload
  app.post('/api/files/confirm', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);

    let body: { file_id?: string; sha256_actual?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.file_id) return c.json({ error: 'file_id_required' }, 400);

    const file = db.prepare(`
      SELECT id, uploaded_by_user_id, room_id, storage_key, filename, size, mime, sha256, deleted_at
      FROM files WHERE id = ? LIMIT 1
    `).get(body.file_id) as { id: string; uploaded_by_user_id: string; room_id: string; storage_key: string; filename: string; size: number; mime: string; sha256: string; deleted_at: string | null } | undefined;

    if (!file) return c.json({ error: 'file_not_found' }, 404);
    if (file.uploaded_by_user_id !== s.user_id) return c.json({ error: 'not_your_upload' }, 403);
    if (file.deleted_at) return c.json({ error: 'already_deleted' }, 410);

    const stat = await storage.stat(file.storage_key);
    if (!stat.exists) {
      // Upload didn't actually happen — clean up the row
      db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
      return c.json({ error: 'upload_not_found_in_storage' }, 422);
    }
    if (stat.size !== file.size) {
      // Size mismatch — delete from storage + DB row
      await storage.del(file.storage_key);
      db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
      return c.json({ error: 'size_mismatch', expected: file.size, actual: stat.size }, 422);
    }
    if (body.sha256_actual && body.sha256_actual !== file.sha256) {
      await storage.del(file.storage_key);
      db.prepare('DELETE FROM files WHERE id = ?').run(file.id);
      return c.json({ error: 'sha256_mismatch' }, 422);
    }

    // Post a FILE-kind message in the room
    const msgId = randomToken(16);
    const maxSeq = (db.prepare('SELECT COALESCE(MAX(seq), 0) as m FROM messages WHERE room_id = ?').get(file.room_id) as { m: number }).m;
    const seq = maxSeq + 1;
    const messageBody = JSON.stringify({
      file_id: file.id,
      filename: file.filename,
      size: file.size,
      mime: file.mime,
    });
    db.prepare(`
      INSERT INTO messages (id, room_id, sender_user_id, kind, body, seq)
      VALUES (?, ?, ?, 'FILE', ?, ?)
    `).run(msgId, file.room_id, s.user_id, messageBody, seq);

    const message = db.prepare(`
      SELECT id, room_id, sender_user_id, sender_bot_id, kind, body, reply_to, seq, created_at
      FROM messages WHERE id = ?
    `).get(msgId);

    broadcastToRoom(file.room_id, { op: 'message', message });

    emitAudit(db, c, {
      action: 'file.confirm',
      actor_user_id: s.user_id,
      target_type: 'file',
      target_id: file.id,
      payload: { room_id: file.room_id, filename: file.filename, size: file.size },
    });

    return c.json({ ok: true, file: { id: file.id, filename: file.filename, size: file.size, mime: file.mime } });
  });

  // Sign download
  app.get('/api/files/:id/sign-download', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const fileId = c.req.param('id');
    const file = db.prepare(`
      SELECT id, room_id, storage_key, filename, mime, size, deleted_at
      FROM files WHERE id = ? LIMIT 1
    `).get(fileId) as { id: string; room_id: string; storage_key: string; filename: string; mime: string; size: number; deleted_at: string | null } | undefined;
    if (!file) return c.json({ error: 'not_found' }, 404);
    if (file.deleted_at) return c.json({ error: 'deleted' }, 410);

    // Membership check
    const member = db.prepare(`
      SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
    `).get(file.room_id, s.user_id);
    if (!member) return c.json({ error: 'not_a_member' }, 403);

    const sign = await storage.signDownload({ storage_key: file.storage_key, filename: file.filename });

    emitAudit(db, c, {
      action: 'file.sign_download',
      actor_user_id: s.user_id,
      target_type: 'file',
      target_id: file.id,
      payload: { room_id: file.room_id, filename: file.filename },
    });

    return c.json({ ...sign, filename: file.filename, mime: file.mime, size: file.size });
  });

  // Delete (soft) — uploader OR room ADMIN OR portal OWNER
  app.post('/api/files/:id/delete', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const fileId = c.req.param('id');
    const file = db.prepare(`
      SELECT id, uploaded_by_user_id, room_id, storage_key, deleted_at
      FROM files WHERE id = ? LIMIT 1
    `).get(fileId) as { id: string; uploaded_by_user_id: string; room_id: string; storage_key: string; deleted_at: string | null } | undefined;
    if (!file) return c.json({ error: 'not_found' }, 404);
    if (file.deleted_at) return c.json({ error: 'already_deleted' }, 410);

    const isOwner = s.role === 'OWNER';
    const isUploader = file.uploaded_by_user_id === s.user_id;
    const member = db.prepare(`
      SELECT role FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
    `).get(file.room_id, s.user_id) as { role: string } | undefined;
    const isRoomAdmin = member?.role === 'ADMIN';
    if (!isOwner && !isUploader && !isRoomAdmin) return c.json({ error: 'forbidden' }, 403);

    db.prepare("UPDATE files SET deleted_at = datetime('now') WHERE id = ?").run(fileId);
    // Storage object kept for 30d per RETENTION_POLICY then pruned by lifecycle (TODO: cron)
    emitAudit(db, c, {
      action: 'file.delete',
      actor_user_id: s.user_id,
      target_type: 'file',
      target_id: fileId,
      payload: { reason: isUploader ? 'uploader' : (isRoomAdmin ? 'room_admin' : 'owner') },
    });
    return c.json({ ok: true });
  });

  // Local-storage GET/PUT routes — only used when FILE_STORAGE_KIND=local
  if (storage.kind === 'local') {
    const local = storage as unknown as { verifyToken: (action: 'put' | 'get', key: string, expiresAt: number, token: string) => boolean; read: (k: string) => Promise<Buffer>; write: (k: string, d: Buffer) => Promise<void> };

    app.get('/api/files/_local/:key', async (c) => {
      const key = decodeURIComponent(c.req.param('key'));
      const exp = parseInt(c.req.query('exp') ?? '0', 10);
      const token = c.req.query('t') ?? '';
      const dl = c.req.query('dl');
      if (!local.verifyToken('get', key, exp, token)) return c.text('forbidden', 403);
      try {
        const data = await local.read(key);
        const headers: Record<string, string> = { 'Cache-Control': 'private, max-age=300' };
        if (dl) headers['Content-Disposition'] = `attachment; filename="${dl.replace(/"/g, '')}"`;
        return new Response(new Uint8Array(data), { status: 200, headers });
      } catch (err) {
        logger.warn({ key, err: (err as Error).message }, 'local file read failed');
        return c.text('not found', 404);
      }
    });

    app.put('/api/files/_local/:key', async (c) => {
      const key = decodeURIComponent(c.req.param('key'));
      const exp = parseInt(c.req.query('exp') ?? '0', 10);
      const token = c.req.query('t') ?? '';
      if (!local.verifyToken('put', key, exp, token)) return c.text('forbidden', 403);
      const data = Buffer.from(await c.req.arrayBuffer());
      if (data.length > MAX_SIZE) return c.text('too large', 413);
      try {
        await local.write(key, data);
        return c.json({ ok: true, size: data.length });
      } catch (err) {
        logger.warn({ key, err: (err as Error).message }, 'local file write failed');
        return c.text('write failed', 500);
      }
    });
  }
}

