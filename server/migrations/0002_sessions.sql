-- 0002_sessions.sql — server-side session records
-- Per AP-044

CREATE TABLE IF NOT EXISTS sessions (
  id              TEXT PRIMARY KEY NOT NULL,                  -- uuid v4
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jwt_id          TEXT NOT NULL UNIQUE,                       -- jti claim, also stored in JWT
  issued_at       TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at      TEXT NOT NULL,
  last_seen_at    TEXT NOT NULL DEFAULT (datetime('now')),
  ip              TEXT,
  user_agent      TEXT,
  revoked_at      TEXT,
  revoke_reason   TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_jwt ON sessions(jwt_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, revoked_at, expires_at);
