// DUNGEON MASTER: THE HUNT — escape recovery system.
// Escaped girls appear as special "on the run" encounters. Timer before they're gone forever.

(function () {
  'use strict';

  const RECOVERY_WINDOW_MS = 3 * 60 * 60 * 1000;   // 3 hours real-time to catch her

  // List current escaped girls that are still recoverable
  function recoverable() {
    const s = window.DMTHGame.state.current;
    const now = Date.now();
    return (s.roster || []).filter(g => {
      if (g.encounterState !== 'escaped') return false;
      const escapedAt = g.escape?.lastAttempt?.ts || now;
      return (now - escapedAt) < RECOVERY_WINDOW_MS;
    });
  }

  // Timer remaining for a girl
  function timeRemaining(girl) {
    const escapedAt = girl.escape?.lastAttempt?.ts || Date.now();
    return Math.max(0, RECOVERY_WINDOW_MS - (Date.now() - escapedAt));
  }

  // Attempt to re-capture an escaped girl — harder than initial capture
  function attemptRecapture({ girl, toolId }) {
    const s = window.DMTHGame.state.current;
    const tool = window.DMTHAssets.getById('item', toolId);
    if (!tool) throw new Error('unknown tool');
    if (!s.inventory[toolId] || s.inventory[toolId] < 1) throw new Error('no such tool in inventory');

    window.DMTHGame.state.consumeItem(toolId, 1);

    // Recapture is harder — girl knows what happened, is on alert, stats effectively +20% defiance
    const boostedGirl = { ...girl, stats: { ...girl.stats, defiance: Math.min(99, girl.stats.defiance + 20) } };
    const { successP } = window.DMTHGame.hunt.previewCaptureOdds({ girl: boostedGirl, toolId, locationId: 'street' });
    const roll = Math.random();

    if (roll < successP) {
      // Re-captured — back to original dungeon or active dungeon
      const dungeonId = girl.assignedDungeonId || s.settings.activeDungeonId;
      const dungeon = window.DMTHGame.state.getDungeon(dungeonId);
      const openIdx = dungeon.holds.findIndex(h => !h.captiveGirlId || h.captiveGirlId === girl.id);
      if (openIdx < 0) throw new Error('no open holds in dungeon');
      window.DMTHGame.state.updateGirl(girl.id, {
        encounterState: 'captive',
        assignedDungeonId: dungeon.id,
        assignedHoldIdx: openIdx,
        mood: { mood: 'defiant', moodEmoji: '😤', history: [...(girl.mood.history || []), { shift: 'recaptured', ts: Date.now() }] },
        body: { ...girl.body, bruises: girl.body.bruises + 4 },
        bond: { ...girl.bond, bondDebt: girl.bond.bondDebt + 10 },
        escape: { ...girl.escape, currentRisk: Math.min(1, (girl.escape?.currentRisk || 0.3) + 0.2) }
      });
      const newHolds = dungeon.holds.slice();
      newHolds[openIdx] = { ...newHolds[openIdx], captiveGirlId: girl.id };
      window.DMTHGame.state.updateDungeon(dungeon.id, { holds: newHolds });
      return { outcome: 'recaptured', successP };
    } else {
      // Missed her — she's gone forever
      window.DMTHGame.state.updateGirl(girl.id, {
        encounterState: 'gone',
        goneAt: Date.now()
      });
      window.DMTHGame.state.addNotoriety(5);
      return { outcome: 'lost-forever', successP };
    }
  }

  // Tick — expire escaped girls that aged out of the recovery window
  function expireTick() {
    const s = window.DMTHGame.state.current;
    if (!s) return;
    const now = Date.now();
    for (const g of s.roster || []) {
      if (g.encounterState !== 'escaped') continue;
      const escapedAt = g.escape?.lastAttempt?.ts || now;
      if ((now - escapedAt) >= RECOVERY_WINDOW_MS) {
        window.DMTHGame.state.updateGirl(g.id, { encounterState: 'gone', goneAt: now });
        window.DMTHGame.state.addNotoriety(3);
      }
    }
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.escapeRecovery = Object.freeze({
    recoverable, timeRemaining, attemptRecapture, expireTick, RECOVERY_WINDOW_MS
  });
})();
