// SEX SLAVE DUNGEON — slave market page.

(function () {
  'use strict';

  function render(el) {
    const s = window.SSDGame.state.current;
    if (!s.slaveMarket.available || s.slaveMarket.available.length === 0) {
      window.SSDGame.slaveMarket.refreshAvailable();
    }
    const listed = s.slaveMarket.listed.map(l => ({ ...l, girl: window.SSDGame.state.getGirl(l.girlId) })).filter(x => x.girl);
    const available = s.slaveMarket.available;
    const sales = s.slaveMarket.recentSales.slice(-10).reverse();

    el.innerHTML = `
      <div class="panel">
        <h2>⛓️ Slave Market</h2>
        <div class="btn-row">
          <button id="refresh-market" class="btn-small">Refresh listings</button>
        </div>
      </div>

      <div class="panel">
        <h2>Your listings (${listed.length})</h2>
        ${listed.length === 0 ? `<p class="muted small">You have nothing listed. List a girl from her room page.</p>` :
          `<div class="girl-grid">${listed.map(l => `
            <div class="girl-card">
              <div class="girl-emoji">${l.girl.mood.moodEmoji}</div>
              <div class="girl-name">${l.girl.name}</div>
              <div class="girl-meta"><span>L${l.girl.bond.bondLevel}</span><span>${l.girl.archetypeTemplate}</span></div>
              <div class="stat-row small"><span>Asking</span><b>$${l.price.toLocaleString()}</b></div>
              <button class="btn-small" data-unlist="${l.girlId}">Unlist</button>
            </div>
          `).join('')}</div>`
        }
      </div>

      <div class="panel">
        <h2>Available from NPCs (${available.length})</h2>
        ${available.length === 0 ? `<p class="muted small">No listings right now.</p>` :
          `<div class="girl-grid">${available.map((l, idx) => `
            <div class="girl-card">
              <div class="girl-emoji">${l.girl.mood.moodEmoji}</div>
              <div class="girl-name">${l.girl.name} <span class="muted small">(${l.girl.age})</span></div>
              <div class="girl-meta"><span>L${l.girl.bond.bondLevel}</span><span>${l.girl.archetypeTemplate}</span></div>
              <div class="small muted">${l.girl.backstoryFragment}</div>
              <div class="stat-row small"><span>Seller</span><b>${l.sellerId}</b></div>
              <div class="stat-row"><span>Price</span><b>$${l.price.toLocaleString()}</b></div>
              <button class="btn-small ${s.wallet.money >= l.price ? 'btn-primary' : ''}" data-buy="${idx}" ${s.wallet.money >= l.price ? '' : 'disabled'}>
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

    el.querySelector('#refresh-market').onclick = () => { window.SSDGame.slaveMarket.refreshAvailable(); window.SSDRouter.handle(); };
    el.querySelectorAll('[data-unlist]').forEach(b => {
      b.onclick = () => { window.SSDGame.slaveMarket.unlistForSale(b.dataset.unlist); window.SSDRouter.handle(); };
    });
    el.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        try {
          const r = window.SSDGame.slaveMarket.buyFromNpc(parseInt(b.dataset.buy, 10));
          alert(`Purchased. Escorted to hold ${r.holdIdx + 1}.`);
          window.SSDRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });
  }

  window.SSDRouter.register('slave-market', render);
})();
