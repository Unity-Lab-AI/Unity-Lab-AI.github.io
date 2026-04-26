// API client — fetch wrapper with CSRF + JSON + error handling.
// Session cookie is HttpOnly so we don't touch it from JS.

import { config } from './config.js';

function getCsrfFromCookie() {
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? m[1] : '';
}

async function request(method, path, body) {
  const headers = { 'Accept': 'application/json' };
  let payload;
  if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  if (method !== 'GET' && method !== 'HEAD') {
    headers['X-CSRF-Token'] = getCsrfFromCookie();
  }
  const res = await fetch(config.API_BASE_URL + path, {
    method,
    headers,
    credentials: 'same-origin',
    body: payload,
  });
  let data;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json().catch(() => ({}));
  } else {
    data = await res.text();
  }
  if (!res.ok) {
    const err = new Error(data?.message || data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.error;
    err.body = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
};
