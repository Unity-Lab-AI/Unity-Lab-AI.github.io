// SEX SLAVE DUNGEON — achievements page.

(function () {
  'use strict';

  function render(el) {
    const unlocked = window.SSDGame.achievements.unlocked();
    const locked   = window.SSDGame.achievements.locked();
    const s = window.SSDGame.state.current;

    el.innerHTML = `
      <div class="panel">
        <h2>🏆 Achievements · ${unlocked.length}/${window.SSDGame.achievements.DEFINITIONS.length}</h2>
      </div>

      <div class="panel">
        <h2>Unlocked</h2>
        ${unlocked.length === 0 ? `<p class="muted small">None yet. Keep playing.</p>` :
          `<div class="girl-grid">${unlocked.map(a => `
            <div class="model-card" style="border-color:#ffd66a">
              <div class="model-name">${a.emoji} ${a.title}</div>
              <div class="model-notes small">${a.description}</div>
              <div class="small gold">unlocked ${new Date(s.achievements[a.id].unlockedAt).toLocaleDateString()}</div>
            </div>
          `).join('')}</div>`
        }
      </div>

      <div class="panel">
        <h2>Locked</h2>
        <div class="girl-grid">
          ${locked.map(a => `
            <div class="model-card" style="opacity:0.55">
              <div class="model-name">🔒 ${a.title}</div>
              <div class="model-notes small">${a.description}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  window.SSDRouter.register('achievements', render);
})();
