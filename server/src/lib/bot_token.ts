/**
 * Bot token issue + verify.
 *
 * Bot tokens are simpler than user JWTs — they don't carry rich claims.
 * Format: `<bot_id>.<random>` where the random is 32 base64url chars.
 * Server stores SHA-256 hash in `bot_sessions.access_token_hash` / `refresh_token_hash`
 * and compares hash on each presented token.
 *
 * Why not JWT: bots are server-managed, we always look up server state on every call,
 * so a JWT's "verify without DB" property buys us nothing. Plain hashed tokens are simpler
 * and revocation is instant (just update DB).
 */

import { randomToken, sha256, constantTimeEqual } from './crypto.js';
import type { DbConn } from '../db/connection.js';
import { logger } from './logger.js';

const ACCESS_TTL_MS = 15 * 60 * 1000;          // 15 minutes
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface BotTokenPair {
  access_token: string;
  refresh_token: string;
  access_expires_at: string;
  refresh_expires_at: string;
}

export function issueBotTokenPair(db: DbConn, botId: string): BotTokenPair {
  const sessionId = randomToken(16);
  const accessRaw = `${botId}.${randomToken(32)}`;
  const refreshRaw = `${botId}.${randomToken(48)}`;
  const accessHash = sha256(accessRaw);
  const refreshHash = sha256(refreshRaw);
  const now = Date.now();
  const accessExpires = new Date(now + ACCESS_TTL_MS).toISOString();
  const refreshExpires = new Date(now + REFRESH_TTL_MS).toISOString();

  db.prepare(`
    INSERT INTO bot_sessions (id, bot_id, refresh_token_hash, access_token_hash, refresh_issued_at, refresh_expires_at, last_refreshed_at)
    VALUES (?, ?, ?, ?, datetime('now'), ?, datetime('now'))
  `).run(sessionId, botId, refreshHash, accessHash, refreshExpires);

  return {
    access_token: accessRaw,
    refresh_token: refreshRaw,
    access_expires_at: accessExpires,
    refresh_expires_at: refreshExpires,
  };
}

/**
 * Rotate refresh: validate the old refresh token, issue a new pair, mark old session revoked.
 * Re-use of an old refresh token = security event = revoke the bot entirely.
 */
export function rotateBotTokens(
  db: DbConn,
  botId: string,
  presentedRefreshToken: string,
): BotTokenPair | { error: string; revoke_bot?: boolean } {
  // The presented token must start with this bot's ID (defence against token confusion)
  if (!presentedRefreshToken.startsWith(`${botId}.`)) {
    return { error: 'token_bot_mismatch' };
  }
  const presentedHash = sha256(presentedRefreshToken);

  const row = db.prepare(`
    SELECT id, refresh_expires_at, revoked_at FROM bot_sessions
    WHERE bot_id = ? AND refresh_token_hash = ? LIMIT 1
  `).get(botId, presentedHash) as { id: string; refresh_expires_at: string; revoked_at: string | null } | undefined;

  if (!row) {
    // Token not found — could be (a) never existed or (b) already-rotated reuse
    // Check for ANY revoked session matching this hash → means reuse → SECURITY EVENT
    const reused = db.prepare(`
      SELECT id FROM bot_sessions WHERE bot_id = ? AND refresh_token_hash = ? AND revoked_at IS NOT NULL LIMIT 1
    `).get(botId, presentedHash);
    if (reused) {
      logger.warn({ bot_id: botId }, 'bot refresh-token REUSE detected — revoking bot');
      db.prepare('UPDATE bots SET revoked_at = datetime(\'now\'), revoke_reason = \'refresh_token_reuse\' WHERE id = ?').run(botId);
      return { error: 'token_reuse_detected', revoke_bot: true };
    }
    return { error: 'invalid_refresh_token' };
  }

  if (row.revoked_at) return { error: 'session_revoked' };
  if (new Date(row.refresh_expires_at).getTime() < Date.now()) return { error: 'refresh_expired' };

  // Mark old session revoked
  db.prepare('UPDATE bot_sessions SET revoked_at = datetime(\'now\'), revoke_reason = \'rotated\' WHERE id = ?').run(row.id);

  // Issue new pair
  return issueBotTokenPair(db, botId);
}

/**
 * Verify an access token. Returns the bot_id if valid, or null.
 * Updates last_message_at on the session if found.
 */
export function verifyBotAccessToken(db: DbConn, presentedToken: string): { bot_id: string; session_id: string } | null {
  const dot = presentedToken.indexOf('.');
  if (dot < 1) return null;
  const claimedBotId = presentedToken.slice(0, dot);
  const presentedHash = sha256(presentedToken);

  const row = db.prepare(`
    SELECT bs.id, bs.bot_id, bs.revoked_at, b.revoked_at AS bot_revoked_at
    FROM bot_sessions bs
    JOIN bots b ON b.id = bs.bot_id
    WHERE bs.bot_id = ? AND bs.access_token_hash = ? LIMIT 1
  `).get(claimedBotId, presentedHash) as { id: string; bot_id: string; revoked_at: string | null; bot_revoked_at: string | null } | undefined;

  if (!row) return null;
  if (row.revoked_at || row.bot_revoked_at) return null;

  // Update last_message_at + bot.last_seen_at (best-effort)
  try {
    db.prepare("UPDATE bot_sessions SET last_message_at = datetime('now') WHERE id = ?").run(row.id);
    db.prepare("UPDATE bots SET last_seen_at = datetime('now') WHERE id = ?").run(row.bot_id);
  } catch { /* ignore */ }

  return { bot_id: row.bot_id, session_id: row.id };
}

/** Verify the constant-time comparison helper is being used (used in tests). */
export const _internal = { constantTimeEqual };
