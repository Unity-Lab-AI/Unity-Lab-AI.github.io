-- 0011_user_passwords.sql — OPTIONAL password fallback for browser-only return users
-- Per user request 2026-04-25 (post-AP-265 addendum)
--
-- The PRIMARY auth path remains Google SSO + WebAuthn (per ADR-002).
-- Password is an OPT-IN secondary path for when:
--   - Returning user on the browser doesn't have .claude/CLI handy
--   - Google SSO temporarily unavailable
--   - User wants to log in from a device without their hardware key
--
-- Security:
--   - Argon2id hash (server-side, NEVER reversible)
--   - Min 12 chars, common-password blocklist enforced at set-time
--   - Set+verify both require active session (so initial setup happens AFTER first SSO login)
--   - Password alone is INSUFFICIENT — still requires email-link round-trip OR WebAuthn second factor
--   - Rate-limited per user (5 fails per 15 min → lockout 1h)

CREATE TABLE IF NOT EXISTS user_passwords (
  user_id            TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash      TEXT NOT NULL,                            -- argon2id encoded ($argon2id$...$...$...)
  set_at             TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at       TEXT,
  failed_attempts    INTEGER NOT NULL DEFAULT 0,
  locked_until       TEXT
);
