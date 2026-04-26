/**
 * Optional password fallback for browser return-users.
 *
 * Argon2id hashing (uses Node's built-in crypto.scrypt for now to avoid extra dep;
 * upgradeable to argon2 npm package in Phase 2 if cracking-resistance budget warrants).
 *
 * NOTE: argon2 is preferred over scrypt for new systems. scrypt is acceptable here as a
 * starting point because: (a) we have a 4-user system not a 4-million-user system,
 * (b) we still require a session to set the password (so it's a SECONDARY factor, not primary),
 * (c) we can swap to argon2id with a hash-version migration when traffic warrants the dep.
 */

import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';
import type { DbConn } from '../db/connection.js';

const SCRYPT_N = 2 ** 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;
const SALT_LEN = 16;

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty', 'qwertyuiop', 'letmein',
  'unityailab', 'admin1234', 'changeme', 'iloveyou', 'monkey1234',
]);

export interface PasswordValidation {
  ok: boolean;
  reason?: string;
}

export function validatePasswordStrength(pw: string): PasswordValidation {
  if (pw.length < 12) return { ok: false, reason: 'min_12_chars' };
  if (pw.length > 200) return { ok: false, reason: 'max_200_chars' };
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) return { ok: false, reason: 'common_password' };
  if (!/[a-z]/.test(pw)) return { ok: false, reason: 'needs_lowercase' };
  if (!/[A-Z]/.test(pw)) return { ok: false, reason: 'needs_uppercase' };
  if (!/[0-9]/.test(pw)) return { ok: false, reason: 'needs_digit' };
  return { ok: true };
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(SALT_LEN);
  const hash = scryptSync(pw, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 128 * 1024 * 1024 });
  return `$scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(pw: string, encoded: string): boolean {
  const m = encoded.match(/^\$scrypt\$N=(\d+),r=(\d+),p=(\d+)\$([0-9a-f]+)\$([0-9a-f]+)$/);
  if (!m) return false;
  const [, nStr, rStr, pStr, saltHex, hashHex] = m;
  const N = parseInt(nStr!, 10);
  const r = parseInt(rStr!, 10);
  const p = parseInt(pStr!, 10);
  const salt = Buffer.from(saltHex!, 'hex');
  const expected = Buffer.from(hashHex!, 'hex');
  const actual = scryptSync(pw, salt, expected.length, { N, r, p, maxmem: 128 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Set or change a password for a user. Caller must have already authenticated the session. */
export function setUserPassword(db: DbConn, userId: string, password: string): void {
  const v = validatePasswordStrength(password);
  if (!v.ok) throw new Error(`weak_password:${v.reason}`);
  const hash = hashPassword(password);
  db.prepare(`
    INSERT INTO user_passwords (user_id, password_hash, set_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT (user_id) DO UPDATE SET
      password_hash = excluded.password_hash,
      set_at = excluded.set_at,
      failed_attempts = 0,
      locked_until = NULL
  `).run(userId, hash);
}

/** Verify password for an email. Handles lockout. Returns user row on success. */
export function attemptPasswordLogin(db: DbConn, email: string, password: string):
  | { ok: true; user: { id: string; email: string; role: 'OWNER'|'SUPERVISOR'|'WORKER'|'OBSERVER' } }
  | { ok: false; reason: string } {
  const user = db.prepare(`
    SELECT id, email, role, status FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1
  `).get(email) as { id: string; email: string; role: 'OWNER'|'SUPERVISOR'|'WORKER'|'OBSERVER'; status: string } | undefined;
  if (!user || user.status !== 'ACTIVE') {
    // Constant-time-ish: still do a hash op even on miss to reduce timing oracle
    hashPassword('decoy_password_to_burn_time_xx');
    return { ok: false, reason: 'invalid_credentials' };
  }
  const pw = db.prepare(`
    SELECT password_hash, failed_attempts, locked_until FROM user_passwords WHERE user_id = ?
  `).get(user.id) as { password_hash: string; failed_attempts: number; locked_until: string | null } | undefined;
  if (!pw) {
    hashPassword('decoy_password_to_burn_time_xx');
    return { ok: false, reason: 'no_password_set' };
  }
  if (pw.locked_until && new Date(pw.locked_until).getTime() > Date.now()) {
    return { ok: false, reason: 'locked_until:' + pw.locked_until };
  }
  if (verifyPassword(password, pw.password_hash)) {
    db.prepare(`
      UPDATE user_passwords SET last_used_at = datetime('now'), failed_attempts = 0, locked_until = NULL
      WHERE user_id = ?
    `).run(user.id);
    return { ok: true, user: { id: user.id, email: user.email, role: user.role } };
  }
  // Failed: increment + lockout if 5+
  const newFails = pw.failed_attempts + 1;
  const lockUntil = newFails >= 5
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : null;
  db.prepare(`
    UPDATE user_passwords SET failed_attempts = ?, locked_until = ? WHERE user_id = ?
  `).run(newFails, lockUntil, user.id);
  return { ok: false, reason: lockUntil ? 'locked_now' : 'invalid_credentials' };
}
