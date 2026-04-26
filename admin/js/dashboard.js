// Dashboard main controller.

import { api } from './api.js';
import { WSClient } from './ws-client.js';
import { uploadFile, renderFileMessage } from './files.js';

const $ = (id) => document.getElementById(id);
const state = {
  user: null,
  rooms: [],
  bots: [],
  currentRoom: null,
  ws: null,
};

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function activity(text, kind = 'info') {
  const li = document.createElement('li');
  li.className = kind;
  li.innerHTML = `<span class="ts">${fmtTime(new Date().toISOString())}</span>${text}`;
  $('activity-feed').prepend(li);
}

async function loadUser() {
  try {
    const res = await api.get('/api/auth/whoami');
    if (!res.authenticated) {
      window.location.href = '/admin/index.html';
      return;
    }
    state.user = res.user;
    $('user-info').textContent = `${state.user.email} · ${state.user.role}`;
  } catch {
    window.location.href = '/admin/index.html';
  }
}

async function loadRooms() {
  try {
    const res = await api.get('/api/rooms');
    state.rooms = res.rooms || [];
    renderRooms();
  } catch (e) {
    activity(`Rooms load failed: ${e.message}`, 'error');
  }
}

function renderRooms() {
  const ul = $('room-list');
  if (state.rooms.length === 0) {
    ul.innerHTML = '<li class="muted">No rooms yet. Create one with +</li>';
    return;
  }
  ul.innerHTML = '';
  for (const r of state.rooms) {
    const li = document.createElement('li');
    li.dataset.roomId = r.id;
    li.innerHTML = `
      <span>${escapeHtml(r.name)}</span>
      <span class="bot-row-right">
        <span class="room-kind">${r.kind}</span>
        <button type="button" class="room-delete" data-room-id="${r.id}" data-room-name="${escapeHtml(r.name)}" title="Delete room">✕</button>
      </span>
    `;
    if (state.currentRoom?.id === r.id) li.classList.add('active');
    li.addEventListener('click', (evt) => {
      if (evt.target.closest('.room-delete')) return;
      selectRoom(r);
    });
    ul.appendChild(li);
  }
  for (const btn of ul.querySelectorAll('.room-delete')) {
    btn.addEventListener('click', async (evt) => {
      evt.stopPropagation();
      const id = btn.dataset.roomId;
      const name = btn.dataset.roomName;
      if (!confirm(`Delete room "${name}"?\n\nThis archives the room so it disappears from everyone's sidebar. Messages and audit log stay in the DB. Cannot be undone from the UI.`)) return;
      try {
        await api.post(`/api/rooms/${id}/delete`);
        if (state.currentRoom?.id === id) {
          state.currentRoom = null;
          $('room-title').textContent = 'Select a room';
          $('composer').classList.add('hidden');
          $('btn-clear-room').classList.add('hidden');
        }
        activity(`Room "${name}" deleted`, 'success');
        await loadRooms();
      } catch (e) {
        activity(`Room delete failed: ${e.message}`, 'error');
      }
    });
  }
}

async function loadBots() {
  try {
    const res = await api.get('/api/bots');
    state.bots = res.bots || [];
    renderBots();
  } catch (e) {
    activity(`Bots load failed: ${e.message}`, 'error');
  }
}

function renderBots() {
  const ul = $('bot-list');
  // Backend returns revoked bots to OWNER for audit visibility; the sidebar filters them out
  // so the list reflects "active bots only". Audit trail stays in DB + audit log.
  const activeBots = state.bots.filter((b) => !b.revoked_at);
  if (activeBots.length === 0) {
    ul.innerHTML = '<li class="muted">No bots. Enroll one with +</li>';
    return;
  }
  ul.innerHTML = '';
  for (const b of activeBots) {
    const online = b.last_seen_at && (Date.now() - new Date(b.last_seen_at).getTime() < 60000);
    const li = document.createElement('li');
    li.innerHTML = `
      <span><span class="bot-status ${online ? 'online' : 'offline'}"></span> ${escapeHtml(b.name)}</span>
      <span class="bot-row-right">
        <span class="bot-role">${b.role}</span>
        <button type="button" class="bot-delete" data-bot-id="${b.id}" data-bot-name="${escapeHtml(b.name)}" title="Delete bot">✕</button>
      </span>
    `;
    ul.appendChild(li);
  }
  for (const btn of ul.querySelectorAll('.bot-delete')) {
    btn.addEventListener('click', async (evt) => {
      evt.stopPropagation();
      const id = btn.dataset.botId;
      const name = btn.dataset.botName;
      if (!confirm(`Delete bot "${name}"?\n\nThis revokes its access tokens immediately and disconnects any live session. The bot row stays in the audit log but disappears from your list. Cannot be undone — you'll have to enroll a fresh one.`)) return;
      try {
        await api.post(`/api/bots/${id}/revoke`);
        activity(`Bot "${name}" deleted`, 'success');
        await loadBots();
      } catch (e) {
        activity(`Bot delete failed: ${e.message}`, 'error');
      }
    });
  }
}

async function selectRoom(room) {
  state.currentRoom = room;
  renderRooms();
  $('room-title').textContent = room.name;
  $('composer').classList.remove('hidden');
  $('btn-clear-room').classList.remove('hidden');
  await loadMessages(room.id);
  state.ws.subscribe(room.id);
}

async function clearCurrentRoom() {
  const room = state.currentRoom;
  if (!room) return;
  if (!confirm(`Clear ALL messages in "${room.name}"?\n\nThis soft-deletes every message in this room. Audit log preserves the action. Cannot be undone.`)) return;
  try {
    const res = await api.post(`/api/rooms/${room.id}/clear`);
    activity(`Cleared ${res.cleared_count ?? 0} messages from "${room.name}"`, 'success');
    // The WS broadcast will trigger reload for everyone, but reload locally too in case
    // our own connection lags or we're not subscribed.
    await loadMessages(room.id);
  } catch (e) {
    activity(`Clear chat failed: ${e.message}`, 'error');
  }
}

async function loadMessages(roomId) {
  try {
    const res = await api.get(`/api/rooms/${roomId}/messages?limit=50`);
    const msgs = (res.messages || []).reverse();
    const box = $('messages');
    box.innerHTML = '';
    for (const m of msgs) appendMessage(m);
    box.scrollTop = box.scrollHeight;
  } catch (e) {
    activity(`Messages load failed: ${e.message}`, 'error');
  }
}

function appendMessage(m) {
  const box = $('messages');
  const empty = box.querySelector('.empty-state');
  if (empty) empty.remove();
  const div = document.createElement('div');
  const cls = m.sender_bot_id ? 'bot' : (m.kind === 'SYSTEM' ? 'system' : '');
  div.className = `message ${cls}`;
  // Prefer the human-readable name, fall back to email prefix, then bot name, then opaque id.
  // Capitalize first letter so "gee" → "Gee", "sponge" → "Sponge", etc.
  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const sender = m.sender_name
    || (m.sender_email ? cap(m.sender_email.split('@')[0]) : null)
    || (m.sender_bot_name ? `🤖 ${m.sender_bot_name}` : null)
    || (m.sender_user_id ? `user:${m.sender_user_id.slice(0,8)}` : null)
    || (m.sender_bot_id ? `bot:${m.sender_bot_id.slice(0,8)}` : 'system');
  if (m.kind === 'FILE') {
    div.innerHTML = `
      <div class="message-meta">
        <span class="message-sender">${escapeHtml(sender)}</span>
        <span class="message-time">${fmtTime(m.created_at)}</span>
      </div>
    `;
    const fileEl = renderFileMessage(m);
    if (fileEl) div.appendChild(fileEl);
  } else {
    div.innerHTML = `
      <div class="message-meta">
        <span class="message-sender">${escapeHtml(sender)}</span>
        <span class="message-time">${fmtTime(m.created_at)}</span>
      </div>
      <div class="message-body">${escapeHtml(m.body)}</div>
    `;
  }
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function handleFileUpload(file) {
  if (!state.currentRoom) {
    activity('Pick a room first', 'warn');
    return;
  }
  $('upload-progress').classList.remove('hidden');
  $('upload-name').textContent = file.name;
  $('upload-bar').value = 0;
  try {
    await uploadFile(file, state.currentRoom.id, (frac) => {
      $('upload-bar').value = frac;
    });
    activity(`Uploaded ${file.name}`, 'success');
  } catch (e) {
    activity(`Upload failed: ${e.message}`, 'error');
  } finally {
    $('upload-progress').classList.add('hidden');
    $('file-input').value = '';
  }
}

async function sendMessage(evt) {
  evt.preventDefault();
  const ta = $('composer-input');
  const body = ta.value.trim();
  if (!body || !state.currentRoom) return;
  ta.value = '';
  try {
    await api.post(`/api/rooms/${state.currentRoom.id}/messages`, { body });
    // Broadcast will re-deliver via WS too — append optimistically not done to avoid dupe.
  } catch (e) {
    activity(`Send failed: ${e.message}`, 'error');
  }
}

async function logout() {
  try { await api.post('/api/auth/logout'); } catch { /* ignore */ }
  window.location.href = '/admin/index.html';
}

function setupModals() {
  for (const btn of document.querySelectorAll('[data-close-modal]')) {
    btn.addEventListener('click', () => btn.closest('.modal').classList.add('hidden'));
  }

  $('btn-new-room').addEventListener('click', () => $('modal-new-room').classList.remove('hidden'));
  $('btn-new-bot').addEventListener('click', () => {
    $('modal-new-bot').classList.remove('hidden');
    $('bot-enroll-result').classList.add('hidden');
    $('form-new-bot').classList.remove('hidden');
  });
  $('btn-set-password').addEventListener('click', () => $('modal-set-password').classList.remove('hidden'));

  $('form-new-room').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const fd = new FormData(evt.target);
    try {
      await api.post('/api/rooms', {
        name: fd.get('name'),
        kind: fd.get('kind'),
        description: fd.get('description'),
      });
      $('modal-new-room').classList.add('hidden');
      evt.target.reset();
      await loadRooms();
      activity('Room created', 'success');
    } catch (e) {
      activity(`Room create failed: ${e.message}`, 'error');
    }
  });

  $('form-new-bot').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const fd = new FormData(evt.target);
    try {
      const res = await api.post('/api/bots', {
        name: fd.get('name'),
        role: fd.get('role'),
      });
      $('bot-enroll-token').textContent = res.enrollment_token;
      $('bot-proxy-link').href = res.proxy_download_url;
      $('form-new-bot').classList.add('hidden');
      $('bot-enroll-result').classList.remove('hidden');
      await loadBots();
      activity('Bot enrolled', 'success');
    } catch (e) {
      activity(`Bot enroll failed: ${e.message}`, 'error');
    }
  });

  $('btn-copy-bot-token').addEventListener('click', async () => {
    const tok = $('bot-enroll-token').textContent;
    try {
      await navigator.clipboard.writeText(tok);
      activity('Bot token copied to clipboard', 'success');
    } catch {
      activity('Clipboard write failed — select the text and copy manually', 'warn');
    }
  });

  $('btn-copy-mcp-snippet').addEventListener('click', async () => {
    const snip = $('bot-mcp-snippet').textContent;
    try {
      await navigator.clipboard.writeText(snip);
      activity('Fresh-file template copied to clipboard', 'success');
    } catch {
      activity('Clipboard write failed — select the text and copy manually', 'warn');
    }
  });

  $('btn-copy-merged-example').addEventListener('click', async () => {
    const snip = $('bot-mcp-merged-example').textContent;
    try {
      await navigator.clipboard.writeText(snip);
      activity('Merged example copied to clipboard', 'success');
    } catch {
      activity('Clipboard write failed — select the text and copy manually', 'warn');
    }
  });

  $('form-set-password').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const fd = new FormData(evt.target);
    if (fd.get('password') !== fd.get('confirm')) {
      alert('Passwords do not match');
      return;
    }
    try {
      await api.post('/api/auth/password/set', { password: fd.get('password') });
      $('modal-set-password').classList.add('hidden');
      evt.target.reset();
      activity('Password set', 'success');
    } catch (e) {
      activity(`Password set failed: ${e.code || e.message}`, 'error');
    }
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

async function setupResetOther() {
  if (state.user?.role !== 'OWNER') return;
  document.getElementById('reset-other-section').classList.remove('hidden');
  document.getElementById('reset-other-card').classList.remove('hidden');

  document.getElementById('btn-reset-other').addEventListener('click', async () => {
    // Populate the email picker with currently-claimed admins (excluding self)
    try {
      const status = await api.get('/api/auth/claim/status');
      const allEmails = ['sponge@unityailab.com', 'gee@unityailab.com', 'red@unityailab.com', 'alfreddo@unityailab.com'];
      const unclaimed = new Set(status.unclaimed_admins ?? []);
      const claimed = allEmails.filter((e) => !unclaimed.has(e) && e !== state.user.email);
      const sel = document.getElementById('reset-other-email');
      sel.innerHTML = '';
      if (claimed.length === 0) {
        sel.innerHTML = '<option value="">(no other claimed admins)</option>';
      } else {
        for (const e of claimed) {
          const opt = document.createElement('option');
          opt.value = e;
          opt.textContent = e;
          sel.appendChild(opt);
        }
      }
      document.getElementById('modal-reset-other').classList.remove('hidden');
      document.getElementById('reset-other-result').classList.add('hidden');
      document.getElementById('form-reset-other').classList.remove('hidden');
    } catch (e) {
      activity('Could not load claim status: ' + e.message, 'error');
    }
  });

  document.getElementById('form-reset-other').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const fd = new FormData(evt.target);
    const email = fd.get('email');
    if (!email) return;
    try {
      const res = await api.post('/api/auth/password/reset', { email });
      document.getElementById('reset-other-url').textContent = res.url;
      document.getElementById('form-reset-other').classList.add('hidden');
      document.getElementById('reset-other-result').classList.remove('hidden');
      activity(`Reset link minted for ${email}`, 'warn');
    } catch (e) {
      activity('Reset mint failed: ' + e.message, 'error');
    }
  });

  document.getElementById('btn-copy-reset-url').addEventListener('click', async () => {
    const url = document.getElementById('reset-other-url').textContent;
    try {
      await navigator.clipboard.writeText(url);
      activity('Reset URL copied to clipboard', 'success');
    } catch {
      activity('Clipboard write failed — copy manually', 'warn');
    }
  });
}

async function loadJobs() {
  try {
    const res = await api.get('/api/jobs?limit=20');
    const ul = $('job-list');
    if (!res.jobs?.length) {
      ul.innerHTML = '<li class="muted">No jobs yet.</li>';
      return;
    }
    ul.innerHTML = '';
    for (const j of res.jobs) {
      const li = document.createElement('li');
      let actions = '';
      if (j.status === 'PENDING_APPROVAL' && (state.user?.role === 'OWNER' || state.user?.role === 'SUPERVISOR')) {
        actions = `<button class="btn btn-small job-approve" data-id="${j.id}">Approve</button> <button class="btn btn-small job-reject" data-id="${j.id}">Reject</button>`;
      }
      li.innerHTML = `
        <div><span class="ts">${fmtTime(j.created_at)}</span> <strong>${escapeHtml(j.kind)}</strong> ${escapeHtml(j.target_repo)} → ${escapeHtml(j.target_branch)}</div>
        <div class="muted" style="font-size:0.75rem">${j.status} · job ${j.id.slice(0,8)}</div>
        ${actions ? `<div style="margin-top:4px">${actions}</div>` : ''}
      `;
      ul.appendChild(li);
    }
    for (const btn of ul.querySelectorAll('.job-approve')) {
      btn.addEventListener('click', async () => {
        try { await api.post(`/api/jobs/${btn.dataset.id}/approve`); activity('Job approved', 'success'); await loadJobs(); }
        catch (e) { activity('Approve failed: ' + e.message, 'error'); }
      });
    }
    for (const btn of ul.querySelectorAll('.job-reject')) {
      btn.addEventListener('click', async () => {
        const reason = prompt('Reject reason?') ?? '';
        try { await api.post(`/api/jobs/${btn.dataset.id}/reject`, { reason }); activity('Job rejected', 'warn'); await loadJobs(); }
        catch (e) { activity('Reject failed: ' + e.message, 'error'); }
      });
    }
  } catch (e) {
    $('job-list').innerHTML = `<li class="error">Jobs load failed: ${escapeHtml(e.message)}</li>`;
  }
}

async function loadClaimWindow() {
  // Only OWNER sees this UI
  if (state.user?.role !== 'OWNER') return;
  try {
    const res = await api.get('/api/auth/claim/status');
    document.getElementById('claim-window-section').classList.remove('hidden');
    document.getElementById('claim-window-card').classList.remove('hidden');
    const dot = document.getElementById('claim-window-dot');
    const text = document.getElementById('claim-window-text');
    const unclaimed = document.getElementById('claim-window-unclaimed');
    const btn = document.getElementById('btn-claim-window-toggle');
    const isOpen = res.window_open;
    dot.className = `status-dot ${isOpen ? 'open' : 'closed'}`;
    text.textContent = isOpen ? 'OPEN — claims allowed' : 'CLOSED';
    unclaimed.innerHTML = (res.unclaimed_admins?.length > 0)
      ? `Unclaimed: ${res.unclaimed_admins.map(escapeHtml).join(', ')}`
      : 'All 4 admins enrolled.';
    btn.textContent = isOpen ? 'Close Claim Window' : 'Open Claim Window';
    btn.onclick = async () => {
      const willBeOpen = !isOpen;
      const verb = willBeOpen ? 'OPEN' : 'CLOSE';
      const msg = willBeOpen
        ? 'Other admins will be able to claim accounts via .claude/ setup. Open this only while distributing the universal template.'
        : 'No new claims will be allowed until reopened.';
      if (!confirm(`${verb} the claim window?\n\n${msg}`)) return;
      try {
        await api.post('/api/auth/claim/window', { open: willBeOpen });
        activity(`Claim window ${willBeOpen ? 'OPENED' : 'CLOSED'}`, willBeOpen ? 'warn' : 'success');
        await loadClaimWindow();
      } catch (e) {
        activity(`Window toggle failed: ${e.message}`, 'error');
      }
    };
  } catch {
    // Non-OWNER returns 403 — silently ignore
  }
}

async function maybeShowFounderBanner() {
  if (state.user?.role !== 'OWNER') return;
  try {
    const status = await api.get('/api/auth/claim/status');
    const unclaimedCount = status.unclaimed_admins?.length ?? 0;
    if (unclaimedCount === 0) return;
    if (document.querySelector('.founder-banner')) return; // dedupe
    const banner = document.createElement('div');
    banner.className = 'founder-banner';
    banner.innerHTML = `
      <div class="text">
        <strong>Welcome ${escapeHtml(state.user.email.split('@')[0])}.</strong>
        ${unclaimedCount} admin${unclaimedCount === 1 ? '' : 's'} not yet enrolled
        (${status.unclaimed_admins.map(escapeHtml).join(', ')}).
        Open the claim window in the right sidebar when you're ready to distribute the <code>.claude/</code> template.
      </div>
      <button class="btn btn-small" id="btn-dismiss-founder">Dismiss</button>
    `;
    document.querySelector('.layout').insertAdjacentElement('beforebegin', banner);
    document.getElementById('btn-dismiss-founder').addEventListener('click', () => banner.remove());
  } catch { /* ignore */ }
}

function setupWs() {
  state.ws = new WSClient();
  state.ws.addEventListener('open', () => activity('WS connected', 'success'));
  state.ws.addEventListener('close', () => activity('WS disconnected — reconnecting…', 'warn'));
  state.ws.addEventListener('message', (evt) => {
    const m = evt.detail;
    if (m.op === 'message' && m.message?.room_id === state.currentRoom?.id) {
      appendMessage(m.message);
    } else if (m.op === 'room_cleared' && m.room_id === state.currentRoom?.id) {
      // Someone (us or another admin) cleared this room — refresh the message view.
      loadMessages(m.room_id);
      activity(`Room "${state.currentRoom.name}" cleared (${m.cleared_count ?? 0} messages)`, 'warn');
    } else if (m.op === 'hello') {
      activity(`Connected as user ${m.user_id?.slice(0, 8)}`);
    } else if (m.op === 'deploy_event') {
      const url = m.deploy_url ? ` <a href="${m.deploy_url}" target="_blank">${m.deploy_url}</a>` : '';
      activity(`🚀 Deploy ${m.status}: ${m.event_type}${url}`, m.status === 'FAILED' ? 'error' : (m.status === 'SUCCEEDED' ? 'success' : 'warn'));
    } else if (m.op === 'job_event') {
      activity(`⚙ Job ${m.event}: ${m.job_id?.slice(0,8) ?? '?'}`, m.event === 'failed' ? 'error' : (m.event === 'completed' ? 'success' : 'info'));
      loadJobs();
    }
  });
  state.ws.connect();
}

document.addEventListener('DOMContentLoaded', async () => {
  $('btn-logout').addEventListener('click', logout);
  $('btn-clear-room').addEventListener('click', clearCurrentRoom);
  $('composer').addEventListener('submit', sendMessage);
  $('composer-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  });
  $('btn-attach').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', (e) => {
    const f = e.target.files?.[0];
    if (f) handleFileUpload(f);
  });
  // Drag-drop on the messages pane
  const dropZone = $('messages');
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.background = 'var(--bg-3)'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.background = ''; });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = '';
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileUpload(f);
  });
  setupModals();
  await loadUser();
  await loadRooms();
  await loadBots();
  await loadClaimWindow();
  await setupResetOther();
  await loadJobs();
  $('btn-refresh-jobs')?.addEventListener('click', loadJobs);
  await maybeShowFounderBanner();
  setupWs();
  // Refresh bot status + claim window + jobs every 30s
  setInterval(loadBots, 30000);
  setInterval(loadClaimWindow, 30000);
  setInterval(loadJobs, 30000);
});
