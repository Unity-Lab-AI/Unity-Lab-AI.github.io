-- 0009_jobs.sql — repo write coordination job queue
-- Per AP-061. Single thread of execution for merges enforced via leases + advisory locks.

CREATE TABLE IF NOT EXISTS jobs (
  id              TEXT PRIMARY KEY NOT NULL,
  kind            TEXT NOT NULL                                -- PUSH | PR | MERGE | REVERT
                  CHECK (kind IN ('PUSH','PR','MERGE','REVERT')),
  target_repo     TEXT NOT NULL,                               -- e.g. Unity-Lab-AI/Unity-Lab-AI.github.io
  target_branch   TEXT NOT NULL,                               -- e.g. main, staging, feature/foo
  payload_json    TEXT NOT NULL,                               -- JSON: commits, message, files, etc.
  supervisor_id   TEXT REFERENCES users(id),                   -- approving supervisor (null until approved)
  worker_bot_id   TEXT REFERENCES bots(id),                    -- assigned worker (null until leased)
  status          TEXT NOT NULL DEFAULT 'QUEUED'               -- QUEUED|PENDING_APPROVAL|LEASED|RUNNING|COMPLETED|FAILED|CANCELLED
                  CHECK (status IN ('QUEUED','PENDING_APPROVAL','LEASED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  depends_on      TEXT,                                         -- JSON array of job IDs
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at     TEXT,
  leased_at       TEXT,
  lease_expires_at TEXT,
  completed_at    TEXT,
  result_json     TEXT
);

CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_target ON jobs(target_repo, target_branch, status);
CREATE INDEX IF NOT EXISTS idx_jobs_worker ON jobs(worker_bot_id);
