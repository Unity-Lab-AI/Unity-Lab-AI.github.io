-- 0008_bots.sql — bot identities + sessions
-- Per AP-059, AP-060

CREATE TABLE IF NOT EXISTS bots (
  id                    TEXT PRIMARY KEY NOT NULL,
  owner_user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'WORKER'         -- SUPERVISOR | WORKER | LOGISTIC | OBSERVER
                        CHECK (role IN ('SUPERVISOR','WORKER','LOGISTIC','OBSERVER')),
  public_key            TEXT,                                   -- Ed25519 pubkey hex (set at first connect)
  enrollment_token_hash TEXT,                                   -- sha256 of one-shot token (1h TTL)
  enrollment_expires_at TEXT,
  enrolled_at           TEXT,                                   -- when public_key first registered
  last_seen_at          TEXT,
  revoked_at            TEXT,
  revoke_reason         TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bot_sessions (
  id              TEXT PRIMARY KEY NOT NULL,
  bot_id          TEXT NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,                     -- long-lived, rotated on refresh
  access_token_hash  TEXT,                                      -- short-lived (15min)
  refresh_issued_at  TEXT NOT NULL DEFAULT (datetime('now')),
  refresh_expires_at TEXT NOT NULL,
  last_refreshed_at  TEXT,
  revoked_at         TEXT,
  revoke_reason      TEXT
);

CREATE INDEX IF NOT EXISTS idx_bots_owner ON bots(owner_user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_bot ON bot_sessions(bot_id, revoked_at);
