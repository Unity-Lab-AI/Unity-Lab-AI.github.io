-- 0005_rooms.sql — chat rooms + memberships
-- Per AP-055, AP-056

CREATE TABLE IF NOT EXISTS rooms (
  id              TEXT PRIMARY KEY NOT NULL,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'CHANNEL'              -- DIRECT | CHANNEL | BOT_BUS
                  CHECK (kind IN ('DIRECT','CHANNEL','BOT_BUS')),
  description     TEXT,
  created_by      TEXT NOT NULL REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at     TEXT
);

CREATE TABLE IF NOT EXISTS room_members (
  room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'MEMBER'               -- ADMIN | MEMBER | READONLY
                  CHECK (role IN ('ADMIN','MEMBER','READONLY')),
  joined_at       TEXT NOT NULL DEFAULT (datetime('now')),
  left_at         TEXT,
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id, left_at);
CREATE INDEX IF NOT EXISTS idx_rooms_kind ON rooms(kind, archived_at);
