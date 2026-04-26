/**
 * Unity AI Lab — Unified Server Entry Point
 *
 * Runs in three modes:
 *   - DEV (NODE_ENV=development): Hono + Vite middleware (HMR), SQLite, dev auth bypass
 *   - PROD (NODE_ENV=production): Hono serves prebuilt dist/, Postgres, real OAuth
 *
 * One process, one port, serves: marketing site + admin portal + APIs + WebSocket.
 * See Docs/ADMIN_PORTAL_ARCHITECTURE.md for the full picture.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { resolve, extname, normalize } from 'node:path';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';

import { loadEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectDb, runMigrations } from './db/connection.js';
import { ensureDevKeys } from './lib/crypto.js';
import { mountSecurityMiddleware } from './middleware/security.js';
import { mountSessionMiddleware } from './middleware/session.js';
import { mountErrorHandler } from './middleware/error.js';

// API route registrars
import { mountHealth } from './api/health.js';
import { mountAuth } from './api/auth.js';
import { mountMe } from './api/me.js';
import { mountRooms } from './api/rooms.js';
import { mountMessages } from './api/messages.js';
import { mountFiles } from './api/files.js';
import { mountBots } from './api/bots.js';
import { mountJobs } from './api/jobs.js';
import { mountVisitors } from './api/visitors.js';
import { mountWebhooks } from './api/webhooks.js';
import { mountClaim } from './api/claim.js';
import { mountHandoff } from './api/handoff.js';
import { mountPasswordReset } from './api/password_reset.js';
import { startCoordinator } from './lib/job_runner.js';

// WebSocket handlers
import { mountHumanWs, mountBotWs } from './ws/handler.js';

async function main() {
  const env = loadEnv();

  logger.info(
    { mode: env.NODE_ENV, port: env.PORT, db: env.DATABASE_URL.replace(/:[^@]*@/, ':***@') },
    'Unity AI Lab - Unified Server starting',
  );

  // Pre-flight: ensure data + keys directories exist (dev only — prod uses secrets manager)
  const dataDir = resolve(process.cwd(), 'server/data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  if (env.NODE_ENV === 'development') {
    await ensureDevKeys();
  }

  // DB
  const db = await connectDb(env.DATABASE_URL);
  await runMigrations(db, resolve(process.cwd(), 'server/migrations'));
  logger.info('database connected and migrations applied');

  // Hono app
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

  // Global middleware
  mountSecurityMiddleware(app, env);
  mountSessionMiddleware(app, env, db);
  mountErrorHandler(app);

  // API routes (mount each module — they each register their own routes on the app)
  mountHealth(app, env, db);
  mountAuth(app, env, db);
  mountMe(app, env, db);
  mountRooms(app, env, db);
  mountMessages(app, env, db);
  mountFiles(app, env, db);
  mountBots(app, env, db);
  mountJobs(app, env, db);
  mountVisitors(app, env, db);
  mountWebhooks(app, env, db);
  mountClaim(app, env, db);
  mountHandoff(app, env, db);
  mountPasswordReset(app, env, db);

  // WebSocket
  mountHumanWs(app, env, db, upgradeWebSocket);
  mountBotWs(app, env, db, upgradeWebSocket);

  // In-process coordinator (no-op if GitHub App env vars not set)
  startCoordinator(env, db);

  // Static file serving — manual handler that handles directory index files
  const STATIC_ROOT = resolve(process.cwd(), env.NODE_ENV === 'development' ? '.' : './dist');
  const MIME: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
  };
  app.use('*', async (c) => {
    let urlPath = c.req.path;
    // Path traversal guard
    if (urlPath.includes('..')) return c.text('400 Bad Request', 400);
    // Directory request → serve index.html
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const filePath = resolve(STATIC_ROOT, '.' + urlPath);
    // Ensure resolved path is still inside STATIC_ROOT (defence in depth)
    if (!normalize(filePath).startsWith(STATIC_ROOT)) {
      return c.text('400 Bad Request', 400);
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      return c.text('404 Not Found', 404);
    }
    const ext = extname(filePath).toLowerCase();
    const data = readFileSync(filePath);
    return new Response(new Uint8Array(data), {
      status: 200,
      headers: { 'content-type': MIME[ext] ?? 'application/octet-stream' },
    });
  });

  // Start
  const server = serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST,
  }, (info) => {
    logger.info({ host: info.address, port: info.port }, 'server listening');
    if (env.NODE_ENV === 'development') {
      logger.info(`marketing site:  http://localhost:${info.port}/`);
      logger.info(`admin portal:    http://localhost:${info.port}/admin/`);
      logger.info(`health:          http://localhost:${info.port}/healthz`);
      if (env.DEV_AUTH_BYPASS) {
        logger.warn('DEV_AUTH_BYPASS=true - dev login picker enabled (no auth required). NEVER set in production.');
      }
    }
  });
  injectWebSocket(server);

  // Graceful shutdown
  for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, () => {
      logger.info({ sig }, 'shutdown signal received, closing server');
      server.close(() => {
        logger.info('server closed cleanly');
        process.exit(0);
      });
      // hard timeout if drain hangs
      setTimeout(() => {
        logger.warn('drain timeout, forcing exit');
        process.exit(1);
      }, 30_000).unref();
    });
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('fatal startup error:', err);
  process.exit(1);
});
