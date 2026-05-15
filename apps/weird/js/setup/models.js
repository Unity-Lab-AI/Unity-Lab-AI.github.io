// DUNGEON MASTER: THE HUNT — Ollama model auto-pull.
// Streams the `POST /api/pull` response so the UI can show download progress.

(function () {
  'use strict';

  const cfg = () => window.DMTHConfig;

  async function pullModel(modelId, onProgress) {
    const endpoint = `${cfg().OLLAMA.endpoint}/api/pull`;
    const body = JSON.stringify({ name: modelId, stream: true });

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body
      });
    } catch (err) {
      throw new Error(`cannot reach Ollama: ${err.message}`);
    }
    if (!res.ok) throw new Error(`pull failed: HTTP ${res.status}`);
    if (!res.body) throw new Error('no response body stream');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let done = false;

    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (!value) continue;
      buf += decoder.decode(value, { stream: true });
      // Each line is a JSON message.
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const s = line.trim();
        if (!s) continue;
        try {
          const msg = JSON.parse(s);
          if (onProgress) onProgress(msg);
        } catch {
          // swallow malformed lines
        }
      }
    }
    // any trailing data
    if (buf.trim()) {
      try { onProgress?.(JSON.parse(buf.trim())); } catch {}
    }
    return { ok: true, modelId };
  }

  // List installed models.
  async function listInstalled() {
    const res = await fetch(`${cfg().OLLAMA.endpoint}/api/tags`, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.models || []).map(m => ({
      id: m.name || m.model,
      sizeBytes: m.size || 0,
      modifiedAt: m.modified_at || null
    }));
  }

  async function deleteModel(modelId) {
    const res = await fetch(`${cfg().OLLAMA.endpoint}/api/delete`, {
      method: 'DELETE',
      mode: 'cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelId })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  }

  window.DMTHModels = Object.freeze({
    pullModel,
    listInstalled,
    deleteModel,
    getCatalog: () => cfg().OLLAMA.modelCatalog.slice()
  });
})();
