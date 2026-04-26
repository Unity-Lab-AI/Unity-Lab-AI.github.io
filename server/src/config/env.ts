/**
 * Environment variable loading + validation.
 * Boots fail-fast if required vars missing or invalid.
 * Production rejects DEV_AUTH_BYPASS=true.
 */

import { z } from 'zod';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env from server/.env if present (lightweight inline parser — no extra dep)
const envPath = resolve(process.cwd(), 'server/.env');
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) {
      const [, key, val] = m;
      if (key && process.env[key] === undefined) {
        process.env[key] = val ? val.replace(/^['"](.*)['"]$/, '$1') : '';
      }
    }
  }
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().default('sqlite://./server/data/dev.db'),

  DEV_AUTH_BYPASS: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),

  // Universal-claim window: when true, any allowlisted admin email can claim an
  // unclaimed account by hitting /api/auth/claim with email+password (no token).
  // Founder turns this ON in prod env when distributing the .claude/ template,
  // turns it OFF after all 4 are enrolled. In dev, defaults to true.
  ADMIN_CLAIM_OPEN: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),

  JWT_SIGNING_KEY: z.string().optional().default(''),
  JWT_ISSUER: z.string().default('admin.unityailab.com'),
  JWT_AUDIENCE: z.string().default('admin.unityailab.com'),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(43200),

  CSRF_COOKIE_SECRET: z.string().optional().default(''),

  WEBAUTHN_RP_ID: z.string().default('localhost'),
  WEBAUTHN_RP_NAME: z.string().default('Unity AI Lab Admin Portal'),
  WEBAUTHN_ORIGIN: z.string().default('http://localhost:3000'),

  FILE_STORAGE_KIND: z.enum(['local', 'r2']).default('local'),
  FILE_STORAGE_LOCAL_PATH: z.string().default('./server/data/uploads'),
  R2_ENDPOINT: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET: z.string().optional().default(''),

  GITHUB_APP_ID: z.string().optional().default(''),
  GITHUB_APP_PRIVATE_KEY: z.string().optional().default(''),
  GITHUB_APP_INSTALLATION_ID: z.string().optional().default(''),
  GITHUB_WEBHOOK_HMAC_SECRET: z.string().optional().default(''),

  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_PRETTY: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),

  RATELIMIT_LOGIN_PER_15MIN: z.coerce.number().int().positive().default(5),
  RATELIMIT_API_PER_MIN: z.coerce.number().int().positive().default(600),
  RATELIMIT_WS_MSG_PER_SEC: z.coerce.number().int().positive().default(10),
});

export type AppEnv = z.infer<typeof schema>;

export function loadEnv(): AppEnv {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('environment validation failed:\n', parsed.error.format());
    process.exit(1);
  }
  const env = parsed.data;

  // PRODUCTION SAFETY: reject dev bypass in prod
  if (env.NODE_ENV === 'production' && env.DEV_AUTH_BYPASS) {
    // eslint-disable-next-line no-console
    console.error('FATAL: DEV_AUTH_BYPASS=true is forbidden when NODE_ENV=production. Refusing to start.');
    process.exit(1);
  }

  // PRODUCTION SAFETY: require signing keys (NOT OAuth — auth is now password-based)
  if (env.NODE_ENV === 'production' && !env.DEV_AUTH_BYPASS) {
    const missing: string[] = [];
    if (!env.JWT_SIGNING_KEY) missing.push('JWT_SIGNING_KEY');
    if (!env.CSRF_COOKIE_SECRET) missing.push('CSRF_COOKIE_SECRET');
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`FATAL: production requires these env vars: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  return env;
}
