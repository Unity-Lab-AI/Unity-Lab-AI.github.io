// SEX SLAVE DUNGEON — in-game settings + save slots panel.

(function () {
  'use strict';

  async function render(el) {
    const cfg = window.SSDConfig;
    const voices = window.SSDVoices.VOICES;
    const catalog = cfg.OLLAMA.modelCatalog;
    const slots = await window.SSDGame.saveSlots.listSlots();

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
          const status = k ? `✓ saved (${k.slice(0,3)}…${k.slice(-4)})`
                           : 'none — using anonymous endpoint';
          return `<p class="small">Key: <b>${status}</b></p>`;
        })()}
        <label class="field"><span>API key</span>
          <input type="password" id="s-polly" placeholder="${cfg.POLLINATIONS.apiKey ? 'paste new key to change' : 'sk_... or pk_...'}" />
        </label>
      </div>

      <div class="panel">
        <h2>Danger zone</h2>
        <div class="btn-row">
          <button class="btn-small btn-danger" id="new-game-btn">🔄 Start over (new game)</button>
          <button class="btn-small btn-danger" id="wipe-all">💥 Wipe ALL saves + settings</button>
        </div>
        <p class="small muted">"Start over" wipes the current save and opens the new-game setup (mode + starter options). Preserves your Ollama/Kokoro/Pollinations settings.</p>
      </div>
    `;

    el.querySelector('#s-model').onchange = e => { localStorage.setItem('ssd_ollama_model', e.target.value); location.reload(); };
    el.querySelector('#s-temp').onchange  = e => { localStorage.setItem('ssd_ollama_temp', e.target.value); location.reload(); };

    // Ollama health check + manual repair
    const healthEl = el.querySelector('#s-ollama-health');
    const checkBtn = el.querySelector('#s-check-health');
    const repairBtn = el.querySelector('#s-repair-now');
    async function runHealthCheck() {
      if (!window.SSDOllamaRepair) {
        healthEl.textContent = 'repair module not loaded';
        return null;
      }
      healthEl.textContent = '⏳ probing…';
      const probe = await window.SSDOllamaRepair.probeModelHealth(cfg.OLLAMA.activeModel);
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
        if (!window.SSDOllamaRepairOverlay) {
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
        const result = await window.SSDOllamaRepairOverlay.show({
          diagnosis: diag,
          modelId: cfg.OLLAMA.activeModel,
          reason: 'manual repair from in-game settings'
        });
        if (result && result.repaired) await runHealthCheck();
      };
    }
    el.querySelector('#s-voice').onchange = e => { localStorage.setItem('ssd_kokoro_voice', e.target.value); location.reload(); };
    el.querySelector('#s-speed').onchange = e => { localStorage.setItem('ssd_kokoro_speed', e.target.value); location.reload(); };
    el.querySelector('#s-polly').onchange = e => {
      if (e.target.value.trim()) {
        localStorage.setItem('ssd_pollinations_key', e.target.value.trim());
        location.reload();
      }
    };

    el.querySelectorAll('[data-save-to]').forEach(b => {
      b.onclick = async () => {
        try { await window.SSDGame.saveSlots.saveTo(b.dataset.saveTo); window.SSDNotify.show(`Saved to ${b.dataset.saveTo}`, { type: 'success' }); window.SSDRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-load-from]').forEach(b => {
      b.onclick = async () => {
        if (!confirm(`Load from ${b.dataset.loadFrom}? Current game will be overwritten.`)) return;
        await window.SSDGame.saveSlots.loadFrom(b.dataset.loadFrom);
        location.reload();
      };
    });
    el.querySelectorAll('[data-wipe]').forEach(b => {
      b.onclick = async () => {
        if (!confirm(`Wipe ${b.dataset.wipe}?`)) return;
        await window.SSDGame.saveSlots.wipeSlot(b.dataset.wipe);
        window.SSDRouter.handle();
      };
    });

    el.querySelector('#new-game-btn').onclick = async () => {
      if (!confirm('Start over? Wipes your current save but keeps your settings (Ollama model, Kokoro voice, Pollinations key).')) return;
      await window.SSDStorage.wipeAll();
      // Keep settings-y localStorage, wipe game-state pointers only
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith('ssd_') && !['ssd_pollinations_key','ssd_ollama_endpoint','ssd_ollama_model','ssd_ollama_temp','ssd_kokoro_voice','ssd_kokoro_speed','ssd_pollinations_model'].includes(k)) {
          localStorage.removeItem(k);
        }
      }
      location.hash = '#newgame';
      location.reload();
    };

    el.querySelector('#wipe-all').onclick = async () => {
      if (!confirm('WIPE ALL DATA? This cannot be undone.')) return;
      await window.SSDStorage.wipeAll();
      for (const k of Object.keys(localStorage)) if (k.startsWith('ssd_')) localStorage.removeItem(k);
      location.reload();
    };
  }

  window.SSDRouter.register('settings', render);
})();
