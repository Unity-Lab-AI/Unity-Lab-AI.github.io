// SEX SLAVE DUNGEON — per-dungeon interior plot-grid page.

(function () {
  'use strict';

  function render(el, params) {
    const dungeonId = params.dungeon;
    const dungeon = window.SSDGame.state.getDungeon(dungeonId);
    if (!dungeon) { el.innerHTML = `<p>no such dungeon · <a href="#dungeon">Dungeons</a></p>`; return; }
    const tpl = window.SSDAssets.getById('dungeon', dungeon.templateId);
    const grid = window.SSDGame.dungeonPlot.buildGrid(dungeon);
    const money = window.SSDGame.state.current.wallet.money;

    el.innerHTML = `
      <div class="panel">
        <h2>${tpl?.emoji || '⛓️'} ${tpl?.displayName} — interior plot</h2>
        <p class="small muted">Hold cells auto-placed. Add facility slots where empty. Render the interior as a Pollinations image when you want.</p>
        <div class="btn-row">
          <a href="#upgrade?dungeon=${dungeonId}" class="btn-small">← upgrades</a>
        </div>
      </div>

      <div class="panel">
        <h2>Plot</h2>
        <div class="plot-grid" style="grid-template-columns: repeat(${grid.width}, 1fr);">
          ${grid.slots.map(s => slotHtml(s, dungeon, money)).join('')}
        </div>
      </div>

      <div class="panel">
        <h2>Add facility</h2>
        <div class="girl-grid">
          ${window.SSDGame.dungeonPlot.INTERIOR_ITEMS.filter(i => i.category === 'facility').map(f => `
            <div class="model-card">
              <div class="model-name">${f.emoji} ${f.displayName}</div>
              <div class="model-notes small">${f.promptTokens}</div>
              <div class="stat-row small"><span>Cost</span><b>$${f.cost.toLocaleString()}</b></div>
              <p class="small muted">Click an empty slot above first, then pick here.</p>
              <button class="btn-small ${money >= f.cost ? 'btn-primary' : ''}" data-add-facility="${f.id}" ${money >= f.cost ? '' : 'disabled'}>
                ${money >= f.cost ? 'Prepare' : 'Too poor'}
              </button>
            </div>
          `).join('')}
        </div>
        <div class="small muted" id="place-status"></div>
      </div>

      <div class="panel">
        <h2>Render dungeon interior</h2>
        <button id="render-btn" class="btn-small ${window.SSDGame.imaging.isAvailable() ? 'btn-primary' : ''}" ${window.SSDGame.imaging.isAvailable() ? '' : 'disabled'}>
          ${window.SSDGame.imaging.isAvailable() ? 'Render interior →' : 'Set Pollinations key first'}
        </button>
        <div id="dungeon-render-slot"></div>
      </div>
    `;

    // Click-to-prepare flow: select a facility template, then click an empty slot to place it.
    let preparedFacility = null;
    el.querySelectorAll('[data-add-facility]').forEach(b => {
      b.onclick = () => {
        preparedFacility = b.dataset.addFacility;
        el.querySelector('#place-status').textContent = `Prepared: ${preparedFacility}. Click an empty slot above to place.`;
      };
    });
    el.querySelectorAll('[data-empty-slot]').forEach(slotBtn => {
      slotBtn.onclick = () => {
        if (!preparedFacility) { alert('Pick a facility below first'); return; }
        const [x, y] = slotBtn.dataset.emptySlot.split(',').map(Number);
        try {
          window.SSDGame.dungeonPlot.placeFacility(dungeonId, x, y, preparedFacility);
          preparedFacility = null;
          window.SSDRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-remove-facility]').forEach(b => {
      b.onclick = () => {
        const [x, y] = b.dataset.removeFacility.split(',').map(Number);
        window.SSDGame.dungeonPlot.removeFacility(dungeonId, x, y);
        window.SSDRouter.handle();
      };
    });

    const renderBtn = el.querySelector('#render-btn');
    if (renderBtn) renderBtn.onclick = async () => {
      const slot = el.querySelector('#dungeon-render-slot');
      slot.innerHTML = `<p class="small muted">Generating interior image…</p>`;
      const prompt = window.SSDGame.dungeonPlot.renderPrompt(dungeon, grid);
      const hash = window.SSDGame.dungeonPlot.hashGrid(grid);
      const r = await window.SSDGame.imaging.renderEnvironment({ kind: `dungeon-${dungeonId}`, prompt, hash });
      if (r.url) slot.innerHTML = `<img src="${r.url}" alt="interior" class="gen-img" />${r.cached ? '<p class="small muted">cached</p>' : ''}`;
      else      slot.innerHTML = `<p class="small danger">render failed: ${r.error}</p>`;
    };
  }

  function slotHtml(s, dungeon, money) {
    if (!s.filled) {
      return `<button data-empty-slot="${s.x},${s.y}" class="plot-slot empty" style="grid-column:${s.x+1};grid-row:${s.y+1}">
        <div class="small muted">empty</div>
      </button>`;
    }
    if (s.category === 'room') {
      return `<a href="#upgrade?dungeon=${dungeon.id}&hold=${s.holdIdx}" class="plot-slot filled" style="grid-column:${s.x+1};grid-row:${s.y+1}">
        <div class="slot-emoji">${s.emoji}</div>
        <div class="slot-label">${s.label}</div>
      </a>`;
    }
    return `<div class="plot-slot filled" style="grid-column:${s.x+1};grid-row:${s.y+1}">
      <div class="slot-emoji">${s.emoji}</div>
      <div class="slot-label">${s.label}</div>
      <button class="btn-small" data-remove-facility="${s.x},${s.y}">Remove</button>
    </div>`;
  }

  window.SSDRouter.register('dungeon-plot', render);
})();
