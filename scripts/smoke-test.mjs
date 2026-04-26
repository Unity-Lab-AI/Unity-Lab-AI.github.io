#!/usr/bin/env node
/**
 * End-to-end smoke test against a running dev server.
 *
 *   1. Start server (npm run dev) in another terminal
 *   2. node scripts/smoke-test.mjs
 *
 * Verifies auth + rooms + messages + bots + jobs + claim window.
 * Exits 0 if all pass, non-zero on first failure.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:2026';
const FOUNDER = 'sponge@unityailab.com';

let cookieJar = '';
const pass = [];
const fail = [];
const skipped = [];
let devBypassEnabled = true; // probed below; controls whether auth-required tests run

function pullCookies(res) {
  const set = res.headers.get('set-cookie');
  if (!set) return;
  for (const part of set.split(/,(?=\s*\w+=)/)) {
    const m = part.match(/^(\w+)=([^;]+)/);
    if (m) {
      const existing = cookieJar.split('; ').filter((c) => !c.startsWith(m[1] + '='));
      existing.push(`${m[1]}=${m[2]}`);
      cookieJar = existing.filter(Boolean).join('; ');
    }
  }
}

async function http(method, path, body) {
  const headers = { 'Accept': 'application/json' };
  if (cookieJar) headers['cookie'] = cookieJar;
  if (body) headers['Content-Type'] = 'application/json';
  const csrf = cookieJar.match(/csrf=([^;]+)/);
  if (csrf) headers['X-CSRF-Token'] = csrf[1];
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  pullCookies(res);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  return { status: res.status, data, headers: res.headers };
}

async function check(name, fn, opts = {}) {
  if (opts.requiresDevBypass && !devBypassEnabled) {
    skipped.push(name);
    console.log(`  ${name}... ⊘ skipped (DEV_AUTH_BYPASS=false)`);
    return;
  }
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    pass.push(name);
    console.log('✓');
  } catch (e) {
    fail.push({ name, err: e.message });
    console.log(`✗ ${e.message}`);
  }
}

async function expect(cond, msg) { if (!cond) throw new Error(msg); }

async function main() {
  console.log(`\nUnity AI Lab Admin Portal — Smoke Test\nBase: ${BASE}\n`);

  await check('GET /healthz returns ok', async () => {
    const r = await http('GET', '/healthz');
    await expect(r.status === 200, `status ${r.status}`);
    await expect(r.data.status === 'ok', `body: ${JSON.stringify(r.data)}`);
  });

  await check('GET /readyz reports DB+secrets ready', async () => {
    const r = await http('GET', '/readyz');
    await expect(r.status === 200, `status ${r.status}`);
    await expect(r.data.ready === true, `not ready: ${JSON.stringify(r.data.checks)}`);
  });

  // Probe whether dev-bypass is enabled before running tests that depend on it.
  // In production (DEV_AUTH_BYPASS=false), the endpoint returns 404 — that's correct + secure.
  {
    const probe = await http('GET', '/api/auth/dev/admins');
    devBypassEnabled = probe.status === 200;
    if (!devBypassEnabled) {
      console.log(`  (DEV_AUTH_BYPASS off — auth-required tests will be skipped, which is correct for prod)`);
    }
  }

  await check('GET /api/auth/dev/admins lists 4', async () => {
    const r = await http('GET', '/api/auth/dev/admins');
    await expect(r.status === 200, `status ${r.status} (DEV_AUTH_BYPASS must be true)`);
    await expect(r.data.admins?.length === 4, `expected 4 admins, got ${r.data.admins?.length}`);
  }, { requiresDevBypass: true });

  await check('GET /api/auth/whoami returns 401 when unauthenticated', async () => {
    const r = await http('GET', '/api/auth/whoami');
    await expect(r.status === 401, `status ${r.status}`);
  });

  await check('POST /api/auth/dev/login as founder', async () => {
    const r = await http('POST', '/api/auth/dev/login', { email: FOUNDER, remember_me: true });
    await expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.data)}`);
    await expect(r.data.user?.email === FOUNDER, `user mismatch: ${JSON.stringify(r.data.user)}`);
    await expect(cookieJar.includes('session='), 'no session cookie set');
  }, { requiresDevBypass: true });

  await check('GET /api/auth/whoami succeeds after login', async () => {
    const r = await http('GET', '/api/auth/whoami');
    await expect(r.status === 200 && r.data.authenticated, JSON.stringify(r.data));
  }, { requiresDevBypass: true });

  await check('GET /api/me returns user with stats', async () => {
    const r = await http('GET', '/api/me');
    await expect(r.status === 200, `status ${r.status}`);
    await expect(r.data.user?.email === FOUNDER, JSON.stringify(r.data));
    await expect(typeof r.data.stats?.bot_count === 'number', 'no bot_count');
  }, { requiresDevBypass: true });

  let roomId;
  await check('POST /api/rooms creates a room', async () => {
    const r = await http('POST', '/api/rooms', { name: `smoketest-${Date.now()}`, kind: 'CHANNEL' });
    await expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.data)}`);
    roomId = r.data.id;
  }, { requiresDevBypass: true });

  await check('POST message in room', async () => {
    const r = await http('POST', `/api/rooms/${roomId}/messages`, { body: 'smoke test message' });
    await expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.data)}`);
    await expect(r.data.message?.kind === 'TEXT', JSON.stringify(r.data.message));
  }, { requiresDevBypass: true });

  await check('GET messages returns the posted one', async () => {
    const r = await http('GET', `/api/rooms/${roomId}/messages?limit=10`);
    await expect(r.status === 200, `status ${r.status}`);
    await expect(r.data.messages?.length >= 1, 'no messages returned');
    await expect(r.data.messages.some((m) => m.body === 'smoke test message'), 'posted message not found');
  }, { requiresDevBypass: true });

  let botId, enrollmentToken;
  await check('POST /api/bots creates a bot with enrollment token', async () => {
    const r = await http('POST', '/api/bots', { name: `smoke-bot-${Date.now()}`, role: 'WORKER' });
    await expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.data)}`);
    botId = r.data.bot_id;
    enrollmentToken = r.data.enrollment_token;
    await expect(typeof enrollmentToken === 'string' && enrollmentToken.length >= 40, 'bad enrollment_token');
  }, { requiresDevBypass: true });

  await check('GET /api/bots/:id/proxy.js serves customised proxy', async () => {
    const r = await http('GET', `/api/bots/${botId}/proxy.js`);
    await expect(r.status === 200, `status ${r.status}`);
    await expect(typeof r.data === 'string' && r.data.includes(botId), 'proxy.js does not contain bot_id');
    await expect(!r.data.includes('__BOT_ID_PLACEHOLDER__'), 'placeholder not replaced');
  }, { requiresDevBypass: true });

  await check('POST /api/bots/:id/enroll with bogus token rejected', async () => {
    const r = await http('POST', `/api/bots/${botId}/enroll`, {
      enrollment_token: 'bogus_token_xxx',
      public_key: 'a'.repeat(64),
    });
    await expect(r.status === 401, `expected 401 got ${r.status}: ${JSON.stringify(r.data)}`);
  }, { requiresDevBypass: true });

  await check('POST /api/jobs as OWNER creates QUEUED job', async () => {
    const r = await http('POST', '/api/jobs', {
      kind: 'PR',
      target_repo: 'test/test',
      target_branch: 'main',
      payload: { head: 'feature/x', title: 'smoke', body: 'smoke' },
    });
    await expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.data)}`);
    await expect(r.data.status === 'QUEUED', `expected QUEUED got ${r.data.status}`);
  }, { requiresDevBypass: true });

  await check('POST direct PUSH to main is blocked', async () => {
    const r = await http('POST', '/api/jobs', {
      kind: 'PUSH',
      target_repo: 'test/test',
      target_branch: 'main',
      payload: { foo: 'bar' },
    });
    await expect(r.status === 403, `expected 403 got ${r.status}: ${JSON.stringify(r.data)}`);
  }, { requiresDevBypass: true });

  await check('GET /api/auth/claim/status', async () => {
    const r = await http('GET', '/api/auth/claim/status');
    await expect(r.status === 200, `status ${r.status}`);
    await expect(typeof r.data.unclaimed_admins === 'object', 'no unclaimed_admins');
  });

  await check('POST /api/auth/logout', async () => {
    const r = await http('POST', '/api/auth/logout');
    await expect(r.status === 200, `status ${r.status}`);
    cookieJar = ''; // simulate cleared cookie
  }, { requiresDevBypass: true });

  await check('GET /api/me 401 after logout', async () => {
    const r = await http('GET', '/api/me');
    await expect(r.status === 401, `status ${r.status}`);
  });

  console.log(`\nResults: ${pass.length} passed, ${fail.length} failed${skipped.length ? `, ${skipped.length} skipped (dev-bypass off)` : ''}`);
  if (fail.length) {
    for (const f of fail) console.log(`  ✗ ${f.name}: ${f.err}`);
    process.exit(1);
  }
  if (skipped.length && !devBypassEnabled) {
    console.log(`  (To run the auth-gated tests, set DEV_AUTH_BYPASS=true in server/.env and restart.)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
