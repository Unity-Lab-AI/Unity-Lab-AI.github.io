#!/usr/bin/env node
/**
 * Standalone CLI: claim or log in to the Unity AI Lab admin portal, then open the browser.
 *
 * Invoked by .claude/setup wizard Phase 8.5. Can also be run directly:
 *   node scripts/claim-admin.mjs
 *
 * What it does:
 *   1. Prompts for admin identity (numbered picker: sponge / gee / red / alfreddo)
 *   2. Prompts for password (no echo)
 *   3. Auto-detects backend URL: tries https://admin.unityailab.com first, falls back to http://localhost:2026
 *   4. POSTs /api/auth/claim — works for first claim (bootstrap or claim-window-open) OR for re-login (already-claimed account)
 *   5. If 409 already_claimed, retries via /api/auth/password/login
 *   6. On success, POSTs /api/auth/handoff to mint a browser session URL
 *   7. Opens that URL in default browser via `start` (Windows) / `open` (macOS) / `xdg-open` (Linux)
 *   8. Saves admin email + base URL to .claude/.env so future runs are silent
 *
 * The session cookie ends up in the browser. The CLI never persists it (just hands off).
 */

import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ADMINS = [
  { email: 'sponge@unityailab.com', handle: 'Sponge' },
  { email: 'gee@unityailab.com',     handle: 'Gee' },
  { email: 'red@unityailab.com',     handle: 'Red' },
  { email: 'alfreddo@unityailab.com',handle: 'Alfreddo' },
];

const ENV_PATH = resolve(process.env.HOME ?? process.env.USERPROFILE ?? '.', '.claude/.env');

// ============================================================================
// I/O helpers
// ============================================================================
function ask(prompt) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (a) => { rl.close(); res(a.trim()); });
  });
}

async function askPassword(prompt) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(prompt);
    // Best-effort no-echo (works on most terminals; falls back gracefully)
    if (process.stdin.isTTY) process.stdin.setRawMode?.(true);
    let pw = '';
    process.stdin.on('data', function onData(buf) {
      const ch = buf.toString();
      if (ch === '\r' || ch === '\n') {
        if (process.stdin.isTTY) process.stdin.setRawMode?.(false);
        process.stdin.removeListener('data', onData);
        process.stdin.pause();
        process.stdout.write('\n');
        rl.close();
        res(pw);
      } else if (ch === '') { // Ctrl+C
        process.exit(1);
      } else if (ch === '\b' || ch === '') {
        if (pw.length) {
          pw = pw.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        pw += ch;
        process.stdout.write('*');
      }
    });
  });
}

// ============================================================================
// Backend detection
// ============================================================================
async function detectBackend() {
  const candidates = [
    process.env.ADMIN_PORTAL_BASE_URL,                        // explicit override (highest priority)
    'https://admin.unityailab.com',                            // production tunnel
    'http://localhost:2026',                                   // local dev
    'http://localhost:3000',                                   // legacy local dev port
  ].filter(Boolean);

  for (const base of candidates) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), 2500);
      const res = await fetch(`${base}/healthz`, { signal: ac.signal });
      clearTimeout(t);
      if (res.ok) return base;
    } catch { /* try next */ }
  }
  return null;
}

// ============================================================================
// Persistence
// ============================================================================
function saveLocal(email, baseUrl) {
  const dir = dirname(ENV_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let existing = '';
  if (existsSync(ENV_PATH)) {
    existing = readFileSync(ENV_PATH, 'utf8');
    // strip prior values for the keys we're setting
    existing = existing.split('\n').filter((l) => !/^ADMIN_PORTAL_(BASE_URL|EMAIL)=/.test(l)).join('\n').trim();
    if (existing) existing += '\n';
  }
  writeFileSync(ENV_PATH, existing + `ADMIN_PORTAL_BASE_URL=${baseUrl}\nADMIN_PORTAL_EMAIL=${email}\n`, 'utf8');
  try { chmodSync(ENV_PATH, 0o600); } catch { /* windows ignore */ }
}

// ============================================================================
// Browser open
// ============================================================================
function openBrowser(url) {
  const cmd = process.platform === 'win32' ? 'cmd' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  const args = process.platform === 'win32' ? ['/c', 'start', '""', url] : [url];
  try {
    spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// Main flow
// ============================================================================
async function main() {
  console.log('');
  console.log('  Unity AI Lab — Admin Portal claim / login');
  console.log('  ─────────────────────────────────────────');
  console.log('');

  // 0. Early-out for non-admins — the .claude/ template is universal, not everyone is an admin
  console.log('  Are you one of the 4 Unity AI Lab admins (sponge / gee / red / alfreddo)?');
  console.log('  - YES -> connect to the portal at https://admin.unityailab.com (or localhost in dev)');
  console.log('  - NO  -> skip this step and continue to Claude Code as usual');
  const yn = (await ask('  (y/n) > ')).toLowerCase();
  if (yn !== 'y' && yn !== 'yes') {
    console.log('  -> skipping admin portal step.');
    process.exit(0);
  }
  console.log('');

  // 1. Backend detection
  const baseUrl = await detectBackend();
  if (!baseUrl) {
    console.error('✗ No backend reachable.');
    console.error('  Tried: ADMIN_PORTAL_BASE_URL env, https://admin.unityailab.com, http://localhost:2026, http://localhost:3000');
    console.error('  If running locally, start the backend in another terminal: npm run dev');
    process.exit(1);
  }
  console.log(`  Backend: ${baseUrl}`);

  // 2. Status check
  let status = null;
  try {
    const r = await fetch(`${baseUrl}/api/auth/claim/status`);
    status = await r.json();
  } catch { /* status unknown, proceed anyway */ }
  if (status?.unclaimed_admins) {
    console.log(`  Unclaimed: ${status.unclaimed_admins.length === 0 ? '(none — all 4 enrolled)' : status.unclaimed_admins.join(', ')}`);
    console.log(`  Claim window: ${status.window_open ? 'OPEN' : 'CLOSED'}${status.bootstrap_mode ? ' (bootstrap mode — first claim is free)' : ''}`);
  }
  console.log('');

  // 3. Admin picker
  console.log('  Which admin are you?');
  ADMINS.forEach((a, i) => {
    const claimed = status?.unclaimed_admins?.includes(a.email) === false;
    console.log(`    ${i + 1}) ${a.handle.padEnd(10)} ${a.email}${claimed ? '  (already claimed — will log in)' : ''}`);
  });
  console.log('    0) cancel');
  let picked;
  while (true) {
    const ans = await ask('  > ');
    const n = parseInt(ans, 10);
    if (n === 0) { console.log('cancelled'); process.exit(0); }
    if (n >= 1 && n <= 4) { picked = ADMINS[n - 1]; break; }
    console.log('  invalid, try again');
  }
  const email = picked.email;
  const handle = picked.handle;
  console.log(`  → ${handle} (${email})`);
  console.log('');

  // 4. Password
  const pw = await askPassword('  Password (min 12 chars, mixed case + digit): ');
  if (pw.length < 12) {
    console.error('  ✗ password too short');
    process.exit(1);
  }

  // 5. Try /api/auth/claim first
  console.log('');
  console.log('  Connecting...');
  let res = await fetch(`${baseUrl}/api/auth/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pw, remember_me: true }),
  });
  let body = await res.json().catch(() => ({}));

  // Capture session cookie from claim if successful
  let setCookie = res.headers.get('set-cookie') ?? '';

  if (!res.ok && body.error === 'already_claimed') {
    // Already claimed → fall back to password login
    console.log('  (account already claimed — logging in instead)');
    res = await fetch(`${baseUrl}/api/auth/password/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw, remember_me: true }),
    });
    body = await res.json().catch(() => ({}));
    setCookie = res.headers.get('set-cookie') ?? '';
  }

  if (!res.ok) {
    console.error(`  ✗ ${body.error ?? `HTTP ${res.status}`}: ${body.message ?? ''}`);
    if (body.error === 'claim_window_closed') {
      console.error('    Ask the founder admin to open the claim window in the dashboard right sidebar.');
    } else if (body.error === 'invalid_credentials') {
      console.error('    Wrong password. Ask another OWNER for a reset link via the dashboard.');
    } else if (body.error?.startsWith('weak_password')) {
      console.error('    Password too weak. Try a longer one with mixed case + digit.');
    }
    process.exit(1);
  }

  console.log(`  ✓ Authenticated as ${email}${body.bootstrap ? ' (FOUNDER bootstrap)' : ''}`);

  // 6. Mint handoff URL — must include the cookie we just got
  const sessionCookie = setCookie.split(/,(?=\s*\w+=)/).find((c) => c.trim().startsWith('session=')) ?? '';
  const handoffRes = await fetch(`${baseUrl}/api/auth/handoff`, {
    method: 'POST',
    headers: { 'Cookie': sessionCookie.split(';')[0] },
  });
  const handoff = await handoffRes.json().catch(() => ({}));
  if (!handoffRes.ok || !handoff.url) {
    console.error('  ✗ handoff mint failed:', handoff.error ?? handoffRes.status);
    process.exit(1);
  }

  // 7. Save local config
  saveLocal(email, baseUrl);
  console.log(`  ✓ Saved admin identity to ${ENV_PATH}`);

  // 8. Open browser
  console.log('');
  console.log(`  Opening browser to ${baseUrl}/admin/dashboard.html ...`);
  console.log(`  (handoff URL valid for ${handoff.expires_in_sec ?? 60}s)`);
  if (!openBrowser(handoff.url)) {
    console.log('  Could not auto-open browser. Open this URL manually:');
    console.log(`    ${handoff.url}`);
  }
  console.log('');
  console.log('  Done.');
}

main().catch((e) => {
  console.error('  ✗ unexpected error:', e.message);
  process.exit(1);
});
