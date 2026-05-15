// DUNGEON MASTER: THE HUNT — disposal flow page.

(function () {
  'use strict';

  function render(el, params) {
    const girl = window.DMTHGame.state.getGirl(params.girl);
    if (!girl) { el.innerHTML = `<p>no such girl · <a href="#roster">Roster</a></p>`; return; }
    const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
    const dungeonTpl = dungeon && window.DMTHAssets.getById('dungeon', dungeon.templateId);

    el.innerHTML = `
      <div class="panel">
        <h2>⚱️ Dispose of ${girl.name}</h2>
        <p class="small muted">${girl.backstoryFragment}</p>
        <div class="stat-row" data-tooltip="Her Stockholm bond level 0-9. Higher levels = bigger premium on finalization films + lower notoriety on bury/release."><span>Stockholm rating</span><b>L${girl.bond.bondLevel}/9</b></div>
        <div class="stat-row" data-tooltip="How isolated this dungeon is. Higher isolation reduces notoriety bumps on every method."><span>Dungeon isolation</span><b>${Math.round((dungeonTpl?.isolation || 0) * 100)}%</b></div>
        <a href="#room?girl=${girl.id}" class="btn-small" data-tooltip="Back to her hold — no harm done.">← cancel</a>
      </div>

      <div class="panel">
        <h2>Choose a method</h2>
        <div class="girl-grid">
          ${Object.entries(window.DMTHGame.disposal.METHODS).map(([key, m]) => {
            const cardTip = (m.notes || '').replace(/"/g, '&quot;');
            return `<div class="model-card" data-tooltip="${cardTip}">
              <div class="model-name">${m.emoji} ${m.displayName}</div>
              <div class="model-notes small">${m.notes}</div>
              <div class="stat-row small" data-tooltip="Up-front money cost for this disposal method"><span>Cost</span><b>$${m.moneyCost}</b></div>
              <div class="stat-row small" data-tooltip="Notoriety added to your operation. Higher = more heat from authorities."><span>Notoriety</span><b>+${m.notorietyFactor(girl, dungeonTpl) || 0}</b></div>
              ${m.generatesFilm ? `<div class="small gold" data-tooltip="Generates a premium finalization film — 3-5× regular film value, one-shot.">🎬 Generates finalization film</div>` : ''}
              ${m.requiresFacility ? `<div class="small warn" data-tooltip="Requires this specific facility built into your dungeon">Requires facility: ${m.requiresFacility}</div>` : ''}
              <button data-method="${key}" class="btn-small btn-danger" data-tooltip="Dispose via ${m.displayName}. Cannot be undone.">Dispose via ${m.displayName}</button>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    if (window.DMTHAssetImg) window.DMTHAssetImg.decorate(el, 80);

    el.querySelectorAll('[data-method]').forEach(b => {
      b.onclick = async () => {
        const method = b.dataset.method;
        if (!confirm(`Dispose of ${girl.name} via ${window.DMTHGame.disposal.METHODS[method].displayName}? This cannot be undone.`)) return;
        try {
          // Capture the girl ref BEFORE disposal mutates state, so we can narrate the final scene
          const girlSnapshot = JSON.parse(JSON.stringify(girl));
          const result = window.DMTHGame.disposal.dispose(girl.id, method);
          // Show final narration from Ollama
          const narration = await window.DMTHGame.disposal.narrateDisposal(girlSnapshot, method);
          const resultHtml = `<div class="panel"><h3>${window.DMTHGame.disposal.METHODS[method].emoji} ${window.DMTHGame.disposal.METHODS[method].displayName}</h3>
            ${narration ? `<div class="log"><div class="log-entry assistant"><b>${girlSnapshot.name}:</b> ${escapeHtml(narration)}</div></div>` : ''}
            ${result.generatedFilmId ? `<p class="small gold">Finalization film ${result.generatedFilmId} recorded and listed.</p>` : ''}
            <div class="dispose-final-image-slot" id="dispose-final-image">
              ${window.DMTHGame.imaging?.isAvailable() && window.DMTHGame.imaging.generateDisposalFinalImage
                ? '<div class="small muted">📷 generating final scene…</div>'
                : ''}
            </div>
            <div class="btn-row"><a href="#dashboard" class="btn-primary">← Dashboard</a></div>
          </div>`;
          el.innerHTML = resultHtml;

          // Generate + render the per-method final-scene image (async).
          // Methods covered: bury / lose-at-sea / incinerate / release / finalization-film.
          // `trade` doesn't generate an image (girl goes to slave market alive).
          const imgSlot = el.querySelector('#dispose-final-image');
          if (imgSlot && window.DMTHGame.imaging?.generateDisposalFinalImage) {
            try {
              const imgResult = await window.DMTHGame.imaging.generateDisposalFinalImage({ method, girl: girlSnapshot });
              if (imgResult?.url) {
                imgSlot.innerHTML = `<figure class="dispose-final-image">
                  <img src="${imgResult.url}" alt="${window.DMTHGame.disposal.METHODS[method].displayName} — ${girlSnapshot.name}" class="gen-img dispose-final-img" onerror="this.outerHTML='<div class=\\'small muted\\'>(image fetch blocked — <a href=\\'' + this.src + '\\' target=\\'_blank\\'>open in new tab</a>)</div>';" />
                  <figcaption class="small muted">${window.DMTHGame.disposal.METHODS[method].emoji} ${window.DMTHGame.disposal.METHODS[method].displayName} — final scene · ${girlSnapshot.name}</figcaption>
                </figure>`;
              } else {
                imgSlot.innerHTML = '';
              }
            } catch (err) {
              imgSlot.innerHTML = `<div class="small muted">(final image gen failed: ${err?.message || 'unknown'})</div>`;
            }
          }
        } catch (e) { alert(e.message); }
      };
    });
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  window.DMTHRouter.register('dispose', render);
})();
