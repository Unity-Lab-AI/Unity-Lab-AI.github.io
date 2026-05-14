// DUNGEON MASTER: THE HUNT — landing page controller.
// Renders: hero, status dashboard, setup wizard cards, LAUNCH button.
// No framework — direct DOM.

(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);

  let currentStatus = null;
  let pollTimer = null;
  // Cache of the last full health probe so fast polls don't lose health state.
  // Health probes hit Ollama with a real chat call — too expensive for 3-sec polling.
  let lastHealth = { status: 'unknown', diagnosis: null, modelId: null, at: 0 };

  // ---------- render helpers ----------
  function statusPill(ok, label) {
    return `<span class="pill ${ok ? 'pill-ok' : 'pill-bad'}">${ok ? '✓' : '✗'} ${label}</span>`;
  }

  function renderStatus(s) {
    const ollamaOk   = s.ollama.reachable;
    const modelOk    = s.ollama.activeModelPresent;
    const kokoroOk   = s.kokoro.loaded;
    const storageOk  = s.storage.ready;
    const pollyOk    = s.pollinations.present;

    // Merge live snapshot health with cached health (fast polls skip the probe)
    const liveHealth = s.ollama.activeModelHealth;
    const liveDiag = s.ollama.healthDiagnosis;
    let healthStatus = liveHealth;
    let healthDiag = liveDiag;
    if ((liveHealth === 'skipped' || liveHealth === 'no-probe-module' || !liveHealth) && lastHealth.status) {
      healthStatus = lastHealth.status;
      healthDiag = lastHealth.diagnosis;
    }
    const healthOk = healthStatus === 'ok' || healthStatus === 'skipped' || healthStatus === 'no-probe-module' || healthStatus === 'unknown';
    const broken = healthStatus === 'corrupt' || healthStatus === 'missing';
    const healthLabel = broken
      ? `❌ Model BROKEN: ${healthDiag?.label || healthStatus}`
      : (healthStatus === 'ok'
          ? `Model weights verified`
          : `Model weights — ${healthStatus}`);

    $('#status-dash').innerHTML = `
      <div class="status-row">${statusPill(ollamaOk, 'Ollama reachable')}</div>
      <div class="status-row">${statusPill(modelOk, `Model present: ${s.ollama.activeModel}`)}</div>
      <div class="status-row">${statusPill(!broken && (healthStatus === 'ok' || healthStatus === 'unknown' || healthStatus === 'skipped' || healthStatus === 'no-probe-module'), healthLabel)}</div>
      <div class="status-row">${statusPill(kokoroOk, `Kokoro TTS loaded${s.kokoro.loading ? ` (${Math.round((s.kokoro.progress||0)*100)}%)` : ''}`)}</div>
      <div class="status-row">${statusPill(storageOk, 'Save storage ready')}</div>
      <div class="status-row">${statusPill(pollyOk, 'Pollinations key (images, optional)')}</div>
      ${broken ? `
        <div class="status-row" style="margin-top:10px;padding:12px;background:#3a1820;border-left:3px solid #ff3d8a;border-radius:6px">
          <div style="font-weight:600;color:#ff7aa8;margin-bottom:6px">⚠ ${escapeHtml(healthDiag?.label || 'Model broken')}</div>
          <div style="font-size:0.86rem;opacity:0.9;margin-bottom:8px">${escapeHtml(healthDiag?.detail || '')}</div>
          <button id="landing-repair-btn" class="btn-primary">🔧 Repair ${escapeHtml(s.ollama.activeModel)} now</button>
          <button id="landing-recheck-btn" class="btn-small" style="margin-left:8px">↻ Re-check</button>
        </div>
      ` : ''}
    `;

    // Wire repair + recheck buttons if shown
    const repairBtn = $('#landing-repair-btn');
    if (repairBtn) {
      repairBtn.onclick = async () => {
        if (!window.DMTHOllamaRepairOverlay) {
          alert('Repair module not loaded — open the page again.');
          return;
        }
        const result = await window.DMTHOllamaRepairOverlay.show({
          diagnosis: healthDiag,
          modelId: s.ollama.activeModel,
          reason: 'manual repair from landing page'
        });
        if (result && result.repaired) {
          await refreshDeep();
        }
      };
    }
    const recheckBtn = $('#landing-recheck-btn');
    if (recheckBtn) {
      recheckBtn.onclick = () => refreshDeep();
    }

    // Launch eligibility — strict core requires Ollama + healthy model + kokoro + storage.
    const canLaunch = ollamaOk && modelOk && healthOk && !broken && kokoroOk && storageOk;
    const btn = $('#launch-btn');
    btn.disabled = !canLaunch;
    btn.textContent = canLaunch
      ? '🔒 LAUNCH DUNGEON MASTER: THE HUNT'
      : (broken ? '🔒 Repair model to launch' : '🔒 Finish setup to launch');
  }

  function renderOllamaSetup(s) {
    const steps = window.DMTHInstaller.getInstallSteps(s.os);
    $('#ollama-setup').innerHTML = `
      <h3>1. Install + run Ollama</h3>
      <p class="small">Your OS: <code>${s.os}</code>. Ollama runs on YOUR machine — nothing leaves your box.</p>
      ${steps.steps.map((st, i) => `
        <div class="step-card">
          <div class="step-label">Step ${i+1}: ${st.label}</div>
          <pre class="code-block" id="ocmd-${i}">${escapeHtml(st.cmd)}</pre>
          <button class="btn-small" data-copy="ocmd-${i}">Copy</button>
          ${st.note ? `<div class="step-note">${escapeHtml(st.note)}</div>` : ''}
        </div>
      `).join('')}
      <div class="status-row">${statusPill(s.ollama.reachable, s.ollama.reachable ? 'Ollama online' : `Waiting... (${s.ollama.reason || 'not reachable'})`)}</div>
    `;
    // Copy buttons
    $('#ollama-setup').querySelectorAll('[data-copy]').forEach(b => {
      b.onclick = () => {
        const target = document.getElementById(b.dataset.copy);
        navigator.clipboard.writeText(target.textContent).then(() => {
          const prev = b.textContent; b.textContent = 'Copied!'; setTimeout(() => b.textContent = prev, 1500);
        });
      };
    });
  }

  function renderModelSetup(s) {
    if (!s.ollama.reachable) {
      $('#model-setup').innerHTML = `<p class="small muted">Finish step 1 first (Ollama must be running).</p>`;
      return;
    }
    const catalog = window.DMTHModels.getCatalog();
    const installed = new Set(s.ollama.models);
    const active = s.ollama.activeModel;

    $('#model-setup').innerHTML = `
      <h3>2. Pull a model</h3>
      <p class="small">These are uncensored / abliterated models that will hold persona without refusing. Pick one (recommended first) and pull it. Models live on your machine.</p>
      <div class="model-grid">
        ${catalog.map(m => {
          const isInstalled = installed.has(m.id);
          const isActive = m.id === active;
          return `
            <div class="model-card ${isActive ? 'active' : ''}">
              <div class="model-name">${escapeHtml(m.displayName)}</div>
              <div class="model-meta">
                <span>${m.sizeGB.toFixed(1)} GB</span>
                ${m.uncensored ? '<span class="tag-unc">uncensored</span>' : ''}
                ${isInstalled ? '<span class="tag-ok">installed</span>' : ''}
              </div>
              <div class="model-notes">${escapeHtml(m.notes)}</div>
              <div class="model-actions">
                ${isInstalled
                  ? `<button class="btn-small" data-set-active="${m.id}">${isActive ? 'Active ✓' : 'Set active'}</button>`
                  : `<button class="btn-small btn-primary" data-pull="${m.id}">Pull</button>`
                }
              </div>
              <div class="model-progress" id="mp-${cssId(m.id)}"></div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    $('#model-setup').querySelectorAll('[data-pull]').forEach(b => {
      b.onclick = () => pullModel(b.dataset.pull);
    });
    $('#model-setup').querySelectorAll('[data-set-active]').forEach(b => {
      b.onclick = () => {
        localStorage.setItem('dmth_ollama_model', b.dataset.setActive);
        refresh();
      };
    });
  }

  function renderKokoroSetup(s) {
    const k = s.kokoro;
    $('#kokoro-setup').innerHTML = `
      <h3>3. Load Kokoro TTS (in your browser)</h3>
      <p class="small">Neural voices that run entirely in your browser. First load downloads ~80MB of model weights to your browser cache. After that it's instant.</p>
      ${k.loaded
        ? `<div class="status-row">${statusPill(true, 'Kokoro loaded — ready to speak')}</div>`
        : k.loading
          ? `<div class="progress-bar"><div class="progress-fill" style="width:${Math.round((k.progress||0)*100)}%"></div></div>
             <p class="small">Downloading model… ${Math.round((k.progress||0)*100)}%</p>`
          : `<button class="btn-primary" id="load-kokoro-btn">Load Kokoro TTS</button>
             <p class="small muted" id="kokoro-err"></p>`
      }
    `;
    const loadBtn = $('#load-kokoro-btn');
    if (loadBtn) {
      loadBtn.onclick = async () => {
        loadBtn.disabled = true;
        loadBtn.textContent = 'Loading…';
        try {
          await window.DMTHKokoro.ensureLoaded(() => refresh());
          refresh();
        } catch (err) {
          const p = $('#kokoro-err');
          if (p) p.textContent = `Load failed: ${err.message}`;
          loadBtn.disabled = false;
          loadBtn.textContent = 'Retry';
        }
      };
    }
  }

  function renderPollinationsSetup(s) {
    const hasKey = s.pollinations.present;
    // Effective key resolved by config — respects precedence: localStorage > __DEV_ENV (env.local.js from .env) > default.
    const effectiveKey = (window.DMTHConfig && window.DMTHConfig.POLLINATIONS && window.DMTHConfig.POLLINATIONS.apiKey) || '';
    const lsKey = localStorage.getItem('dmth_pollinations_key') || '';
    const sourceLabel = (effectiveKey && !lsKey)
      ? 'from .env / env.local.js'
      : (effectiveKey && lsKey)
        ? 'from Settings panel'
        : '';
    // Mask the key as a string of dots matching its length — gives the input the visual
    // "this is filled in" affordance without leaking the real key into the DOM. Capped at
    // 48 dots so a long key doesn't overflow the input visually.
    const maskedDots = hasKey ? '•'.repeat(Math.min(effectiveKey.length, 48)) : '';
    const prefix = effectiveKey.slice(0, 4);
    const suffix = effectiveKey.slice(-4);

    $('#polly-setup').innerHTML = `
      <h3>4. Pollinations API key (optional — for images)</h3>
      <p class="small">Used for whole-body profile images + on-demand selfies. Skip it — the game plays fully as text+emoji.</p>
      ${hasKey ? `
        <div style="background:#1a2a1a;border:1px solid #2f5d3a;border-left:4px solid #53d68a;border-radius:6px;padding:10px 12px;margin:10px 0;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:1.15rem;color:#53d68a;font-weight:600;">✓ KEY LOADED</span>
            <code style="background:#0e1a0e;padding:3px 8px;border-radius:3px;color:#9fefb5;font-size:0.95rem;">${prefix}${'•'.repeat(8)}${suffix}</code>
            <span class="small muted">(${sourceLabel})</span>
          </div>
          <p class="small muted" style="margin:6px 0 0;">Image generation is wired up — selfies will hit Pollinations directly. To change keys, paste a new one below.</p>
        </div>
      ` : `
        <p class="small">No key set — image generation will fall back to the legacy free endpoint (rate-limited, may 403).</p>
      `}
      <div class="polly-row">
        <input type="password" id="polly-key" class="text-input"
          ${hasKey ? `value="${maskedDots}" data-masked="1"` : `placeholder="sk_... or pk_..."`} />
        <button class="btn-small" id="polly-save">${hasKey ? 'Replace key' : 'Save'}</button>
        ${lsKey ? `<button class="btn-small btn-danger" id="polly-clear">Clear localStorage key</button>` : ''}
      </div>
    `;
    // Wipe the dot-mask on first focus/keypress so the user can paste a new key cleanly.
    const keyInput = $('#polly-key');
    if (keyInput && keyInput.dataset.masked === '1') {
      const wipeMask = () => { keyInput.value = ''; delete keyInput.dataset.masked; keyInput.removeEventListener('focus', wipeMask); keyInput.removeEventListener('input', wipeMask); };
      keyInput.addEventListener('focus', wipeMask);
      keyInput.addEventListener('input', wipeMask);
    }
    $('#polly-save').onclick = () => {
      const v = keyInput.value.trim();
      // Guard: if the user clicked Save without editing, the value is still the dot-mask. Don't save it.
      if (v && v !== maskedDots && !/^•+$/.test(v)) {
        localStorage.setItem('dmth_pollinations_key', v);
        keyInput.value = '';
        refresh();
      }
    };
    const clearBtn = $('#polly-clear');
    if (clearBtn) clearBtn.onclick = () => { localStorage.removeItem('dmth_pollinations_key'); refresh(); };
  }

  async function pullModel(modelId) {
    const progEl = $(`#mp-${cssId(modelId)}`);
    if (progEl) progEl.innerHTML = `<div class="progress-bar"><div class="progress-fill" style="width:0%"></div></div>`;
    try {
      await window.DMTHModels.pullModel(modelId, (msg) => {
        if (progEl) {
          const total = msg.total || 0;
          const done = msg.completed || 0;
          const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
          const status = msg.status || '';
          progEl.innerHTML = `
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <p class="small">${escapeHtml(status)}${total > 0 ? ` (${pct}%)` : ''}</p>
          `;
        }
      });
      // After pull, set as active if nothing else is
      if (!localStorage.getItem('dmth_ollama_model')) {
        localStorage.setItem('dmth_ollama_model', modelId);
      }
      // Pull just landed — health probe matters now, do a deep refresh
      refreshDeep();
    } catch (err) {
      if (progEl) progEl.innerHTML = `<p class="small muted">Pull failed: ${escapeHtml(err.message)}</p>`;
    }
  }

  // ---------- refresh cycle ----------
  // Fast refresh — runs every 3s. SKIPS the health probe (which would otherwise
  // fire a real chat request every poll and pound Ollama).
  async function refresh() {
    currentStatus = await window.DMTHDetector.fullStatus({ skipHealthProbe: true });
    renderStatus(currentStatus);
    renderOllamaSetup(currentStatus);
    renderModelSetup(currentStatus);
    renderKokoroSetup(currentStatus);
    renderPollinationsSetup(currentStatus);
  }

  // Deep refresh — INCLUDES the health probe. Used at init, after a pull, and
  // when the user clicks "↻ Re-check". Caches the result so the fast refresh
  // can still display it.
  async function refreshDeep() {
    currentStatus = await window.DMTHDetector.fullStatus({ skipHealthProbe: false });
    if (currentStatus?.ollama?.activeModelHealth && currentStatus.ollama.activeModelHealth !== 'skipped') {
      lastHealth = {
        status: currentStatus.ollama.activeModelHealth,
        diagnosis: currentStatus.ollama.healthDiagnosis,
        modelId: currentStatus.ollama.activeModel,
        at: Date.now()
      };
    }
    renderStatus(currentStatus);
    renderOllamaSetup(currentStatus);
    renderModelSetup(currentStatus);
    renderKokoroSetup(currentStatus);
    renderPollinationsSetup(currentStatus);
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refresh, 3000);
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  // ---------- init ----------
  async function init() {
    const cfg = window.DMTHConfig;
    $('#game-title').textContent = cfg.GAME.title;
    $('#game-tagline').textContent = cfg.GAME.tagline;
    $('#game-version').textContent = `v${cfg.GAME.version}`;

    // Initial render = deep refresh (probes the active model's actual health)
    await refreshDeep();
    startPolling();

    $('#launch-btn').onclick = () => {
      if ($('#launch-btn').disabled) return;
      window.location.href = './game.html';
    };

    $('#open-settings-btn').onclick = () => {
      document.body.classList.toggle('settings-open');
    };

    window.DMTHKokoro.onStateChange(() => refresh());
    window.addEventListener('storage', () => refresh());
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function cssId(s) { return String(s).replace(/[^a-zA-Z0-9_-]/g, '_'); }

  document.addEventListener('DOMContentLoaded', init);
})();
