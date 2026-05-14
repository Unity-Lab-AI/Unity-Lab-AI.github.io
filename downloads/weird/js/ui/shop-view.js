// DUNGEON MASTER: THE HUNT — shop page.

(function () {
  'use strict';

  const SUBCATS = ['blunt','sedation','restraint','containment','toys','drugs','food','dungeon-upgrade','consumables','utility','tech'];

  function render(el, params) {
    const subcat = params.sub || 'sedation';
    const s = window.DMTHGame.state.current;
    const listings = window.DMTHGame.shop.listingsBySubcategory(subcat);

    // Per-subcategory tooltip hints surfaced on the tab + per-item notes on the card.
    const SUBCAT_TOOLTIPS = {
      'blunt': 'Blunt-force tools — pipes etc. Cheap Approach + Subdue stage assist. Messy.',
      'sedation': 'Chemical subdue tools — rohypnol / chloroform / ether / ketamine / tranquilizer. Single-use per stage.',
      'restraint': 'Binding tools — handcuffs / shackles / harness. Multi-use, drive Secure stage.',
      'containment': 'Tape / rope / zip-ties. Single-use Secure-stage cheap binding.',
      'toys': 'In-room toys for sessions.',
      'drugs': 'Recreational drugs you administer in the dungeon — coke, weed, mdma, acid, whiskey.',
      'food': 'Food + water consumables for your captives.',
      'dungeon-upgrade': 'Static dungeon-template upgrades.',
      'consumables': 'Misc per-girl ongoing items.',
      'utility': 'Tools + supplies that don\'t fit the capture loop.',
      'tech': 'Cameras, recording gear, surveillance.',
      'contraception': 'Condoms + preventive items. Blocks pregnancy conception roll when in use.',
      'reproductive-medical': 'Plan-B / abortion pills / surgical kits / OB-GYN referrals. Each has a gestation-day window.'
    };
    el.innerHTML = `
      <div class="panel">
        <h2>🛒 Shop</h2>
        <div class="tabs">
          ${SUBCATS.map(c => `<a href="#shop?sub=${c}" class="tab ${c === subcat ? 'active' : ''}" data-tooltip="${SUBCAT_TOOLTIPS[c] || c}">${c}</a>`).join('')}
        </div>
      </div>
      <div class="panel">
        <h2>${subcat}</h2>
        <div class="girl-grid">
          ${listings.map(it => {
            const have = s.inventory[it.id] || 0;
            const canAfford = s.wallet.money >= it.price;
            const tooltip = (it.notes || it.displayName || '').replace(/"/g, '&quot;');
            return `<div class="model-card" data-tooltip="${tooltip}">
              <div class="asset-slot" data-asset-category="item" data-asset-id="${it.id}" data-asset-size="80"></div>
              <div class="model-name">${it.emoji} ${it.displayName}</div>
              <div class="model-meta">
                <span data-tooltip="Item cost in dollars">$${it.price.toLocaleString()}</span>
                <span data-tooltip="Item tier — higher = more powerful + more expensive">tier ${it.tier}</span>
                <span data-tooltip="Count currently in your inventory">have: ${have}</span>
              </div>
              <div class="model-notes small">${it.notes || ''}</div>
              <button class="btn-small ${canAfford ? 'btn-primary' : ''}" data-buy="${it.id}" ${canAfford ? '' : 'disabled'} data-tooltip="Buy one. Deducts $${it.price.toLocaleString()} from treasury.">
                ${canAfford ? 'Buy' : 'Too poor'}
              </button>
              <button class="btn-small" data-buy5="${it.id}" ${s.wallet.money >= it.price * 5 ? '' : 'disabled'} data-tooltip="Bulk buy ×5. Deducts $${(it.price * 5).toLocaleString()} from treasury.">
                Buy ×5
              </button>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        try { window.DMTHGame.shop.buy(b.dataset.buy, 1); window.DMTHRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });
    el.querySelectorAll('[data-buy5]').forEach(b => {
      b.onclick = () => {
        try { window.DMTHGame.shop.buy(b.dataset.buy5, 5); window.DMTHRouter.handle(); }
        catch (e) { alert(e.message); }
      };
    });

    // Asset images lazy-loaded (if any cover.png present in the folder)
    if (window.DMTHAssetImg) window.DMTHAssetImg.decorate(el, 80);
  }

  window.DMTHRouter.register('shop', render);
})();
