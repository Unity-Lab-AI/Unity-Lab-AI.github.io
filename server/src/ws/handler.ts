/**
 * WebSocket handlers.
 * - /ws — human admins (auth via session cookie)
 * - /ws/bot — bot proxies (auth via bot token, signature-verified for state-changing ops)
 *
 * Replay protection on bot signed messages: nonce dedup within session + 5-min ts skew window.
 * Bot rate limit: 60 messages per 60 seconds.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { joinRoom, leaveAllRooms, broadcastToRoom } from './rooms.js';
import { logger } from '../lib/logger.js';
import { verifySessionJwt } from '../lib/jwt.js';
import { verifyBotAccessToken } from '../lib/bot_token.js';
import { ed25519Verify, randomToken } from '../lib/crypto.js';

type UpgradeWebSocket = ReturnType<typeof import('@hono/node-ws').createNodeWebSocket>['upgradeWebSocket'];

interface InboundMsg {
  op: string;
  room_id?: string;
  body?: string;
  payload?: any;
  ts?: string;
  nonce?: string;
  sig?: string;
  bot_id?: string;
}

// Per-bot rate limit (60 messages per 60 seconds)
const botRateLimits = new Map<string, { count: number; resetAt: number }>();
function checkBotRate(botId: string): boolean {
  const now = Date.now();
  let r = botRateLimits.get(botId);
  if (!r || now > r.resetAt) {
    r = { count: 0, resetAt: now + 60_000 };
    botRateLimits.set(botId, r);
  }
  r.count += 1;
  return r.count <= 60;
}

export function mountHumanWs(app: Hono, env: AppEnv, db: DbConn, upgradeWebSocket: UpgradeWebSocket): void {
  app.get(
    '/ws',
    upgradeWebSocket((c) => {
      let userId: string | null = null;
      let sessionId: string | null = null;

      return {
        async onOpen(_evt, ws) {
          const cookie = c.req.header('cookie') ?? '';
          const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
          if (!m || !m[1]) {
            ws.send(JSON.stringify({ op: 'error', code: 'auth_required' }));
            ws.close(1008, 'auth_required');
            return;
          }
          try {
            const claims = await verifySessionJwt(m[1], env.JWT_ISSUER, env.JWT_AUDIENCE);
            userId = claims.sub;
            sessionId = claims.sid;
            // Auto-join the special _deploys pseudo-room so admins get deploy notifications
            joinRoom('_deploys', ws as any);
            ws.send(JSON.stringify({ op: 'hello', user_id: userId }));
          } catch {
            ws.send(JSON.stringify({ op: 'error', code: 'invalid_session' }));
            ws.close(1008, 'invalid_session');
          }
        },
        onMessage(evt, ws) {
          if (!userId) return;
          let parsed: InboundMsg;
          try {
            parsed = JSON.parse(typeof evt.data === 'string' ? evt.data : evt.data.toString());
          } catch {
            ws.send(JSON.stringify({ op: 'error', code: 'invalid_json' }));
            return;
          }
          if (parsed.op === 'ping') {
            ws.send(JSON.stringify({ op: 'pong', t: Date.now() }));
            return;
          }
          if (parsed.op === 'subscribe' && parsed.room_id) {
            const member = db.prepare(`
              SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
            `).get(parsed.room_id, userId);
            if (!member) {
              ws.send(JSON.stringify({ op: 'error', code: 'not_a_member', room_id: parsed.room_id }));
              return;
            }
            joinRoom(parsed.room_id, ws as any);
            ws.send(JSON.stringify({ op: 'subscribed', room_id: parsed.room_id }));
          }
        },
        onClose(_evt, ws) {
          leaveAllRooms(ws as any);
          logger.debug({ userId, sessionId }, 'ws human disconnected');
        },
      };
    }),
  );
}

export function mountBotWs(app: Hono, _env: AppEnv, db: DbConn, upgradeWebSocket: UpgradeWebSocket): void {
  app.get(
    '/ws/bot',
    upgradeWebSocket((c) => {
      let botId: string | null = null;
      let ownerId: string | null = null;
      let publicKeyHex: string | null = null;
      const seenNonces = new Set<string>();
      return {
        async onOpen(_evt, ws) {
          const auth = c.req.header('authorization') ?? '';
          const m = auth.match(/^Bearer\s+(.+)$/i);
          if (!m || !m[1]) {
            ws.send(JSON.stringify({ op: 'error', code: 'auth_required' }));
            ws.close(1008, 'auth_required');
            return;
          }
          const result = verifyBotAccessToken(db, m[1]);
          if (!result) {
            ws.send(JSON.stringify({ op: 'error', code: 'invalid_bot_token' }));
            ws.close(1008, 'invalid_bot_token');
            return;
          }
          botId = result.bot_id;
          const bot = db.prepare('SELECT owner_user_id, public_key FROM bots WHERE id = ? LIMIT 1').get(botId) as { owner_user_id: string; public_key: string | null } | undefined;
          if (!bot || !bot.public_key) {
            ws.send(JSON.stringify({ op: 'error', code: 'bot_no_pubkey' }));
            ws.close(1008, 'bot_no_pubkey');
            return;
          }
          ownerId = bot.owner_user_id;
          publicKeyHex = bot.public_key;
          ws.send(JSON.stringify({ op: 'hello', bot_id: botId, ts: new Date().toISOString() }));
        },
        async onMessage(evt, ws) {
          if (!botId || !publicKeyHex || !ownerId) return;
          let parsed: InboundMsg;
          try {
            parsed = JSON.parse(typeof evt.data === 'string' ? evt.data : evt.data.toString());
          } catch {
            ws.send(JSON.stringify({ op: 'error', code: 'invalid_json' }));
            return;
          }

          if (parsed.op === 'ping') {
            ws.send(JSON.stringify({ op: 'pong', t: Date.now() }));
            try { db.prepare("UPDATE bots SET last_seen_at = datetime('now') WHERE id = ?").run(botId); } catch { /* ignore */ }
            return;
          }
          if (parsed.op === 'hello') {
            ws.send(JSON.stringify({ op: 'hello_ack', bot_id: botId }));
            return;
          }

          // Bot subscribes to a BOT_BUS room — joins the in-memory broadcast set so
          // future broadcastToRoom calls deliver to this bot's WS. Bots can subscribe
          // to ANY BOT_BUS room (not just rooms their owner-admin is a member of) per
          // the "bots see all rooms and enter at will" requirement. DIRECT and CHANNEL
          // rooms remain off-limits to bots.
          if (parsed.op === 'subscribe') {
            const room_id = parsed.payload?.room_id;
            if (!room_id || typeof room_id !== 'string') {
              ws.send(JSON.stringify({ op: 'error', code: 'invalid_subscribe_payload' }));
              return;
            }
            const room = db.prepare('SELECT kind FROM rooms WHERE id = ? AND archived_at IS NULL LIMIT 1').get(room_id) as { kind: string } | undefined;
            if (!room) {
              ws.send(JSON.stringify({ op: 'error', code: 'room_not_found' }));
              return;
            }
            if (room.kind !== 'BOT_BUS') {
              ws.send(JSON.stringify({ op: 'error', code: 'bot_subscribe_only_bot_bus' }));
              return;
            }
            joinRoom(room_id, ws);
            ws.send(JSON.stringify({ op: 'subscribed', room_id }));
            return;
          }

          // State-changing ops require Ed25519 signature verification
          if (parsed.op === 'send' || parsed.op === 'intent') {
            if (!checkBotRate(botId)) {
              ws.send(JSON.stringify({ op: 'error', code: 'rate_limited' }));
              return;
            }
            if (!parsed.ts || !parsed.nonce || !parsed.sig) {
              ws.send(JSON.stringify({ op: 'error', code: 'missing_signature_fields' }));
              return;
            }
            if (seenNonces.has(parsed.nonce)) {
              ws.send(JSON.stringify({ op: 'error', code: 'nonce_replay' }));
              return;
            }
            const ts = new Date(parsed.ts).getTime();
            if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
              ws.send(JSON.stringify({ op: 'error', code: 'timestamp_skew' }));
              return;
            }
            seenNonces.add(parsed.nonce);
            if (seenNonces.size > 1000) {
              const arr = Array.from(seenNonces);
              seenNonces.clear();
              arr.slice(-500).forEach((n) => seenNonces.add(n));
            }
            const canonical = JSON.stringify({
              op: parsed.op,
              payload: parsed.payload ?? {},
              ts: parsed.ts,
              nonce: parsed.nonce,
            });
            const sigOk = await ed25519Verify(publicKeyHex, new TextEncoder().encode(canonical), parsed.sig);
            if (!sigOk) {
              ws.send(JSON.stringify({ op: 'error', code: 'invalid_signature' }));
              return;
            }

            if (parsed.op === 'send') {
              const room_id = parsed.payload?.room_id;
              const body = parsed.payload?.body;
              if (!room_id || typeof body !== 'string' || body.length < 1) {
                ws.send(JSON.stringify({ op: 'error', code: 'invalid_send_payload' }));
                return;
              }
              if (body.length > 8000) {
                ws.send(JSON.stringify({ op: 'error', code: 'body_too_long' }));
                return;
              }
              const room = db.prepare('SELECT kind FROM rooms WHERE id = ? AND archived_at IS NULL LIMIT 1').get(room_id) as { kind: string } | undefined;
              if (!room) {
                ws.send(JSON.stringify({ op: 'error', code: 'room_not_found' }));
                return;
              }
              if (room.kind !== 'BOT_BUS') {
                ws.send(JSON.stringify({ op: 'error', code: 'room_not_bot_bus' }));
                return;
              }
              const ownerMember = db.prepare(`
                SELECT 1 FROM room_members WHERE room_id = ? AND user_id = ? AND left_at IS NULL
              `).get(room_id, ownerId);
              if (!ownerMember) {
                ws.send(JSON.stringify({ op: 'error', code: 'owner_not_in_room' }));
                return;
              }
              const msgId = randomToken(16);
              const maxSeq = (db.prepare('SELECT COALESCE(MAX(seq), 0) as m FROM messages WHERE room_id = ?').get(room_id) as { m: number }).m;
              const seq = maxSeq + 1;
              db.prepare(`
                INSERT INTO messages (id, room_id, sender_bot_id, kind, body, seq)
                VALUES (?, ?, ?, 'TEXT', ?, ?)
              `).run(msgId, room_id, botId, body, seq);
              const message = db.prepare(`
                SELECT m.id, m.room_id, m.sender_user_id, m.sender_bot_id, m.kind, m.body, m.reply_to, m.seq, m.created_at,
                       u.email AS sender_email, u.name AS sender_name,
                       b.name AS sender_bot_name
                FROM messages m
                LEFT JOIN users u ON m.sender_user_id = u.id
                LEFT JOIN bots b ON m.sender_bot_id = b.id
                WHERE m.id = ?
              `).get(msgId);
              broadcastToRoom(room_id, { op: 'message', message });
              ws.send(JSON.stringify({ op: 'send_ack', msg_id: msgId, seq }));
              return;
            }

            if (parsed.op === 'intent') {
              // Bot intent for the job/coordination layer.
              // Phase 3 full impl: AP-159. Echoes ack with intent kind for now.
              ws.send(JSON.stringify({ op: 'intent_ack_stub', tracked: 'AP-159', intent_kind: parsed.payload?.intent ?? 'unknown' }));
              return;
            }
          }

          ws.send(JSON.stringify({ op: 'error', code: 'unknown_op', received: parsed.op }));
        },
        onClose(_evt, ws) {
          logger.debug({ bot_id: botId }, 'ws bot disconnected');
          // Remove this WS from every room broadcast set so we don't try to send to
          // a closed connection. broadcastToRoom does best-effort cleanup too, but
          // explicit cleanup here is faster + cleaner.
          leaveAllRooms(ws as any);
        },
      };
    }),
  );
}
