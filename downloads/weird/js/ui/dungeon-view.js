// DUNGEON MASTER: THE HUNT — dungeon portfolio view. All owned hideouts + holds.

(function () {
  'use strict';

  function render(el) {
    const s = window.DMTHGame.state.current;
    const dungeons = s.dungeons;

    el.innerHTML = `
      <div class="panel">
        <h2>🏚️ Dungeon portfolio · ${dungeons.length}</h2>
        <p class="small muted">Predator hideouts. Hidden from prying eyes and ears.</p>
        ${dungeons.map(renderDungeon).join('')}
      </div>

      <div class="panel">
        <h2>Available hideouts to acquire</h2>
        ${window.DMTHAssets.DUNGEONS
          .filter(t => !dungeons.some(d => d.templateId === t.id))
          .map(t => {
            const tooltip = `${t.notes || ''}`.replace(/"/g, '&quot;');
            return `<div class="model-card" data-tooltip="${tooltip}">
              <div class="model-name">${t.emoji} ${t.displayName}</div>
              <div class="model-meta">
                <span data-tooltip="Purchase cost">$${t.cost.toLocaleString()}</span>
                <span data-tooltip="Number of captive holds this dungeon provides at base capacity">${t.roomSlots} hold${t.roomSlots === 1 ? '' : 's'}</span>
                <span data-tooltip="Isolation — how far from civilization. Higher = lower suspicion when transporting captives.">iso ${Math.round((t.isolation || 0.5) * 100)}%</span>
                <span data-tooltip="Concealment — how hidden from accidental discovery. Higher = lower escape-aftermath notoriety.">conc ${Math.round((t.concealment || 0.5) * 100)}%</span>
              </div>
              <div class="model-notes">${t.notes}</div>
              <div class="asset-slot" data-asset-category="dungeon" data-asset-id="${t.id}" data-asset-size="140"></div>
              <button class="btn-small ${s.wallet.money >= t.cost ? 'btn-primary' : ''}" data-buy="${t.id}" ${s.wallet.money < t.cost ? 'disabled' : ''} data-tooltip="${s.wallet.money < t.cost ? 'Need $' + t.cost.toLocaleString() + ' — earn more from films + properties.' : 'Buy this hideout. Adds ' + t.roomSlots + ' empty hold' + (t.roomSlots === 1 ? '' : 's') + ' to your portfolio.'}">
                ${s.wallet.money < t.cost ? 'Insufficient funds' : 'Acquire →'}
              </button>
            </div>`;
          }).join('')}
      </div>
    `;

    function renderDungeon(d) {
      const tpl = window.DMTHAssets.getById('dungeon', d.templateId);
      return `
        <div class="model-card">
          <div class="model-name">${tpl?.emoji || '⛓️'} ${tpl?.displayName || d.templateId} <span class="muted small">— ${d.locationDescriptor}</span></div>
          <div class="model-meta">
            <span data-tooltip="Filled holds / total capacity">${d.holds.filter(h => h.captiveGirlId).length}/${d.capacity} held</span>
            <a href="#upgrade?dungeon=${d.id}" class="btn-small" data-tooltip="Configure per-hold upgrade tracks (security / restraints / lights / toys / food / toilet / waterSupply / feedAutomation / bedding / entertainment / decor / climate) + buy more capacity.">⚙️ Upgrades + capacity</a>
          </div>
          <div class="hold-grid">
            ${d.holds.map((h, i) => {
              const g = h.captiveGirlId ? window.DMTHGame.state.getGirl(h.captiveGirlId) : null;
              return `<div class="hold-slot ${g ? 'filled' : 'empty'}" data-tooltip="${g ? g.name + ' — L' + g.bond.bondLevel + ' Stockholm rating, ' + g.archetypeTemplate + '. Click to enter her hold.' : 'Empty ' + h.holdType + ' hold. Assign a captive on successful hunt.'}">
                ${g
                  ? `<a href="#room?girl=${g.id}">${g.mood.moodEmoji} ${g.name} <span class="muted small">L${g.bond.bondLevel}</span></a>`
                  : `<span class="muted small">hold ${i+1} · empty · ${h.holdType}</span>`
                }
              </div>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    // Lazy-load any cover images dropped into asset folders
    if (window.DMTHAssetImg) window.DMTHAssetImg.decorate(el, 140);

    el.querySelectorAll('[data-buy]').forEach(b => {
      b.onclick = () => {
        const tplId = b.dataset.buy;
        const tpl = window.DMTHAssets.getById('dungeon', tplId);
        if (!window.DMTHGame.state.spendMoney(tpl.cost, `buy-dungeon:${tplId}`)) {
          alert('Insufficient funds'); return;
        }
        const id = 'dun_' + Date.now().toString(36);
        window.DMTHGame.state.addDungeon({
          id,
          templateId: tpl.id,
          displayName: tpl.displayName,
          capacity: tpl.roomSlots,
          holds: Array.from({ length: tpl.roomSlots }, (_, i) => ({
            id: `${id}_hold_${i}`, captiveGirlId: null, holdType: tpl.holdType, restraintStatus: 'standard',
            foodReserve: 0, waterReserve: 0
          })),
          locationDescriptor: locationForTemplate(tpl.id),
          purchasedAt: Date.now()
        });
        window.DMTHRouter.handle();
      };
    });
  }

  function locationForTemplate(tplId) {
    const map = {
      'hole-in-the-desert':   'a remote stretch of desert 2 hours east',
      'woods-container':       'deep pine forest off an abandoned logging road',
      'basement-hidden-room':  'an unremarkable single-family house at 1147 Oak',
      'subway-service-room':   'sealed corridor under Line 4',
      'sewer-tunnel-locked':   'Victorian-era tunnel system under the old district',
      'coldwar-bunker':        '80-acre wooded parcel, the old civil-defense site',
      'abandoned-mine-shaft':  'the Boulder Creek claim, deeded wilderness',
      'remote-compound':       'off-grid mountain acreage, 15mi from nearest neighbor',
      'underground-complex':   'purpose-built facility under your legitimate front'
    };
    return map[tplId] || 'unspecified location';
  }

  window.DMTHRouter.register('dungeon', render);
})();
