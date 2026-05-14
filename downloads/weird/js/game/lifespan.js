// DUNGEON MASTER: THE HUNT — girl lifespan system.
// Days-captive tracking, physical/mental degradation from neglect, terminal states, slow game-time aging.

(function () {
  'use strict';

  const TICK_MS = 30_000;                        // matches tick.js interval
  const REAL_MS_PER_GAME_DAY = 30 * 60_000;       // 30 real minutes = 1 in-game day
  const AGING_REAL_MS_PER_GAME_YEAR = 30 * 24 * 60 * 60 * 1000; // slow — 30 real days = 1 in-game year

  // Lifespan states in order of severity
  const STATES = {
    healthy:    { label: '💚 Healthy',      penaltyPerTick: { bondDebt: 0 } },
    strained:   { label: '💛 Strained',     penaltyPerTick: { bondDebt: 1 } },
    breaking:   { label: '🟠 Breaking',     penaltyPerTick: { bondDebt: 2, bruises: 0.3 } },
    terminal:   { label: '🔴 Terminal',     penaltyPerTick: { bondDebt: 3, bruises: 0.5 } },
    'mentally-broken': { label: '💀 Mentally broken beyond repair', penaltyPerTick: { bondDebt: 5 } },
    'died-of-neglect': { label: '☠️ Died of neglect', penaltyPerTick: {} },
    'aged-out':        { label: '⏳ Aged out of usefulness', penaltyPerTick: {} }
  };

  // Compute days captive from captureDate
  function daysCaptive(girl) {
    if (!girl.captureDate) return 0;
    return Math.floor((Date.now() - girl.captureDate) / REAL_MS_PER_GAME_DAY);
  }

  // Compute current in-game age based on real-time elapsed since girl was created
  function currentAge(girl) {
    const ageOffset = girl.age || 22;
    if (!girl.captureDate) return ageOffset;
    const yearsElapsed = (Date.now() - girl.captureDate) / AGING_REAL_MS_PER_GAME_YEAR;
    return Math.floor(ageOffset + yearsElapsed);
  }

  // Lifespan state is DERIVED from body.health + body.stamina rather than tracked as a
  // separate scalar that drifted independently. The prior independent-scalar design showed
  // "Terminal" popups while the girl's HP bar still read 100% — the lifespan.score crashed
  // within ~20 ticks even when the player was feeding her and her body.health was untouched.
  //
  // New design: lifespan.state is a UX label for the composite body vital. body.health is
  // the authoritative number (drained by tickStaminaHealth in action-effects.js, restored
  // by heal/feed/water actions). Lifespan only labels it and applies soft per-state effects.
  function vitalScore(girl) {
    const health = girl.body?.health ?? 100;
    const stamina = girl.body?.stamina ?? 70;
    // 70% weight on health, 30% on stamina — stamina compounds neglect but doesn't dominate.
    return Math.round(health * 0.7 + stamina * 0.3);
  }

  // Kept as the public API for any caller that wanted a raw careScore — but now reflects
  // vital direction (positive = recovering, negative = strained). Caller code should
  // prefer `vitalScore` or the lifespan.score field directly.
  function careScore(girl) {
    const v = vitalScore(girl);
    // Map vital score to a small delta sign for legacy callers — same range as before.
    if (v >= 80) return 2;
    if (v >= 60) return 1;
    if (v >= 40) return 0;
    if (v >= 20) return -2;
    return -4;
  }

  // Evaluate lifespan state per girl — called every tick
  function evaluate(girl) {
    if (!girl || girl.encounterState !== 'captive') return null;
    let lifespan = girl.lifespan || { state: 'healthy', score: 100, ageAtCapture: girl.age || 22 };

    // State derives directly from body vital. No independent scalar drift.
    const v = vitalScore(girl);
    lifespan.score = v;

    const prev = lifespan.state;
    if      (v >= 60) lifespan.state = 'healthy';
    else if (v >= 40) lifespan.state = 'strained';
    else if (v >= 20) lifespan.state = 'breaking';
    else if (v > 0)   lifespan.state = 'terminal';
    else              lifespan.state = girl.bond?.bondLevel >= 5 ? 'mentally-broken' : 'died-of-neglect';

    // Terminal aging — very long captivity with low care
    const dc = daysCaptive(girl);
    if (dc > 365 && lifespan.score < 30) {
      lifespan.state = 'aged-out';
    }

    lifespan.daysCaptive = dc;
    lifespan.currentAge  = currentAge(girl);

    // Apply per-tick penalty
    const penalty = STATES[lifespan.state]?.penaltyPerTick || {};
    const patch = { lifespan };
    if (penalty.bondDebt) {
      patch.bond = { ...girl.bond, bondDebt: (girl.bond?.bondDebt || 0) + penalty.bondDebt };
    }
    if (penalty.bruises) {
      patch.body = { ...girl.body, bruises: Math.min(99, (girl.body?.bruises || 0) + Math.ceil(penalty.bruises)) };
    }

    // Terminal / dead → encounterState flip
    if (['died-of-neglect', 'mentally-broken', 'aged-out'].includes(lifespan.state)) {
      if (!girl.lifespan || girl.lifespan.state !== lifespan.state) {
        patch.encounterState = lifespan.state === 'mentally-broken' ? 'broken' : 'deceased';
        patch.deceasedAt = Date.now();
        patch.deceasedCause = lifespan.state;
        // Log to disposal ledger
        window.DMTHGame.state.addDisposal({
          girlId: girl.id,
          girlNameAtDisposal: girl.name,
          method: lifespan.state,
          dungeonId: girl.assignedDungeonId,
          disposalDate: Date.now(),
          notorietyImpact: 0,
          finalBondLevel: girl.bond?.bondLevel || 0,
          cause: lifespan.state
        });
        // Free the hold
        const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
        if (dungeon) {
          const newHolds = dungeon.holds.map(h => h.captiveGirlId === girl.id ? { ...h, captiveGirlId: null } : h);
          window.DMTHGame.state.updateDungeon(dungeon.id, { holds: newHolds });
        }
      }
    }

    window.DMTHGame.state.updateGirl(girl.id, patch);

    // Notify on state transitions
    if (prev !== lifespan.state && window.DMTHNotify) {
      window.DMTHNotify.show(`${girl.name}: ${STATES[lifespan.state].label}`, { type: lifespan.score < 30 ? 'error' : 'info' });
    }
    return lifespan;
  }

  function tickAll() {
    const s = window.DMTHGame.state.current;
    if (!s) return;
    for (const girl of s.roster || []) {
      if (girl.encounterState !== 'captive') continue;
      evaluate(girl);
    }
  }

  function describeLifespan(girl) {
    const ls = girl.lifespan || { state: 'healthy', score: 100 };
    const dc = ls.daysCaptive != null ? ls.daysCaptive : daysCaptive(girl);
    const age = ls.currentAge != null ? ls.currentAge : currentAge(girl);
    return {
      state: ls.state,
      label: STATES[ls.state]?.label || ls.state,
      score: ls.score,
      daysCaptive: dc,
      currentAge: age
    };
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.lifespan = Object.freeze({
    STATES, evaluate, tickAll, daysCaptive, currentAge, careScore, describeLifespan,
    TICK_MS, REAL_MS_PER_GAME_DAY, AGING_REAL_MS_PER_GAME_YEAR
  });
})();
