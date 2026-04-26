// Password reset page logic.

import { api } from './api.js';

const $ = (id) => document.getElementById(id);

function showBanner(text, kind = 'info') {
  const b = $('status-banner');
  b.textContent = text;
  b.className = `banner ${kind}`;
}

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token');
}

async function init() {
  const token = getTokenFromUrl();
  if (!token) {
    $('reset-subtitle').textContent = 'Missing token';
    showBanner('No reset token in the URL. Ask the founder for a new reset link.', 'error');
    return;
  }

  // Validate token + fetch target email
  let check;
  try {
    check = await api.get(`/api/auth/password/reset/${encodeURIComponent(token)}/check`);
  } catch (e) {
    $('reset-subtitle').textContent = 'Invalid token';
    showBanner('Could not verify reset token: ' + e.message, 'error');
    return;
  }
  if (!check.valid) {
    $('reset-subtitle').textContent = 'Token invalid';
    const reasons = {
      invalid_token: 'This reset link is not valid. Ask the founder for a fresh one.',
      already_used: 'This reset link has already been used. Ask the founder for a fresh one.',
      expired: 'This reset link has expired (24h TTL). Ask the founder for a fresh one.',
    };
    showBanner(reasons[check.reason] ?? 'Token cannot be used.', 'error');
    return;
  }

  $('reset-subtitle').textContent = 'Set a new password';
  $('reset-target-email').textContent = check.email;
  $('form-reset').classList.remove('hidden');

  $('form-reset').addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const fd = new FormData(evt.target);
    const password = fd.get('password');
    const confirm = fd.get('confirm');
    if (password !== confirm) {
      showBanner('Passwords do not match.', 'error');
      return;
    }
    try {
      await api.post(`/api/auth/password/reset/${encodeURIComponent(token)}/consume`, {
        password,
        remember_me: fd.get('remember_me') === 'on',
      });
      // Save email in localStorage for return-visit pre-fill
      try { localStorage.setItem('unity_admin_last_email', check.email); } catch { /* ignore */ }
      showBanner('Password updated — redirecting to dashboard…', 'success');
      setTimeout(() => { window.location.href = '/admin/dashboard.html'; }, 600);
    } catch (e) {
      if (e.code === 'weak_password') {
        showBanner('Password too weak: ' + (e.body?.reason ?? 'unknown'), 'error');
      } else {
        showBanner('Reset failed: ' + e.message, 'error');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
