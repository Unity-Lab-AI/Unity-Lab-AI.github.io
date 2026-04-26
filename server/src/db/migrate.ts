/**
 * Standalone migration runner — usable via `npm run migrate`.
 * Boot-time integration also calls runMigrations() in src/index.ts.
 */

import { resolve } from 'node:path';
import { loadEnv } from '../config/env.js';
import { connectDb, runMigrations } from './connection.js';
import { logger } from '../lib/logger.js';

async function main() {
  const env = loadEnv();
  const db = await connectDb(env.DATABASE_URL);
  await runMigrations(db, resolve(process.cwd(), 'server/migrations'));
  logger.info('migrations applied');
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('migration failed:', err);
  process.exit(1);
});
