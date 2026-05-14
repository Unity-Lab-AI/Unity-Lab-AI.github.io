// SEX SLAVE DUNGEON — balancing. Tuned curves for economy, bond XP, escape, notoriety.

(function () {
  'use strict';

  // Tunable curve constants — centralized so we can adjust in one place.
  const CURVES = {
    // Bond XP per-level — linear early, harder late. L0→L5 = 50 per; L5→L9 = accelerating.
    bondLevelXpRequired: [0, 50, 100, 150, 200, 250, 340, 450, 600, 800],

    // Notoriety slow decay per tick — game reduces heat slowly over time
    notorietyDecayPerTick: -0.5,   // stored as float, floored on display

    // Escape-roll base rate — per-girl per-tick chance to attempt (before containment roll)
    escapeBaseRate: 0.08,
    escapeMinThreshold: 0.02,

    // Market sale tick baseline
    marketSaleBaseChance: 0.25,

    // Propositioner arrival base chance per tick
    propositionerArrivalBase: 0.15
  };

  // Apply once at boot
  function applyBalancing() {
    const s = window.SSDGame.state.current;
    if (!s) return;
    if (s.tickCount < 2 && !s._balancingApplied) {
      window.SSDGame.state.addMoney(50, 'balancing:starter-bonus');
      s._balancingApplied = true;
      window.SSDGame.state.save();
    }
  }

  // Notoriety slow decay — called from tick
  function decayTick() {
    const s = window.SSDGame.state.current;
    if (!s) return;
    if (s.wallet.notoriety > 0) {
      // accumulate a fractional decay, apply when >= 1
      s._notorietyDrift = (s._notorietyDrift || 0) + Math.abs(CURVES.notorietyDecayPerTick);
      if (s._notorietyDrift >= 1) {
        const amount = Math.floor(s._notorietyDrift);
        s.wallet.notoriety = Math.max(0, s.wallet.notoriety - amount);
        s._notorietyDrift -= amount;
      }
    }
  }

  // Compute XP required for a given level (used by delta.js level-up check)
  function xpForLevel(level) {
    return CURVES.bondLevelXpRequired[Math.max(0, Math.min(9, level))];
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.balancing = Object.freeze({ applyBalancing, decayTick, xpForLevel, CURVES });
})();
