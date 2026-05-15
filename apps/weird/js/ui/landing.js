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

    // Identify the next concrete action the visitor needs to take. Highest-priority
    // failing prereq surfaces as a big "👉 Next step" callout at the top so they see
    // it without scrolling — the old layout buried install instructions below the
    // status dashboard and visitors didn't realize they needed to scroll.
    let nextStep = null;
    if (!ollamaOk) {
      // CORS distinction — Ollama running locally but missing OLLAMA_ORIGINS is the
      // #1 silent failure mode for GitHub Pages → localhost. Call it out.
      const looksCors = s.ollama.reason === 'not-reachable-or-cors';
      nextStep = {
        title: looksCors ? '👉 Next: Install Ollama or enable CORS for this site' : '👉 Next: Install Ollama on your machine',
        detail: looksCors
          ? 'Ollama might already be running but your browser can\'t reach it. Set OLLAMA_ORIGINS=* in your environment and restart Ollama — see Step 2 below.'
          : 'Ollama is the LLM that runs the girls\' minds. It runs entirely on your machine. The Setup steps below give you a one-line install command for your OS.',
        target: '#ollama-setup'
      };
    } else if (!modelOk) {
      nextStep = {
        title: `👉 Next: Pull the ${s.ollama.activeModel} model`,
        detail: 'Ollama is running. Now pull the LLM weights — about 4GB, lives on your machine. Click Pull in the Model card below.',
        target: '#model-setup'
      };
    } else if (broken) {
      nextStep = {
        title: '⚠ Next: Repair broken model weights',
        detail: 'Ollama says the model is installed but the weights file is corrupt or missing. Use the Repair button below.',
        target: '#status-dash'
      };
    } else if (!kokoroOk) {
      nextStep = {
        title: '👉 Next: Load Kokoro TTS (in your browser)',
        detail: 'Neural voices that run entirely in your browser. ~80MB first-time download, then cached. Click Load Kokoro below.',
        target: '#kokoro-setup'
      };
    } else if (!storageOk) {
      nextStep = {
        title: '⚠ Next: Browser storage unavailable',
        detail: 'IndexedDB is blocked — likely Private Browsing mode or a strict extension. Open the site in a normal window.',
        target: null
      };
    }

    // Model-weights row hidden when its prereqs (Ollama reachable + model present) aren't
    // met. Previously this row rendered as "✓ Model weights — unknown" when Ollama wasn't
    // reachable, which read as misleading-green pill + confusing label simultaneously.
    const showWeightsRow = ollamaOk && modelOk;

    $('#status-dash').innerHTML = `
      ${nextStep ? `
        <div class="next-step-callout" style="margin-bottom:14px;padding:14px 16px;background:#1f2a3a;border-left:4px solid #5da8ff;border-radius:6px">
          <div style="font-weight:600;color:#9ec8ff;font-size:1.05rem;margin-bottom:6px">${escapeHtml(nextStep.title)}</div>
          <div style="font-size:0.92rem;opacity:0.92;margin-bottom:${nextStep.target ? '10px' : '0'}">${escapeHtml(nextStep.detail)}</div>
          ${nextStep.target ? `<a href="${nextStep.target}" class="btn-small btn-primary" data-jump="${nextStep.target}">Jump to fix ↓</a>` : ''}
        </div>
      ` : ''}
      <div class="status-row">${statusPill(ollamaOk, ollamaOk ? 'Ollama reachable' : (s.ollama.reason === 'not-reachable-or-cors' ? 'Ollama not reachable (install it OR set OLLAMA_ORIGINS=*)' : `Ollama not reachable (${s.ollama.reason || 'check that it\'s running'})`))}</div>
      <div class="status-row">${statusPill(modelOk, modelOk ? `Model present: ${s.ollama.activeModel}` : `Model not pulled: ${s.ollama.activeModel} (~4GB) — pull it below`)}</div>
      ${showWeightsRow ? `<div class="status-row">${statusPill(!broken && (healthStatus === 'ok' || healthStatus === 'unknown' || healthStatus === 'skipped' || healthStatus === 'no-probe-module'), healthLabel)}</div>` : ''}
      <div class="status-row">${statusPill(kokoroOk, kokoroOk ? 'Kokoro TTS loaded' : (s.kokoro.loading ? `Kokoro TTS loading (${Math.round((s.kokoro.progress||0)*100)}%)` : 'Kokoro TTS not loaded — click Load below'))}</div>
      <div class="status-row">${statusPill(storageOk, 'Save storage ready')}</div>
      <div class="status-row">${statusPill(pollyOk, pollyOk ? 'Pollinations key (images)' : 'Pollinations key (images, optional)')}</div>
      ${broken ? `
        <div class="status-row" style="margin-top:10px;padding:12px;background:#3a1820;border-left:3px solid #ff3d8a;border-radius:6px">
          <div style="font-weight:600;color:#ff7aa8;margin-bottom:6px">⚠ ${escapeHtml(healthDiag?.label || 'Model broken')}</div>
          <div style="font-size:0.86rem;opacity:0.9;margin-bottom:8px">${escapeHtml(healthDiag?.detail || '')}</div>
          <button id="landing-repair-btn" class="btn-primary">🔧 Repair ${escapeHtml(s.ollama.activeModel)} now</button>
          <button id="landing-recheck-btn" class="btn-small" style="margin-left:8px">↻ Re-check</button>
        </div>
      ` : ''}
    `;
    // Wire the "Jump to fix" anchor for smooth-scroll behavior.
    const jumpBtn = $('#status-dash [data-jump]');
    if (jumpBtn) {
      jumpBtn.onclick = (ev) => {
        const target = document.querySelector(jumpBtn.dataset.jump);
        if (target) {
          ev.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    }

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
    // Surface the last load error from the kokoro module regardless of loading state.
    // Previously the error was only shown when NOT loading, so silent worker failures
    // (CDN import hung, WASM blocked) left the UI showing 0% progress with no error
    // and no Retry button. Now the error renders inline, plus a Retry button when
    // loading is no longer in flight.
    const lastErr = window.DMTHKokoro.getError ? window.DMTHKokoro.getError() : null;
    $('#kokoro-setup').innerHTML = `
      <h3>3. Load Kokoro TTS (in your browser)</h3>
      <p class="small">Neural voices that run entirely in your browser. First load downloads ~80MB of model weights to your browser cache. After that it's instant.</p>
      ${k.loaded
        ? `<div class="status-row">${statusPill(true, 'Kokoro loaded — ready to speak')}</div>`
        : k.loading
          ? `<div class="progress-bar"><div class="progress-fill" style="width:${Math.round((k.progress||0)*100)}%"></div></div>
             <p class="small">Downloading model… ${Math.round((k.progress||0)*100)}%</p>
             <p class="small muted">Web Worker init runs with a 60-second safety timeout. If it stalls, the loader falls back to main-thread synthesis automatically.</p>`
          : `<button class="btn-primary" id="load-kokoro-btn">${lastErr ? 'Retry Kokoro Load' : 'Load Kokoro TTS'}</button>
             ${lastErr ? `<p class="small" style="color:#ff7aa8;margin-top:8px"><b>Last attempt failed:</b> ${escapeHtml(String(lastErr.message || lastErr))}</p>` : ''}
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
          // The error span won't exist if the render loop replaced the button with the
          // progress bar mid-await — refresh() will re-render with the error visible
          // because lastErr now resolves via window.DMTHKokoro.getError().
          const p = $('#kokoro-err');
          if (p) p.textContent = `Load failed: ${err.message}`;
          refresh();
        }
      };
    }
  }

  function renderPollinationsSetup(s) {
    // Worker-route toggle — explicit on/off control. Persists in localStorage as
    // dmth_use_unity_worker = 'on' / 'off' / unset. When unset, config.js falls back to
    // hostname auto-detect (unityailab.com → on, everywhere else → off).
    const workerMode = !!(window.DMTHConfig?.POLLINATIONS?.useUnityLabWorker);
    const flagRaw = (() => { try { return window.localStorage.getItem('dmth_use_unity_worker'); } catch { return null; } })();
    const flagState = flagRaw === 'on' ? 'on' : flagRaw === 'off' ? 'off' : 'auto';
    const flagLabel = flagState === 'on' ? 'forced ON' : flagState === 'off' ? 'forced OFF' : `auto (hostname → ${workerMode ? 'on' : 'off'})`;

    const toggleHTML = `
      <div style="background:#1c1a2a;border:1px solid #3a3458;border-left:4px solid #7e6bc4;border-radius:6px;padding:10px 12px;margin:10px 0;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span style="font-weight:600;color:#c9bef0">🔀 Unity AI Lab Worker (shared Pollinations proxy)</span>
          <span class="small muted">Current: <b>${flagLabel}</b> · resolved: <b>${workerMode ? 'ROUTED THROUGH WORKER' : 'direct Pollinations + your pk_ key'}</b></span>
        </div>
        <p class="small muted" style="margin:6px 0 8px">
          When ON, image gen routes through <code>websiteunityailab.gfourteen7525.workers.dev/image/</code> and the Worker injects the operator's <code>sk_</code> token server-side. No key needed in your browser. Same routing as the rest of the website2.0 apps. <b>CORS note:</b> the Worker only allows <code>https://unityailab.com</code> origins — forcing it ON elsewhere will trigger CORS failures until you update the Worker's allowed-origins list.
        </p>
        <div class="btn-row">
          <button class="btn-small ${flagState === 'on' ? 'btn-primary' : ''}" data-worker-toggle="on">Force ON</button>
          <button class="btn-small ${flagState === 'off' ? 'btn-primary' : ''}" data-worker-toggle="off">Force OFF</button>
          <button class="btn-small ${flagState === 'auto' ? 'btn-primary' : ''}" data-worker-toggle="auto">Auto (hostname)</button>
        </div>
      </div>
    `;

    if (workerMode) {
      $('#polly-setup').innerHTML = `
        <h3>4. Pollinations (routed through Unity AI Lab Worker)</h3>
        ${toggleHTML}
        <div style="background:#1a2a1a;border:1px solid #2f5d3a;border-left:4px solid #53d68a;border-radius:6px;padding:10px 12px;margin:10px 0;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:1.15rem;color:#53d68a;font-weight:600;">✓ ROUTED THROUGH WORKER</span>
            <code style="background:#0e1a0e;padding:3px 8px;border-radius:3px;color:#9fefb5;font-size:0.85rem;">websiteunityailab.gfourteen7525.workers.dev/image/</code>
          </div>
          <p class="small muted" style="margin:6px 0 0;">
            No key needed in your browser. The Worker injects the operator's <code>sk_</code> token server-side. Uniform Pollinations auth across every app on the site.
          </p>
        </div>
      `;
      wireWorkerToggle();
      return;
    }
    // Below: standard pk_ paste-box flow when Worker mode is off.
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
      ${toggleHTML}
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
    wireWorkerToggle();
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

  // Wire the Worker-routing toggle buttons (Force ON / Force OFF / Auto). Mutates the
  // localStorage flag, then re-reads config.js's detector and forces a refresh so the
  // current resolved state + correct UX (callout vs paste box) appear immediately.
  function wireWorkerToggle() {
    document.querySelectorAll('[data-worker-toggle]').forEach(b => {
      b.onclick = () => {
        const mode = b.dataset.workerToggle;
        try {
          if (mode === 'auto') {
            window.localStorage.removeItem('dmth_use_unity_worker');
          } else {
            window.localStorage.setItem('dmth_use_unity_worker', mode);
          }
        } catch (e) { console.warn('[worker-toggle] localStorage write failed:', e); }
        // Re-evaluate the flag via config.js's detector + push the new value back into
        // the POLLINATIONS block so the next renderPollinationsSetup picks it up.
        try {
          const p = window.DMTHConfig?.POLLINATIONS;
          if (p && typeof window.DMTHConfig.detectUnityLabWorker === 'function') {
            p.useUnityLabWorker = window.DMTHConfig.detectUnityLabWorker();
          } else if (p) {
            // detectUnityLabWorker isn't exported on DMTHConfig in this build — inline the
            // priority logic: explicit flag overrides, otherwise hostname auto.
            const flag = window.localStorage.getItem('dmth_use_unity_worker');
            if (flag === 'on') p.useUnityLabWorker = true;
            else if (flag === 'off') p.useUnityLabWorker = false;
            else {
              const h = (window.location.hostname || '').toLowerCase();
              p.useUnityLabWorker = (h === 'unityailab.com' || h === 'www.unityailab.com');
            }
          }
        } catch (e) { console.warn('[worker-toggle] flag re-evaluation failed:', e); }
        refresh();
      };
    });
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
