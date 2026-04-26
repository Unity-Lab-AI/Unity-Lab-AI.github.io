// File upload + render helpers.

import { api } from './api.js';
import { config } from './config.js';

async function sha256Hex(arrayBuffer) {
  const hash = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadFile(file, roomId, onProgress) {
  // 1. Compute sha256 client-side
  const buf = await file.arrayBuffer();
  const sha256 = await sha256Hex(buf);

  // 2. Request signed upload
  const sign = await api.post('/api/files/sign-upload', {
    filename: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
    room_id: roomId,
    sha256,
  });

  // 3. PUT the bytes (use XHR for progress events)
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(sign.method, sign.upload_url);
    for (const [k, v] of Object.entries(sign.headers || {})) xhr.setRequestHeader(k, v);
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(e.loaded / e.total);
      });
    }
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(xhr) : reject(new Error(`upload ${xhr.status}: ${xhr.responseText}`));
    xhr.onerror = () => reject(new Error('upload network error'));
    xhr.send(buf);
  });

  // 4. Confirm — server posts the FILE-kind message
  return await api.post('/api/files/confirm', {
    file_id: sign.file_id,
    sha256_actual: sha256,
  });
}

export function renderFileMessage(message) {
  // body is JSON { file_id, filename, size, mime }
  let info;
  try { info = JSON.parse(message.body); } catch { return null; }
  const isImage = info.mime?.startsWith('image/');
  const sizeKb = (info.size / 1024).toFixed(1);
  const downloadHref = `${config.API_BASE_URL}/api/files/${info.file_id}/sign-download`;

  const wrapper = document.createElement('div');
  wrapper.className = 'file-attachment';
  if (isImage) {
    // Inline preview — fetch signed URL on click to actually display
    wrapper.innerHTML = `
      <div class="file-meta">
        <span class="file-icon">🖼</span>
        <span class="file-name">${escapeHtml(info.filename)}</span>
        <span class="file-size muted">${sizeKb} KB</span>
      </div>
      <button class="btn btn-small btn-block file-load-btn">Load preview</button>
    `;
    wrapper.querySelector('.file-load-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Loading…';
      try {
        const res = await api.get(`/api/files/${info.file_id}/sign-download`);
        const img = document.createElement('img');
        img.src = res.download_url;
        img.alt = info.filename;
        img.style.cssText = 'max-width: 100%; max-height: 400px; border-radius: 4px; margin-top: 8px;';
        btn.replaceWith(img);
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Failed — retry';
      }
    });
  } else {
    wrapper.innerHTML = `
      <div class="file-meta">
        <span class="file-icon">📎</span>
        <span class="file-name">${escapeHtml(info.filename)}</span>
        <span class="file-size muted">${sizeKb} KB</span>
      </div>
      <button class="btn btn-small btn-block file-download-btn">Download</button>
    `;
    wrapper.querySelector('.file-download-btn').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Preparing…';
      try {
        const res = await api.get(`/api/files/${info.file_id}/sign-download`);
        const a = document.createElement('a');
        a.href = res.download_url;
        a.download = info.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        btn.disabled = false;
        btn.textContent = 'Download';
      } catch (err) {
        btn.disabled = false;
        btn.textContent = 'Failed — retry';
      }
    });
  }
  return wrapper;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
