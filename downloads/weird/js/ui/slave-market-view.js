// DUNGEON MASTER: THE HUNT — slave market page.

(function () {
  'use strict';

  function render(el) {
    const s = window.DMTHGame.state.current;
    if (!s.slaveMarket.available || s.slaveMarket.available.length === 0) {
      window.DMTHGame.slaveMarket.refreshAvailable();
    }
    const listed = s.slaveMarket.listed.map(l => ({ ...l, girl: window.DMTHGame.state.getGirl(l.girlId) })).filter(x => x.girl);
    const available = s.slaveMarket.available;
    const sales = s.slaveMarket.recentSales.slice(-10).reverse();

    el.innerHTML = `
      <div class="panel">
        <h2>⛓️ Slave Market</h2>
        <div class="btn-row">
          <button id="refresh-market" class="btn-small" data-tooltip="Refresh the NPC listings. New procedurally-generated captives appear from other sellers.">Refresh listings</button>
        </div>
      </div>

      <div class="panel">
        <h2>Your listings (${listed.length})</h2>
        ${listed.length === 0 ? `<p class="muted small">You have nothing listed. List a girl from her room page.</p>` :
          `<div class="girl-grid">${listed.map(l => `
            <div class="girl-card" data-tooltip="${l.girl.name} listed for $${l.price.toLocaleString()}. Buyer-tick ticks her down to NPC buyers over time.">
              <div class="girl-emoji">${l.girl.mood.moodEmoji}</div>
              <div class="girl-name">${l.girl.name}</div>
              <div class="girl-meta"><span>L${l.girl.bond.bondLevel}</span><span>${l.girl.archetypeTemplate}</span></div>
              <div class="stat-row small" data-tooltip="Asking price. Scales with bond + stats + outfit + rarity."><span>Asking</span><b>$${l.price.toLocaleString()}</b></div>
              <button class="btn-small" data-unlist="${l.girl.id || l.girlId}" data-tooltip="Pull her off the market. She returns to your roster + assigned hold.">Unlist</button>
            </div>
          `).join('')}</div>`
        }
      </div>

      <div class="panel">
        <h2>Available from NPCs (${available.length})</h2>
        ${available.length === 0 ? `<p class="muted small">No listings right now.</p>` :
          `<div class="girl-grid">${available.map((l, idx) => `
            <div class="girl-card" data-tooltip="${(l.girl.backstoryFragment || '').replace(/"/g, '&quot;')}">
              <div class="girl-emoji">${l.girl.mood.moodEmoji}</div>
              <div class="girl-name">${l.girl.name} <span class="muted small">(${l.girl.age})</span></div>
              <div class="girl-meta"><span>L${l.girl.bond.bondLevel}</span><span>${l.girl.archetypeTemplate}</span></div>
              <div class="small muted">${l.girl.backstoryFragment}</div>
              <div class="stat-row small" data-tooltip="NPC selling her — different sellers have different rep + reliability"><span>Seller</span><b>${l.sellerId}</b></div>
              <div class="stat-row" data-tooltip="Purchase price"><span>Price</span><b>$${l.price.toLocaleString()}</b></div>
              <button class="btn-small ${s.wallet.money >= l.price ? 'btn-primary' : ''}" data-buy="${idx}" ${s.wallet.money >= l.price ? '' : 'disabled'} data-tooltip="${s.wallet.money >= l.price ? 'Buy her. Auto-assigns to first empty hold.' : 'Need $' + l.price.toLocaleString() + ' — earn more first.'}">
                ${s.wallet.money >= l.price ? 'Buy' : 'Too poor'}
              </button>
            </div>
          `).join('')}</div>`
        }
      </div>

      <div class="panel">
        <h2>Recent market activity (${sales.length})</h2>
        ${sales.length === 0 ? `<p class="muted small">No recent activity.</p>` :
          `<ul class="small">${sales.map(s => `
            <li>${new Date(s.at).toLocaleString()} — ${s.direction === 'bought' ? '🛒 Bought' : '💰 Sold'} <b>${s.girlName || s.girlId}</b> for $${s.price.toLocaleString()}</li>
          `).join('')}</ul>`
        }
      </div>
    `;

    el.querySelector('#refresh-market').onclick = () => { window.DMTHGame.slaveMarket.refreshAvailable(); window.DMTHRouter.handle(); };
    el.querySelectorAll('[data-unlist]').forEach(b => {
      b.onclick = () => { window.DMTHGame.slaveMarket.unlistForSale(b.dataset.unlist); window.DMTHRouter.handle(); };
    });
    el.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        try {
          const r = window.DMTHGame.slaveMarket.buyFromNpc(parseInt(b.dataset.buy, 10));
          alert(`Purchased. Escorted to hold ${r.holdIdx + 1}.`);
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });
  }

  window.DMTHRouter.register('slave-market', render);
})();
