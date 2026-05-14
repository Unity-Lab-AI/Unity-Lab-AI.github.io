// SEX SLAVE DUNGEON — wardrobe page. Buy outfits, equip/unequip per girl.

(function () {
  'use strict';

  function render(el, params) {
    const girlId = params.girl;
    const girl = window.SSDGame.state.getGirl(girlId);
    if (!girl) { el.innerHTML = `<p>no such girl · <a href="#roster">Roster</a></p>`; return; }
    const money = window.SSDGame.state.current.wallet.money;
    const owned = new Set((girl.wardrobe || []).map(w => w.id));

    const isNude = girl.currentOutfit === 'nude';
    el.innerHTML = `
      <div class="panel">
        <h2>👗 ${girl.name}'s wardrobe</h2>
        <p class="small muted">Currently wearing: <b>${(girl.wardrobe || []).find(w => w.id === girl.currentOutfit)?.displayName || 'default'}</b></p>
        <div class="btn-row">
          <a href="#room?girl=${girl.id}" class="btn-small">← back to her hold</a>
          <button class="btn-small ${isNude ? '' : 'btn-primary'}" data-derobe>${isNude ? '👗 Re-dress (default outfit)' : '🍑 Derobe — strip her fully nude'}</button>
        </div>
        <p class="small muted" style="margin-top:8px">
          Derobe puts <code>nude</code> at position 2 of the image prompt — front-loaded so Pollinations
          can't bury it as a one-word tail token. Outfit description is suppressed entirely. Free, always available.
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
          ${window.SSDGame.wardrobe.catalog().map(o => {
            const isOwned = owned.has(o.id);
            return `<div class="model-card">
              <div class="model-name">${o.emoji} ${o.displayName}</div>
              <div class="model-notes small">${o.description}</div>
              <div class="model-meta">
                <span>$${o.price}</span>
                <span>tier ${o.tier}</span>
                <span>×${o.multiplier} film value</span>
                <span class="muted">${o.roleplay}</span>
              </div>
              ${isOwned
                ? `<div class="small gold">Already owns</div>`
                : `<button class="btn-small ${money >= o.price ? 'btn-primary' : ''}" data-buy="${o.id}" ${money >= o.price ? '' : 'disabled'}>
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
        try { window.SSDGame.wardrobe.buyForGirl(girl.id, b.dataset.buy); window.SSDRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-equip]').forEach(b => {
      b.onclick = () => {
        try { window.SSDGame.wardrobe.equip(girl.id, b.dataset.equip); window.SSDRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    const derobeBtn = el.querySelector('[data-derobe]');
    if (derobeBtn) {
      derobeBtn.onclick = () => {
        try {
          if (girl.currentOutfit === 'nude') {
            window.SSDGame.wardrobe.equip(girl.id, 'default');
          } else {
            window.SSDGame.wardrobe.derobe(girl.id);
          }
          window.SSDRouter.handle();
        } catch (e) { alert(e.message); }
      };
    }
  }

  window.SSDRouter.register('wardrobe', render);
})();
