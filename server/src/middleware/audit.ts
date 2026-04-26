/**
 * Audit log emission helper — INSERT-only into audit_log table.
 * App role in production should have INSERT privilege only, no UPDATE/DELETE on this table.
 */

import type { Context } from 'hono';
import type { DbConn } from '../db/connection.js';
import { randomToken } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';

export interface AuditEvent {
  action: string;                                    // e.g. 'login.success', 'room.create'
  actor_user_id?: string | null;
  actor_kind?: 'user' | 'bot' | 'system' | 'webhook';
  target_type?: string;
  target_id?: string;
  payload?: Record<string, unknown>;
}

export function emitAudit(db: DbConn, c: Context | null, evt: AuditEvent): void {
  try {
    const id = randomToken(16);
    const ip = c?.req.header('cf-connecting-ip') ?? c?.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const ua = c?.req.header('user-agent') ?? null;
    db.prepare(`
      INSERT INTO audit_log (id, actor_user_id, actor_kind, action, target_type, target_id, payload_json, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      evt.actor_user_id ?? null,
      evt.actor_kind ?? 'user',
      evt.action,
      evt.target_type ?? null,
      evt.target_id ?? null,
      evt.payload ? JSON.stringify(evt.payload) : null,
      ip,
      ua,
    );
  } catch (err) {
    // Audit failures should never break the app — log + continue
    logger.error({ err, action: evt.action }, 'audit: emit failed');
  }
}
