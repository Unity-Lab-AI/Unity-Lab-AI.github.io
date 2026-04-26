/**
 * /api/bots/* — bot enrollment + management.
 * Phase 1+: list, create, enroll (first-run from proxy.js), refresh tokens, download proxy.js, revoke.
 *
 * Enrollment flow (per ADMIN_PORTAL_TODO.md AP-141..150):
 *   1. Admin creates bot via POST /api/bots → server returns enrollment_token (one-shot, 1h TTL)
 *      + proxy_download_url + bot_id
 *   2. Admin downloads customised proxy.js via GET /api/bots/:id/proxy.js (session-auth required)
 *   3. proxy.js first-run generates Ed25519 keypair locally, calls POST /api/bots/:id/enroll
 *      with { enrollment_token, public_key }
 *   4. Server validates token, stores public_key, issues access+refresh token pair, marks token used
 *   5. proxy.js connects to /ws/bot using access token in Authorization header
 *   6. proxy.js refreshes access token before expiry via POST /api/bots/:id/refresh
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { randomToken, sha256 } from '../lib/crypto.js';
import { emitAudit } from '../middleware/audit.js';
import { issueBotTokenPair, rotateBotTokens, verifyBotAccessToken } from '../lib/bot_token.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { logger } from '../lib/logger.js';

// Cache the proxy.js template on first read (small file, served unchanged minus 3 placeholder swaps)
let cachedProxyTemplate: string | null = null;
function getProxyTemplate(): string {
  if (cachedProxyTemplate) return cachedProxyTemplate;
  cachedProxyTemplate = readFileSync(resolve(process.cwd(), 'proxy/proxy.js'), 'utf8');
  return cachedProxyTemplate;
}

export function mountBots(app: Hono, env: AppEnv, db: DbConn): void {
  // List bots owned by current user (or all if OWNER)
  app.get('/api/bots', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const bots = s.role === 'OWNER'
      ? db.prepare(`
          SELECT id, owner_user_id, name, role, enrolled_at, last_seen_at, revoked_at, created_at
          FROM bots ORDER BY created_at DESC
        `).all()
      : db.prepare(`
          SELECT id, owner_user_id, name, role, enrolled_at, last_seen_at, revoked_at, created_at
          FROM bots WHERE owner_user_id = ? AND revoked_at IS NULL
          ORDER BY created_at DESC
        `).all(s.user_id);
    return c.json({ bots });
  });

  // Create a bot — issues one-shot enrollment token
  app.post('/api/bots', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);

    let body: { name?: string; role?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.name || body.name.length < 1 || body.name.length > 60) {
      return c.json({ error: 'invalid_name' }, 400);
    }
    const role = body.role ?? 'WORKER';
    if (!['SUPERVISOR', 'WORKER', 'LOGISTIC', 'OBSERVER'].includes(role)) {
      return c.json({ error: 'invalid_role' }, 400);
    }

    const ownedCount = (db.prepare('SELECT COUNT(*) as n FROM bots WHERE owner_user_id = ? AND revoked_at IS NULL').get(s.user_id) as { n: number }).n;
    if (ownedCount >= 5) return c.json({ error: 'bot_limit_reached', limit: 5 }, 409);

    const botId = randomToken(16);
    const enrollmentToken = randomToken(32);
    const enrollmentTokenHash = sha256(enrollmentToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO bots (id, owner_user_id, name, role, enrollment_token_hash, enrollment_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(botId, s.user_id, body.name, role, enrollmentTokenHash, expiresAt);

    emitAudit(db, c, {
      action: 'bot.create',
      actor_user_id: s.user_id,
      target_type: 'bot',
      target_id: botId,
      payload: { name: body.name, role },
    });

    return c.json({
      bot_id: botId,
      enrollment_token: enrollmentToken,
      enrollment_expires_at: expiresAt,
      proxy_download_url: `/api/bots/${botId}/proxy.js`,
    });
  });

  // List all BOT_BUS rooms this bot can see (= all BOT_BUS rooms in the system,
  // archived ones excluded). Per Gee's "bots see all rooms and enter at will" spec —
  // bots are not restricted to their owner-admin's room memberships. The bot can
  // then call WS 'subscribe' for whichever rooms it wants to receive broadcasts on.
  // Auth: bot Bearer token (Authorization header) — not session cookie.
  app.get('/api/bots/:id/rooms', async (c) => {
    const auth = c.req.header('authorization') ?? '';
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) return c.json({ error: 'auth_required' }, 401);
    const tokenResult = verifyBotAccessToken(db, m[1]);
    if (!tokenResult) return c.json({ error: 'invalid_token' }, 401);
    const requestedBotId = c.req.param('id');
    if (requestedBotId !== tokenResult.bot_id) return c.json({ error: 'forbidden' }, 403);
    const rows = db.prepare(`
      SELECT id, name, kind, description, created_at
      FROM rooms
      WHERE kind = 'BOT_BUS' AND archived_at IS NULL
      ORDER BY created_at ASC
    `).all();
    return c.json({ rooms: rows });
  });

  // Download per-bot customised proxy.js (session-auth required + ownership check)
  app.get('/api/bots/:id/proxy.js', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const botId = c.req.param('id');
    const bot = db.prepare(`
      SELECT id, owner_user_id, enrollment_token_hash, enrollment_expires_at, enrolled_at, revoked_at
      FROM bots WHERE id = ? LIMIT 1
    `).get(botId) as { id: string; owner_user_id: string; enrollment_token_hash: string | null; enrollment_expires_at: string | null; enrolled_at: string | null; revoked_at: string | null } | undefined;
    if (!bot) return c.json({ error: 'not_found' }, 404);
    if (bot.owner_user_id !== s.user_id && s.role !== 'OWNER') return c.json({ error: 'forbidden' }, 403);
    if (bot.revoked_at) return c.json({ error: 'bot_revoked' }, 410);

    // For UN-enrolled bots: proxy.js carries the enrollment token. The server doesn't have the
    // raw token (only its hash). The download endpoint must include the raw — so we issue a
    // FRESH single-use enrollment token now, replacing the previous one. This means downloading
    // proxy.js twice invalidates the older download.
    const wsScheme = env.PUBLIC_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = env.PUBLIC_BASE_URL.replace(/^https?:\/\//, '');
    const wsUrl = `${wsScheme}://${wsHost}/ws/bot`;
    const httpBase = env.PUBLIC_BASE_URL;

    let enrollmentToken: string | null = null;
    if (!bot.enrolled_at) {
      enrollmentToken = randomToken(32);
      const newHash = sha256(enrollmentToken);
      const newExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db.prepare(`
        UPDATE bots SET enrollment_token_hash = ?, enrollment_expires_at = ? WHERE id = ?
      `).run(newHash, newExpires, botId);
      emitAudit(db, c, {
        action: 'bot.proxy_download',
        actor_user_id: s.user_id,
        target_type: 'bot',
        target_id: botId,
        payload: { reissued_enrollment_token: true },
      });
    } else {
      emitAudit(db, c, {
        action: 'bot.proxy_download',
        actor_user_id: s.user_id,
        target_type: 'bot',
        target_id: botId,
        payload: { already_enrolled: true },
      });
    }

    const tpl = getProxyTemplate();
    const customised = tpl
      .replaceAll('__BOT_ID_PLACEHOLDER__', botId)
      .replaceAll('__ENROLLMENT_TOKEN_PLACEHOLDER__', enrollmentToken ?? 'BOT_ALREADY_ENROLLED_RE_USE_LOCAL_STATE')
      .replaceAll("ws://localhost:3000/ws/bot", wsUrl)
      .replaceAll("http://localhost:3000", httpBase);

    c.header('Content-Type', 'application/javascript; charset=utf-8');
    c.header('Content-Disposition', `attachment; filename="unity-proxy-${botId}.js"`);
    c.header('Cache-Control', 'no-store');
    return c.body(customised);
  });

  // Bot enrollment — called by proxy.js on first run
  app.post('/api/bots/:id/enroll', async (c) => {
    const botId = c.req.param('id');
    let body: { enrollment_token?: string; public_key?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.enrollment_token || !body.public_key) {
      return c.json({ error: 'missing_fields' }, 400);
    }
    if (!/^[0-9a-f]{64}$/.test(body.public_key)) {
      return c.json({ error: 'invalid_public_key_format', message: 'expected 64 hex chars' }, 400);
    }

    const bot = db.prepare(`
      SELECT id, owner_user_id, enrollment_token_hash, enrollment_expires_at, enrolled_at, revoked_at
      FROM bots WHERE id = ? LIMIT 1
    `).get(botId) as { id: string; owner_user_id: string; enrollment_token_hash: string | null; enrollment_expires_at: string | null; enrolled_at: string | null; revoked_at: string | null } | undefined;

    if (!bot) return c.json({ error: 'bot_not_found' }, 404);
    if (bot.revoked_at) return c.json({ error: 'bot_revoked' }, 410);
    if (bot.enrolled_at) return c.json({ error: 'already_enrolled' }, 409);
    if (!bot.enrollment_token_hash || !bot.enrollment_expires_at) {
      return c.json({ error: 'no_pending_enrollment' }, 410);
    }
    if (new Date(bot.enrollment_expires_at).getTime() < Date.now()) {
      return c.json({ error: 'enrollment_expired' }, 410);
    }
    if (sha256(body.enrollment_token) !== bot.enrollment_token_hash) {
      emitAudit(db, c, {
        action: 'bot.enroll.token_mismatch',
        actor_kind: 'bot',
        target_type: 'bot',
        target_id: botId,
      });
      return c.json({ error: 'invalid_enrollment_token' }, 401);
    }

    // Mark enrolled, store public key, invalidate enrollment token
    db.prepare(`
      UPDATE bots SET
        enrolled_at = datetime('now'),
        public_key = ?,
        enrollment_token_hash = NULL,
        enrollment_expires_at = NULL,
        last_seen_at = datetime('now')
      WHERE id = ?
    `).run(body.public_key, botId);

    // Issue first token pair
    const tokens = issueBotTokenPair(db, botId);

    emitAudit(db, c, {
      action: 'bot.enroll.success',
      actor_kind: 'bot',
      target_type: 'bot',
      target_id: botId,
    });

    logger.info({ bot_id: botId, owner_user_id: bot.owner_user_id }, 'bot enrolled');

    return c.json(tokens);
  });

  // Bot token refresh
  app.post('/api/bots/:id/refresh', async (c) => {
    const botId = c.req.param('id');
    let body: { refresh_token?: string };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.refresh_token) return c.json({ error: 'refresh_token_required' }, 400);

    const result = rotateBotTokens(db, botId, body.refresh_token);
    if ('error' in result) {
      emitAudit(db, c, {
        action: 'bot.refresh.failed',
        actor_kind: 'bot',
        target_type: 'bot',
        target_id: botId,
        payload: { reason: result.error, bot_revoked: !!result.revoke_bot },
      });
      return c.json({ error: result.error }, 401);
    }
    return c.json(result);
  });

  // Revoke a bot
  app.post('/api/bots/:id/revoke', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const botId = c.req.param('id');
    const bot = db.prepare('SELECT owner_user_id FROM bots WHERE id = ? LIMIT 1').get(botId) as { owner_user_id: string } | undefined;
    if (!bot) return c.json({ error: 'not_found' }, 404);
    if (bot.owner_user_id !== s.user_id && s.role !== 'OWNER') return c.json({ error: 'forbidden' }, 403);

    db.transaction(() => {
      db.prepare(`
        UPDATE bots SET revoked_at = datetime('now'), revoke_reason = ? WHERE id = ?
      `).run(s.user_id === bot.owner_user_id ? 'owner_revoked' : 'admin_revoked', botId);
      // Revoke all bot sessions (active connections will be dropped on next message)
      db.prepare(`
        UPDATE bot_sessions SET revoked_at = datetime('now'), revoke_reason = 'bot_revoked'
        WHERE bot_id = ? AND revoked_at IS NULL
      `).run(botId);
    })();

    emitAudit(db, c, { action: 'bot.revoke', actor_user_id: s.user_id, target_type: 'bot', target_id: botId });
    return c.json({ ok: true });
  });
}
