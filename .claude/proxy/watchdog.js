#!/usr/bin/env node
/**
 * Unity AI Lab — Bot Watchdog
 *
 * Wraps a Claude Code CLI process and bridges the admin portal → CLI direction:
 * portal WebSocket events for rooms this bot is in get injected into the CLI's stdin
 * as user-typed lines. The CLI's stdout is passed through to the user's terminal so
 * they can also see the bot's responses in real time.
 *
 * Companion to proxy.js (which handles the CLI → portal direction via MCP).
 *
 * Lifecycle:
 *   1. Load bot state (.bot.json — produced by proxy.js on first run or by us)
 *   2. Pick a role template from role-templates/<role>.md based on bot.role
 *   3. Connect to admin portal WS (Bearer-auth with access_token)
 *   4. Spawn `claude` CLI with --dangerously-skip-permissions and a stdio pipe
 *   5. Pipe child's stdout/stderr to our stdout/stderr so user sees output
 *   6. Pipe our stdin to child's stdin so user can also type
 *   7. Inject role-template as the FIRST input the CLI sees
 *   8. On WS room-message event: write `[#room] @sender: body\n` to child's stdin
 *   9. Heartbeat every 120s: write `# heartbeat <iso-ts>\n` to child's stdin (no-op
 *      comment line — keeps the process active without consuming meaningful tokens)
 *  10. Track child PID; on exit, restart with exponential backoff (max 5 retries)
 *  11. SIGINT (Ctrl+C) → kill child, close WS, exit cleanly
 *
 * Path-agnostic: every path is computed from `import.meta.url` (this script's location)
 * or from runtime env vars. No hardcoded user paths anywhere — drop this folder into
 * any admin's machine and it works.
 *
 * Usage:
 *   node watchdog.js                           # uses .bot.json from default location
 *   node watchdog.js --bot-state /path/...     # override state file location
 *   node watchdog.js --role WORKER             # override role from state (testing)
 *   node watchdog.js --no-spawn                # skip CLI spawn (debug WS only)
 *   node watchdog.js --heartbeat-secs 120      # override heartbeat cadence (default 120)
 *
 * Env vars (all optional):
 *   UNITY_BOT_STATE    — path to .bot.json (default: ~/.claude/proxy/.bot.json)
 *   UNITY_SERVER_WS    — portal WS URL (default: from .bot.json or ws://localhost:3000/ws/bot)
 *   UNITY_SERVER_HTTP  — portal HTTP base (default: from .bot.json or http://localhost:3000)
 *   UNITY_CLAUDE_BIN   — claude CLI binary name (default: 'claude' or 'claude.cmd' on Windows)
 *   UNITY_HEARTBEAT_SECS — heartbeat interval (default: 120)
 *   UNITY_ROLE_TEMPLATE_DIR — override role-templates path (default: <this-dir>/role-templates)
 */

import { WebSocket } from 'ws';
import * as pty from 'node-pty';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes } from 'node:crypto';

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

// === Resolve script directory (path-agnostic) ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// === CLI args ===
function parseArgs(argv) {
  const args = { spawn: true, heartbeatSecs: null, botStatePath: null, roleOverride: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-spawn') args.spawn = false;
    else if (a === '--bot-state') args.botStatePath = argv[++i];
    else if (a === '--role') args.roleOverride = argv[++i];
    else if (a === '--heartbeat-secs') args.heartbeatSecs = parseInt(argv[++i], 10);
    else if (a === '--help' || a === '-h') {
      console.log(readFileSync(__filename, 'utf8').match(/Usage:[\s\S]+?(?=\*\/)/)?.[0] ?? 'see source for usage');
      process.exit(0);
    }
  }
  return args;
}

const ARGS = parseArgs(process.argv);

// === Config ===
const BOT_STATE_PATH = ARGS.botStatePath
  ?? process.env.UNITY_BOT_STATE
  ?? resolve(homedir(), '.claude/proxy/.bot.json');
const HEARTBEAT_SECS = ARGS.heartbeatSecs ?? parseInt(process.env.UNITY_HEARTBEAT_SECS ?? '120', 10);
const ROLE_TEMPLATE_DIR = process.env.UNITY_ROLE_TEMPLATE_DIR ?? join(__dirname, 'role-templates');
// node-pty does NOT do PATH/PATHEXT resolution like child_process.spawn does -
// it needs an absolute path to the executable. Resolve via `where` / `which`.
function resolveBin(name) {
  if (!name) return name;
  if (name.includes('/') || name.includes('\\') || /^[A-Za-z]:/.test(name)) return name;
  const lookupCmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    const out = execSync(`${lookupCmd} ${name}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const first = out.split(/\r?\n/)[0]?.trim();
    if (first && existsSync(first)) return first;
  } catch { /* not on PATH */ }
  return name;
}
const CLAUDE_BIN = resolveBin(process.env.UNITY_CLAUDE_BIN ?? 'claude');
const MAX_RESTART_RETRIES = 5;

const log = (...args) =>
  process.stderr.write(`[watchdog ${new Date().toISOString()}] ${args.join(' ')}\n`);

// === Load bot state ===
function loadBotState() {
  if (!existsSync(BOT_STATE_PATH)) {
    log(`bot state not found at ${BOT_STATE_PATH}`);
    log('run proxy.js once first (Claude Code MCP-spawn enrolls + writes state)');
    log('or pass --bot-state <path> to point at an existing state file');
    process.exit(1);
  }
  try {
    const s = JSON.parse(readFileSync(BOT_STATE_PATH, 'utf8'));
    if (!s.bot_id || !s.access_token || !s.private_key_hex) {
      log('bot state is incomplete — missing bot_id / access_token / private_key_hex');
      process.exit(1);
    }
    return s;
  } catch (e) {
    log(`bot state read failed: ${e.message}`);
    process.exit(1);
  }
}

// === Resolve server URLs ===
function resolveServerUrls(state) {
  const wsUrl = process.env.UNITY_SERVER_WS ?? state.server_ws_url ?? 'ws://localhost:3000/ws/bot';
  const httpBase = process.env.UNITY_SERVER_HTTP ?? state.server_http_base ?? 'http://localhost:3000';
  return { wsUrl, httpBase };
}

// === Resolve role template ===
function loadRoleTemplate(role) {
  const r = (role ?? 'WORKER').toUpperCase();
  const map = { WORKER: 'worker.md', SUPERVISOR: 'supervisor.md', LOGISTIC: 'logistic.md', OBSERVER: 'observer.md' };
  const filename = map[r];
  if (!filename) {
    log(`unknown role "${r}" — falling back to WORKER`);
    return loadRoleTemplate('WORKER');
  }
  const path = join(ROLE_TEMPLATE_DIR, filename);
  if (!existsSync(path)) {
    log(`role template missing at ${path}`);
    log('cannot brief the CLI on its role — proceeding with empty initial prompt');
    return '';
  }
  return readFileSync(path, 'utf8');
}

// === HTTP helper ===
async function botHttp(state, httpBase, method, path, body) {
  const res = await fetch(`${httpBase}${path}`, {
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

// === Subscribe to all visible rooms ===
async function subscribeToVisibleRooms(state, httpBase, ws) {
  let rooms = [];
  try {
    const res = await botHttp(state, httpBase, 'GET', `/api/bots/${state.bot_id}/rooms`);
    rooms = res.rooms ?? [];
  } catch (e) {
    log(`could not list bot rooms: ${e.message} — falling back to no subscriptions`);
    return;
  }
  log(`subscribing to ${rooms.length} room(s)`);
  for (const r of rooms) {
    await signedSend(ws, state, 'subscribe', { room_id: r.id }).catch((e) =>
      log(`subscribe to ${r.id} failed: ${e.message}`),
    );
  }
}

// === Signed WS send (matches proxy.js signing protocol) ===
async function signedSend(ws, state, op, payload = {}) {
  const ts = new Date().toISOString();
  const nonce = randomBytes(16).toString('hex');
  const canonical = JSON.stringify({ op, payload, ts, nonce });
  const sigHex = Buffer.from(
    await ed.sign(new TextEncoder().encode(canonical), Buffer.from(state.private_key_hex, 'hex')),
  ).toString('hex');
  const msg = JSON.stringify({ bot_id: state.bot_id, op, payload, ts, nonce, sig: sigHex });
  ws.send(msg);
}

// === Format incoming room message for CLI injection ===
function formatRoomMessage(m) {
  const room = m.room_name ? `#${m.room_name}` : `#${m.room_id?.slice(0, 8) ?? 'room'}`;
  const sender = m.sender_name
    || (m.sender_email ? m.sender_email.split('@')[0] : null)
    || (m.sender_bot_name ? `🤖${m.sender_bot_name}` : null)
    || (m.sender_user_id ? `user:${m.sender_user_id.slice(0, 8)}` : 'system');
  return `[${room}] @${sender}: ${m.body ?? ''}`;
}

// === Main: watchdog loop ===
async function main() {
  const state = loadBotState();
  const { wsUrl, httpBase } = resolveServerUrls(state);
  const role = ARGS.roleOverride ?? state.role ?? 'WORKER';
  const roleTemplate = loadRoleTemplate(role);

  log(`bot ${state.bot_id} | role ${role}`);
  log(`portal WS: ${wsUrl}`);
  log(`heartbeat every ${HEARTBEAT_SECS}s`);

  // === Connect to portal WS ===
  const ws = new WebSocket(wsUrl, { headers: { Authorization: `Bearer ${state.access_token}` } });
  let wsReady = false;

  ws.on('open', async () => {
    wsReady = true;
    log('WS connected');
    await signedSend(ws, state, 'hello', { version: 'watchdog-0.1.0', role }).catch((e) =>
      log('hello failed:', e.message),
    );
    await subscribeToVisibleRooms(state, httpBase, ws);
  });
  ws.on('error', (err) => log('WS error:', err.message));
  ws.on('close', (code, reason) => {
    wsReady = false;
    log('WS closed', code, reason?.toString?.() ?? '');
  });

  // === Spawn Claude CLI as child ===
  let child = null;
  let restartCount = 0;
  let shuttingDown = false;

  function spawnClaude() {
    if (!ARGS.spawn) {
      log('--no-spawn set: skipping CLI spawn (WS-only mode)');
      return;
    }
    const cols = process.stdout.columns || 120;
    const rows = process.stdout.rows || 30;
    log(`spawning ${CLAUDE_BIN} via PTY (${cols}x${rows}, restart count: ${restartCount})`);
    try {
      child = pty.spawn(CLAUDE_BIN, ['--dangerously-skip-permissions'], {
        name: 'xterm-256color',
        cols, rows,
        cwd: process.cwd(),
        env: process.env,
      });
    } catch (e) {
      log('PTY spawn failed:', e.message);
      child = null;
      return;
    }
    log(`CLI spawned with PID ${child.pid}`);

    child.onData((data) => {
      process.stdout.write(data);
    });

    child.onExit(({ exitCode, signal }) => {
      log(`CLI exited (code=${exitCode} signal=${signal})`);
      child = null;
      if (shuttingDown) return;
      if (restartCount >= MAX_RESTART_RETRIES) {
        log(`max restart retries (${MAX_RESTART_RETRIES}) reached - giving up`);
        process.exit(1);
      }
      restartCount++;
      const backoffMs = Math.min(30000, 1000 * 2 ** restartCount);
      log(`restarting in ${backoffMs}ms`);
      setTimeout(() => {
        spawnClaude();
        injectRolePrompt();
      }, backoffMs);
    });
  }

  function writeToCLI(text) {
    if (!child) return false;
    try {
      // PTY treats \r as Enter (real terminal carriage return), not \n
      child.write(text.endsWith('\r') || text.endsWith('\n') ? text.replace(/\n$/, '\r') : text + '\r');
      return true;
    } catch (e) {
      log('CLI write failed:', e.message);
      return false;
    }
  }

  function injectRolePrompt() {
    if (roleTemplate) {
      setTimeout(() => {
        log('injecting role template as initial CLI prompt');
        writeToCLI(roleTemplate);
      }, 1500);
    }
    const initialPrompt = process.env.UNITY_INITIAL_PROMPT;
    if (initialPrompt) {
      setTimeout(() => {
        log(`injecting initial prompt: ${initialPrompt.slice(0, 80)}`);
        writeToCLI(initialPrompt);
      }, 2500);
    }
  }

  // === User stdin → PTY passthrough (raw mode for instant keystroke forwarding) ===
  if (ARGS.spawn) {
    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(true); }
      catch (e) { log('setRawMode failed (non-fatal):', e.message); }
    }
    process.stdin.resume();
    process.stdin.on('data', (chunk) => {
      if (child) {
        try { child.write(chunk.toString()); }
        catch (e) { log('user stdin -> CLI write failed:', e.message); }
      }
    });
    // Forward terminal resize events to the PTY so Claude's UI re-flows
    process.stdout.on('resize', () => {
      if (child) {
        try { child.resize(process.stdout.columns || 120, process.stdout.rows || 30); }
        catch { /* ignore */ }
      }
    });
    // Restore cooked mode on exit so the user's terminal isn't left broken
    process.on('exit', () => {
      if (process.stdin.isTTY) {
        try { process.stdin.setRawMode(false); } catch { /* ignore */ }
      }
    });
  }

  // === WS message → CLI stdin injection ===
  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw.toString()); }
    catch { return; }
    if (m.op === 'message' && m.message) {
      const line = formatRoomMessage(m.message);
      log(`→ CLI: ${line.slice(0, 120)}`);
      writeToCLI(line);
    } else if (m.op === 'error') {
      log(`WS server error: ${m.code}`);
    }
  });

  // === Heartbeat ===
  setInterval(() => {
    if (!child) return;
    const ok = writeToCLI(`# heartbeat ${new Date().toISOString()}`);
    if (!ok) log('heartbeat write skipped (CLI not ready)');
  }, HEARTBEAT_SECS * 1000).unref();

  // === Token refresh (mirror of proxy.js logic) ===
  setInterval(async () => {
    try {
      if (state.access_expires_at
          && new Date(state.access_expires_at).getTime() - Date.now() < 5 * 60 * 1000) {
        const r = await fetch(`${httpBase}/api/bots/${state.bot_id}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: state.refresh_token }),
        });
        if (r.ok) {
          const body = await r.json();
          state.access_token = body.access_token;
          state.refresh_token = body.refresh_token;
          state.access_expires_at = body.access_expires_at;
          log('token refreshed');
        } else {
          log(`token refresh failed: ${r.status}`);
        }
      }
    } catch (e) {
      log('token refresh threw:', e.message);
    }
  }, 60000).unref();

  // === Clean shutdown ===
  function shutdown(reason) {
    if (shuttingDown) return;
    shuttingDown = true;
    log(`shutdown: ${reason}`);
    if (child) {
      try { child.kill(); } catch { /* ignore */ }
    }
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      try { ws.close(); } catch { /* ignore */ }
    }
    setTimeout(() => process.exit(0), 1000);
  }

  process.on('SIGINT', () => shutdown('SIGINT (Ctrl+C)'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // === Boot CLI ===
  spawnClaude();
  injectRolePrompt();
}

main().catch((err) => {
  log('fatal:', err.stack ?? err.message);
  process.exit(1);
});
