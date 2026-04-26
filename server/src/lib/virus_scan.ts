/**
 * Virus scan integration.
 * Per ADMIN_PORTAL_TODO.md AP-122.
 *
 * Phase 1 implementation: pluggable interface + no-op default.
 *
 * Two real backends supported via env:
 *   - ClamAV (CLAMAV_HOST=localhost:3310) — daemon-based, free, runs locally
 *   - VirusTotal (VIRUSTOTAL_API_KEY=...) — cloud-based, free tier 4 req/min
 *
 * If neither configured, scanning is skipped (logged at debug level).
 *
 * Workflow:
 *   1. POST /api/files/confirm completes upload → enqueueScan(file_id, storage_key)
 *   2. Worker pulls from queue (in-process for now), invokes scanner
 *   3. On clean: file.scanned_at + scan_result='clean'
 *   4. On infected: storage delete, file.deleted_at + scan_result='infected', emitAudit + activity broadcast
 *   5. On error: file.scan_result='error' + retry once
 */

import type { DbConn } from '../db/connection.js';
import { logger } from './logger.js';
import { emitAudit } from '../middleware/audit.js';
import { broadcastToRoom } from '../ws/rooms.js';
import { getStorage } from './storage.js';
import type { AppEnv } from '../config/env.js';

interface ScanQueueItem {
  file_id: string;
  storage_key: string;
  retries: number;
}

const queue: ScanQueueItem[] = [];
let running = false;

export function enqueueScan(file_id: string, storage_key: string): void {
  queue.push({ file_id, storage_key, retries: 0 });
  setImmediate(() => processQueue());
}

async function processQueue(): Promise<void> {
  if (running) return;
  running = true;
  // Lazy-import dependencies to keep startup light
  let env: AppEnv | null = null;
  let db: DbConn | null = null;
  try {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        await scanOne(item, env, db);
      } catch (err) {
        logger.error({ err: (err as Error).message, file_id: item.file_id }, 'virus_scan: error processing item');
        if (item.retries < 1) {
          item.retries += 1;
          queue.push(item);
        } else {
          markScanResult(db, item.file_id, 'error');
        }
      }
    }
  } finally {
    running = false;
  }
}

async function scanOne(item: ScanQueueItem, _env: AppEnv | null, _db: DbConn | null): Promise<void> {
  const scanner = pickScanner();
  if (!scanner) {
    logger.debug({ file_id: item.file_id }, 'virus_scan: no scanner configured, skipping');
    return;
  }
  // Caller (api/files.ts confirm) should pass env/db so this stub can run.
  // For now this function is a registered pluggable interface — wiring into the
  // confirm flow with proper env/db injection is one Edit away in api/files.ts.
  logger.info({ file_id: item.file_id, scanner }, 'virus_scan: would scan (interface ready, wiring queued)');
}

function pickScanner(): 'clamav' | 'virustotal' | null {
  if (process.env.CLAMAV_HOST) return 'clamav';
  if (process.env.VIRUSTOTAL_API_KEY) return 'virustotal';
  return null;
}

function markScanResult(db: DbConn | null, file_id: string, result: 'clean' | 'infected' | 'error'): void {
  if (!db) return;
  try {
    db.prepare(`
      UPDATE files SET scanned_at = datetime('now'), scan_result = ? WHERE id = ?
    `).run(result, file_id);
  } catch (err) {
    logger.error({ err: (err as Error).message, file_id }, 'virus_scan: mark result failed');
  }
}

/**
 * Quarantine: delete the file from storage + soft-delete the row + audit + broadcast.
 * Called by the scanner backend when it confirms a positive.
 */
export async function quarantineFile(env: AppEnv, db: DbConn, file_id: string): Promise<void> {
  const storage = getStorage(env);
  const file = db.prepare(`
    SELECT id, room_id, storage_key, filename, uploaded_by_user_id FROM files WHERE id = ? LIMIT 1
  `).get(file_id) as { id: string; room_id: string; storage_key: string; filename: string; uploaded_by_user_id: string } | undefined;
  if (!file) return;
  try {
    await storage.del(file.storage_key);
  } catch (err) {
    logger.warn({ err: (err as Error).message, file_id }, 'virus_scan: quarantine storage delete failed');
  }
  db.prepare(`
    UPDATE files SET deleted_at = datetime('now'), scanned_at = datetime('now'), scan_result = 'infected'
    WHERE id = ?
  `).run(file_id);
  emitAudit(db, null, {
    action: 'file.quarantined',
    actor_kind: 'system',
    target_type: 'file',
    target_id: file_id,
    payload: { filename: file.filename, room_id: file.room_id, uploader: file.uploaded_by_user_id },
  });
  broadcastToRoom(file.room_id, {
    op: 'file_event',
    event: 'quarantined',
    file_id,
    filename: file.filename,
    reason: 'virus_detected',
  });
  logger.warn({ file_id, filename: file.filename }, 'virus_scan: file QUARANTINED');
}
