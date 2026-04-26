/**
 * Structured logger.
 * - Pino in JSON mode for prod
 * - Pretty-printed in dev if LOG_PRETTY=true
 * - Redacts known secret patterns from log payloads
 */

import pino from 'pino';

const REDACT_PATHS = [
  'password',
  'token',
  'access_token',
  'refresh_token',
  'jwt',
  'authorization',
  'cookie',
  'set-cookie',
  'private_key',
  'client_secret',
  'secret',
  '*.password',
  '*.token',
  '*.secret',
  '*.private_key',
];

const isPretty = process.env.LOG_PRETTY === 'true';
const level = process.env.LOG_LEVEL ?? 'info';

export const logger = pino({
  level,
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  ...(isPretty
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

/**
 * Strip known secret-looking strings from arbitrary text (logs, error messages).
 * Belt-and-suspenders alongside pino redact.
 */
export function redactSecrets(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]')
    .replace(/sk_[A-Za-z0-9_]{20,}/g, 'sk_[REDACTED]')
    .replace(/pk_[A-Za-z0-9_]{20,}/g, 'pk_[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT-REDACTED]');
}
