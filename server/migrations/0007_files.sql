-- 0007_files.sql — file metadata (file bytes live in object storage / local fs)
-- Per AP-058

CREATE TABLE IF NOT EXISTS files (
  id              TEXT PRIMARY KEY NOT NULL,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id),
  room_id         TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  storage_kind    TEXT NOT NULL DEFAULT 'local'                -- local | r2 | s3
                  CHECK (storage_kind IN ('local','r2','s3')),
  storage_key     TEXT NOT NULL,                               -- e.g. files/<room_id>/<file_id>/<filename>
  filename        TEXT NOT NULL,
  size            INTEGER NOT NULL,
  mime            TEXT NOT NULL,
  sha256          TEXT NOT NULL,                               -- hex; verified on upload-confirm
  uploaded_at     TEXT NOT NULL DEFAULT (datetime('now')),
  scanned_at      TEXT,                                        -- virus-scan timestamp
  scan_result     TEXT,                                        -- clean | infected | error
  deleted_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_files_room ON files(room_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploaded_by_user_id, uploaded_at DESC);
