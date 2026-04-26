#!/usr/bin/env node
/**
 * Seed script — creates test rooms, sample messages, and test bots in the dev DB.
 * Run via: node scripts/seed-dev-data.mjs
 *
 * Requires the unified server to be running on http://localhost:3000 with
 * DEV_AUTH_BYPASS=true.
 *
 * Idempotent — re-running adds nothing if seeds already exist.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const FOUNDER = 'sponge@unityailab.com';

let cookieJar = '';

function pullCookies(res) {
  const set = res.headers.get('set-cookie');
  if (!set) return;
  // Crude but works for dev: take the first key=value pair from each set-cookie line
  for (const part of set.split(/,(?=\s*\w+=)/)) {
    const m = part.match(/^(\w+)=([^;]+)/);
    if (m) {
      const existing = cookieJar.split('; ').filter((c) => !c.startsWith(m[1] + '='));
      existing.push(`${m[1]}=${m[2]}`);
      cookieJar = existing.filter(Boolean).join('; ');
    }
  }
}

async function call(method, path, body) {
  const headers = { 'Accept': 'application/json' };
  if (cookieJar) headers['cookie'] = cookieJar;
  if (body) headers['Content-Type'] = 'application/json';
  if (cookieJar.includes('csrf=')) {
    headers['X-CSRF-Token'] = cookieJar.match(/csrf=([^;]+)/)[1];
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  pullCookies(res);
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log(`seeding via ${BASE} as ${FOUNDER}...`);

  // 0. Get a CSRF cookie (any GET works)
  await call('GET', '/healthz');

  // 1. Verify dev bypass is on
  const devList = await call('GET', '/api/auth/dev/admins').catch(() => null);
  if (!devList?.admins) {
    console.error('Dev bypass not available. Set DEV_AUTH_BYPASS=true in server/.env and restart.');
    process.exit(1);
  }

  // 2. Login as founder
  await call('POST', '/api/auth/dev/login', { email: FOUNDER, remember_me: true });
  console.log(`✓ logged in as ${FOUNDER}`);

  // 3. Create rooms
  const rooms = [
    { name: 'general', kind: 'CHANNEL', description: 'General admin chat' },
    { name: 'engineering', kind: 'CHANNEL', description: 'Engineering coordination' },
    { name: 'bot-bus', kind: 'BOT_BUS', description: 'Where bots and admins coordinate' },
    { name: 'incidents', kind: 'CHANNEL', description: 'Incident response coordination' },
  ];
  const created = [];
  for (const r of rooms) {
    try {
      const res = await call('POST', '/api/rooms', r);
      created.push({ ...r, id: res.id });
      console.log(`✓ room created: ${r.name} (${res.id.slice(0, 8)})`);
    } catch (e) {
      if (e.message.includes('already')) {
        console.log(`- room exists: ${r.name}`);
      } else {
        console.warn(`! room ${r.name} failed: ${e.message}`);
      }
    }
  }

  // 4. Sample messages in the first room
  if (created.length > 0) {
    const r = created[0];
    const samples = [
      'Welcome to the admin portal seed. This is a test message.',
      'Try uploading a file by dragging it into this pane.',
      'Sidebar shows live deploy events when GitHub webhooks fire.',
    ];
    for (const body of samples) {
      try {
        await call('POST', `/api/rooms/${r.id}/messages`, { body });
      } catch (e) { console.warn(`! message failed: ${e.message}`); }
    }
    console.log(`✓ posted ${samples.length} sample messages in ${r.name}`);
  }

  // 5. Create a sample bot
  try {
    const bot = await call('POST', '/api/bots', { name: 'sponge-test-bot', role: 'WORKER' });
    console.log(`✓ bot enrolled: ${bot.bot_id.slice(0, 8)} (proxy.js: ${BASE}${bot.proxy_download_url})`);
    console.log(`  enrollment_token: ${bot.enrollment_token}`);
  } catch (e) {
    console.warn(`! bot create failed: ${e.message}`);
  }

  // 6. Create a sample job
  try {
    const job = await call('POST', '/api/jobs', {
      kind: 'PR',
      target_repo: 'Unity-Lab-AI/Unity-Lab-AI.github.io',
      target_branch: 'main',
      payload: { head: 'feature/seed-test', base: 'main', title: 'Test PR (seed)', body: 'Created by seed-dev-data.mjs' },
    });
    console.log(`✓ job created: ${job.job_id.slice(0, 8)} (status=${job.status})`);
  } catch (e) {
    console.warn(`! job create failed: ${e.message}`);
  }

  console.log('\nseed complete. Open http://localhost:3000/admin/dashboard.html to explore.');
}

main().catch((e) => { console.error(e); process.exit(1); });
