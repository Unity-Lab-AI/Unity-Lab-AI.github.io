// DUNGEON MASTER: THE HUNT — dashboard page. Overview of everything.

(function () {
  'use strict';

  function render(el) {
    const s = window.DMTHGame.state.current;
    if (!s || !s.createdAt) {
      el.innerHTML = `<div class="panel"><h2>No game in progress</h2><button id="new-game-btn" class="btn-primary">New Game</button></div>`;
      el.querySelector('#new-game-btn').onclick = () => window.DMTHRouter.go('newgame');
      return;
    }

    const captives = s.roster.filter(g => g.encounterState === 'captive');
    const listedFilms = s.films.filter(f => f.status === 'listed').length;
    const soldFilms = s.films.filter(f => f.status === 'sold').length;
    const totalEarned = s.films.reduce((t, f) => f.saleRecord ? t + f.saleRecord.price : t, 0);

    el.innerHTML = `
      <div class="grid-2">
        <section class="panel" data-tooltip="Liquid cash on hand. Notoriety = total heat from the operation. Tick = elapsed game-time ticks.">
          <h2>💰 Treasury</h2>
          <div class="big-num">$${s.wallet.money.toLocaleString()}</div>
          <div class="sub">Notoriety: ${s.wallet.notoriety} · Tick: ${s.tickCount}</div>
        </section>
        <section class="panel" data-tooltip="Films auto-sell on tick. Listed = passive earners. Sold = closed sales. Total earned = lifetime payouts.">
          <h2>🎬 Film Market</h2>
          <div class="stat-row" data-tooltip="Films currently listed. Each pays per-tick passive income — they NEVER unlist unless you 💣 sell negatives.">Listed<b>${listedFilms}</b></div>
          <div class="stat-row" data-tooltip="Legacy sold count (pre-auto-sell). Auto-sell films stay listed.">Sold<b>${soldFilms}</b></div>
          <div class="stat-row" data-tooltip="Cumulative payouts from films across the entire save.">Total earned<b>$${totalEarned.toLocaleString()}</b></div>
          <a data-route="market" href="#market" class="btn-small" data-tooltip="Open the films market — list / sell-negatives / view passive income.">Open market →</a>
        </section>
        <section class="panel" data-tooltip="Captives in your operation across all dungeons.">
          <h2>🔗 Captives</h2>
          <div class="big-num">${captives.length}</div>
          <div class="sub">across ${s.dungeons.length} dungeon${s.dungeons.length === 1 ? '' : 's'}</div>
          <a data-route="roster" href="#roster" class="btn-small" data-tooltip="Full roster + disposal log + listings.">Roster →</a>
          <a data-route="dungeon" href="#dungeon" class="btn-small" data-tooltip="Dungeon portfolio + hold upgrades.">Dungeons →</a>
        </section>
        <section class="panel" data-tooltip="John inbox — upmarket clientele requesting specific rental gigs. Accept/reject per request.">
          <h2>📬 Propositioners</h2>
          <div class="stat-row" data-tooltip="Waiting for your review.">Inbox<b>${s.propositioners.inbox.length}</b></div>
          <div class="stat-row" data-tooltip="Currently being fulfilled by your girls.">Active<b>${s.propositioners.active.length}</b></div>
          <div class="stat-row" data-tooltip="Completed engagements — drove repeat-client reputation.">Completed<b>${s.propositioners.completed.length}</b></div>
          <a data-route="propositioners" href="#propositioners" class="btn-small" data-tooltip="Review inbox + manage active engagements.">Inbox →</a>
        </section>
      </div>

      <section class="panel">
        <h2>Quick actions</h2>
        <div class="btn-row">
          <a href="#town" class="btn-primary" data-tooltip="The map. Visit locations + own properties.">🌆 Town</a>
          <a href="#hunt" class="btn-small" data-tooltip="Pick a target + loadout. Run a 4-stage capture attempt.">🎯 Hunt</a>
          <a href="#shop" class="btn-small" data-tooltip="Buy tools, drugs, food, water, contraception, abortion supplies.">🛒 Shop</a>
          <a href="#slave-market" class="btn-small" data-tooltip="Buy/sell captives. Untrained cheap, trained premium.">⛓️ Slave market</a>
          <a href="#achievements" class="btn-small" data-tooltip="Unlocked milestones.">🏆 Achievements</a>
          ${window.DMTHGame.escapeRecovery && window.DMTHGame.escapeRecovery.recoverable().length > 0 ? `<a href="#escape-recovery" class="btn-small btn-danger" data-tooltip="Girls have escaped — recapture them before they alert authorities.">🏃 ${window.DMTHGame.escapeRecovery.recoverable().length} on the run</a>` : ''}
          ${captives.length > 0 ? `<a href="#room?girl=${captives[0].id}" class="btn-small" data-tooltip="Jump straight into ${captives[0].name}'s hold.">🚪 Enter ${captives[0].name}'s hold</a>` : ''}
        </div>
      </section>

      <section class="panel">
        <h2>Recent captives</h2>
        ${captives.length === 0
          ? `<p class="muted small">No captives. <a href="#hunt">Go hunt one.</a></p>`
          : `<div class="girl-grid">${captives.map(g => {
              const preg = g.pregnancy || {};
              const pregLight = preg.status === 'pregnant'
                ? `<span class="preg-light" title="🤰 Pregnant — gestation day ${preg.gestationDays}/280 (trimester ${preg.trimester})">🤰</span>`
                : preg.status === 'aborted' ? `<span class="preg-light" title="Pregnancy aborted (day ${preg.outcomeHistory?.slice(-1)[0]?.day || '?'})">⚪</span>`
                : preg.status === 'miscarried' ? `<span class="preg-light" title="Miscarried (complication)">🩸</span>`
                : preg.status === 'birthed' ? `<span class="preg-light" title="Birthed">🍼</span>`
                : preg.status === 'lost' ? `<span class="preg-light" title="Lost to authorities">🚨</span>`
                : '';
              return `<a class="girl-card" href="#room?girl=${g.id}">
                <div class="girl-emoji">${g.mood.moodEmoji}${pregLight}</div>
                <div class="girl-name">${g.name}${preg.status === 'pregnant' ? ' 🤰' : ''}</div>
                <div class="girl-meta">
                  <span>L${g.bond.bondLevel}</span>
                  <span>${g.archetypeTemplate}</span>
                  ${preg.status === 'pregnant' ? `<span class="muted small" title="gestation day ${preg.gestationDays}/280">T${preg.trimester}·d${preg.gestationDays}</span>` : ''}
                </div>
                <div class="bar"><div class="bar-fill" style="width:${Math.round(((g.bond.bondXP % 50) / 50) * 100)}%"></div></div>
              </a>`;
            }).join('')}</div>`
        }
      </section>
    `;

    // No listener cleanup needed for static anchors.
    const unsub = window.DMTHGame.state.onChange(() => {
      if (location.hash === '#dashboard' || location.hash === '') render(el);
    });
    return unsub;
  }

  window.DMTHRouter.register('dashboard', render);
})();
