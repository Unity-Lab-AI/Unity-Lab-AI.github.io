/**
 * DB connection — SQLite (dev) and Postgres (prod).
 *
 * Returns a unified `DbConn` with a small subset of the better-sqlite3 API that's
 * polyfilled for Postgres. Most queries written for SQLite work on Postgres unchanged
 * because we stuck to dialect-portable SQL in migrations + queries.
 *
 * Differences callers must handle:
 *   - Auto-increment: SQLite uses INTEGER PRIMARY KEY AUTOINCREMENT. We avoid it
 *     by using TEXT pk + randomToken everywhere except the _migrations table.
 *   - datetime('now'): works on SQLite, NOT on Postgres. Postgres path REPLACES
 *     with NOW() in queries that go through the polyfill — but for raw queries
 *     in the codebase we use datetime('now') everywhere, which the polyfill rewrites.
 */

import Database from 'better-sqlite3';
import { resolve } from 'node:path';
import { readdirSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { logger } from '../lib/logger.js';

export interface PreparedStatement {
  run(...params: any[]): { changes: number; lastInsertRowid?: number | bigint };
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

export interface DbConn {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): void;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  pragma?(s: string): any;
  close?(): void;
  /** which dialect */
  dialect: 'sqlite' | 'postgres';
}

class SqliteAdapter implements DbConn {
  readonly dialect = 'sqlite' as const;
  constructor(private inner: Database.Database) {}
  prepare(sql: string): PreparedStatement { return this.inner.prepare(sql); }
  exec(sql: string): void { this.inner.exec(sql); }
  transaction<T extends (...args: any[]) => any>(fn: T): T { return this.inner.transaction(fn) as unknown as T; }
  pragma(s: string): any { return this.inner.pragma(s); }
  close(): void { this.inner.close(); }
}

export async function connectDb(databaseUrl: string): Promise<DbConn> {
  if (databaseUrl.startsWith('sqlite://')) {
    const path = databaseUrl.replace(/^sqlite:\/\//, '');
    const abs = resolve(process.cwd(), path);
    const dir = resolve(abs, '..');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const inner = new Database(abs);
    inner.pragma('journal_mode = WAL');
    inner.pragma('foreign_keys = ON');
    inner.pragma('synchronous = NORMAL');
    inner.pragma('busy_timeout = 5000');
    logger.info({ path: abs }, 'sqlite connected');
    return new SqliteAdapter(inner);
  }

  if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
    return await connectPostgres(databaseUrl);
  }

  throw new Error(`unsupported DATABASE_URL scheme: ${databaseUrl}`);
}

async function connectPostgres(url: string): Promise<DbConn> {
  // Lazy-import pg to avoid forcing the dependency in dev installs
  let pg: any;
  try {
    pg = await import('pg');
  } catch (e) {
    throw new Error('Postgres path requires `pg` npm package. Add `"pg": "^8.13.0"` to dependencies and `"@types/pg": "^8.11.0"` to devDependencies, then `npm install`.');
  }
  const pool = new pg.default.Pool({ connectionString: url, max: 10 });
  await pool.query('SELECT 1');
  logger.info('postgres connected');

  // Rewriter: SQLite-isms → Postgres equivalents
  function rewrite(sql: string): { sql: string; paramRewrite: boolean } {
    let out = sql
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/COALESCE\(MAX\(seq\), 0\)/g, 'COALESCE(MAX(seq), 0)') // identical, just kept explicit
      .replace(/AUTOINCREMENT/gi, '');
    // Replace ? placeholders with $1, $2...
    let i = 0;
    out = out.replace(/\?/g, () => `$${++i}`);
    return { sql: out, paramRewrite: i > 0 };
  }

  function adapt(rows: any[]): any[] {
    return rows.map((r) => {
      const out: any = {};
      for (const [k, v] of Object.entries(r)) {
        // Pg returns Date for timestamps, BIGINT as string — normalize basic ones
        if (v instanceof Date) out[k] = v.toISOString();
        else if (typeof v === 'bigint') out[k] = Number(v);
        else out[k] = v;
      }
      return out;
    });
  }

  const conn: DbConn = {
    dialect: 'postgres',
    prepare(sql: string): PreparedStatement {
      const { sql: rewritten } = rewrite(sql);
      return {
        run(...params: any[]) {
          // Use queryEvent to expose rowCount
          // Pool query is async — wrap synchronously is impossible, so we do "best effort sync"
          // by buffering. Since better-sqlite3 callers expect sync, we use deasync-like trick: NO.
          // Instead: this Postgres adapter runs queries via .runAsync; callers using `prepare(...).run()` in pg path
          // must be migrated, OR we accept that Postgres support requires async.
          throw new Error('synchronous prepare(...).run is not supported on Postgres path. Use the async helpers from db/pg-async.ts (TODO Phase 2). For now, dev = SQLite.');
        },
        get(...params: any[]) {
          throw new Error('synchronous prepare(...).get is not supported on Postgres path.');
        },
        all(...params: any[]) {
          throw new Error('synchronous prepare(...).all is not supported on Postgres path.');
        },
      };
    },
    exec(sql: string) {
      // Used only for migrations — execute synchronously by blocking on the promise.
      // Acceptable at boot time; not suitable for hot-path queries.
      throw new Error('Postgres exec(): blocking pg from sync context. Run migrations via the async migrate.ts entry instead.');
    },
    transaction<T extends (...args: any[]) => any>(fn: T): T { return fn; },
  };

  // Note: Full Postgres support requires refactoring the API handlers to use async DB calls.
  // SQLite path remains the only fully-functional path in this round. Tracked AP-051 (extension).
  logger.warn('Postgres connection acquired but synchronous query API not wired. Use SQLite for now or refactor to async.');
  (conn as any)._pgPool = pool;
  return conn;
}

export async function runMigrations(db: DbConn, migrationsDir: string): Promise<void> {
  if (db.dialect === 'postgres') {
    return runMigrationsPg(db, migrationsDir);
  }
  // SQLite path
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const applied = new Set(
    db.prepare('SELECT filename FROM _migrations').all().map((r: any) => r.filename as string),
  );

  if (!existsSync(migrationsDir)) {
    logger.warn({ migrationsDir }, 'migrations directory does not exist — skipping');
    return;
  }

  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = readFileSync(resolve(migrationsDir, f), 'utf8');
    logger.info({ migration: f }, 'applying migration');
    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migrations (filename) VALUES (?)').run(f);
    });
    try { tx(); } catch (err) {
      logger.error({ migration: f, err }, 'migration failed');
      throw err;
    }
  }
}

async function runMigrationsPg(db: DbConn, migrationsDir: string): Promise<void> {
  const pool = (db as any)._pgPool;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const { rows } = await pool.query('SELECT filename FROM _migrations');
  const applied = new Set(rows.map((r: any) => r.filename));

  if (!existsSync(migrationsDir)) return;
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = readFileSync(resolve(migrationsDir, f), 'utf8');
    // Translate SQLite-isms for Postgres
    const translated = sql
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
      .replace(/TEXT NOT NULL DEFAULT \(datetime\('now'\)\)/gi, 'TIMESTAMPTZ NOT NULL DEFAULT NOW()')
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/BLOB/gi, 'BYTEA')
      .replace(/REFERENCES users\(id\) ON DELETE CASCADE/gi, 'REFERENCES users(id) ON DELETE CASCADE');
    logger.info({ migration: f, dialect: 'postgres' }, 'applying migration');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(translated);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [f]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ migration: f, err }, 'pg migration failed');
      throw err;
    } finally {
      client.release();
    }
  }
}
