// DUNGEON MASTER: THE HUNT — in-game settings + save slots panel.

(function () {
  'use strict';

  async function render(el) {
    try {
      await renderInner(el);
    } catch (err) {
      // Surface render failures visibly instead of leaving a blank/stale panel.
      // Without this, a missing global or bad reference would silently abort the
      // settings page and the player would see whatever was rendered last.
      console.error('[settings] render failed:', err);
      el.innerHTML = `
        <div class="panel" style="background:#3a0a14;border:2px solid #ff3060;">
          <h2 style="color:#ff7aa8;">⚠️ Settings failed to render</h2>
          <p>JavaScript error during settings render. Most likely cause: <b>stale browser cache</b> after a code update.</p>
          <p><b>Try first:</b> hard-refresh the page — Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac).</p>
          <p><b>If that doesn't fix it:</b> open DevTools (F12) → Console tab → reload → paste the red error here.</p>
          <pre style="background:#1a0a14;padding:10px;border-radius:4px;overflow:auto;font-size:0.85rem;">${String(err && err.stack || err).replace(/&/g,'&amp;').replace(/</g,'&lt;')}</pre>
          <a href="#dashboard" class="btn-small">← back to dashboard</a>
        </div>
      `;
    }
  }

  async function renderInner(el) {
    const cfg = window.DMTHConfig;
    const voices = window.DMTHVoices.VOICES;
    const catalog = cfg.OLLAMA.modelCatalog;
    const slots = await window.DMTHGame.saveSlots.listSlots();

    el.innerHTML = `
      <div class="panel">
        <h2>⚙️ Settings</h2>
        <p class="small muted">Changes save immediately. Some settings may need a reload.</p>
        <a href="#dashboard" class="btn-small">← back</a>
      </div>

      <div class="panel">
        <h2>Save slots</h2>
        <p class="small muted">Multiple named saves. 'main' is the live slot; copy to a lettered slot to keep a backup.</p>
        <div class="girl-grid">
          ${slots.map(s => `
            <div class="model-card ${s.isActive ? 'active' : ''}">
              <div class="model-name">${s.isActive ? '✓ ' : ''}${s.id}</div>
              ${s.exists ? `
                <div class="small muted">${new Date(s.createdAt).toLocaleString()}</div>
                <div class="stat-row small"><span>Captives</span><b>${s.captiveCount}</b></div>
                <div class="stat-row small"><span>Money</span><b>$${s.money.toLocaleString()}</b></div>
                <div class="stat-row small"><span>Notoriety</span><b>${s.notoriety}</b></div>
                <div class="stat-row small"><span>Ticks</span><b>${s.tickCount}</b></div>
              ` : `<div class="muted small">empty</div>`}
              <div class="btn-row">
                ${s.id !== 'main' ? `<button class="btn-small" data-save-to="${s.id}">Save from main</button>` : ''}
                ${s.exists && s.id !== 'main' ? `<button class="btn-small btn-primary" data-load-from="${s.id}">Load</button>` : ''}
                ${s.exists && s.id !== 'main' ? `<button class="btn-small btn-danger" data-wipe="${s.id}">Wipe</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel">
        <h2>Ollama</h2>
        <label class="field"><span>Model</span>
          <select id="s-model">${catalog.map(m => `<option value="${m.id}" ${m.id === cfg.OLLAMA.activeModel ? 'selected' : ''}>${m.displayName}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Temperature</span>
          <input type="number" id="s-temp" step="0.05" min="0" max="2" value="${cfg.OLLAMA.temperature}" />
        </label>
        <div class="stat-row" style="margin-top:10px">
          <span>Model health</span>
          <span id="s-ollama-health" class="small muted">click check →</span>
          <button class="btn-small" id="s-check-health">🩺 Check now</button>
          <button class="btn-small btn-primary" id="s-repair-now">🔧 Re-pull (repair)</button>
        </div>
        <p class="small muted">Probes the active model with a real chat ping. If weights were deleted from disk (Windows Storage Sense, cleanup tools), re-pull fixes it without leaving the game.</p>
      </div>

      <div class="panel">
        <h2>Kokoro voice (default)</h2>
        <label class="field"><span>Voice</span>
          <select id="s-voice">${voices.map(v => `<option value="${v.id}" ${v.id === cfg.KOKORO.defaultFemaleVoice ? 'selected' : ''}>${v.displayName} (${v.accent}) — ${v.timbre}</option>`).join('')}</select>
        </label>
        <label class="field"><span>Speed</span>
          <input type="number" id="s-speed" step="0.05" min="0.5" max="2" value="${cfg.KOKORO.defaultSpeed}" />
        </label>
      </div>

      <div class="panel">
        <h2>Pollinations (optional images)</h2>
        ${(() => {
          const k = cfg.POLLINATIONS.apiKey || '';
          if (!k) {
            return `<p class="small">Key: <b>none — using anonymous endpoint (rate-limited)</b></p>`;
          }
          const lsHas = !!localStorage.getItem('dmth_pollinations_key');
          const src = lsHas ? 'from Settings' : 'from .env / env.local.js';
          const masked = k.slice(0, 4) + '•'.repeat(8) + k.slice(-4);
          return `
            <div style="background:#1a2a1a;border:1px solid #2f5d3a;border-left:4px solid #53d68a;border-radius:6px;padding:10px 12px;margin:6px 0 12px;">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <span style="font-size:1.05rem;color:#53d68a;font-weight:600;">✓ KEY LOADED</span>
                <code style="background:#0e1a0e;padding:3px 8px;border-radius:3px;color:#9fefb5;">${masked}</code>
                <span class="small muted">(${src})</span>
              </div>
            </div>
          `;
        })()}
        <label class="field"><span>${cfg.POLLINATIONS.apiKey ? 'Replace key' : 'API key'}</span>
          <input type="password" id="s-polly" ${cfg.POLLINATIONS.apiKey ? `value="${'•'.repeat(Math.min(cfg.POLLINATIONS.apiKey.length, 48))}" data-masked="1"` : `placeholder="sk_... or pk_..."`} />
        </label>
      </div>

      <div class="panel">
        <h2>Danger zone</h2>
        <div class="btn-row">
          <button class="btn-small btn-danger" id="new-game-btn">🔄 Start over (new game)</button>
          <button class="btn-small btn-danger" id="wipe-all">💥 Wipe ALL saves + settings</button>
          <button class="btn-small btn-danger" id="full-nuke" style="border:2px solid #ff3060;background:#3a0a14;">☢️ FULL NUKE — delete ALL user data (fresh slate)</button>
        </div>
        <p class="small muted">
          <b>Start over</b> — wipes the current save, opens the new-game setup. Keeps Ollama/Kokoro/Pollinations settings.<br>
          <b>Wipe ALL saves + settings</b> — wipes IndexedDB + every <code>dmth_*</code> localStorage key. Age-gate stays accepted.<br>
          <b>FULL NUKE</b> — burns the whole origin down: IndexedDB, ALL localStorage (incl. age verification + ToS acceptance), sessionStorage. You'll re-verify 18+ and re-accept ToS on next load. Fresh slate, no traces.
        </p>
      </div>
    `;

    el.querySelector('#s-model').onchange = e => { localStorage.setItem('dmth_ollama_model', e.target.value); location.reload(); };
    el.querySelector('#s-temp').onchange  = e => { localStorage.setItem('dmth_ollama_temp', e.target.value); location.reload(); };

    // Ollama health check + manual repair
    const healthEl = el.querySelector('#s-ollama-health');
    const checkBtn = el.querySelector('#s-check-health');
    const repairBtn = el.querySelector('#s-repair-now');
    async function runHealthCheck() {
      if (!window.DMTHOllamaRepair) {
        healthEl.textContent = 'repair module not loaded';
        return null;
      }
      healthEl.textContent = '⏳ probing…';
      const probe = await window.DMTHOllamaRepair.probeModelHealth(cfg.OLLAMA.activeModel);
      if (probe.status === 'ok') {
        healthEl.textContent = '✓ healthy';
        healthEl.style.color = '#53d68a';
      } else {
        healthEl.textContent = `✗ ${probe.diagnosis?.label || probe.status}`;
        healthEl.style.color = '#ff7aa8';
      }
      return probe;
    }
    if (checkBtn) {
      checkBtn.onclick = async () => {
        checkBtn.disabled = true;
        await runHealthCheck();
        checkBtn.disabled = false;
      };
    }
    if (repairBtn) {
      repairBtn.onclick = async () => {
        if (!window.DMTHOllamaRepairOverlay) {
          alert('Repair overlay not loaded.');
          return;
        }
        const probe = await runHealthCheck();
        const diag = probe?.diagnosis || {
          code: 'unknown',
          label: 'Manual repair',
          modelId: cfg.OLLAMA.activeModel,
          detail: 'You requested a manual re-pull. This re-downloads the model weights.',
          fix: `ollama pull ${cfg.OLLAMA.activeModel}`
        };
        const result = await window.DMTHOllamaRepairOverlay.show({
          diagnosis: diag,
          modelId: cfg.OLLAMA.activeModel,
          reason: 'manual repair from in-game settings'
        });
        if (result && result.repaired) await runHealthCheck();
      };
    }
    el.querySelector('#s-voice').onchange = e => { localStorage.setItem('dmth_kokoro_voice', e.target.value); location.reload(); };
    el.querySelector('#s-speed').onchange = e => { localStorage.setItem('dmth_kokoro_speed', e.target.value); location.reload(); };
    const pollyInput = el.querySelector('#s-polly');
    // Wipe the dot-mask on first focus/keypress so the user can paste a clean replacement.
    if (pollyInput && pollyInput.dataset.masked === '1') {
      const wipeMask = () => { pollyInput.value = ''; delete pollyInput.dataset.masked; pollyInput.removeEventListener('focus', wipeMask); pollyInput.removeEventListener('input', wipeMask); };
      pollyInput.addEventListener('focus', wipeMask);
      pollyInput.addEventListener('input', wipeMask);
    }
    pollyInput.onchange = e => {
      const v = e.target.value.trim();
      // Don't save the dot-mask itself if the user clicked away without editing.
      if (v && !/^•+$/.test(v)) {
        localStorage.setItem('dmth_pollinations_key', v);
        location.reload();
      }
    };

    el.querySelectorAll('[data-save-to]').forEach(b => {
      b.onclick = async () => {
        try { await window.DMTHGame.saveSlots.saveTo(b.dataset.saveTo); window.DMTHNotify.show(`Saved to ${b.dataset.saveTo}`, { type: 'success' }); window.DMTHRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-load-from]').forEach(b => {
      b.onclick = async () => {
        if (!confirm(`Load from ${b.dataset.loadFrom}? Current game will be overwritten.`)) return;
        await window.DMTHGame.saveSlots.loadFrom(b.dataset.loadFrom);
        location.reload();
      };
    });
    el.querySelectorAll('[data-wipe]').forEach(b => {
      b.onclick = async () => {
        if (!confirm(`Wipe ${b.dataset.wipe}?`)) return;
        await window.DMTHGame.saveSlots.wipeSlot(b.dataset.wipe);
        window.DMTHRouter.handle();
      };
    });

    // Pre-wipe shutdown sequence prevents the 30-second tick from firing a background
    // save() that repopulates IndexedDB after wipeAll(). The _nuking flag short-circuits
    // state.save() while the wipe is in flight.
    function shutdownBeforeWipe() {
      try { if (window.DMTHGame?.tick) window.DMTHGame.tick.stop(); } catch {}
      try { if (window.DMTHVoiceQueue) window.DMTHVoiceQueue.cancel(); } catch {}
      try { if (window.DMTHGame?.state) window.DMTHGame.state._nuking = true; } catch {}
    }

    el.querySelector('#new-game-btn').onclick = async () => {
      if (!confirm('Start over? Wipes your current save but keeps your settings (Ollama model, Kokoro voice, Pollinations key).')) return;
      shutdownBeforeWipe();
      await window.DMTHStorage.wipeAll();
      // Keep settings-y localStorage, wipe game-state pointers only
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('dmth_') && !['dmth_pollinations_key','dmth_ollama_endpoint','dmth_ollama_model','dmth_ollama_temp','dmth_kokoro_voice','dmth_kokoro_speed','dmth_pollinations_model'].includes(k)) {
          localStorage.removeItem(k);
        }
      }
      location.hash = '#newgame';
      location.reload();
    };

    el.querySelector('#wipe-all').onclick = async () => {
      if (!confirm('WIPE ALL DATA? This cannot be undone.')) return;
      shutdownBeforeWipe();
      await window.DMTHStorage.wipeAll();
      for (const k of Object.keys(localStorage)) if (k.startsWith('dmth_')) localStorage.removeItem(k);
      location.reload();
    };

    // FULL NUKE — burns the origin down: IndexedDB + ALL localStorage (including
    // age-gate + ToS acceptance) + sessionStorage. No survivors.
    el.querySelector('#full-nuke').onclick = async () => {
      if (!confirm('FULL NUKE — delete EVERYTHING: game data, Pollinations key, age verification, ToS acceptance, all preferences. You will re-verify 18+ and re-accept the ToS on the next load. This cannot be undone. Proceed?')) return;
      if (!confirm('Second confirmation — really wipe ALL user data?')) return;
      shutdownBeforeWipe();
      try { await window.DMTHStorage.wipeAll(); } catch (e) { console.warn('IDB wipe failed:', e); }
      try { localStorage.clear(); } catch (e) { console.warn('localStorage clear failed:', e); }
      try { sessionStorage.clear(); } catch (e) { console.warn('sessionStorage clear failed:', e); }
      // Hard-reset hash + reload to landing page so age-gate fires from scratch
      location.href = './index.html';
    };
  }

  window.DMTHRouter.register('settings', render);
})();
