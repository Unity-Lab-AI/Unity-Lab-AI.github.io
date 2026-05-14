// SEX SLAVE DUNGEON — dungeon ops: room upgrades + capacity expansions.
// Wires the 10 per-room upgrade tracks + the per-dungeon capacityUpgrades chain.

(function () {
  'use strict';

  // Per-room 10-track upgrade definitions with per-tier costs.
  const UPGRADE_TRACKS = {
    security:      { label: '🔒 Security',       maxTier: 4, tierCosts: [0, 60,  250, 800, 2400], tierNames: ['basic latch','deadbolt','steel+combo','biometric','vault-grade'] },
    restraints:    { label: '⛓️ Restraints',      maxTier: 5, tierCosts: [0, 80,  220, 600, 1400, 3000], tierNames: ['bare','floor ring + chain','bed cuffs','full harness rig','wall spread-eagle rig','institution-grade'] },
    lights:        { label: '💡 Lights',          maxTier: 4, tierCosts: [0, 20,  80,  220, 600], tierNames: ['bare bulb','warm lamp','dimmable LED','mood LED strips','theatrical'] },
    toys:          { label: '🧸 Toys',            maxTier: 4, tierCosts: [0, 60,  200, 600, 1500], tierNames: ['empty drawer','basic','varied chest','deluxe kit','institution-grade'] },
    food:          { label: '🍱 Food quality',    maxTier: 4, tierCosts: [0, 30,  100, 300, 800], tierNames: ['slop','basic meals','varied','gourmet','whatever-she-wants'] },
    toilet:        { label: '🚽 Toilet',           maxTier: 2, tierCosts: [0, 45, 300], tierNames: ['can','bucket','full plumbing'] },
    bedding:       { label: '🛏️ Bedding',         maxTier: 4, tierCosts: [0, 20, 100, 300, 700], tierNames: ['bare floor','foam mat','mattress','real bed','canopy bed'] },
    entertainment: { label: '📺 Entertainment',   maxTier: 4, tierCosts: [0, 40, 180, 400, 900], tierNames: ['none','radio','TV','screen + library','full streaming'] },
    decor:         { label: '🎨 Decor',            maxTier: 4, tierCosts: [0, 30, 120, 400, 1000], tierNames: ['bare concrete','minimal','themed','luxury','fetish-themed'] },
    climate:       { label: '🌡️ Climate',         maxTier: 3, tierCosts: [0, 40, 180, 500], tierNames: ['none','fan','AC','full climate control'] }
  };

  function getHold(dungeonId, holdIdx) {
    const d = window.SSDGame.state.getDungeon(dungeonId);
    if (!d) throw new Error('no such dungeon');
    const h = d.holds[holdIdx];
    if (!h) throw new Error('no such hold');
    return { dungeon: d, hold: h };
  }

  function getUpgradeLevel(hold, trackKey) {
    return hold.upgrades?.[trackKey] || 0;
  }

  function upgrade(dungeonId, holdIdx, trackKey) {
    const track = UPGRADE_TRACKS[trackKey];
    if (!track) throw new Error('unknown track: ' + trackKey);
    const { dungeon, hold } = getHold(dungeonId, holdIdx);
    const currentTier = getUpgradeLevel(hold, trackKey);
    if (currentTier >= track.maxTier) throw new Error('already at max');
    const nextTier = currentTier + 1;
    const cost = track.tierCosts[nextTier];

    const ok = window.SSDGame.state.spendMoney(cost, `upgrade:${trackKey}:${dungeonId}:${holdIdx}:L${nextTier}`);
    if (!ok) throw new Error('insufficient funds');

    const newHolds = dungeon.holds.slice();
    newHolds[holdIdx] = {
      ...hold,
      upgrades: { ...(hold.upgrades || {}), [trackKey]: nextTier }
    };
    window.SSDGame.state.updateDungeon(dungeonId, { holds: newHolds });
    return { ok: true, track: trackKey, newTier: nextTier, cost };
  }

  // --- Capacity expansion (T27.5) ---
  function nextCapacityUpgrade(dungeon) {
    const tpl = window.SSDAssets.getById('dungeon', dungeon.templateId);
    if (!tpl || !Array.isArray(tpl.capacityUpgrades)) return null;
    return tpl.capacityUpgrades.find(u => u.atSlots > dungeon.capacity) || null;
  }

  function expandCapacity(dungeonId) {
    const dungeon = window.SSDGame.state.getDungeon(dungeonId);
    if (!dungeon) throw new Error('no such dungeon');
    const next = nextCapacityUpgrade(dungeon);
    if (!next) throw new Error('dungeon already at max capacity for this template');
    const ok = window.SSDGame.state.spendMoney(next.cost, `expand-capacity:${dungeonId}:${next.atSlots}`);
    if (!ok) throw new Error('insufficient funds');

    const tpl = window.SSDAssets.getById('dungeon', dungeon.templateId);
    const newHolds = dungeon.holds.slice();
    while (newHolds.length < next.atSlots) {
      newHolds.push({
        id: `${dungeonId}_hold_${newHolds.length}`,
        captiveGirlId: null,
        holdType: tpl.holdType,
        restraintStatus: 'standard',
        upgrades: {},
        expansionNote: next.describedAs
      });
    }
    window.SSDGame.state.updateDungeon(dungeonId, {
      capacity: next.atSlots,
      holds: newHolds,
      lastExpansion: { at: next.atSlots, cost: next.cost, describedAs: next.describedAs, ts: Date.now() }
    });
    return { ok: true, newCapacity: next.atSlots, cost: next.cost, note: next.describedAs };
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.dungeonOps = Object.freeze({
    UPGRADE_TRACKS, getUpgradeLevel, upgrade,
    nextCapacityUpgrade, expandCapacity
  });
})();
