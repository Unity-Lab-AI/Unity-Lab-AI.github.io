// SEX SLAVE DUNGEON — roster page. All collected girls.

(function () {
  'use strict';

  function render(el) {
    const s = window.SSDGame.state.current;
    const roster = s.roster || [];
    const captives = roster.filter(g => g.encounterState === 'captive');
    const listed = roster.filter(g => s.slaveMarket.listed.some(l => l.girlId === g.id));
    const escaped = roster.filter(g => g.encounterState === 'escaped');

    el.innerHTML = `
      <div class="panel">
        <h2>📋 Roster · ${roster.length}</h2>
        <div class="tabs">
          <a href="#roster" class="tab active">Captives (${captives.length})</a>
          <a href="#roster?filter=listed" class="tab">Listed for sale (${listed.length})</a>
          <a href="#roster?filter=escaped" class="tab">Escaped (${escaped.length})</a>
        </div>
        <div class="girl-grid">
          ${(new URLSearchParams(location.hash.split('?')[1]).get('filter') === 'escaped' ? escaped
           : new URLSearchParams(location.hash.split('?')[1]).get('filter') === 'listed' ? listed
           : captives).map(renderCard).join('')}
        </div>
      </div>

      <div class="panel">
        <h2>Disposal log (${s.disposals.length})</h2>
        ${s.disposals.length === 0 ? `<p class="muted small">No disposals yet.</p>` :
          `<ul class="small">${s.disposals.slice(-10).reverse().map(d =>
            `<li>${new Date(d.disposalDate).toLocaleDateString()} — <b>${d.girlNameAtDisposal}</b> — ${d.method} — L${d.finalBondLevel}${d.generatedFilmId ? ' · film recorded' : ''} · +${d.notorietyImpact} notoriety</li>`
          ).join('')}</ul>`
        }
      </div>
    `;

    function renderCard(g) {
      const ls = window.SSDGame.lifespan ? window.SSDGame.lifespan.describeLifespan(g) : null;
      return `
        <a class="girl-card" href="#room?girl=${g.id}">
          <div class="girl-emoji">${g.mood.moodEmoji}</div>
          <div class="girl-name">${g.name}</div>
          <div class="girl-meta">
            <span>L${g.bond.bondLevel}</span>
            <span>${g.archetypeTemplate}</span>
            <span>🩸${g.body.bruises}</span>
            ${ls ? `<span>${ls.daysCaptive}d</span>` : ''}
          </div>
          ${ls ? `<div class="small muted">${ls.label}</div>` : ''}
          <div class="bar"><div class="bar-fill ${ls && ls.score < 30 ? 'danger' : ''}" style="width:${Math.round(((g.bond.bondXP % 50) / 50) * 100)}%"></div></div>
        </a>
      `;
    }
  }

  window.SSDRouter.register('roster', render);
})();
