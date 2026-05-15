// DUNGEON MASTER: THE HUNT — settings panel.
// Slide-out panel: endpoint config, model swap, default voice picker, Pollinations key,
// save wipe / export / import, re-open setup wizard.

(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);

  function render() {
    const cfg = window.DMTHConfig;
    const voices = window.DMTHVoices.VOICES;
    const catalog = window.DMTHModels?.getCatalog() || cfg.OLLAMA.modelCatalog;

    // Populate BOTH containers — the slide-out (#settings-body) AND the inline section
    // (#settings-body-inline) in the landing page's Settings card. Without this, the
    // inline section stays empty and the user sees only the placeholder + "Go to Setup"
    // fallback line.
    const settingsHTML = `
      <section class="settings-section">
        <h3>Ollama</h3>
        <label class="field">
          <span>Endpoint</span>
          <input type="text" id="s-endpoint" value="${cfg.OLLAMA.endpoint}" />
        </label>
        <label class="field">
          <span>Active model</span>
          <select id="s-model">
            ${catalog.map(m => `<option value="${m.id}" ${m.id === cfg.OLLAMA.activeModel ? 'selected' : ''}>${m.displayName}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Temperature</span>
          <input type="number" id="s-temp" step="0.05" min="0" max="2" value="${cfg.OLLAMA.temperature}" />
        </label>
      </section>

      <section class="settings-section">
        <h3>Kokoro TTS</h3>
        <label class="field">
          <span>Default female voice</span>
          <select id="s-voice">
            ${voices.map(v => `<option value="${v.id}" ${v.id === cfg.KOKORO.defaultFemaleVoice ? 'selected' : ''}>${v.displayName} (${v.accent}) — ${v.timbre}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Default speed</span>
          <input type="number" id="s-speed" step="0.05" min="0.5" max="2" value="${cfg.KOKORO.defaultSpeed}" />
        </label>
        <button class="btn-small" id="s-preview-voice">Preview voice</button>
      </section>

      <section class="settings-section">
        <h3>Pollinations (images)</h3>
        <label class="field">
          <span>API key</span>
          <input type="password" id="s-polly" placeholder="${cfg.POLLINATIONS.apiKey ? 'saved ✓' : 'sk_…'}" />
        </label>
        <label class="field">
          <span>Image model</span>
          <select id="s-polly-model">
            <option value="flux" ${cfg.POLLINATIONS.imageModel === 'flux' ? 'selected' : ''}>flux (recommended, strict)</option>
            <option value="turbo" ${cfg.POLLINATIONS.imageModel === 'turbo' ? 'selected' : ''}>turbo (fast)</option>
            <option value="gptimage" ${cfg.POLLINATIONS.imageModel === 'gptimage' ? 'selected' : ''}>gptimage</option>
          </select>
        </label>
      </section>

      <section class="settings-section">
        <h3>Save data</h3>
        <div class="btn-row">
          <button class="btn-small" id="s-export">Export save</button>
          <button class="btn-small" id="s-import">Import save</button>
          <button class="btn-small btn-danger" id="s-wipe">💥 Wipe ALL data</button>
          <button class="btn-small btn-danger" id="s-full-nuke" style="border:2px solid #ff3060;background:#3a0a14;">☢️ FULL NUKE — burn it all down</button>
        </div>
        <p class="small muted" style="margin-top:8px;">
          <b>Wipe ALL data</b> — clears IndexedDB + every <code>dmth_*</code> localStorage key. Age-gate stays accepted.<br>
          <b>FULL NUKE</b> — burns the whole origin down: IndexedDB, ALL localStorage (incl. age verification + ToS acceptance), sessionStorage. You'll re-verify 18+ and re-accept ToS on next load. Fresh slate, no traces.
        </p>
        <input type="file" id="s-import-file" accept="application/json" style="display:none" />
      </section>

      <section class="settings-section">
        <button class="btn-small" id="s-close">Close</button>
      </section>
    `;
    // Prefer the inline container on the landing page (#settings-body-inline). If only
    // the slide-out exists (e.g. game.html chrome ⚙ legacy modal), fall back to that.
    // Rendering into both would duplicate IDs and break querySelector wiring below.
    const inlineEl = $('#settings-body-inline');
    const bodyEl = $('#settings-body');
    const target = inlineEl || bodyEl;
    if (!target) return;
    target.innerHTML = settingsHTML;

    // Wire handlers
    const closeBtn = $('#s-close');
    if (closeBtn) closeBtn.onclick = () => document.body.classList.remove('settings-open');
    $('#s-endpoint').onchange = e => { localStorage.setItem('dmth_ollama_endpoint', e.target.value); softReload(); };
    $('#s-model').onchange = e => { localStorage.setItem('dmth_ollama_model', e.target.value); softReload(); };
    $('#s-temp').onchange = e => { localStorage.setItem('dmth_ollama_temp', e.target.value); softReload(); };
    $('#s-voice').onchange = e => { localStorage.setItem('dmth_kokoro_voice', e.target.value); softReload(); };
    $('#s-speed').onchange = e => { localStorage.setItem('dmth_kokoro_speed', e.target.value); softReload(); };
    $('#s-polly').onchange = e => {
      if (e.target.value.trim()) {
        localStorage.setItem('dmth_pollinations_key', e.target.value.trim());
        e.target.value = '';
        softReload();
      }
    };
    $('#s-polly-model').onchange = e => { localStorage.setItem('dmth_pollinations_model', e.target.value); softReload(); };

    $('#s-preview-voice').onclick = async () => {
      const voice = $('#s-voice').value;
      const speed = parseFloat($('#s-speed').value) || 1.0;
      try {
        const url = await window.DMTHKokoro.speak("fuck... let's see what this voice sounds like, Master.", voice, speed);
        new Audio(url).play();
      } catch (err) {
        alert(`Voice preview failed: ${err.message}. Load Kokoro first.`);
      }
    };

    $('#s-export').onclick = async () => {
      const data = await window.DMTHStorage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ssd-save-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    $('#s-import').onclick = () => $('#s-import-file').click();
    $('#s-import-file').onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const payload = JSON.parse(text);
        await window.DMTHStorage.importAll(payload);
        alert('Save imported. Reloading.');
        location.reload();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    $('#s-wipe').onclick = async () => {
      if (!confirm('WIPE ALL game data and local settings? This cannot be undone.')) return;
      try { if (window.DMTHGame?.tick) window.DMTHGame.tick.stop(); } catch {}
      try { if (window.DMTHVoiceQueue) window.DMTHVoiceQueue.cancel(); } catch {}
      try { if (window.DMTHGame?.state) window.DMTHGame.state._nuking = true; } catch {}
      await window.DMTHStorage.wipeAll();
      // clear our localStorage keys only
      for (const k of Object.keys(localStorage)) { if (k.startsWith('dmth_')) localStorage.removeItem(k); }
      alert('All data wiped. Reloading.');
      location.reload();
    };

    // FULL NUKE — burns the whole origin down: IndexedDB + ALL localStorage (including
    // age-gate + ToS acceptance) + sessionStorage. No survivors. Lands on landing page
    // with a fresh age-gate prompt.
    $('#s-full-nuke').onclick = async () => {
      if (!confirm('FULL NUKE — delete EVERYTHING: game data, Pollinations key, age verification, ToS acceptance, all preferences. You will re-verify 18+ and re-accept the ToS on the next load. This cannot be undone. Proceed?')) return;
      if (!confirm('Second confirmation — really wipe ALL user data?')) return;
      try { if (window.DMTHGame?.tick) window.DMTHGame.tick.stop(); } catch {}
      try { if (window.DMTHVoiceQueue) window.DMTHVoiceQueue.cancel(); } catch {}
      try { if (window.DMTHGame?.state) window.DMTHGame.state._nuking = true; } catch {}
      try { await window.DMTHStorage.wipeAll(); } catch (e) { console.warn('IDB wipe failed:', e); }
      try { localStorage.clear(); } catch (e) { console.warn('localStorage clear failed:', e); }
      try { sessionStorage.clear(); } catch (e) { console.warn('sessionStorage clear failed:', e); }
      location.href = './index.html';
    };
  }

  // Soft reload — rebuild config from localStorage without full page reload.
  // For now we just reload; config is frozen after init.
  function softReload() {
    // simplest implementation: reload the page
    // future: make DMTHConfig mutable/re-readable on demand
    location.reload();
  }

  document.addEventListener('DOMContentLoaded', render);
})();
