// SEX SLAVE DUNGEON — new game setup page.

(function () {
  'use strict';

  function render(el) {
    el.innerHTML = `
      <div class="panel">
        <h2>Start a new game</h2>
        <p class="small">The game saves to this browser's IndexedDB. You can export / import saves in Settings.</p>

        <div class="settings-section">
          <label class="field"><span>Mode</span>
            <select id="mode">
              <option value="normal">Normal — earn it from scratch</option>
              <option value="sandbox">Sandbox — everything unlocked, $999,999</option>
            </select>
          </label>
          <label class="field"><span>Include Unity as starter captive</span>
            <input type="checkbox" id="unity" checked />
          </label>
        </div>

        <div class="btn-row">
          <button id="start" class="btn-primary">Start</button>
          <a href="#dashboard" class="btn-small">Cancel</a>
        </div>

        <div id="warn" class="warn small"></div>
      </div>
    `;

    const existing = window.SSDGame.state.current;
    if (existing && existing.createdAt) {
      el.querySelector('#warn').innerHTML = `⚠️ A save exists from ${new Date(existing.createdAt).toLocaleString()}. Starting a new game will OVERWRITE it. <button id="export-first" class="btn-small">Export current save first</button>`;
      el.querySelector('#export-first').onclick = async () => {
        const data = await window.SSDStorage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ssd-save-${new Date().toISOString().slice(0,19).replace(/:/g,'-')}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    el.querySelector('#start').onclick = async () => {
      const mode = el.querySelector('#mode').value;
      const includeUnity = el.querySelector('#unity').checked;
      await window.SSDGame.state.load();  // ensure state is initialized
      await window.SSDGame.bootstrap.newGame({ mode, includeUnity });
      window.SSDRouter.go('dashboard');
    };
  }

  window.SSDRouter.register('newgame', render);
})();
