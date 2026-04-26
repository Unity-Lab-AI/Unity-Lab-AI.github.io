-- 0004_audit_log.sql — append-only audit log
-- Per AP-053. App role has INSERT only — no UPDATE/DELETE in production.
-- (DB role separation enforced at app layer via prepared statements + at DB layer in prod via GRANT.)

CREATE TABLE IF NOT EXISTS audit_log (
  id              TEXT PRIMARY KEY NOT NULL,
  actor_user_id   TEXT REFERENCES users(id),                   -- nullable for system events
  actor_kind      TEXT NOT NULL DEFAULT 'user'                 -- user | bot | system | webhook
                  CHECK (actor_kind IN ('user','bot','system','webhook')),
  action          TEXT NOT NULL,                               -- e.g. login.success, room.create, bot.revoke
  target_type     TEXT,                                        -- e.g. room | message | bot | user
  target_id       TEXT,
  payload_json    TEXT,                                        -- JSON details (PII-aware — see DATA_CLASSIFICATION)
  ip              TEXT,
  user_agent      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
