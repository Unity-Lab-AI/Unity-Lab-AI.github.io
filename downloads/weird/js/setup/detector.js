// DUNGEON MASTER: THE HUNT — runtime detector.
// Checks the status of every prerequisite on every visit:
//   - Ollama reachable?
//   - Preset models pulled?
//   - Kokoro loaded in-browser?
//   - IndexedDB initialized?
//   - Pollinations key present?

(function () {
  'use strict';

  const cfg = () => window.DMTHConfig;

  // --- OS detection ---
  function detectOS() {
    const ua = navigator.userAgent || '';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
    if (/Linux/i.test(ua)) return 'linux';
    return 'unknown';
  }

  // --- Ollama probe ---
  async function probeOllama() {
    try {
      const res = await fetch(`${cfg().OLLAMA.endpoint}/api/tags`, {
        method: 'GET',
        mode: 'cors'
      });
      if (!res.ok) {
        return { reachable: false, reason: `HTTP ${res.status}`, models: [] };
      }
      const data = await res.json();
      const models = (data.models || []).map(m => m.name || m.model).filter(Boolean);
      return { reachable: true, models };
    } catch (err) {
      // Usually: CORS block or connection refused
      const msg = String(err?.message || err);
      const looksLikeCors = /Failed to fetch|NetworkError|CORS/i.test(msg);
      return {
        reachable: false,
        reason: looksLikeCors ? 'not-reachable-or-cors' : msg,
        models: []
      };
    }
  }

  async function probeOllamaModelPresent(modelId) {
    const probe = await probeOllama();
    if (!probe.reachable) return { present: false, reason: probe.reason };
    const present = probe.models.includes(modelId);
    return { present, models: probe.models };
  }

  // --- Kokoro probe ---
  // Kokoro-js loaded state lives on window.DMTHKokoro (see setup/kokoro.js)
  function probeKokoro() {
    const k = window.DMTHKokoro;
    if (!k) return { loaded: false, reason: 'not-loaded' };
    return {
      loaded: k.isReady(),
      loading: k.isLoading(),
      progress: k.getProgress ? k.getProgress() : null
    };
  }

  // --- Storage probe ---
  async function probeStorage() {
    try {
      await window.DMTHStorage.save.put('__probe__', { at: Date.now() });
      await window.DMTHStorage.save.del?.('__probe__');
      return { ready: true };
    } catch (err) {
      return { ready: false, reason: String(err?.message || err) };
    }
  }

  // --- Pollinations key probe ---
  function probePollinationsKey() {
    const k = cfg().POLLINATIONS.apiKey;
    return { present: !!k && k.length > 0 };
  }

  // --- Full status snapshot ---
  // If `opts.skipHealthProbe` is true, we only check that the model is listed
  // by /api/tags (fast path for repeated polling). When false (default), we
  // also fire a 1-token chat probe to verify the weights blob actually loads —
  // catching the case where Storage Sense / cleanup tools deleted the multi-GB
  // blob file but left the manifest intact.
  async function fullStatus(opts = {}) {
    const [ollama, storage] = await Promise.all([probeOllama(), probeStorage()]);
    const preset = cfg().OLLAMA.activeModel;
    const modelPresent = ollama.reachable && ollama.models.includes(preset);

    // Health probe — only meaningful if the manifest claims the model is there.
    // Result codes: 'ok' | 'corrupt' | 'missing' | 'unreachable' | 'unknown' | 'skipped' | 'no-probe-module'
    let activeModelHealth = 'skipped';
    let healthDiagnosis = null;
    if (modelPresent && !opts.skipHealthProbe) {
      if (window.DMTHOllamaRepair) {
        try {
          const probe = await window.DMTHOllamaRepair.probeModelHealth(preset);
          activeModelHealth = probe.status;
          healthDiagnosis = probe.diagnosis;
        } catch (err) {
          activeModelHealth = 'unknown';
          healthDiagnosis = { code: 'unknown', label: 'probe failed', detail: String(err?.message || err) };
        }
      } else {
        activeModelHealth = 'no-probe-module';
      }
    }

    const kokoro = probeKokoro();
    const polly = probePollinationsKey();

    // "Green" now requires the health probe to pass when it ran. If we skipped
    // the probe, fall back to manifest presence (preserves old behavior for
    // pollers that explicitly opt out).
    const modelHealthOk = activeModelHealth === 'ok'
      || activeModelHealth === 'skipped'
      || activeModelHealth === 'no-probe-module';
    const allGreen = ollama.reachable && modelPresent && modelHealthOk && kokoro.loaded && storage.ready;

    return {
      os: detectOS(),
      ollama: {
        ...ollama,
        activeModel: preset,
        activeModelPresent: modelPresent,
        activeModelHealth,
        healthDiagnosis
      },
      kokoro,
      storage,
      pollinations: polly,
      allGreen,
      checkedAt: Date.now()
    };
  }

  window.DMTHDetector = Object.freeze({
    detectOS,
    probeOllama,
    probeOllamaModelPresent,
    probeKokoro,
    probeStorage,
    probePollinationsKey,
    fullStatus
  });
})();
