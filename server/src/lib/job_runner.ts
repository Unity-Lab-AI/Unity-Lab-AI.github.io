/**
 * In-process job coordinator.
 *
 * Polls /lease/next every COORDINATOR_POLL_MS, executes the job via the GitHub App,
 * reports COMPLETED or FAILED back. Runs as a `setInterval` started by index.ts.
 *
 * For multi-coordinator scale (multiple Node instances), the lease + UPDATE...WHERE
 * pattern in jobs.ts already serializes — only one coordinator wins each job.
 *
 * Job kinds executed:
 *   - PR — opens a pull request
 *   - MERGE — validates CI status, then merges the PR
 *   - REVERT — opens a revert PR (auto-merges if requested)
 *   - PUSH — currently NOT executed by the coordinator (use PR + MERGE instead);
 *           the API layer rejects PUSH-to-main directly. PUSH-to-feature-branch via
 *           coordinator is queued AP-167.
 *
 * Lease heartbeat: while a job runs, an interval extends the lease every 60s.
 * If execution exceeds 30 minutes total, coordinator gives up and lets the lease expire.
 */

import type { AppEnv } from '../config/env.js';
import type { DbConn } from './../db/connection.js';
import { github } from './github_app.js';
import { logger } from './logger.js';
import { emitAudit } from '../middleware/audit.js';
import { broadcastToRoom } from '../ws/rooms.js';

const POLL_MS = 5_000;
const HEARTBEAT_MS = 60_000;
const MAX_RUN_MS = 30 * 60_000;

let stopped = false;
let activeJobs = new Set<string>();

interface JobLease {
  id: string;
  kind: string;
  target_repo: string;
  target_branch: string;
  payload: any;
}

async function leaseNextJob(env: AppEnv): Promise<JobLease | null> {
  // Internal: call the same logic as /api/jobs/lease/next would.
  // For an in-process coordinator we hit our own HTTP endpoint to keep the
  // serialization logic in one place.
  try {
    const res = await fetch(`${env.PUBLIC_BASE_URL}/api/jobs/lease/next`, {
      method: 'POST',
      headers: { 'X-Internal-Coordinator': 'true' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.job ?? null;
  } catch (err) {
    logger.debug({ err: (err as Error).message }, 'job_runner: lease fetch failed');
    return null;
  }
}

async function reportJob(env: AppEnv, jobId: string, status: 'COMPLETED' | 'FAILED' | 'RUNNING', result?: any): Promise<void> {
  try {
    await fetch(`${env.PUBLIC_BASE_URL}/api/jobs/${jobId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Coordinator': 'true' },
      body: JSON.stringify({ status, result }),
    });
  } catch (err) {
    logger.error({ jobId, err: (err as Error).message }, 'job_runner: report failed');
  }
}

async function heartbeatJob(env: AppEnv, jobId: string): Promise<void> {
  try {
    await fetch(`${env.PUBLIC_BASE_URL}/api/jobs/${jobId}/heartbeat`, {
      method: 'POST',
      headers: { 'X-Internal-Coordinator': 'true' },
    });
  } catch { /* ignore */ }
}

async function executeJob(env: AppEnv, db: DbConn, job: JobLease): Promise<{ status: 'COMPLETED' | 'FAILED'; result: any }> {
  const start = Date.now();
  logger.info({ job_id: job.id, kind: job.kind, repo: job.target_repo }, 'coordinator: executing job');

  try {
    switch (job.kind) {
      case 'PR': {
        // payload: { head, base, title, body? }
        const { head, base = job.target_branch, title, body } = job.payload ?? {};
        if (!head || !title) throw new Error('PR job requires payload.head and payload.title');
        const pr = await github.openPullRequest(env, {
          repo: job.target_repo,
          head, base, title, body,
        });
        return { status: 'COMPLETED', result: { pr_number: pr.number, pr_url: pr.html_url, head, base } };
      }

      case 'MERGE': {
        // payload: { pull_number, merge_method?, require_ci_green? }
        const { pull_number, merge_method = 'squash', require_ci_green = true, commit_title } = job.payload ?? {};
        if (!pull_number) throw new Error('MERGE job requires payload.pull_number');

        if (require_ci_green) {
          const pr = await github.getPullRequest(env, { repo: job.target_repo, pull_number });
          const sha = pr.head?.sha;
          if (!sha) throw new Error('PR has no head SHA');
          const status = await github.getCommitStatus(env, { repo: job.target_repo, ref: sha });
          if (status.state !== 'success') {
            throw new Error(`CI not green: state=${status.state}`);
          }
        }

        const merge = await github.mergePullRequest(env, {
          repo: job.target_repo,
          pull_number,
          merge_method,
          commit_title,
        });
        return { status: 'COMPLETED', result: { merged: merge.merged, sha: merge.sha, message: merge.message } };
      }

      case 'REVERT': {
        // payload: { revert_sha, revert_branch (the new branch the revert goes on), title?, body?, auto_merge? }
        // Implemented via the same flow: open PR with the revert as a commit on a new branch.
        // Actual revert commit creation requires the Contents API — out of scope for this stub.
        return {
          status: 'FAILED',
          result: { error: 'REVERT execution not yet implemented in coordinator', tracked: 'AP-167' },
        };
      }

      case 'PUSH': {
        // PUSH-to-feature-branch via coordinator using Contents API
        // payload: { files: [{path, content_base64, mode?}], message }
        return {
          status: 'FAILED',
          result: { error: 'PUSH coordinator execution not yet implemented (use PR + MERGE)', tracked: 'AP-167' },
        };
      }

      default:
        return { status: 'FAILED', result: { error: `unknown job kind: ${job.kind}` } };
    }
  } catch (err) {
    const msg = (err as Error).message;
    logger.warn({ job_id: job.id, err: msg, took_ms: Date.now() - start }, 'coordinator: job failed');
    return { status: 'FAILED', result: { error: msg } };
  }
}

export function startCoordinator(env: AppEnv, db: DbConn): void {
  if (!env.GITHUB_APP_ID || !env.GITHUB_APP_PRIVATE_KEY || !env.GITHUB_APP_INSTALLATION_ID) {
    logger.info('coordinator: GitHub App not configured (set GITHUB_APP_ID/PRIVATE_KEY/INSTALLATION_ID to enable). Coordinator disabled.');
    return;
  }
  logger.info('coordinator: starting (poll interval ' + POLL_MS + 'ms)');

  const tick = async () => {
    if (stopped) return;
    if (activeJobs.size >= 3) {
      // Cap concurrency
      return;
    }
    const job = await leaseNextJob(env);
    if (!job) return;

    activeJobs.add(job.id);
    const startedAt = Date.now();
    const heartbeat = setInterval(() => {
      if (Date.now() - startedAt > MAX_RUN_MS) {
        logger.warn({ job_id: job.id }, 'coordinator: job exceeded MAX_RUN_MS, giving up');
        clearInterval(heartbeat);
        activeJobs.delete(job.id);
        reportJob(env, job.id, 'FAILED', { error: 'coordinator timeout' });
        return;
      }
      heartbeatJob(env, job.id);
    }, HEARTBEAT_MS);

    emitAudit(db, null, {
      action: 'coordinator.start',
      actor_kind: 'system',
      target_type: 'job',
      target_id: job.id,
      payload: { kind: job.kind, repo: job.target_repo },
    });
    broadcastToRoom('_jobs', { op: 'job_event', event: 'coordinator_started', job_id: job.id });

    try {
      const { status, result } = await executeJob(env, db, job);
      await reportJob(env, job.id, status, result);
      emitAudit(db, null, {
        action: `coordinator.${status.toLowerCase()}`,
        actor_kind: 'system',
        target_type: 'job',
        target_id: job.id,
        payload: result,
      });
    } catch (err) {
      await reportJob(env, job.id, 'FAILED', { error: (err as Error).message });
    } finally {
      clearInterval(heartbeat);
      activeJobs.delete(job.id);
    }
  };

  setInterval(() => { tick().catch((err) => logger.error({ err: err.message }, 'coordinator tick error')); }, POLL_MS).unref();
}

export function stopCoordinator(): void {
  stopped = true;
}
