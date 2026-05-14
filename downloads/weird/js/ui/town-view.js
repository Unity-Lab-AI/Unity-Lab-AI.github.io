// DUNGEON MASTER: THE HUNT — town plot-grid page. Hunt locations only — you VISIT to hunt, you don't buy.

(function () {
  'use strict';

  function render(el) {
    const grid = window.DMTHGame.townPlot.buildGrid();

    el.innerHTML = `
      <div class="panel">
        <h2>🌆 Town</h2>
        <p class="small muted">Click any location to visit and hunt the girls available there. Each location spawns different archetypes at different difficulty levels.</p>
        <div class="stat-row small" data-tooltip="Cumulative heat from your operation. Higher = harder spawns, lower capture odds, more cop interest."><span>Notoriety</span><b>${window.DMTHGame.state.current.wallet.notoriety}</b>
          <span class="muted">(affects spawns + acquire odds)</span></div>
      </div>

      <div class="panel">
        <div class="plot-grid" style="grid-template-columns: repeat(${grid.width}, 1fr);">
          ${grid.slots.map(s => slotHtml(s)).join('')}
        </div>
      </div>

      <div class="panel">
        <h2>Render town</h2>
        <p class="small muted">Generate a full-res Pollinations image of the town layout.</p>
        <button id="render-btn" class="btn-small btn-primary" data-tooltip="Pollinations renders the full town grid as a single overhead image. Hash-cached so repeat clicks reuse the cached image until you change slots.">Render town →</button>
        <div id="town-render-slot"></div>
      </div>
    `;

    // Wire visit buttons — clicking the slot or the Visit button both navigate
    el.querySelectorAll('[data-visit]').forEach(b => {
      b.onclick = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        window.DMTHRouter.go('hunt', { stage: 'location', loc: b.dataset.visit });
      };
    });

    // Lazy-load cover images (if dropped into assets/locations/<id>/cover.*)
    if (window.DMTHAssetImg) window.DMTHAssetImg.decorate(el, 64);

    const renderBtn = el.querySelector('#render-btn');
    renderBtn.onclick = async () => {
      const slot = el.querySelector('#town-render-slot');
      slot.innerHTML = `<p class="small muted">Generating town image…</p>`;
      const prompt = window.DMTHGame.townPlot.renderPrompt(grid);
      const hash = window.DMTHGame.townPlot.hashGrid(grid);
      const r = await window.DMTHGame.imaging.renderEnvironment({ kind: 'town', prompt, hash });
      if (r.url) {
        const hint = r.directUrl ? ' (direct — may fail on content filter)' : r.cached ? ' (cached)' : '';
        slot.innerHTML = `<img src="${r.url}" alt="town" class="gen-img" onerror="this.outerHTML='<p class=\\'small danger\\'>image load failed — Pollinations likely content-filtered this render. Try again with different slots or get a pk_ key.</p>'" /><p class="small muted">${hint}</p>`;
      } else {
        slot.innerHTML = `<p class="small danger">Render failed: ${r.error || 'unknown'}</p>`;
      }
    };
  }

  function slotHtml(s) {
    if (!s.filled) {
      return `<div class="plot-slot empty" style="grid-column:${s.x+1};grid-row:${s.y+1}">
        <div class="small muted">—</div>
      </div>`;
    }
    const diff = s.subcategory === 'easy' ? '🟢' : s.subcategory === 'medium' ? '🟡' : '🔴';
    const tip = `${s.label} — ${s.subcategory} difficulty. Click to visit + hunt girls who spawn here.`;
    return `
      <button class="plot-slot filled" data-visit="${s.itemId}" style="grid-column:${s.x+1};grid-row:${s.y+1}" data-tooltip="${tip}">
        <div class="asset-slot slot-emoji" data-asset-category="location" data-asset-id="${s.itemId}" data-asset-size="64">${s.emoji}</div>
        <div class="slot-label">${s.label}</div>
        <div class="slot-meta">${diff} ${s.subcategory}</div>
      </button>
    `;
  }

  window.DMTHRouter.register('town', render);
})();
