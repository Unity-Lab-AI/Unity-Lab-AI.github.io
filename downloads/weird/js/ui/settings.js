// SEX SLAVE DUNGEON — settings panel.
// Slide-out panel: endpoint config, model swap, default voice picker, Pollinations key,
// save wipe / export / import, re-open setup wizard.

(function () {
  'use strict';

  const $ = sel => document.querySelector(sel);

  function render() {
    const cfg = window.SSDConfig;
    const voices = window.SSDVoices.VOICES;
    const catalog = window.SSDModels?.getCatalog() || cfg.OLLAMA.modelCatalog;

    $('#settings-body').innerHTML = `
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
          <button class="btn-small btn-danger" id="s-wipe">Wipe ALL data</button>
        </div>
        <input type="file" id="s-import-file" accept="application/json" style="display:none" />
      </section>

      <section class="settings-section">
        <button class="btn-small" id="s-close">Close</button>
      </section>
    `;

    // Wire handlers
    $('#s-close').onclick = () => document.body.classList.remove('settings-open');
    $('#s-endpoint').onchange = e => { localStorage.setItem('ssd_ollama_endpoint', e.target.value); softReload(); };
    $('#s-model').onchange = e => { localStorage.setItem('ssd_ollama_model', e.target.value); softReload(); };
    $('#s-temp').onchange = e => { localStorage.setItem('ssd_ollama_temp', e.target.value); softReload(); };
    $('#s-voice').onchange = e => { localStorage.setItem('ssd_kokoro_voice', e.target.value); softReload(); };
    $('#s-speed').onchange = e => { localStorage.setItem('ssd_kokoro_speed', e.target.value); softReload(); };
    $('#s-polly').onchange = e => {
      if (e.target.value.trim()) {
        localStorage.setItem('ssd_pollinations_key', e.target.value.trim());
        e.target.value = '';
        softReload();
      }
    };
    $('#s-polly-model').onchange = e => { localStorage.setItem('ssd_pollinations_model', e.target.value); softReload(); };

    $('#s-preview-voice').onclick = async () => {
      const voice = $('#s-voice').value;
      const speed = parseFloat($('#s-speed').value) || 1.0;
      try {
        const url = await window.SSDKokoro.speak("fuck... let's see what this voice sounds like, Master.", voice, speed);
        new Audio(url).play();
      } catch (err) {
        alert(`Voice preview failed: ${err.message}. Load Kokoro first.`);
      }
    };

    $('#s-export').onclick = async () => {
      const data = await window.SSDStorage.exportAll();
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
        await window.SSDStorage.importAll(payload);
        alert('Save imported. Reloading.');
        location.reload();
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    $('#s-wipe').onclick = async () => {
      if (!confirm('WIPE ALL game data and local settings? This cannot be undone.')) return;
      await window.SSDStorage.wipeAll();
      // clear our localStorage keys only
      for (const k of Object.keys(localStorage)) { if (k.startsWith('ssd_')) localStorage.removeItem(k); }
      alert('All data wiped. Reloading.');
      location.reload();
    };
  }

  // Soft reload — rebuild config from localStorage without full page reload.
  // For now we just reload; config is frozen after init.
  function softReload() {
    // simplest implementation: reload the page
    // future: make SSDConfig mutable/re-readable on demand
    location.reload();
  }

  document.addEventListener('DOMContentLoaded', render);
})();
