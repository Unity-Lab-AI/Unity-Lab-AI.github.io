// DUNGEON MASTER: THE HUNT — whore-out passive-income subsystem.
// Captives generate passive income through john encounters; the ledger tracks every john
// (act / payment / time / quirks) so the captive can reference them in chat.
//
// Distinct from Propositioner (bespoke single deals, player-approval gated, upmarket
// clientele). Whore-out is continuous passive general-public flow with batch resolution
// per tick. Both systems coexist.
//
// Schema on `girl.whoreOut`:
//   {
//     enabled:           bool
//     enabledAt:         ts | null
//     rate:              'low' | 'standard' | 'premium' | 'all-comers'
//     condomRequired:    bool
//     permittedActs:     string[]   // act IDs the player has whitelisted; empty = john's pick
//     blockedJohnTypes:  string[]   // archetype IDs the player blacklists
//     johnLedger:        JohnEncounter[]
//     sessionTotals: { encounters, gross, tips, bruisesAdded, cumLoadAdded }
//     unclaimedEarnings: number     // accrues per encounter; cashout transfers to wallet
//   }
//
// JohnEncounter shape:
//   {
//     id, ts, johnArchetype, johnDescription, acts, duration_min,
//     payment, tip, totalPaid, condomUsed,
//     girlMoodBefore, girlMoodAfter, bondDeltaApplied, bondDebtAdded,
//     bruisesAdded, cumLoadAdded, staminaDrained, notes,
//     pregnancyHookFired   // true if vaginal-cum gate + !condomUsed → attemptConception called
//   }

(function () {
  'use strict';

  // Cadence-based arrival params. Replaces the prior % per-tick rate enum so the player
  // can SEE when the next john is coming. Each tick (= 30 game minutes) advances a
  // per-girl `pendingArrivals` accumulator by `30 / cadenceMinutes * buzzMul`. Whole-
  // number portion fires that many arrivals; fractional carries forward.
  //
  //   rapid    — 1 john / 10 game min  (every tick fires ~3, ~6 at BUZZ 100)
  //   steady   — 1 john / 30 game min  (every tick fires 1, 2 at BUZZ 100)
  //   casual   — 1 john / 60 game min  (every 2 ticks fires 1)
  //   trickle  — 1 john / 120 game min (every 4 ticks fires 1)
  //   off      — no arrivals
  //
  // Legacy `rate` values (low/standard/premium/all-comers) map onto the new cadence so
  // old saves keep working without a migration pass.
  const RATE_PARAMS = {
    off:         { cadenceMinutes: Infinity, displayName: 'off' },
    trickle:     { cadenceMinutes: 120,      displayName: '1 john / 120 game min' },
    casual:      { cadenceMinutes: 60,       displayName: '1 john / 60 game min' },
    steady:      { cadenceMinutes: 30,       displayName: '1 john / 30 game min' },
    rapid:       { cadenceMinutes: 10,       displayName: '1 john / 10 game min' },
    // Legacy alias map — old saves with these values fall through to the closest cadence
    low:         { cadenceMinutes: 120, displayName: '1 john / 120 game min (legacy)', alias: 'trickle' },
    standard:    { cadenceMinutes: 30,  displayName: '1 john / 30 game min (legacy)',  alias: 'steady' },
    premium:     { cadenceMinutes: 20,  displayName: '1 john / 20 game min (legacy)',  alias: 'steady' },
    'all-comers':{ cadenceMinutes: 10,  displayName: '1 john / 10 game min (legacy)',  alias: 'rapid' }
  };
  // BUZZ multiplier on the cadence — BUZZ 100 doubles the arrival rate.
  function buzzMultiplier() {
    const buzz = window.DMTHGame.state?.getBuzz ? window.DMTHGame.state.getBuzz() : 0;
    return 1 + (buzz / 100);
  }
  // Expected fractional arrivals per tick (30 game minutes) at the current cadence + BUZZ.
  // For UI countdown + per-tick accumulator.
  function expectedArrivalsPerTick(rateId) {
    const r = RATE_PARAMS[rateId] || RATE_PARAMS.steady;
    if (!Number.isFinite(r.cadenceMinutes)) return 0;
    return (30 / r.cadenceMinutes) * buzzMultiplier();
  }
  // Game-minutes until next arrival from the per-girl `pendingArrivals` accumulator.
  // Used for the visible "next john in 8m 24s" countdown in the whore-out panel.
  function gameMinutesToNextArrival(girl) {
    const wo = getWhoreOut(girl);
    if (!wo.enabled) return null;
    const r = RATE_PARAMS[wo.rate] || RATE_PARAMS.steady;
    if (!Number.isFinite(r.cadenceMinutes)) return null;
    const pending = wo.pendingArrivals || 0;
    const buzzMul = buzzMultiplier();
    if (buzzMul <= 0) return null;
    // Minutes to climb from pending → 1.0 at the current effective arrival rate.
    const remaining = Math.max(0, 1 - pending);
    return remaining * r.cadenceMinutes / buzzMul;
  }

  // Acts that count as vaginal-cum delivery for pregnancy conception (matches the
  // VAGINAL_CUM_TAGS set in delta.js).
  const VAGINAL_CUM_ACTS = new Set(['creampie', 'breeding', 'cum-in-pussy', 'cum-inside', 'vaginal-cum']);

  // Stamina-floor below which the girl refuses further johns and rest is forced.
  const STAMINA_FLOOR_JOHN_GATE = 10;

  // Bond-debt threshold above which she protests / escape risk spikes.
  const BONDDEBT_EXCESS = 60;

  function defaultWhoreOut() {
    return {
      enabled: false,
      enabledAt: null,
      rate: 'steady',
      condomRequired: false,
      permittedActs: [],
      blockedJohnTypes: [],
      johnLedger: [],
      sessionTotals: { encounters: 0, gross: 0, tips: 0, bruisesAdded: 0, cumLoadAdded: 0 },
      unclaimedEarnings: 0,
      // Cadence accumulator — each tick advances by `expectedArrivalsPerTick`. Whole-number
      // portion fires that many arrivals; fractional carries forward so cadence is
      // deterministic across ticks rather than dice-rolled per tick.
      pendingArrivals: 0,
      // Game-minutes timestamp of the most recent john arrival. Used for ledger context
      // and for the countdown display in the room UI.
      lastJohnArrivalAt: null
    };
  }

  function getWhoreOut(girl) {
    const wo = (girl && girl.whoreOut) || defaultWhoreOut();
    // Legacy rate normalization — old saves persisted low/standard/premium/all-comers.
    // Resolve via alias so the UI dropdown selects a valid canonical option and the
    // cadence math hits a single canonical row instead of the legacy aliases.
    const r = RATE_PARAMS[wo.rate];
    if (r && r.alias) return { ...wo, rate: r.alias };
    return wo;
  }

  function toggle(girlId, on) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) throw new Error('no such girl');
    const wo = { ...getWhoreOut(girl) };
    wo.enabled = !!on;
    if (on) wo.enabledAt = Date.now();
    window.DMTHGame.state.updateGirl(girlId, { whoreOut: wo });
    return wo;
  }

  function updateSettings(girlId, patch) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) throw new Error('no such girl');
    const wo = { ...getWhoreOut(girl), ...patch };
    window.DMTHGame.state.updateGirl(girlId, { whoreOut: wo });
    return wo;
  }

  // -----------------------------------------------------------------------
  // Per-tick john arrivals
  // -----------------------------------------------------------------------

  // Fire a single john encounter for one whored-out girl. Caller has already decided that
  // an arrival is due (per the cadence accumulator). Returns null when arrival is blocked
  // (stamina floor, bond-debt overflow, blocked archetype with no fallback) — otherwise
  // returns the resolved JohnEncounter.
  //
  // Postmortem branch: when girl.encounterState === 'dead', skip the alive-only gates
  // (stamina/bond-debt are irrelevant) and force the postmortem-john archetype.
  function tryArrival(girl) {
    const wo = getWhoreOut(girl);
    if (!wo.enabled) return null;

    // Postmortem branch — body is dead but whore-out continues. Always uses postmortem-john.
    if (girl.encounterState === 'dead') {
      return resolveEncounter(girl, 'postmortem-john');
    }

    const stamina = girl.body?.stamina ?? 70;
    if (stamina <= STAMINA_FLOOR_JOHN_GATE) return null;  // she's too tired

    // Bond-debt overflow — girl protests, no more johns until debt clears
    if ((girl.bond?.bondDebt || 0) > BONDDEBT_EXCESS) return null;

    const isPregnant = girl.pregnancy?.status === 'pregnant';
    let archetypeId = window.DMTHJohnArchetypes.rollJohnArchetype(Math.random, { isPregnant });

    // Player blocks this archetype? Re-roll once; if still blocked, skip.
    if (wo.blockedJohnTypes.includes(archetypeId)) {
      archetypeId = window.DMTHJohnArchetypes.rollJohnArchetype(Math.random, { isPregnant });
      if (wo.blockedJohnTypes.includes(archetypeId)) return null;
    }

    return resolveEncounter(girl, archetypeId);
  }

  function resolveEncounter(girl, archetypeId) {
    const arc = window.DMTHJohnArchetypes.JOHN_ARCHETYPES[archetypeId];
    if (!arc) return null;
    const wo = getWhoreOut(girl);

    // Pick acts — intersection of john's preferences + player's permittedActs (if non-empty)
    // When player has a non-empty permittedActs whitelist and no
    // john preference matches, the john leaves without service (whitelist is binding now,
    // not "john gets his preferences anyway"). Prevents the player's whitelist from being
    // silently ignored.
    let acts = window.DMTHJohnArchetypes.rollJohnActs(archetypeId);
    if (wo.permittedActs.length > 0) {
      const filtered = acts.filter(a => wo.permittedActs.includes(a));
      if (filtered.length === 0) {
        // Whitelist couldn't match — john leaves dissatisfied. No encounter persisted,
        // no pay, no stamina drain. Light mood/notoriety blip from declining work.
        return null;
      }
      acts = filtered;
    }

    // Condom use — player-requirement overrides john compliance
    const condomUsed = wo.condomRequired
      ? true
      : Math.random() < arc.condomCompliance;

    // Compute pay using johnHappinessForGirl multiplier
    const basePay = arc.payRange[0] + Math.floor(Math.random() * (arc.payRange[1] - arc.payRange[0]));
    const happiness = window.DMTHGame.actionEffects?.johnHappinessForGirl(girl) || { multiplier: 1.0, breakdown: {} };
    const payment = Math.round(basePay * happiness.multiplier);
    const tipRoll = Math.random() < arc.tipChance;
    const tip = tipRoll ? Math.round(payment * (arc.tipMul - 1.0)) : 0;
    const totalPaid = payment + tip;

    // Apply the john action (drains stamina + health + mood per archetype intensity)
    // Capture bond before+after so encounter ledger records the ACTUAL bond delta applied,
    // not hardcoded 0.
    const moodBefore = girl.mood?.mood || 'neutral';
    const bondDebtBefore = girl.bond?.bondDebt || 0;
    const bondXPBefore = girl.bond?.bondXP || 0;
    if (window.DMTHGame.actionEffects?.applyAction) {
      const strain = (girl.body?.stamina ?? 70) <= window.DMTHGame.actionEffects.STAMINA_THRESHOLD_FOR_STRAIN;
      window.DMTHGame.actionEffects.applyAction(girl.id, arc.johnActionId, { strain });
    }
    // Re-read girl after applyAction mutations
    const refreshed = window.DMTHGame.state.getGirl(girl.id);
    const moodAfter = refreshed?.mood?.mood || moodBefore;
    const bondDebtAfter = refreshed?.bond?.bondDebt || 0;
    const bondXPAfter = refreshed?.bond?.bondXP || 0;

    // Determine cum delivery: vaginal-cum acts trigger pregnancy hook unless condomUsed
    const hasVaginalCum = acts.some(a => VAGINAL_CUM_ACTS.has(a));
    let pregnancyHookFired = false;
    if (hasVaginalCum && !condomUsed && window.DMTHGame.pregnancy) {
      try {
        const r = window.DMTHGame.pregnancy.attemptConception(girl.id, {
          conceptionSource: 'whore-out',
          johnEncounterId: null   // set below after we have the id
        });
        if (r && r.rolled) pregnancyHookFired = true;
      } catch (err) {
        console.debug('[whore-out] pregnancy hook failed:', err);
      }
    }

    // For repeat-eligible archetypes, persist a stable johnId so
    // subsequent encounters can match against prior visits. Repeat clients build cumulative
    // rep + the girl can reference them by name in dialogue ("the regular from Tuesday").
    const isRepeatable = !!arc.repeatable;
    let johnId = null;
    if (isRepeatable) {
      const refreshedWo = getWhoreOut(girl);
      const priorRepeats = (refreshedWo.johnLedger || []).filter(e => e.johnArchetype === archetypeId && e.johnId);
      // 60% chance to match a prior repeat-client if one exists; else mint a new ID
      if (priorRepeats.length > 0 && Math.random() < 0.6) {
        johnId = priorRepeats[priorRepeats.length - 1].johnId;
      } else {
        johnId = 'john_' + archetypeId + '_' + Date.now().toString(36).slice(-4);
      }
    }

    const encounter = {
      id: 'enc_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 0xffff).toString(36),
      johnId,
      ts: Date.now(),
      johnArchetype: archetypeId,
      johnDescription: arc.displayName,
      acts,
      duration_min: arc.intensity * 5 + Math.floor(Math.random() * 10),
      payment,
      tip,
      totalPaid,
      condomUsed,
      girlMoodBefore: moodBefore,
      girlMoodAfter: moodAfter,
      bondDeltaApplied: bondXPAfter - bondXPBefore,
      bondDebtAdded: bondDebtAfter - bondDebtBefore,
      bruisesAdded: arc.bruisesAdded || 0,
      cumLoadAdded: hasVaginalCum ? 1.2 : (acts.includes('oral') ? 1.0 : 0),
      staminaDrained: Math.abs(window.DMTHGame.actionEffects?.ACTIONS?.[arc.johnActionId]?.stamina || 5),
      notes: `${arc.displayName} — ${arc.dialogueTone}. Acts: ${acts.join(', ')}.${condomUsed ? ' [condom used]' : ' [no condom]'}`,
      pregnancyHookFired
    };

    // Persist to ledger + session totals + unclaimed earnings + cadence timestamp
    const newWo = { ...getWhoreOut(refreshed || girl) };
    newWo.johnLedger = [...(newWo.johnLedger || []), encounter].slice(-200);
    newWo.sessionTotals = {
      encounters: (newWo.sessionTotals?.encounters || 0) + 1,
      gross: (newWo.sessionTotals?.gross || 0) + payment,
      tips: (newWo.sessionTotals?.tips || 0) + tip,
      bruisesAdded: (newWo.sessionTotals?.bruisesAdded || 0) + encounter.bruisesAdded,
      cumLoadAdded: (newWo.sessionTotals?.cumLoadAdded || 0) + encounter.cumLoadAdded
    };
    newWo.unclaimedEarnings = (newWo.unclaimedEarnings || 0) + totalPaid;
    // Stamp the arrival time in game-minutes for the room UI countdown display.
    if (window.DMTHGame.gameClock) {
      newWo.lastJohnArrivalAt = window.DMTHGame.gameClock.now();
    }

    // Notoriety bump per encounter — 1 per 4 encounters
    if (window.DMTHGame.state.addNotoriety && (newWo.johnLedger.length % 4 === 0)) {
      window.DMTHGame.state.addNotoriety(1);
    }

    // BUZZ feed — every successful john bumps the operator's underground reputation. Word
    // spreads; more johns find their way to the dungeon over time. Postmortem encounters
    // bump LESS (niche clientele doesn't broadcast as widely) — half the alive rate.
    if (window.DMTHGame.state.addBuzz) {
      const buzzGain = archetypeId === 'postmortem-john' ? 0.25 : 0.5;
      window.DMTHGame.state.addBuzz(buzzGain, `john-completed: ${archetypeId}`);
    }

    window.DMTHGame.state.updateGirl(girl.id, { whoreOut: newWo });
    return encounter;
  }

  // -----------------------------------------------------------------------
  // Tick wiring
  // -----------------------------------------------------------------------

  // Cadence-based tick. Each enabled whored-out girl accumulates `expectedArrivalsPerTick`
  // into her `pendingArrivals` field; whole-number portion fires that many arrivals this
  // tick, fractional carries forward to the next tick. BUZZ multiplier folded into the
  // accumulator, so higher BUZZ literally adds more pending arrivals per tick.
  //
  // Dead girls (encounterState === 'dead') keep accumulating arrivals as long as their
  // whoreOut.enabled is true and decay hasn't passed the forced-disposal threshold — but
  // only fire postmortem-john arrivals (handled in tryArrival).
  function runJohnTick() {
    const s = window.DMTHGame.state.current;
    if (!s) return;
    for (const girl of s.roster) {
      // Captive (alive) OR dead-but-not-yet-disposed
      const eligible = girl.encounterState === 'captive' || girl.encounterState === 'dead';
      if (!eligible) continue;
      const wo = getWhoreOut(girl);
      if (!wo.enabled) continue;

      // Accumulate fractional arrivals for this tick. BUZZ folded in.
      const perTick = expectedArrivalsPerTick(wo.rate);
      let pending = (wo.pendingArrivals || 0) + perTick;
      const toFire = Math.floor(pending);
      pending -= toFire;

      // Persist accumulator update before firing any arrivals — every encounter re-reads
      // girl from state, so we update the carrier first so subsequent reads see fresh.
      window.DMTHGame.state.updateGirl(girl.id, {
        whoreOut: { ...wo, pendingArrivals: pending }
      });

      let arrivals = 0;
      for (let i = 0; i < toFire; i++) {
        const enc = tryArrival(window.DMTHGame.state.getGirl(girl.id));
        if (enc) arrivals++;
      }
      if (arrivals > 0 && window.DMTHNotify && arrivals >= 2) {
        window.DMTHNotify.show(`💰 ${girl.name}: ${arrivals} johns this tick`, { type: 'info', durationMs: 2000 });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Cashout + ledger helpers
  // -----------------------------------------------------------------------

  function cashout(girlId) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) throw new Error('no such girl');
    const wo = getWhoreOut(girl);
    const amount = wo.unclaimedEarnings || 0;
    if (amount <= 0) return { ok: false, reason: 'nothing to cash out', amount: 0 };
    window.DMTHGame.state.addMoney(amount, `whore-out:cashout:${girlId}`);
    const newWo = { ...wo, unclaimedEarnings: 0 };
    window.DMTHGame.state.updateGirl(girlId, { whoreOut: newWo });
    return { ok: true, amount };
  }

  // Summarize the last N encounters for Ollama context block / memory injection so the
  // captive can talk about her johns in chat.
  function summarizeLedger(girlId, opts = {}) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return [];
    const wo = getWhoreOut(girl);
    const n = opts.last || 5;
    return (wo.johnLedger || []).slice(-n).map(e => ({
      ts: e.ts,
      archetype: e.johnArchetype,
      description: e.johnDescription,
      acts: e.acts.join(', '),
      paid: e.totalPaid,
      notes: e.notes
    }));
  }

  // Compact one-line ledger entries for Ollama context.
  function contextBlockText(girlId) {
    const summary = summarizeLedger(girlId, { last: 5 });
    if (!summary.length) return '';
    const lines = summary.map(e => {
      const when = new Date(e.ts);
      const ago = Math.max(0, Math.round((Date.now() - e.ts) / 60000));
      return `  - ${ago}min ago: ${e.description} (${e.acts}) — $${e.paid}. ${e.notes}`;
    });
    return `RECENT JOHNS (last 5 — she remembers and may reference them):\n${lines.join('\n')}`;
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.whoreOut = Object.freeze({
    RATE_PARAMS,
    STAMINA_FLOOR_JOHN_GATE,
    BONDDEBT_EXCESS,
    defaultWhoreOut,
    getWhoreOut,
    toggle,
    updateSettings,
    tryArrival,
    resolveEncounter,
    runJohnTick,
    cashout,
    summarizeLedger,
    contextBlockText,
    buzzMultiplier,
    expectedArrivalsPerTick,
    gameMinutesToNextArrival
  });
})();
