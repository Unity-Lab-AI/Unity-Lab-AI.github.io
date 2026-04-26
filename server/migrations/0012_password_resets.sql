-- 0012_password_resets.sql — single-use password reset tokens
-- OWNER mints a reset for another admin via /api/auth/password/reset.
-- Target admin clicks the link, sets a new password.

CREATE TABLE IF NOT EXISTS password_resets (
  id              TEXT PRIMARY KEY NOT NULL,
  target_user_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,                         -- sha256 of raw token
  minted_by       TEXT NOT NULL REFERENCES users(id),
  minted_at       TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT NOT NULL,                                -- default 24h
  consumed_at     TEXT,
  consumed_ip     TEXT,
  consumed_ua     TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_resets_target ON password_resets(target_user_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_password_resets_hash ON password_resets(token_hash);
