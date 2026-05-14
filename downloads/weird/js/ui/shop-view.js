// SEX SLAVE DUNGEON — shop page.

(function () {
  'use strict';

  const SUBCATS = ['blunt','sedation','restraint','containment','toys','drugs','food','dungeon-upgrade','consumables','utility','tech'];

  function render(el, params) {
    const subcat = params.sub || 'sedation';
    const s = window.SSDGame.state.current;
    const listings = window.SSDGame.shop.listingsBySubcategory(subcat);

    el.innerHTML = `
      <div class="panel">
        <h2>🛒 Shop</h2>
        <div class="tabs">
          ${SUBCATS.map(c => `<a href="#shop?sub=${c}" class="tab ${c === subcat ? 'active' : ''}">${c}</a>`).join('')}
        </div>
      </div>
      <div class="panel">
        <h2>${subcat}</h2>
        <div class="girl-grid">
          ${listings.map(it => {
            const have = s.inventory[it.id] || 0;
            const canAfford = s.wallet.money >= it.price;
            return `<div class="model-card">
              <div class="asset-slot" data-asset-category="item" data-asset-id="${it.id}" data-asset-size="80"></div>
              <div class="model-name">${it.emoji} ${it.displayName}</div>
              <div class="model-meta">
                <span>$${it.price.toLocaleString()}</span>
                <span>tier ${it.tier}</span>
                <span>have: ${have}</span>
              </div>
              <div class="model-notes small">${it.notes || ''}</div>
              <button class="btn-small ${canAfford ? 'btn-primary' : ''}" data-buy="${it.id}" ${canAfford ? '' : 'disabled'}>
                ${canAfford ? 'Buy' : 'Too poor'}
              </button>
              <button class="btn-small" data-buy5="${it.id}" ${s.wallet.money >= it.price * 5 ? '' : 'disabled'}>
                Buy ×5
              </button>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        try { window.SSDGame.shop.buy(b.dataset.buy, 1); window.SSDRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-buy5]').forEach(b => {
      b.onclick = () => {
        try { window.SSDGame.shop.buy(b.dataset.buy5, 5); window.SSDRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });

    // Asset images lazy-loaded (if any cover.png present in the folder)
    if (window.SSDAssetImg) window.SSDAssetImg.decorate(el, 80);
  }

  window.SSDRouter.register('shop', render);
})();
