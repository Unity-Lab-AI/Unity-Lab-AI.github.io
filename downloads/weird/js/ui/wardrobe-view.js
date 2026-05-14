// DUNGEON MASTER: THE HUNT — wardrobe page. Buy outfits, equip/unequip per girl.

(function () {
  'use strict';

  function render(el, params) {
    const girlId = params.girl;
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) { el.innerHTML = `<p>no such girl · <a href="#roster">Roster</a></p>`; return; }
    const money = window.DMTHGame.state.current.wallet.money;
    const owned = new Set((girl.wardrobe || []).map(w => w.id));

    const isNude = girl.currentOutfit === 'nude';
    const isStripped = girl.currentOutfit === 'none';
    const currentWear = (girl.wardrobe || []).find(w => w.id === girl.currentOutfit);
    const capturedEntry = (girl.wardrobe || []).find(w => w.source === 'captured-with');
    el.innerHTML = `
      <div class="panel">
        <h2>👗 ${girl.name}'s wardrobe</h2>
        <p class="small muted">Currently wearing: <b>${currentWear?.displayName || 'default'}</b>${currentWear?.source === 'captured-with' ? ' <span class="small">(her captured-at outfit)</span>' : ''}</p>
        ${capturedEntry?.description ? `<p class="small muted">📸 <b>Captured wearing:</b> ${capturedEntry.description}</p>` : ''}
        <div class="btn-row">
          <a href="#room?girl=${girl.id}" class="btn-small">← back to her hold</a>
          <button class="btn-small ${isNude ? '' : 'btn-primary'}" data-derobe>${isNude ? '👗 Re-dress (her captured-at outfit)' : '🍑 Derobe — strip her fully nude'}</button>
          <button class="btn-small ${isStripped ? '' : 'btn-danger'}" data-strip-all>${isStripped ? '👗 Re-dress (her captured-at outfit)' : '🚫 Strip everything — no accessories'}</button>
        </div>
        <p class="small muted" style="margin-top:8px">
          <b>🍑 Derobe</b> puts <code>nude</code> at position 2 of the image prompt — accessories (collars, cuffs, harnesses) still allowed if equipped.<br>
          <b>🚫 Strip everything</b> is more aggressive — bans accessories, jewelry, collars, restraints. Raw nakedness, no body adornment whatsoever.<br>
          <b>👗 Re-dress</b> restores her captured-at outfit (the clothes she was wearing when taken). Both strip options free + always available.
        </p>
      </div>

      <div class="panel">
        <h2>Owned</h2>
        <div class="girl-grid">
          ${(girl.wardrobe || []).map(w => `
            <div class="model-card ${w.id === girl.currentOutfit ? 'active' : ''}">
              <div class="model-name">${w.displayName}</div>
              <div class="model-notes small">${w.description}</div>
              ${w.id === girl.currentOutfit
                ? `<div class="small gold">EQUIPPED</div>`
                : `<button class="btn-small" data-equip="${w.id}">Equip</button>`
              }
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel">
        <h2>Buy for her</h2>
        <div class="girl-grid">
          ${window.DMTHGame.wardrobe.catalog().map(o => {
            const isOwned = owned.has(o.id);
            const cardTip = (o.description || '').replace(/"/g, '&quot;');
            return `<div class="model-card" data-tooltip="${cardTip}">
              <div class="model-name">${o.emoji} ${o.displayName}</div>
              <div class="model-notes small">${o.description}</div>
              <div class="model-meta">
                <span data-tooltip="Purchase cost in dollars">$${o.price}</span>
                <span data-tooltip="Outfit tier — higher tier = more elaborate, costlier, bigger film-value multiplier">tier ${o.tier}</span>
                <span data-tooltip="Multiplies film sale price when she's wearing this outfit during recording">×${o.multiplier} film value</span>
                <span class="muted" data-tooltip="Roleplay flavor — informs Ollama scene composition">${o.roleplay}</span>
              </div>
              ${isOwned
                ? `<div class="small gold" data-tooltip="She owns this. Equip via the card in 'Owned' section above.">Already owns</div>`
                : `<button class="btn-small ${money >= o.price ? 'btn-primary' : ''}" data-buy="${o.id}" ${money >= o.price ? '' : 'disabled'} data-tooltip="Buy this outfit + add it to her wardrobe. Then equip via the 'Owned' card.">
                     ${money >= o.price ? 'Buy + add to wardrobe' : 'Too poor'}
                   </button>`
              }
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        try { window.DMTHGame.wardrobe.buyForGirl(girl.id, b.dataset.buy); window.DMTHRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-equip]').forEach(b => {
      b.onclick = () => {
        try { window.DMTHGame.wardrobe.equip(girl.id, b.dataset.equip); window.DMTHRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    const derobeBtn = el.querySelector('[data-derobe]');
    if (derobeBtn) {
      derobeBtn.onclick = () => {
        try {
          if (girl.currentOutfit === 'nude') {
            window.DMTHGame.wardrobe.equip(girl.id, 'default');
          } else {
            window.DMTHGame.wardrobe.derobe(girl.id);
          }
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    }
    const stripAllBtn = el.querySelector('[data-strip-all]');
    if (stripAllBtn) {
      stripAllBtn.onclick = () => {
        try {
          if (girl.currentOutfit === 'none') {
            window.DMTHGame.wardrobe.equip(girl.id, 'default');
          } else {
            window.DMTHGame.wardrobe.stripEverything(girl.id);
          }
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    }
  }

  window.DMTHRouter.register('wardrobe', render);
})();
