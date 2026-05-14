// SEX SLAVE DUNGEON — maintenance tick. Runs on interval while game page is open.

(function () {
  'use strict';

  let timer = null;

  const INTERVAL_MS = 30_000;    // 30 seconds between ticks

  function start() {
    if (timer) return;
    timer = setInterval(runTick, INTERVAL_MS);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function runTick() {
    const s = window.SSDGame.state.current;
    if (!s || !s.createdAt) return;

    window.SSDGame.state.bumpTick();

    // 1. Consumable decay per girl
    for (const girl of s.roster) {
      if (girl.encounterState !== 'captive') continue;
      decayConsumables(girl);
    }

    // 2. Escape rolls per captive
    for (const girl of s.roster) {
      if (girl.encounterState !== 'captive') continue;
      runEscapeRoll(girl);
    }

    // 3. Market sale pass (films)
    window.SSDGame.market.runSaleTick();

    // 4. Propositioner arrivals
    if (window.SSDGame.propositioner.shouldArriveThisTick()) {
      const p = window.SSDGame.propositioner.rollPropositioner();
      window.SSDGame.state.enqueuePropositioner(p);
    }

    // 5. Slave-market buyer tick
    window.SSDGame.slaveMarket.runBuyerTick();

    // 6. Drug scheduler — pharmacokinetic curves drive high + active list
    if (window.SSDGame.drugs) window.SSDGame.drugs.tickAll();

    // 7. Notoriety slow decay — heat cools over time
    if (window.SSDGame.balancing) window.SSDGame.balancing.decayTick();

    // 9. Achievements check
    if (window.SSDGame.achievements) {
      const unlocks = window.SSDGame.achievements.check();
      if (unlocks.length && window.SSDNotify) {
        unlocks.forEach(u => window.SSDNotify.show(`${u.emoji} ${u.title} — ${u.description}`));
      }
    }

    // 10. Escape-recovery window expiration
    if (window.SSDGame.escapeRecovery) window.SSDGame.escapeRecovery.expireTick();

    // 11. Lifespan system — days-captive aging + neglect/care evaluation + terminal state transitions
    if (window.SSDGame.lifespan) window.SSDGame.lifespan.tickAll();
  }

  function decayConsumables(girl) {
    const c = girl.consumables || {};
    const newC = JSON.parse(JSON.stringify(c));
    let moodPenalty = 0;

    for (const key of ['food', 'water']) {
      if (!newC[key]) continue;
      newC[key].stock = Math.max(0, (newC[key].stock || 0) - (newC[key].decayPerTick || 1));
      if (newC[key].stock === 0) moodPenalty += 1;
    }

    const patch = { consumables: newC };
    if (moodPenalty > 0) {
      const newBody = { ...girl.body };
      newBody.bruises = newBody.bruises;  // starvation doesn't bruise, but mood drops
      patch.body = newBody;
      const newBond = { ...girl.bond, bondDebt: (girl.bond.bondDebt || 0) + moodPenalty };
      patch.bond = newBond;
    }
    window.SSDGame.state.updateGirl(girl.id, patch);
  }

  function runEscapeRoll(girl) {
    if (!girl.escape) return;
    const threshold = Math.min(0.6, girl.escape.currentRisk || 0.1);
    if (Math.random() < threshold * 0.1) {       // slow rate — per-tick chance
      // Escape attempt
      const dungeon = window.SSDGame.state.getDungeon(girl.assignedDungeonId);
      const dungeonTpl = dungeon && window.SSDAssets.getById('dungeon', dungeon.templateId);
      const concealment = dungeonTpl?.concealment || 0.5;
      const isolation = dungeonTpl?.isolation || 0.5;
      const containmentChance = Math.min(0.95, 0.4 + concealment * 0.3 + isolation * 0.3);
      const caught = Math.random() < containmentChance;
      if (caught) {
        // Contained — small bruise hit, bond debt
        const newBody = { ...girl.body, bruises: girl.body.bruises + 2 };
        const newBond = { ...girl.bond, bondDebt: girl.bond.bondDebt + 3 };
        const newMood = { mood: 'defiant', moodEmoji: '😤', history: [...(girl.mood.history || []), { shift: 'escape-caught', ts: Date.now() }] };
        window.SSDGame.state.updateGirl(girl.id, {
          body: newBody, bond: newBond, mood: newMood,
          escape: { ...girl.escape, lastAttempt: { outcome: 'caught', ts: Date.now() } }
        });
      } else {
        // She got out — move encounter state, notoriety spike
        window.SSDGame.state.updateGirl(girl.id, {
          encounterState: 'escaped',
          escape: { ...girl.escape, lastAttempt: { outcome: 'escaped', ts: Date.now() } }
        });
        window.SSDGame.state.addNotoriety(4);
      }
    }
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.tick = Object.freeze({ start, stop, runTick });
})();
