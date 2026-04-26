// Login page logic.
// Browser login is DISABLED — the only public-facing path is the .claude/ setup wizard.
// This page exists to (a) explain that, (b) host the dev-bypass picker for localhost-only
// debugging, and (c) detect already-authenticated sessions and redirect to the dashboard.

import { api } from './api.js';

const $ = (id) => document.getElementById(id);

function showTab(name) {
  for (const t of document.querySelectorAll('.tab')) {
    t.classList.toggle('active', t.dataset.tab === name);
  }
  for (const p of document.querySelectorAll('.panel')) {
    p.classList.toggle('active', p.id === 'panel-' + name);
  }
}

function showBanner(text, kind = 'info') {
  const b = $('status-banner');
  b.textContent = text;
  b.className = `banner ${kind}`;
}

function hideBanner() {
  $('status-banner').className = 'banner hidden';
}

async function loadDevAdmins() {
  try {
    const res = await api.get('/api/auth/dev/admins');
    if (!res.admins) return false;
    $('tab-dev').classList.remove('hidden');
    const grid = $('dev-admin-list');
    grid.innerHTML = '';
    for (const a of res.admins) {
      const card = document.createElement('div');
      card.className = 'admin-card';
      card.innerHTML = `<div class="handle">${a.handle}</div><div class="email">${a.email}</div>`;
      card.addEventListener('click', () => devLogin(a.email));
      grid.appendChild(card);
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function devLogin(email) {
  hideBanner();
  try {
    const remember = $('dev-remember').checked;
    await api.post('/api/auth/dev/login', { email, remember_me: remember });
    showBanner(`Signed in as ${email} — redirecting…`, 'success');
    setTimeout(() => { window.location.href = '/admin/dashboard.html'; }, 400);
  } catch (e) {
    if (e.code === 'dev_bypass_localhost_only') {
      showBanner('Dev login is localhost-only. Use .claude/start.bat instead.', 'error');
    } else {
      showBanner(`Login failed: ${e.message}`, 'error');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Tab switching (only relevant if dev tab gets shown)
  for (const t of document.querySelectorAll('.tab')) {
    t.addEventListener('click', () => showTab(t.dataset.tab));
  }

  // Dev mode detection (localhost only — backend rejects from any proxy/tunnel)
  const devAvailable = await loadDevAdmins();

  // If ?dev=1 query param AND dev is reachable, default to dev tab
  if (devAvailable && new URLSearchParams(window.location.search).get('dev') === '1') {
    showTab('dev');
  }

  // Already logged in? Redirect to dashboard. (Cookie still valid from a prior .claude/ handoff.)
  try {
    const me = await api.get('/api/auth/whoami');
    if (me?.authenticated) {
      window.location.href = '/admin/dashboard.html';
    }
  } catch { /* not logged in, stay on this page */ }
});
