-- 0010_deploy_events.sql — GitHub deploy / push events received via webhook
-- Per AP-062

CREATE TABLE IF NOT EXISTS deploy_events (
  id              TEXT PRIMARY KEY NOT NULL,
  provider        TEXT NOT NULL DEFAULT 'github_pages',
  repo            TEXT NOT NULL,                                -- e.g. Unity-Lab-AI/Unity-Lab-AI.github.io
  branch          TEXT NOT NULL,
  commit_sha      TEXT NOT NULL,
  actor           TEXT,                                         -- GitHub login that triggered
  status          TEXT NOT NULL DEFAULT 'STARTED'               -- STARTED | SUCCEEDED | FAILED | CANCELLED
                  CHECK (status IN ('STARTED','SUCCEEDED','FAILED','CANCELLED')),
  deploy_url      TEXT,
  payload_json    TEXT NOT NULL,                                -- raw webhook payload for forensics
  received_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_deploy_events_repo ON deploy_events(repo, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_deploy_events_status ON deploy_events(status, received_at DESC);
