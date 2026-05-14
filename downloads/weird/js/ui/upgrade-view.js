// DUNGEON MASTER: THE HUNT — per-hold upgrade + per-dungeon capacity expansion view.

(function () {
  'use strict';

  function render(el, params) {
    const dungeonId = params.dungeon;
    const dungeon = window.DMTHGame.state.getDungeon(dungeonId);
    if (!dungeon) { el.innerHTML = `<p>no such dungeon · <a href="#dungeon">Dungeons</a></p>`; return; }
    const tpl = window.DMTHAssets.getById('dungeon', dungeon.templateId);
    const holdIdx = params.hold != null ? parseInt(params.hold, 10) : null;

    if (holdIdx == null) return renderDungeonOverview(el, dungeon, tpl);
    return renderHoldUpgrades(el, dungeon, tpl, holdIdx);
  }

  function renderDungeonOverview(el, dungeon, tpl) {
    const next = window.DMTHGame.dungeonOps.nextCapacityUpgrade(dungeon);
    const money = window.DMTHGame.state.current.wallet.money;

    el.innerHTML = `
      <div class="panel">
        <h2>${tpl?.emoji || '⛓️'} ${tpl?.displayName || dungeon.templateId} — upgrades</h2>
        <p class="small muted">${dungeon.locationDescriptor}</p>
        <div class="stat-row"><span>Capacity</span><b>${dungeon.holds.filter(h=>h.captiveGirlId).length}/${dungeon.capacity}</b></div>
        <div class="btn-row">
          <a href="#dungeon" class="btn-small">← portfolio</a>
          <a href="#dungeon-plot?dungeon=${dungeon.id}" class="btn-small">🗺️ Interior plot</a>
        </div>
      </div>

      <div class="panel">
        <h2>Capacity expansion</h2>
        ${next
          ? `<div class="model-card">
              <div class="model-name">Expand: ${next.atSlots} holds</div>
              <div class="model-notes small">${next.describedAs}</div>
              <div class="stat-row"><span>Cost</span><b>$${next.cost.toLocaleString()}</b></div>
              <button id="expand-btn" class="btn-small ${money >= next.cost ? 'btn-primary' : ''}" ${money >= next.cost ? '' : 'disabled'}>
                ${money >= next.cost ? 'Expand capacity' : 'Insufficient funds'}
              </button>
            </div>`
          : `<p class="muted small">This hideout is at max capacity for its template. Acquire a larger template to hold more.</p>`
        }
      </div>

      <div class="panel">
        <h2>Per-hold upgrade tracks</h2>
        <p class="small">Click a hold to open its 10-track upgrade panel.</p>
        <div class="hold-grid">
          ${dungeon.holds.map((h, i) => {
            const g = h.captiveGirlId ? window.DMTHGame.state.getGirl(h.captiveGirlId) : null;
            const totalTiers = Object.values(h.upgrades || {}).reduce((s, v) => s + v, 0);
            return `<a class="hold-slot ${g ? 'filled' : 'empty'}" href="#upgrade?dungeon=${dungeon.id}&hold=${i}">
              <div><b>Hold ${i+1}</b> · ${h.holdType}</div>
              <div class="small muted">${g ? `${g.mood.moodEmoji} ${g.name}` : 'empty'}</div>
              <div class="small">Upgrades: ${totalTiers}</div>
            </a>`;
          }).join('')}
        </div>
      </div>
    `;

    const expandBtn = el.querySelector('#expand-btn');
    if (expandBtn) {
      expandBtn.onclick = () => {
        try {
          const r = window.DMTHGame.dungeonOps.expandCapacity(dungeon.id);
          alert(`Expanded to ${r.newCapacity} holds. "${r.note}"`);
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    }
  }

  function renderHoldUpgrades(el, dungeon, tpl, holdIdx) {
    const hold = dungeon.holds[holdIdx];
    if (!hold) { el.innerHTML = `<p>no such hold · <a href="#upgrade?dungeon=${dungeon.id}">back</a></p>`; return; }
    const money = window.DMTHGame.state.current.wallet.money;
    const occupant = hold.captiveGirlId ? window.DMTHGame.state.getGirl(hold.captiveGirlId) : null;

    el.innerHTML = `
      <div class="panel">
        <h2>Hold ${holdIdx + 1} · ${tpl?.emoji || '⛓️'} ${tpl?.displayName}</h2>
        <p class="small muted">Type: ${hold.holdType} · ${hold.expansionNote || ''}</p>
        ${occupant ? `<p>Occupant: <a href="#room?girl=${occupant.id}">${occupant.mood.moodEmoji} ${occupant.name}</a></p>` : `<p class="small muted">Empty</p>`}
        <a href="#upgrade?dungeon=${dungeon.id}" class="btn-small">← back to dungeon</a>
      </div>

      <div class="panel">
        <h2>Upgrade tracks</h2>
        <div class="upgrade-grid">
          ${Object.entries(window.DMTHGame.dungeonOps.UPGRADE_TRACKS).map(([key, track]) => {
            const tier = window.DMTHGame.dungeonOps.getUpgradeLevel(hold, key);
            const atMax = tier >= track.maxTier;
            const nextCost = atMax ? 0 : track.tierCosts[tier + 1];
            const canAfford = money >= nextCost;
            return `<div class="upgrade-track">
              <div class="track-label">${track.label}</div>
              <div class="track-current">Tier ${tier}/${track.maxTier} — <i>${track.tierNames[tier]}</i></div>
              ${atMax
                ? `<div class="small gold">MAX TIER</div>`
                : `<div class="track-next">Next: <i>${track.tierNames[tier + 1]}</i> — $${nextCost.toLocaleString()}</div>
                   <button class="btn-small ${canAfford ? 'btn-primary' : ''}" data-upgrade="${key}" ${canAfford ? '' : 'disabled'}>
                     ${canAfford ? 'Upgrade' : 'Too poor'}
                   </button>`
              }
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelectorAll('[data-upgrade]').forEach(b => {
      b.onclick = () => {
        try {
          const r = window.DMTHGame.dungeonOps.upgrade(dungeon.id, holdIdx, b.dataset.upgrade);
          window.DMTHRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });
  }

  window.DMTHRouter.register('upgrade', render);
})();
