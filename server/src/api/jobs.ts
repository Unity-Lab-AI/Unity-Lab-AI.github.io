/**
 * /api/jobs/* — repo write coordination.
 * Per ADMIN_PORTAL_TODO.md AP-161 through AP-174.
 *
 * Job lifecycle:
 *   QUEUED (supervisor) | PENDING_APPROVAL (worker) → LEASED → RUNNING → COMPLETED | FAILED | CANCELLED
 *
 * Concurrency: SQLite uses BEGIN IMMEDIATE + UPDATE ... WHERE status = 'QUEUED' AND id = ?
 * to serialize lease attempts (same effect as SELECT FOR UPDATE on Postgres).
 *
 * Dependency resolution: a job is leasable only if all its `depends_on` job IDs are COMPLETED.
 * Coordinator computes leasable set on each /lease/next call.
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { randomToken } from '../lib/crypto.js';
import { emitAudit } from '../middleware/audit.js';
import { broadcastToRoom } from '../ws/rooms.js';

const LEASE_TTL_MS = 5 * 60 * 1000; // 5 minutes — workers heartbeat to extend

export function mountJobs(app: Hono, _env: AppEnv, db: DbConn): void {
  // Sweep expired leases on import (and every 60s)
  function sweepLeases() {
    const result = db.prepare(`
      UPDATE jobs SET status = 'QUEUED', worker_bot_id = NULL, leased_at = NULL, lease_expires_at = NULL
      WHERE status IN ('LEASED', 'RUNNING') AND lease_expires_at < datetime('now')
    `).run();
    if (result.changes > 0) {
      // No audit/broadcast — sweeper is internal infrastructure
    }
  }
  setInterval(sweepLeases, 60_000).unref();

  // List jobs
  app.get('/api/jobs', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const status = c.req.query('status');
    const limit = Math.min(200, parseInt(c.req.query('limit') ?? '100', 10));
    const params: any[] = [];
    let where = '';
    if (status) { where = 'WHERE status = ?'; params.push(status); }
    const jobs = db.prepare(`
      SELECT id, kind, target_repo, target_branch, status, supervisor_id, worker_bot_id,
             depends_on, created_at, approved_at, leased_at, lease_expires_at, completed_at,
             result_json, payload_json
      FROM jobs ${where} ORDER BY created_at DESC LIMIT ?
    `).all(...params, limit);
    return c.json({ jobs });
  });

  // Create job — humans (any role) and bots both via same endpoint.
  // Humans with SUPERVISOR/OWNER role: status = QUEUED immediately.
  // Workers + everyone else: status = PENDING_APPROVAL until a supervisor approves.
  app.post('/api/jobs', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);

    let body: { kind?: string; target_repo?: string; target_branch?: string; payload?: any; depends_on?: string[] };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.kind || !body.target_repo || !body.target_branch || !body.payload) {
      return c.json({ error: 'missing_fields' }, 400);
    }
    if (!['PUSH', 'PR', 'MERGE', 'REVERT'].includes(body.kind)) {
      return c.json({ error: 'invalid_kind' }, 400);
    }
    // Force-push protection: never allow direct PUSH to main
    if (body.kind === 'PUSH' && body.target_branch === 'main') {
      return c.json({ error: 'direct_push_to_main_forbidden', message: 'Use PR + MERGE flow.' }, 403);
    }

    const isSupervisor = s.role === 'OWNER' || s.role === 'SUPERVISOR';
    const id = randomToken(16);
    const status = isSupervisor ? 'QUEUED' : 'PENDING_APPROVAL';
    const supervisorId = isSupervisor ? s.user_id : null;
    const approvedAt = isSupervisor ? new Date().toISOString() : null;

    db.prepare(`
      INSERT INTO jobs (id, kind, target_repo, target_branch, payload_json, supervisor_id, status, depends_on, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.kind,
      body.target_repo,
      body.target_branch,
      JSON.stringify(body.payload),
      supervisorId,
      status,
      body.depends_on ? JSON.stringify(body.depends_on) : null,
      approvedAt,
    );

    emitAudit(db, c, {
      action: 'job.create',
      actor_user_id: s.user_id,
      target_type: 'job',
      target_id: id,
      payload: { kind: body.kind, target_repo: body.target_repo, target_branch: body.target_branch, status },
    });

    broadcastToRoom('_jobs', { op: 'job_event', event: 'created', job_id: id, status });
    return c.json({ job_id: id, status });
  });

  // Approve a PENDING_APPROVAL job (SUPERVISOR/OWNER only)
  app.post('/api/jobs/:id/approve', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    if (s.role !== 'OWNER' && s.role !== 'SUPERVISOR') return c.json({ error: 'forbidden' }, 403);
    const jobId = c.req.param('id');
    const result = db.prepare(`
      UPDATE jobs SET status = 'QUEUED', supervisor_id = ?, approved_at = datetime('now')
      WHERE id = ? AND status = 'PENDING_APPROVAL'
    `).run(s.user_id, jobId);
    if (result.changes === 0) return c.json({ error: 'not_pending_approval' }, 409);
    emitAudit(db, c, { action: 'job.approve', actor_user_id: s.user_id, target_type: 'job', target_id: jobId });
    broadcastToRoom('_jobs', { op: 'job_event', event: 'approved', job_id: jobId, by: s.user_id });
    return c.json({ ok: true });
  });

  // Reject a PENDING_APPROVAL job
  app.post('/api/jobs/:id/reject', async (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    if (s.role !== 'OWNER' && s.role !== 'SUPERVISOR') return c.json({ error: 'forbidden' }, 403);
    const jobId = c.req.param('id');
    let body: { reason?: string };
    try { body = await c.req.json(); } catch { body = {}; }
    const result = db.prepare(`
      UPDATE jobs SET status = 'CANCELLED', completed_at = datetime('now'),
        result_json = ?
      WHERE id = ? AND status = 'PENDING_APPROVAL'
    `).run(JSON.stringify({ rejected_by: s.user_id, reason: body.reason ?? '' }), jobId);
    if (result.changes === 0) return c.json({ error: 'not_pending_approval' }, 409);
    emitAudit(db, c, { action: 'job.reject', actor_user_id: s.user_id, target_type: 'job', target_id: jobId, payload: { reason: body.reason } });
    broadcastToRoom('_jobs', { op: 'job_event', event: 'rejected', job_id: jobId });
    return c.json({ ok: true });
  });

  // Lease the next leasable job (worker bot or human worker)
  app.post('/api/jobs/lease/next', async (c) => {
    // This endpoint accepts BOTH session-auth (humans) and bot-token-auth via Authorization
    const s = c.get('session');
    let leaseHolderUser: string | null = null;
    let leaseHolderBot: string | null = null;

    if (s) {
      leaseHolderUser = s.user_id;
    } else {
      // Try bot token
      const auth = c.req.header('authorization') ?? '';
      const m = auth.match(/^Bearer\s+(.+)$/i);
      if (m && m[1]) {
        const { verifyBotAccessToken } = await import('../lib/bot_token.js');
        const result = verifyBotAccessToken(db, m[1]);
        if (result) leaseHolderBot = result.bot_id;
      }
    }
    if (!leaseHolderUser && !leaseHolderBot) return c.json({ error: 'auth_required' }, 401);

    // Find a leasable job: status=QUEUED + all dependencies COMPLETED
    const candidates = db.prepare(`
      SELECT id, kind, target_repo, target_branch, payload_json, depends_on, supervisor_id
      FROM jobs WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 50
    `).all() as { id: string; kind: string; target_repo: string; target_branch: string; payload_json: string; depends_on: string | null; supervisor_id: string | null }[];

    for (const cand of candidates) {
      if (cand.depends_on) {
        const deps: string[] = JSON.parse(cand.depends_on);
        if (deps.length > 0) {
          const incomplete = db.prepare(`
            SELECT COUNT(*) as n FROM jobs WHERE id IN (${deps.map(() => '?').join(',')}) AND status != 'COMPLETED'
          `).get(...deps) as { n: number };
          if (incomplete.n > 0) continue; // not yet leasable
        }
      }
      // Try to lease via atomic UPDATE (SQLite serializes via BEGIN IMMEDIATE)
      const expiresAt = new Date(Date.now() + LEASE_TTL_MS).toISOString();
      const result = db.prepare(`
        UPDATE jobs SET status = 'LEASED',
          worker_bot_id = ?, leased_at = datetime('now'), lease_expires_at = ?
        WHERE id = ? AND status = 'QUEUED'
      `).run(leaseHolderBot, expiresAt, cand.id);
      if (result.changes === 1) {
        // Got it
        emitAudit(db, null, {
          action: 'job.lease',
          actor_user_id: leaseHolderUser ?? null,
          actor_kind: leaseHolderBot ? 'bot' : 'user',
          target_type: 'job',
          target_id: cand.id,
        });
        broadcastToRoom('_jobs', { op: 'job_event', event: 'leased', job_id: cand.id });
        return c.json({
          job: {
            id: cand.id,
            kind: cand.kind,
            target_repo: cand.target_repo,
            target_branch: cand.target_branch,
            payload: JSON.parse(cand.payload_json),
            lease_expires_at: expiresAt,
          },
        });
      }
      // Else someone else won — try next candidate
    }
    return c.json({ job: null, message: 'no leasable jobs' }, 200);
  });

  // Heartbeat — extend lease
  app.post('/api/jobs/:id/heartbeat', async (c) => {
    const jobId = c.req.param('id');
    const newExpires = new Date(Date.now() + LEASE_TTL_MS).toISOString();
    const result = db.prepare(`
      UPDATE jobs SET lease_expires_at = ?, status = COALESCE(NULLIF(status, 'LEASED'), 'RUNNING')
      WHERE id = ? AND status IN ('LEASED', 'RUNNING')
    `).run(newExpires, jobId);
    if (result.changes === 0) return c.json({ error: 'not_active' }, 409);
    return c.json({ ok: true, lease_expires_at: newExpires });
  });

  // Complete (or fail) a job
  app.post('/api/jobs/:id/complete', async (c) => {
    const jobId = c.req.param('id');
    let body: { status?: 'COMPLETED' | 'FAILED' | 'RUNNING'; result?: any };
    try { body = await c.req.json(); } catch { return c.json({ error: 'invalid_json' }, 400); }
    if (!body.status || !['COMPLETED', 'FAILED', 'RUNNING'].includes(body.status)) {
      return c.json({ error: 'invalid_status' }, 400);
    }
    if (body.status === 'RUNNING') {
      // Acts as heartbeat + status update
      const newExpires = new Date(Date.now() + LEASE_TTL_MS).toISOString();
      db.prepare(`
        UPDATE jobs SET status = 'RUNNING', lease_expires_at = ?,
          result_json = COALESCE(?, result_json)
        WHERE id = ? AND status IN ('LEASED', 'RUNNING')
      `).run(newExpires, body.result ? JSON.stringify(body.result) : null, jobId);
      return c.json({ ok: true, lease_expires_at: newExpires });
    }
    const result = db.prepare(`
      UPDATE jobs SET status = ?, completed_at = datetime('now'),
        result_json = ?
      WHERE id = ? AND status IN ('LEASED', 'RUNNING')
    `).run(body.status, body.result ? JSON.stringify(body.result) : null, jobId);
    if (result.changes === 0) return c.json({ error: 'not_active' }, 409);
    emitAudit(db, c, {
      action: `job.${body.status.toLowerCase()}`,
      target_type: 'job',
      target_id: jobId,
      payload: body.result ?? {},
    });
    broadcastToRoom('_jobs', { op: 'job_event', event: body.status.toLowerCase(), job_id: jobId });
    return c.json({ ok: true });
  });

  // Cancel (any OWNER or original supervisor)
  app.post('/api/jobs/:id/cancel', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const jobId = c.req.param('id');
    const job = db.prepare('SELECT supervisor_id, status FROM jobs WHERE id = ? LIMIT 1').get(jobId) as { supervisor_id: string | null; status: string } | undefined;
    if (!job) return c.json({ error: 'not_found' }, 404);
    if (s.role !== 'OWNER' && job.supervisor_id !== s.user_id) return c.json({ error: 'forbidden' }, 403);
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) return c.json({ error: 'already_terminal' }, 409);
    db.prepare(`
      UPDATE jobs SET status = 'CANCELLED', completed_at = datetime('now'),
        result_json = ? WHERE id = ?
    `).run(JSON.stringify({ cancelled_by: s.user_id }), jobId);
    emitAudit(db, c, { action: 'job.cancel', actor_user_id: s.user_id, target_type: 'job', target_id: jobId });
    broadcastToRoom('_jobs', { op: 'job_event', event: 'cancelled', job_id: jobId });
    return c.json({ ok: true });
  });
}
