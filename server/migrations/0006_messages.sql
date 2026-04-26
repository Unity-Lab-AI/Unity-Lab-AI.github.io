-- 0006_messages.sql — chat messages (RESTRICTED data class)
-- Per AP-057. CHECK constraint: exactly one of sender_user_id/sender_bot_id non-null.

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY NOT NULL,
  room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_user_id  TEXT REFERENCES users(id),                   -- nullable
  sender_bot_id   TEXT REFERENCES bots(id),                    -- nullable; FK enforced after 0008
  kind            TEXT NOT NULL DEFAULT 'TEXT'                 -- TEXT | FILE | SYSTEM | BOT_INTENT
                  CHECK (kind IN ('TEXT','FILE','SYSTEM','BOT_INTENT')),
  body            TEXT NOT NULL,                               -- JSON for non-TEXT kinds, plaintext for TEXT
  reply_to        TEXT REFERENCES messages(id),
  seq             INTEGER NOT NULL,                            -- monotonic per-room ordering
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  edited_at       TEXT,
  deleted_at      TEXT,
  deleted_by      TEXT REFERENCES users(id),
  CHECK ((sender_user_id IS NOT NULL AND sender_bot_id IS NULL)
      OR (sender_user_id IS NULL     AND sender_bot_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_messages_room_seq ON messages(room_id, seq DESC);
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_user ON messages(sender_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_bot ON messages(sender_bot_id, created_at DESC);
