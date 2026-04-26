#!/usr/bin/env node
// Standalone companion: enroll bot if needed, find "Gee Room" by name, send "hi" via signed WS, exit.
// Reuses the same SERVER_HTTP_BASE / SERVER_WS_URL / BOT_ID / ENROLLMENT_TOKEN as the MCP proxy.

import { WebSocket } from 'ws';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes } from 'node:crypto';

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const BOT_ID = process.env.UNITY_BOT_ID ?? 'YU58gH5uOCf-K3gYv1UiGw';
const ENROLLMENT_TOKEN = process.env.UNITY_ENROLLMENT_TOKEN ?? 'AE4y8rKjZrKaOXygUeDBG-YE7HgsPhzurjDGm9Pf4yI';
const SERVER_WS_URL = process.env.UNITY_SERVER_WS_URL ?? 'ws://localhost:2026/ws/bot';
const SERVER_HTTP_BASE = process.env.UNITY_SERVER_HTTP_BASE ?? 'http://localhost:2026';
const STATE_PATH = resolve(process.env.HOME ?? process.env.USERPROFILE ?? '.', '.claude/proxy/.bot.json');

const ROOM_NAME_HINT = process.argv[2] ?? 'Gee Room';
const MESSAGE_BODY = process.argv[3] ?? 'hi';

const log = (...a) => process.stderr.write(`[say-hi ${new Date().toISOString()}] ${a.join(' ')}\n`);

function loadState() {
  if (!existsSync(STATE_PATH)) return null;
  try { return JSON.parse(readFileSync(STATE_PATH, 'utf8')); } catch { return null; }
}
function saveState(s) {
  const dir = dirname(STATE_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(s, null, 2), 'utf8');
  try { chmodSync(STATE_PATH, 0o600); } catch {}
}

async function enroll(state) {
  if (state?.enrolled) return state;
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

async function botHttp(state, method, path, body) {
  const res = await fetch(`${SERVER_HTTP_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.access_token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

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
        if (m.op === 'send_ack' || m.op === 'intent_ack_stub' || m.op === 'hello_ack' || m.op === 'error') {
          acked = true;
          ws.off('message', handler);
          if (m.op === 'error') reject(new Error(`bot WS error: ${m.code ?? JSON.stringify(m)}`));
          else resolve(m);
        }
      } catch {}
    };
    ws.on('message', handler);
    ws.send(msg);
    setTimeout(() => { if (!acked) { ws.off('message', handler); reject(new Error('signedSend timeout')); } }, 8000);
  });
}

async function findRoomByName(state, hint) {
  // Try /api/bots/<id>/rooms first, fall back to /api/rooms.
  let rooms;
  try {
    const r = await botHttp(state, 'GET', `/api/bots/${BOT_ID}/rooms`);
    rooms = r.rooms ?? r;
  } catch (e) {
    log('bot/rooms fallback:', e.message);
    const r = await botHttp(state, 'GET', '/api/rooms');
    rooms = r.rooms ?? r;
  }
  if (!Array.isArray(rooms)) throw new Error(`unexpected rooms response: ${JSON.stringify(rooms).slice(0, 200)}`);
  const lc = hint.toLowerCase();
  const exact = rooms.find((r) => (r.name ?? r.title ?? '').toLowerCase() === lc);
  if (exact) return exact;
  const partial = rooms.find((r) => (r.name ?? r.title ?? '').toLowerCase().includes(lc));
  if (partial) return partial;
  throw new Error(`no room matching "${hint}". available: ${rooms.map((r) => r.name ?? r.title ?? r.id).join(', ')}`);
}

async function main() {
  let state = loadState();
  state = await enroll(state);
  log('enrolled ok, bot_id=', state.bot_id);

  log('looking up room "%s"', ROOM_NAME_HINT);
  const room = await findRoomByName(state, ROOM_NAME_HINT);
  log('found room:', room.id, room.name ?? room.title ?? '(unnamed)');

  log('opening WS', SERVER_WS_URL);
  const ws = new WebSocket(SERVER_WS_URL, { headers: { Authorization: `Bearer ${state.access_token}` } });
  await new Promise((res, rej) => {
    ws.once('open', res);
    ws.once('error', rej);
    setTimeout(() => rej(new Error('ws open timeout')), 5000);
  });
  log('WS open, sending hello');
  await signedSend(ws, state, 'hello', { version: '0.1.0' }).catch((e) => log('hello note:', e.message));

  log('sending message to room', room.id);
  const ack = await signedSend(ws, state, 'send', { room_id: room.id, body: MESSAGE_BODY });
  console.log(JSON.stringify({ ok: true, room_id: room.id, room_name: room.name ?? room.title ?? null, ack }, null, 2));
  ws.close();
  setTimeout(() => process.exit(0), 200);
}

main().catch((e) => { log('FATAL:', e.message); process.exit(1); });
