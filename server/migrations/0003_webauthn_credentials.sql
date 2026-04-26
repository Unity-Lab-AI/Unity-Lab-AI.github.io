-- 0003_webauthn_credentials.sql — registered WebAuthn credentials per user
-- Per AP-054

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id              TEXT PRIMARY KEY NOT NULL,                  -- uuid v4
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id   BLOB NOT NULL UNIQUE,                       -- raw credential id from authenticator
  public_key      BLOB NOT NULL,                              -- COSE public key
  counter         INTEGER NOT NULL DEFAULT 0,                 -- signature counter (clone detection)
  transports      TEXT,                                        -- JSON array of transports (usb, nfc, ble, internal)
  label           TEXT,                                        -- user-supplied nickname
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at    TEXT,
  deleted_at      TEXT                                         -- soft delete
);

CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id, deleted_at);
