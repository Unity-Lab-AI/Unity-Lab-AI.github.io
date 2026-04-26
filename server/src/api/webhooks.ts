/**
 * /webhooks/* — incoming webhooks (GitHub).
 * Per ADMIN_PORTAL_TODO.md AP-179. HMAC-verifies, parses event types, inserts into deploy_events,
 * broadcasts to all admin WebSockets via a special pseudo-room "_deploys".
 */

import type { Hono } from 'hono';
import type { AppEnv } from '../config/env.js';
import type { DbConn } from '../db/connection.js';
import { createHmac } from 'node:crypto';
import { constantTimeEqual, randomToken } from '../lib/crypto.js';
import { broadcastToRoom } from '../ws/rooms.js';
import { logger } from '../lib/logger.js';
import { emitAudit } from '../middleware/audit.js';

function verifyGitHubSignature(secret: string, raw: string, header: string | undefined): boolean {
  if (!header) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
  return constantTimeEqual(header, expected);
}

interface PushPayload {
  ref?: string;
  before?: string;
  after?: string;
  repository?: { full_name?: string };
  sender?: { login?: string };
  commits?: { id: string; message: string; author?: { name?: string } }[];
}

interface DeploymentStatusPayload {
  deployment?: { id?: number; ref?: string; sha?: string; environment?: string };
  deployment_status?: { state?: string; environment_url?: string; target_url?: string };
  repository?: { full_name?: string };
  sender?: { login?: string };
}

interface WorkflowRunPayload {
  workflow_run?: {
    id?: number;
    head_sha?: string;
    head_branch?: string;
    name?: string;
    status?: string;
    conclusion?: string;
    html_url?: string;
  };
  repository?: { full_name?: string };
  sender?: { login?: string };
}

export function mountWebhooks(app: Hono, env: AppEnv, db: DbConn): void {
  app.post('/webhooks/github', async (c) => {
    const raw = await c.req.text();
    const sig = c.req.header('x-hub-signature-256');
    const event = c.req.header('x-github-event') ?? 'unknown';
    const deliveryId = c.req.header('x-github-delivery') ?? randomToken(8);

    const secret = env.GITHUB_WEBHOOK_HMAC_SECRET;
    if (!secret) {
      logger.warn({ event }, 'webhook: GITHUB_WEBHOOK_HMAC_SECRET not set; rejecting');
      return c.json({ error: 'webhook_secret_not_configured' }, 503);
    }
    if (!verifyGitHubSignature(secret, raw, sig)) {
      emitAudit(db, c, { action: 'webhook.bad_signature', actor_kind: 'webhook', payload: { event, delivery_id: deliveryId } });
      logger.warn({ event, delivery_id: deliveryId }, 'webhook: hmac mismatch');
      return c.json({ error: 'invalid_signature' }, 401);
    }

    let payload: any;
    try { payload = JSON.parse(raw); } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }

    let inserted: { id: string; status: string; deploy_url?: string | null } | null = null;

    try {
      if (event === 'push') {
        const p = payload as PushPayload;
        const branch = p.ref?.replace(/^refs\/heads\//, '') ?? '';
        const repo = p.repository?.full_name ?? '';
        const sha = p.after ?? '';
        const id = randomToken(16);
        db.prepare(`
          INSERT INTO deploy_events (id, provider, repo, branch, commit_sha, actor, status, payload_json)
          VALUES (?, 'github_pages', ?, ?, ?, ?, 'STARTED', ?)
        `).run(id, repo, branch, sha, p.sender?.login ?? null, raw);
        inserted = { id, status: 'STARTED' };
      } else if (event === 'deployment_status') {
        const p = payload as DeploymentStatusPayload;
        const repo = p.repository?.full_name ?? '';
        const sha = p.deployment?.sha ?? '';
        const branch = p.deployment?.ref ?? '';
        const stateRaw = p.deployment_status?.state ?? '';
        const status = stateRaw === 'success' ? 'SUCCEEDED'
                     : stateRaw === 'failure' || stateRaw === 'error' ? 'FAILED'
                     : stateRaw === 'in_progress' || stateRaw === 'queued' || stateRaw === 'pending' ? 'STARTED'
                     : 'STARTED';
        const url = p.deployment_status?.environment_url ?? p.deployment_status?.target_url ?? null;
        const id = randomToken(16);
        db.prepare(`
          INSERT INTO deploy_events (id, provider, repo, branch, commit_sha, actor, status, deploy_url, payload_json)
          VALUES (?, 'github_pages', ?, ?, ?, ?, ?, ?, ?)
        `).run(id, repo, branch, sha, p.sender?.login ?? null, status, url, raw);
        inserted = { id, status, deploy_url: url };
      } else if (event === 'workflow_run') {
        const p = payload as WorkflowRunPayload;
        const repo = p.repository?.full_name ?? '';
        const sha = p.workflow_run?.head_sha ?? '';
        const branch = p.workflow_run?.head_branch ?? '';
        const phase = p.workflow_run?.status; // queued | in_progress | completed
        const conc = p.workflow_run?.conclusion; // success | failure | cancelled | ...
        const status = phase === 'completed'
          ? (conc === 'success' ? 'SUCCEEDED' : conc === 'cancelled' ? 'CANCELLED' : 'FAILED')
          : 'STARTED';
        const url = p.workflow_run?.html_url ?? null;
        const id = randomToken(16);
        db.prepare(`
          INSERT INTO deploy_events (id, provider, repo, branch, commit_sha, actor, status, deploy_url, payload_json)
          VALUES (?, 'github_actions', ?, ?, ?, ?, ?, ?, ?)
        `).run(id, repo, branch, sha, p.sender?.login ?? null, status, url, raw);
        inserted = { id, status, deploy_url: url };
      } else {
        // Other event types — log + return 200 (so GitHub doesn't retry endlessly)
        logger.debug({ event }, 'webhook: unhandled event type');
      }
    } catch (err) {
      logger.error({ event, err: (err as Error).message }, 'webhook: insert failed');
      return c.json({ error: 'internal' }, 500);
    }

    emitAudit(db, c, {
      action: 'webhook.received',
      actor_kind: 'webhook',
      payload: { event, delivery_id: deliveryId, inserted_id: inserted?.id },
    });

    if (inserted) {
      // Broadcast to the special _deploys pseudo-room (frontend subscribes to this)
      broadcastToRoom('_deploys', {
        op: 'deploy_event',
        event_type: event,
        deploy_event_id: inserted.id,
        status: inserted.status,
        deploy_url: inserted.deploy_url,
      });
    }

    return c.json({ ok: true, event, processed: !!inserted });
  });

  // List recent deploy events (any authed admin)
  app.get('/api/deploys', (c) => {
    const s = c.get('session');
    if (!s) return c.json({ error: 'auth_required' }, 401);
    const events = db.prepare(`
      SELECT id, provider, repo, branch, commit_sha, actor, status, deploy_url, received_at
      FROM deploy_events ORDER BY received_at DESC LIMIT 50
    `).all();
    return c.json({ events });
  });
}
