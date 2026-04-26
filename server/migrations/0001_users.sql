-- 0001_users.sql — admin users table
-- Per ADMIN_PORTAL_TODO.md AP-052

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY NOT NULL,                  -- uuid v4
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,                                        -- display name from Google profile
  role            TEXT NOT NULL DEFAULT 'OWNER'                -- OWNER | SUPERVISOR | WORKER | OBSERVER
                  CHECK (role IN ('OWNER','SUPERVISOR','WORKER','OBSERVER')),
  status          TEXT NOT NULL DEFAULT 'ACTIVE'               -- ACTIVE | SUSPENDED | REMOVED
                  CHECK (status IN ('ACTIVE','SUSPENDED','REMOVED')),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at   TEXT,
  suspended_at    TEXT,
  suspended_by    TEXT REFERENCES users(id),
  suspended_reason TEXT,
  removed_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
