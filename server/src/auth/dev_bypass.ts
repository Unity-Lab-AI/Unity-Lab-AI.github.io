/**
 * DEV-ONLY auth bypass: lets the local user pick which admin to log in as without Google OAuth.
 * Only active when DEV_AUTH_BYPASS=true AND NODE_ENV !== 'production'.
 * Production startup rejects DEV_AUTH_BYPASS=true (see config/env.ts).
 */

import type { DbConn } from '../db/connection.js';
import { ADMIN_ALLOWLIST, ADMIN_DISPLAY, isAllowedAdmin } from '../config/admin_allowlist.js';
import { randomToken } from '../lib/crypto.js';

export function listDevAdmins() {
  return ADMIN_ALLOWLIST.map((email) => ({
    email,
    handle: ADMIN_DISPLAY[email].handle,
  }));
}

/** Get-or-create the user row for a dev login. Returns the user. */
export function getOrCreateDevUser(db: DbConn, email: string): { id: string; email: string; role: 'OWNER' } {
  if (!isAllowedAdmin(email)) {
    throw new Error(`dev_bypass: email ${email} not in admin allowlist`);
  }
  const existing = db.prepare('SELECT id, email, role FROM users WHERE email = ? LIMIT 1').get(email) as
    | { id: string; email: string; role: 'OWNER' }
    | undefined;
  if (existing) return existing;
  const id = randomToken(16);
  const handle = ADMIN_DISPLAY[email as keyof typeof ADMIN_DISPLAY].handle;
  db.prepare(`
    INSERT INTO users (id, email, name, role, status)
    VALUES (?, ?, ?, 'OWNER', 'ACTIVE')
  `).run(id, email, handle);
  return { id, email, role: 'OWNER' };
}
