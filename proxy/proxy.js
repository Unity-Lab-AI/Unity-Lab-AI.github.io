#!/usr/bin/env node
/**
 * Unity AI Lab — MCP Proxy
 *
 * Bridges a local Claude Code instance (via MCP stdio JSON-RPC 2.0) to the
 * Unity AI Lab admin portal backend over WebSocket.
 *
 * Distributed by the portal at /api/bots/<id>/proxy.js — that download is
 * personalised per bot (BOT_ID + ENROLLMENT_TOKEN baked in by the server).
 *
 * MCP tools exposed to local Claude Code:
 *   unity_send_message(room_id, body)
 *   unity_list_rooms()
 *   unity_list_recent_messages(room_id, limit?)
 *   unity_propose_job(kind, target_repo, target_branch, payload)
 *   unity_report_job_status(job_id, status, result?)
 *   unity_get_deploy_events(limit?)
 *
 * On first run: generates Ed25519 keypair locally, sends pubkey + enrollment_token
 * to /api/bots/:id/enroll, persists state to ~/.claude/proxy/.bot.json (mode 0600).
 */

import { WebSocket } from 'ws';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createInterface } from 'node:readline';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes } from 'node:crypto';

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

// === Config (server replaces these placeholders on download) ===
const BOT_ID = process.env.UNITY_BOT_ID ?? '__BOT_ID_PLACEHOLDER__';
const ENROLLMENT_TOKEN = process.env.UNITY_ENROLLMENT_TOKEN ?? '__ENROLLMENT_TOKEN_PLACEHOLDER__';
const SERVER_WS_URL = process.env.UNITY_SERVER_WS_URL ?? 'ws://localhost:3000/ws/bot';
const SERVER_HTTP_BASE = process.env.UNITY_SERVER_HTTP_BASE ?? 'http://localhost:3000';
const STATE_PATH = resolve(process.env.HOME ?? process.env.USERPROFILE ?? '.', '.claude/proxy/.bot.json');

const log = (...args) => process.stderr.write(`[unity-proxy ${new Date().toISOString()}] ${args.join(' ')}\n`);

// === State ===
function loadState() {
  if (!existsSync(STATE_PATH)) return null;
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); }
  catch (e) { log('state read failed:', e.message); return null; }
}
function saveState(s) {
  const dir = dirname(STATE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2), 'utf8');
  try { chmodSync(STATE_PATH, 0o600); } catch { /* windows ignore */ }
}

// === Enrollment ===
async function enroll(state) {
  if (state?.enrolled) return state;
  if (BOT_ID.startsWith('__') || ENROLLMENT_TOKEN.startsWith('__')) {
    throw new Error('proxy.js was not customised by the server. Re-download from the admin portal.');
  }
  log('enrolling bot', BOT_ID);
  const privBytes = ed.utils.randomPrivateKey();
  const pubBytes = await ed.getPublicKey(privBytes);
  const privHex = Buffer.from(privBytes).toString('hex');
  const pubHex = Buffer.from(pubBytes).toString('hex');
  const res = await fetch(`${SERVER_HTTP_BASE}/api/bots/${BOT_ID}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enrollment_token: ENROLLMENT_TOKEN, public_key: pubHex }),
  });
  if (!res.ok) throw new Error(`enrollment failed: ${res.status} ${await res.text()}`);
  const body = await res.json();
  const newState = {
    enrolled: true,
    bot_id: BOT_ID,
    private_key_hex: privHex,
    public_key_hex: pubHex,
    refresh_token: body.refresh_token,
    access_token: body.access_token,
    access_expires_at: body.access_expires_at,
  };
  saveState(newState);
  return newState;
}

async function refreshTokens(state) {
  const res = await fetch(`${SERVER_HTTP_BASE}/api/bots/${BOT_ID}/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: state.refresh_token }),
  });
  if (!res.ok) throw new Error(`refresh failed: ${res.status}`);
  const body = await res.json();
  state.refresh_token = body.refresh_token;
  state.access_token = body.access_token;
  state.access_expires_at = body.access_expires_at;
  saveState(state);
  return state;
}

// === HTTP helpers ===
async function botHttp(state, method, path, body) {
  const res = await fetch(`${SERVER_HTTP_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.access_token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${await res.text()}`);
  return res.json();
}

// === Signed WS send ===
async function signedSend(ws, state, op, payload = {}) {
  const ts = new Date().toISOString();
  const nonce = randomBytes(16).toString('hex');
  const canonical = JSON.stringify({ op, payload, ts, nonce });
  const sigHex = Buffer.from(
    await ed.sign(new TextEncoder().encode(canonical), Buffer.from(state.private_key_hex, 'hex')),
  ).toString('hex');
  const msg = JSON.stringify({ bot_id: BOT_ID, op, payload, ts, nonce, sig: sigHex });
  return new Promise((resolve, reject) => {
    let acked = false;
    const handler = (raw) => {
      try {
        const m = JSON.parse(raw.toString());
        if (m.op === 'send_ack' || m.op === 'intent_ack_stub' || m.op === 'error') {
          acked = true;
          ws.off('message', handler);
          if (m.op === 'error') reject(new Error(`bot WS error: ${m.code}`));
          else resolve(m);
        }
      } catch { /* ignore */ }
    };
    ws.on('message', handler);
    ws.send(msg);
    setTimeout(() => { if (!acked) { ws.off('message', handler); reject(new Error('signedSend timeout')); } }, 10000);
  });
}

// === MCP JSON-RPC over stdio ===
const MCP_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'unity_send_message',
    description: 'Send a message to a Unity Admin Portal BOT_BUS room as this bot. All other admins in that room (and their bots) see the message in real time.',
    inputSchema: {
      type: 'object',
      required: ['room_id', 'body'],
      properties: {
        room_id: { type: 'string', description: 'The BOT_BUS room ID' },
        body: { type: 'string', description: 'Message body, max 8000 chars' },
      },
    },
  },
  {
    name: 'unity_list_rooms',
    description: 'List rooms this bot can interact with (BOT_BUS rooms its owner-admin is a member of).',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'unity_list_recent_messages',
    description: 'Read recent messages from a room. Newest first.',
    inputSchema: {
      type: 'object',
      required: ['room_id'],
      properties: {
        room_id: { type: 'string' },
        limit: { type: 'number', description: 'Default 20, max 100' },
      },
    },
  },
  {
    name: 'unity_propose_job',
    description: 'Propose a repo-write job (push, PR, merge, revert) to the coordinator. Worker bots create jobs in PENDING_APPROVAL state — a SUPERVISOR must approve before another worker leases.',
    inputSchema: {
      type: 'object',
      required: ['kind', 'target_repo', 'target_branch', 'payload'],
      properties: {
        kind: { type: 'string', enum: ['PUSH', 'PR', 'MERGE', 'REVERT'] },
        target_repo: { type: 'string', description: 'e.g. Unity-Lab-AI/Unity-Lab-AI.github.io' },
        target_branch: { type: 'string' },
        payload: { type: 'object', description: 'Free-form: commits, message, files, etc.' },
        depends_on: { type: 'array', items: { type: 'string' }, description: 'Optional job IDs this depends on' },
      },
    },
  },
  {
    name: 'unity_report_job_status',
    description: 'Report status on a job this bot is working. Used by worker bots after lease.',
    inputSchema: {
      type: 'object',
      required: ['job_id', 'status'],
      properties: {
        job_id: { type: 'string' },
        status: { type: 'string', enum: ['RUNNING', 'COMPLETED', 'FAILED'] },
        result: { type: 'object', description: 'Optional result payload' },
      },
    },
  },
  {
    name: 'unity_get_deploy_events',
    description: 'List recent deploy/push events from GitHub webhooks the portal has received.',
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'number', description: 'Default 20, max 50' } },
    },
  },
];

let mcpInitialized = false;
let mcpState = null; // bot state, set in main()
let mcpWs = null;

function mcpRespond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function mcpError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

async function mcpHandleTool(name, args) {
  switch (name) {
    case 'unity_send_message': {
      if (!mcpWs) throw new Error('WS not connected');
      const r = await signedSend(mcpWs, mcpState, 'send', { room_id: args.room_id, body: args.body });
      return r;
    }
    case 'unity_list_rooms':
      return await botHttp(mcpState, 'GET', `/api/bots/${BOT_ID}/rooms`).catch(() =>
        // Fallback if endpoint doesn't exist yet — query rooms via a HEAD/GET available
        botHttp(mcpState, 'GET', '/api/rooms').catch(() => ({ rooms: [], note: 'rooms list requires session auth path; bots use BOT_BUS rooms via owner-admin membership' })),
      );
    case 'unity_list_recent_messages': {
      const limit = Math.min(100, args.limit ?? 20);
      return await botHttp(mcpState, 'GET', `/api/rooms/${args.room_id}/messages?limit=${limit}`);
    }
    case 'unity_propose_job':
      return await botHttp(mcpState, 'POST', '/api/jobs', {
        kind: args.kind,
        target_repo: args.target_repo,
        target_branch: args.target_branch,
        payload: args.payload,
        depends_on: args.depends_on,
      });
    case 'unity_report_job_status':
      return await botHttp(mcpState, 'POST', `/api/jobs/${args.job_id}/complete`, {
        status: args.status,
        result: args.result,
      });
    case 'unity_get_deploy_events': {
      const limit = Math.min(50, args.limit ?? 20);
      return await botHttp(mcpState, 'GET', `/api/deploys?limit=${limit}`);
    }
    default:
      throw new Error(`unknown tool: ${name}`);
  }
}

async function mcpHandle(req) {
  const { id, method, params } = req;
  try {
    switch (method) {
      case 'initialize':
        mcpInitialized = true;
        return mcpRespond(id, {
          protocolVersion: MCP_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'unity-admin-portal', version: '0.1.0' },
        });
      case 'tools/list':
        return mcpRespond(id, { tools: TOOLS });
      case 'tools/call': {
        const result = await mcpHandleTool(params?.name, params?.arguments ?? {});
        return mcpRespond(id, {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        });
      }
      case 'ping':
        return mcpRespond(id, {});
      case 'notifications/initialized':
      case 'notifications/cancelled':
        return; // notifications: no response
      default:
        return mcpError(id, -32601, `method not found: ${method}`);
    }
  } catch (e) {
    log('mcp error:', e.message);
    return mcpError(id, -32000, e.message);
  }
}

function startMcpStdio() {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let req;
    try { req = JSON.parse(line); }
    catch { log('invalid mcp json:', line.slice(0, 100)); return; }
    Promise.resolve(mcpHandle(req)).catch((e) => log('mcp handle threw:', e.message));
  });
  rl.on('close', () => { log('stdin closed, exiting'); process.exit(0); });
  log('MCP stdio bridge ready');
}

// === Main ===
async function main() {
  let state = loadState();
  state = await enroll(state);
  mcpState = state;

  log('connecting to', SERVER_WS_URL);
  mcpWs = new WebSocket(SERVER_WS_URL, {
    headers: { Authorization: `Bearer ${state.access_token}` },
  });

  mcpWs.on('open', async () => {
    log('WS connected');
    await signedSend(mcpWs, state, 'hello', { version: '0.1.0' }).catch((e) => log('hello failed:', e.message));
    startMcpStdio();
  });

  mcpWs.on('close', (code, reason) => {
    log('WS closed', code, reason?.toString?.() ?? '');
    setTimeout(() => process.exit(0), 1000); // exit; supervisor (Claude Code) will restart
  });
  mcpWs.on('error', (err) => log('WS error', err.message));

  // Heartbeat
  setInterval(() => {
    if (mcpWs?.readyState === WebSocket.OPEN) {
      mcpWs.send(JSON.stringify({ op: 'ping', t: Date.now() }));
    }
  }, 25000).unref();

  // Token refresh before expiry
  setInterval(async () => {
    try {
      if (state.access_expires_at && new Date(state.access_expires_at).getTime() - Date.now() < 5 * 60 * 1000) {
        state = await refreshTokens(state);
        mcpState = state;
        log('token refreshed');
      }
    } catch (e) {
      log('refresh failed:', e.message);
      mcpWs?.close();
    }
  }, 60000).unref();
}

main().catch((err) => { log('fatal:', err.message); process.exit(1); });
