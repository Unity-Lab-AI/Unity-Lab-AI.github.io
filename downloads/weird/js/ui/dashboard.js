// SEX SLAVE DUNGEON — dashboard page. Overview of everything.

(function () {
  'use strict';

  function render(el) {
    const s = window.SSDGame.state.current;
    if (!s || !s.createdAt) {
      el.innerHTML = `<div class="panel"><h2>No game in progress</h2><button id="new-game-btn" class="btn-primary">New Game</button></div>`;
      el.querySelector('#new-game-btn').onclick = () => window.SSDRouter.go('newgame');
      return;
    }

    const captives = s.roster.filter(g => g.encounterState === 'captive');
    const listedFilms = s.films.filter(f => f.status === 'listed').length;
    const soldFilms = s.films.filter(f => f.status === 'sold').length;
    const totalEarned = s.films.reduce((t, f) => f.saleRecord ? t + f.saleRecord.price : t, 0);

    el.innerHTML = `
      <div class="grid-2">
        <section class="panel">
          <h2>💰 Treasury</h2>
          <div class="big-num">$${s.wallet.money.toLocaleString()}</div>
          <div class="sub">Notoriety: ${s.wallet.notoriety} · Tick: ${s.tickCount}</div>
        </section>
        <section class="panel">
          <h2>🎬 Film Market</h2>
          <div class="stat-row"><span>Listed</span><b>${listedFilms}</b></div>
          <div class="stat-row"><span>Sold</span><b>${soldFilms}</b></div>
          <div class="stat-row"><span>Total earned</span><b>$${totalEarned.toLocaleString()}</b></div>
          <a data-route="market" href="#market" class="btn-small">Open market →</a>
        </section>
        <section class="panel">
          <h2>🔗 Captives</h2>
          <div class="big-num">${captives.length}</div>
          <div class="sub">across ${s.dungeons.length} dungeon${s.dungeons.length === 1 ? '' : 's'}</div>
          <a data-route="roster" href="#roster" class="btn-small">Roster →</a>
          <a data-route="dungeon" href="#dungeon" class="btn-small">Dungeons →</a>
        </section>
        <section class="panel">
          <h2>📬 Propositioners</h2>
          <div class="stat-row"><span>Inbox</span><b>${s.propositioners.inbox.length}</b></div>
          <div class="stat-row"><span>Active</span><b>${s.propositioners.active.length}</b></div>
          <div class="stat-row"><span>Completed</span><b>${s.propositioners.completed.length}</b></div>
          <a data-route="propositioners" href="#propositioners" class="btn-small">Inbox →</a>
        </section>
      </div>

      <section class="panel">
        <h2>Quick actions</h2>
        <div class="btn-row">
          <a href="#town" class="btn-primary">🌆 Town</a>
          <a href="#hunt" class="btn-small">🎯 Hunt</a>
          <a href="#shop" class="btn-small">🛒 Shop</a>
          <a href="#slave-market" class="btn-small">⛓️ Slave market</a>
          <a href="#achievements" class="btn-small">🏆 Achievements</a>
          ${window.SSDGame.escapeRecovery && window.SSDGame.escapeRecovery.recoverable().length > 0 ? `<a href="#escape-recovery" class="btn-small btn-danger">🏃 ${window.SSDGame.escapeRecovery.recoverable().length} on the run</a>` : ''}
          ${captives.length > 0 ? `<a href="#room?girl=${captives[0].id}" class="btn-small">🚪 Enter ${captives[0].name}'s hold</a>` : ''}
        </div>
      </section>

      <section class="panel">
        <h2>Recent captives</h2>
        ${captives.length === 0
          ? `<p class="muted small">No captives. <a href="#hunt">Go hunt one.</a></p>`
          : `<div class="girl-grid">${captives.map(g => `
              <a class="girl-card" href="#room?girl=${g.id}">
                <div class="girl-emoji">${g.mood.moodEmoji}</div>
                <div class="girl-name">${g.name}</div>
                <div class="girl-meta">
                  <span>L${g.bond.bondLevel}</span>
                  <span>${g.archetypeTemplate}</span>
                </div>
                <div class="bar"><div class="bar-fill" style="width:${Math.round(((g.bond.bondXP % 50) / 50) * 100)}%"></div></div>
              </a>`).join('')}</div>`
        }
      </section>
    `;

    // No listener cleanup needed for static anchors.
    const unsub = window.SSDGame.state.onChange(() => {
      if (location.hash === '#dashboard' || location.hash === '') render(el);
    });
    return unsub;
  }

  window.SSDRouter.register('dashboard', render);
})();
