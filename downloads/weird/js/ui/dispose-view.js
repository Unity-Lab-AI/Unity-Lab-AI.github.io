// SEX SLAVE DUNGEON — disposal flow page.

(function () {
  'use strict';

  function render(el, params) {
    const girl = window.SSDGame.state.getGirl(params.girl);
    if (!girl) { el.innerHTML = `<p>no such girl · <a href="#roster">Roster</a></p>`; return; }
    const dungeon = window.SSDGame.state.getDungeon(girl.assignedDungeonId);
    const dungeonTpl = dungeon && window.SSDAssets.getById('dungeon', dungeon.templateId);

    el.innerHTML = `
      <div class="panel">
        <h2>⚱️ Dispose of ${girl.name}</h2>
        <p class="small muted">${girl.backstoryFragment}</p>
        <div class="stat-row"><span>Bond L</span><b>${girl.bond.bondLevel}/9</b></div>
        <div class="stat-row"><span>Dungeon isolation</span><b>${Math.round((dungeonTpl?.isolation || 0) * 100)}%</b></div>
        <a href="#room?girl=${girl.id}" class="btn-small">← cancel</a>
      </div>

      <div class="panel">
        <h2>Choose a method</h2>
        <div class="girl-grid">
          ${Object.entries(window.SSDGame.disposal.METHODS).map(([key, m]) => `
            <div class="model-card">
              <div class="model-name">${m.emoji} ${m.displayName}</div>
              <div class="model-notes small">${m.notes}</div>
              <div class="stat-row small"><span>Cost</span><b>$${m.moneyCost}</b></div>
              <div class="stat-row small"><span>Notoriety</span><b>+${m.notorietyFactor(girl, dungeonTpl) || 0}</b></div>
              ${m.generatesFilm ? `<div class="small gold">🎬 Generates finalization film</div>` : ''}
              ${m.requiresFacility ? `<div class="small warn">Requires facility: ${m.requiresFacility}</div>` : ''}
              <button data-method="${key}" class="btn-small btn-danger">Dispose via ${m.displayName}</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.SSDAssetImg) window.SSDAssetImg.decorate(el, 80);

    el.querySelectorAll('[data-method]').forEach(b => {
      b.onclick = async () => {
        const method = b.dataset.method;
        if (!confirm(`Dispose of ${girl.name} via ${window.SSDGame.disposal.METHODS[method].displayName}? This cannot be undone.`)) return;
        try {
          // Capture the girl ref BEFORE disposal mutates state, so we can narrate the final scene
          const girlSnapshot = JSON.parse(JSON.stringify(girl));
          const result = window.SSDGame.disposal.dispose(girl.id, method);
          // Show final narration from Ollama
          const narration = await window.SSDGame.disposal.narrateDisposal(girlSnapshot, method);
          const resultHtml = `<div class="panel"><h3>${window.SSDGame.disposal.METHODS[method].emoji} ${window.SSDGame.disposal.METHODS[method].displayName}</h3>
            ${narration ? `<div class="log"><div class="log-entry assistant"><b>${girlSnapshot.name}:</b> ${escapeHtml(narration)}</div></div>` : ''}
            ${result.generatedFilmId ? `<p class="small gold">Finalization film ${result.generatedFilmId} recorded and listed.</p>` : ''}
            <div class="btn-row"><a href="#dashboard" class="btn-primary">← Dashboard</a></div>
          </div>`;
          el.innerHTML = resultHtml;
        } catch (e) { alert(e.message); }
      };
    });
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  window.SSDRouter.register('dispose', render);
})();
