// DUNGEON MASTER: THE HUNT — pregnancy subsystem.
// Captives can be knocked up; abortion methods are shop-purchasable; outcomes branch
// based on which method (or no method) is used.
//
// Schema (lives on `girl.pregnancy`):
//   {
//     status: 'none' | 'pregnant' | 'aborted' | 'miscarried' | 'birthed' | 'lost',
//     conceivedAtTick: number | null,           // tick.now() at conception
//     gestationDays:   number,                  // 0-280 — advanced by tickPregnancies()
//     trimester:       1 | 2 | 3 | null,        // computed; cached for prompt-hash stability
//     conceptionSource:'organic' | 'whore-out' | null,
//     johnEncounterId: string | null,           // wires into the john-ledger when present
//     outcomeHistory:  Array<{ status, day, method, ts, notes }>,
//     lastAbortMethod: string | null            // surfaced on dispose/UI
//   }
//
// Conception: fired from delta.applyDelta() when cumLoad crosses ~1.0 in a turn (semen
// delivery proxy) AND outfit ID is not 'condom-on' AND bond.bondLevel < 9 (fully-bonded
// captives use birth-control off-screen). Conception chance modulated by fertility curve
// (peaks mid-cycle, simplified to a flat base + per-drug protection factor).
//
// Abortion methods (catalog items, see catalog.js entries shipped with this milestone):
//   - condom            $2/stack  — preventive (worn as wardrobe; not technically abort)
//   - plan-b            $25       — works only in days 0-3 (post-coital window)
//   - abortion-pill-medical $120   — works in days 4-93 (1st trimester, clinical)
//   - surgical-kit-back-alley $200 — works in days 94-186 (2nd trimester, RISK of complication)
//   - obgyn-referral-clean $600    — works any time before day 200 (clean, no risk, lower notoriety)
//
// Full-term outcome (day 280): roll one of three branches —
//   - birthed (40%) — flag set; child NOT yet added to roster (multi-girl spawning deferred)
//   - sold-to-market (35%) — notoriety bump; cash from black-market broker
//   - lost-to-authorities (25%) — notoriety spike; girl gains 'lost-to-authorities' permanent tag
//
// Tick advancement: pregnancy.js exposes tickPregnancies(state) — tick.js calls it once per
// engine tick. One in-game gestation day per tick (~5 min full-term at 1-sec ticks — game
// pacing meaningful inside a single session). Player can adjust later via balancing.js.

(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // Schema defaults
  // -----------------------------------------------------------------------
  const DEFAULT_PREGNANCY = Object.freeze({
    status: 'none',
    conceivedAtTick: null,
    gestationDays: 0,
    trimester: null,
    conceptionSource: null,
    johnEncounterId: null,
    outcomeHistory: [],
    lastAbortMethod: null
  });

  function getPregnancy(girl) {
    return (girl && girl.pregnancy) || DEFAULT_PREGNANCY;
  }

  function isPregnant(girl) {
    return getPregnancy(girl).status === 'pregnant';
  }

  // Trimester boundaries (days). 1st: 0-93, 2nd: 94-186, 3rd: 187-280.
  function trimesterFromDays(days) {
    if (days < 0) return null;
    if (days <= 93) return 1;
    if (days <= 186) return 2;
    return 3;
  }

  // -----------------------------------------------------------------------
  // Conception
  // -----------------------------------------------------------------------

  // Base conception chance (per qualifying turn).
  const BASE_CONCEPTION_CHANCE = 0.30;

  // Per-drug protection / hostility factors (multiplicative on base chance).
  // MDMA slightly suppresses fertility per literature; coke marginally too.
  function drugProtectionFactor(girl) {
    const active = girl?.body?.activeDrugs || [];
    let factor = 1.0;
    for (const d of active) {
      const name = (d?.name || d || '').toLowerCase();
      if (name === 'mdma') factor *= 0.85;
      if (name === 'coke') factor *= 0.95;
      if (name === 'tranquilizer') factor *= 1.0;  // no effect
      if (name === 'ketamine') factor *= 0.95;
    }
    return factor;
  }

  // Returns:
  //   { rolled: true, conceived: bool, chance: number, reason?: string }
  //   { rolled: false, reason: '...' }   — gate failed
  function attemptConception(girlId, opts) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return { rolled: false, reason: 'no such girl' };

    // Pregnancy lifecycle assumes captive context. A girl in
    // 'roster' / 'escaped' / 'listed-on-slave-market' state must not receive a conception
    // roll, else tick.js gestation advance fires on a non-captive girl creating
    // downstream weirdness.
    if (girl.encounterState && girl.encounterState !== 'captive') {
      return { rolled: false, reason: 'not in captive state — no conception' };
    }

    const preg = getPregnancy(girl);
    if (preg.status === 'pregnant') {
      return { rolled: false, reason: 'already pregnant' };
    }
    if (preg.status === 'birthed' && preg.outcomeHistory?.some(o => o.day && (Date.now() - o.ts) < 24 * 60 * 60 * 1000)) {
      // Postpartum cooldown — can't conceive within ~24h real-time of birth
      return { rolled: false, reason: 'postpartum cooldown' };
    }

    // Gate: outfit must not be a condom wardrobe entry (none ship in catalog yet — leave
    // open hook for the 'condom-equipped' wardrobe item to land later).
    const currentOutfitId = girl.currentOutfit || '';
    if (currentOutfitId === 'condom-on') {
      return { rolled: false, reason: 'condom equipped' };
    }

    // Gate: fully-bonded captives (L9) use birth-control off-screen unless source is forced.
    const bondLevel = girl?.bond?.bondLevel || 0;
    if (bondLevel >= 9 && opts?.conceptionSource !== 'whore-out') {
      return { rolled: false, reason: 'fully-bonded captive uses contraception off-screen' };
    }

    const chance = BASE_CONCEPTION_CHANCE * drugProtectionFactor(girl);
    const roll = Math.random();
    const conceived = roll < chance;

    if (!conceived) {
      return { rolled: true, conceived: false, chance, roll };
    }

    // Conception confirmed.
    const newPreg = {
      status: 'pregnant',
      conceivedAtTick: Date.now(),
      gestationDays: 0,
      trimester: 1,
      conceptionSource: opts?.conceptionSource || 'organic',
      johnEncounterId: opts?.johnEncounterId || null,
      outcomeHistory: [
        ...(preg.outcomeHistory || []),
        {
          status: 'conceived',
          day: 0,
          method: null,
          ts: Date.now(),
          notes: opts?.conceptionSource === 'whore-out' ? 'conceived during whore-out session' : 'conceived'
        }
      ],
      lastAbortMethod: null
    };
    window.DMTHGame.state.updateGirl(girlId, { pregnancy: newPreg });
    if (window.DMTHNotify) {
      window.DMTHNotify.show(`🤰 ${girl.name} is pregnant.`, { type: 'warn', durationMs: 3500 });
    }
    return { rolled: true, conceived: true, chance, roll };
  }

  // -----------------------------------------------------------------------
  // Abortion methods + outcome
  // -----------------------------------------------------------------------

  // Method specs — keyed by catalog item ID.
  //   windowDays:    [minDay, maxDay] inclusive — works only inside this gestation window
  //   complications: 0..1 chance of a complication (health hit, may abort+miscarry, may inflict lifespan damage)
  //   notorietyHit:  flat +N notoriety when used (back-alley higher, clean lower)
  //   moodPenalty:   -N mood points
  //   bondImpact:    -N bondXP / +N bondDebt
  const ABORT_METHODS = Object.freeze({
    'plan-b': {
      windowDays: [0, 3],
      complications: 0.05,
      notorietyHit: 0,
      moodPenalty: 4,
      bondImpact: -2,
      itemId: 'plan-b',
      label: 'Plan B (post-coital)',
      emoji: '💊'
    },
    'abortion-pill-medical': {
      windowDays: [4, 93],
      complications: 0.10,
      notorietyHit: 1,
      moodPenalty: 8,
      bondImpact: -4,
      itemId: 'abortion-pill-medical',
      label: 'Medical Abortion Pill',
      emoji: '💊'
    },
    'surgical-kit-back-alley': {
      windowDays: [94, 186],
      complications: 0.30,
      notorietyHit: 3,
      moodPenalty: 18,
      bondImpact: -10,
      itemId: 'surgical-kit-back-alley',
      label: 'Back-alley Surgical Kit',
      emoji: '🔪'
    },
    'obgyn-referral-clean': {
      windowDays: [0, 200],
      complications: 0.03,
      notorietyHit: 0,
      moodPenalty: 6,
      bondImpact: -3,
      itemId: 'obgyn-referral-clean',
      label: 'Clean OB-GYN Referral',
      emoji: '🏥'
    }
  });

  // applyAbortion(girlId, methodId) — attempts the abortion. Returns:
  //   { ok: true, status: 'aborted'|'miscarried-from-complication', notesAdded, complicationRolled }
  //   { ok: false, reason: '...' }
  function applyAbortion(girlId, methodId) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return { ok: false, reason: 'no such girl' };
    const preg = getPregnancy(girl);
    if (preg.status !== 'pregnant') return { ok: false, reason: 'not pregnant' };
    const method = ABORT_METHODS[methodId];
    if (!method) return { ok: false, reason: 'unknown method' };

    const [minD, maxD] = method.windowDays;
    if (preg.gestationDays < minD || preg.gestationDays > maxD) {
      return { ok: false, reason: `outside ${method.label} window (gestation day ${preg.gestationDays}, requires ${minD}-${maxD})` };
    }

    // Consume the item from inventory.
    const consumed = window.DMTHGame.state.consumeItem(method.itemId, 1);
    if (!consumed) return { ok: false, reason: `no ${method.itemId} in inventory` };

    const complicationRolled = Math.random() < method.complications;
    const resultStatus = complicationRolled ? 'miscarried' : 'aborted';

    // Apply side-effects on the girl.
    const moodPenalty = method.moodPenalty + (complicationRolled ? 12 : 0);
    const bondImpact = method.bondImpact + (complicationRolled ? -6 : 0);
    const lifespanHit = complicationRolled ? 8 : 0;

    const newPreg = {
      status: resultStatus,
      conceivedAtTick: preg.conceivedAtTick,
      gestationDays: preg.gestationDays,
      trimester: preg.trimester,
      conceptionSource: preg.conceptionSource,
      johnEncounterId: preg.johnEncounterId,
      outcomeHistory: [
        ...(preg.outcomeHistory || []),
        {
          status: resultStatus,
          day: preg.gestationDays,
          method: methodId,
          ts: Date.now(),
          notes: complicationRolled ? `complication during ${method.label}` : `clean abortion via ${method.label}`
        }
      ],
      lastAbortMethod: methodId
    };

    const patch = { pregnancy: newPreg };

    // Mood + bond patches
    const newMood = { ...girl.mood, mood: complicationRolled ? 'traumatized' : 'subdued', moodEmoji: complicationRolled ? '😨' : '😔' };
    patch.mood = newMood;
    const newBond = { ...girl.bond };
    newBond.bondXP = Math.max(0, (newBond.bondXP || 0) + bondImpact);
    newBond.bondDebt = (newBond.bondDebt || 0) + Math.abs(bondImpact);
    patch.bond = newBond;

    // Defensively initialize girl.lifespan before patching so
    // back-alley complication health damage still bites on legacy saves missing the field.
    if (lifespanHit > 0) {
      const lifespan = girl.lifespan || { healthDamage: 0, daysCaptive: 0 };
      patch.lifespan = { ...lifespan, healthDamage: (lifespan.healthDamage || 0) + lifespanHit };
    }

    window.DMTHGame.state.updateGirl(girlId, patch);

    // Notoriety bump
    if (method.notorietyHit > 0 && window.DMTHGame.state.addNotoriety) {
      window.DMTHGame.state.addNotoriety(method.notorietyHit);
    }

    if (window.DMTHNotify) {
      window.DMTHNotify.show(
        complicationRolled
          ? `🩸 Complication during ${method.label} — ${girl.name} miscarried with damage.`
          : `${method.emoji} ${girl.name}'s pregnancy ended via ${method.label}.`,
        { type: complicationRolled ? 'error' : 'warn', durationMs: 4500 }
      );
    }

    return { ok: true, status: resultStatus, complicationRolled, notesAdded: 1 };
  }

  // -----------------------------------------------------------------------
  // Full-term outcome resolver
  // -----------------------------------------------------------------------

  // Day 280 — roll the outcome.
  function resolveFullTerm(girlId) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return { ok: false, reason: 'no such girl' };
    const preg = getPregnancy(girl);
    if (preg.status !== 'pregnant' || preg.gestationDays < 280) {
      return { ok: false, reason: 'not at full term' };
    }

    // Newborns NEVER enter the captive roster. The branches below cover every disposal
    // path the operator (or fate) might take. Random distribution — UI may add a player-
    // pick prompt later for the non-random methods.
    //
    //   stillbirth-trash        — random adverse outcome, baby never lived. No money,
    //                             small notoriety, mild bond-debt from the trauma.
    //   firestation-drop        — anonymous safe-haven drop-off. Zero money, low notoriety.
    //   sold-to-black-market    — broker sale. Real money, moderate notoriety.
    //   lost-to-authorities     — caught delivering / reported. Heavy notoriety, no money.
    //   abandoned-trash         — dumped (river / dumpster / shallow grave). Tiny notoriety
    //                             chance of low spike, but mostly clean. Cold.
    const r = Math.random();
    let outcome, notes, notorietyBump = 0, moneyGain = 0;
    if (r < 0.15) {
      outcome = 'stillbirth-trash';
      notes = `${girl.name}'s baby was stillborn. The body is wrapped and disposed of quietly.`;
      notorietyBump = 1;
      const newBond = { ...girl.bond, bondDebt: (girl.bond?.bondDebt || 0) + 4 };
      window.DMTHGame.state.updateGirl(girlId, { bond: newBond });
    } else if (r < 0.40) {
      outcome = 'firestation-drop';
      notes = `${girl.name}'s newborn was dropped off anonymously at a firestation. No questions asked.`;
      notorietyBump = 1;
    } else if (r < 0.70) {
      outcome = 'sold-to-black-market';
      notes = `${girl.name} delivered. Child sold to black-market broker.`;
      moneyGain = 800 + Math.floor(Math.random() * 1200);
      notorietyBump = 3;
      window.DMTHGame.state.addMoney(moneyGain, `pregnancy:broker-sale:${girl.id}`);
    } else if (r < 0.88) {
      outcome = 'abandoned-trash';
      notes = `${girl.name}'s newborn was disposed of with the trash. No paper trail.`;
      notorietyBump = Math.random() < 0.2 ? 5 : 0;   // small chance of being found
    } else {
      outcome = 'lost-to-authorities';
      notes = `${girl.name}'s delivery was reported to authorities. Heavy notoriety.`;
      notorietyBump = 8;
    }

    if (notorietyBump && window.DMTHGame.state.addNotoriety) {
      window.DMTHGame.state.addNotoriety(notorietyBump);
    }

    const newPreg = {
      status: outcome,
      conceivedAtTick: preg.conceivedAtTick,
      gestationDays: preg.gestationDays,
      trimester: 3,
      conceptionSource: preg.conceptionSource,
      johnEncounterId: preg.johnEncounterId,
      outcomeHistory: [
        ...(preg.outcomeHistory || []),
        { status: outcome, day: preg.gestationDays, method: null, ts: Date.now(), notes }
      ],
      lastAbortMethod: preg.lastAbortMethod
    };
    window.DMTHGame.state.updateGirl(girlId, { pregnancy: newPreg });

    if (window.DMTHNotify) {
      window.DMTHNotify.show(`🍼 ${girl.name}: ${notes}`, { type: outcome === 'lost' ? 'error' : 'success', durationMs: 5000 });
    }

    return { ok: true, outcome, notes, notorietyBump, moneyGain };
  }

  // -----------------------------------------------------------------------
  // Tick advancement
  // -----------------------------------------------------------------------

  // Days-per-tick for gestation advancement. Gestation pace target: 1 game day per
  // trimester, 3 game days to full term. At 1 real-sec = 1 game-min, 1 game day =
  // 24 real min. Tick fires every 30 real sec → 30 game min/tick → 48 ticks per game
  // day → 144 ticks per full term. Full term is 280 pregnancyDays, so per-tick advance
  // is 280 / 144 ≈ 1.944. Trimester boundaries at 93 / 186 / 280 pregnancyDays land at
  // game-day 1 / 2 / 3 respectively.
  const GESTATION_DAYS_PER_TICK = 280 / 144;

  // Called from tick.js once per engine tick. Advances gestation by GESTATION_DAYS_PER_TICK.
  // For each pregnant girl: increment gestationDays; recompute trimester; auto-resolve at 280.
  function tickPregnancies() {
    const s = window.DMTHGame.state.current;
    if (!s) return;
    for (const girl of s.roster) {
      if (girl.encounterState !== 'captive') continue;
      const preg = getPregnancy(girl);
      if (preg.status !== 'pregnant') continue;

      const newDays = (preg.gestationDays || 0) + GESTATION_DAYS_PER_TICK;
      const newTrimester = trimesterFromDays(newDays);

      window.DMTHGame.state.updateGirl(girl.id, {
        pregnancy: { ...preg, gestationDays: newDays, trimester: newTrimester }
      });

      // Auto-resolve at full term.
      if (newDays >= 280) {
        resolveFullTerm(girl.id);
      }
    }
  }

  // -----------------------------------------------------------------------
  // UI helpers
  // -----------------------------------------------------------------------

  function describePregnancy(girl) {
    const preg = getPregnancy(girl);
    if (preg.status === 'none') return null;
    const lines = [];
    if (preg.status === 'pregnant') {
      lines.push(`🤰 PREGNANT · day ${preg.gestationDays}/280 · trimester ${preg.trimester}`);
    } else {
      const last = (preg.outcomeHistory || []).slice(-1)[0];
      const tag = preg.status.toUpperCase();
      lines.push(`${tag}${last?.method ? ` via ${last.method}` : ''}${last?.day != null ? ` · day ${last.day}` : ''}`);
    }
    return lines.join(' · ');
  }

  // Methods currently usable on a given girl (within window, item in inventory, status pregnant).
  function eligibleAbortionMethods(girl) {
    const preg = getPregnancy(girl);
    if (preg.status !== 'pregnant') return [];
    const inv = window.DMTHGame.state.current?.inventory || {};
    return Object.entries(ABORT_METHODS)
      .filter(([id, m]) => {
        if (!inv[id] || inv[id] < 1) return false;
        const [minD, maxD] = m.windowDays;
        return preg.gestationDays >= minD && preg.gestationDays <= maxD;
      })
      .map(([id, m]) => ({ id, ...m }));
  }

  function allAbortionMethodsForDisplay(girl) {
    const preg = getPregnancy(girl);
    const inv = window.DMTHGame.state.current?.inventory || {};
    return Object.entries(ABORT_METHODS).map(([id, m]) => {
      const [minD, maxD] = m.windowDays;
      const inWindow = preg.status === 'pregnant' && preg.gestationDays >= minD && preg.gestationDays <= maxD;
      const inStock = (inv[id] || 0) >= 1;
      return { id, ...m, inWindow, inStock, owned: inv[id] || 0 };
    });
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.pregnancy = Object.freeze({
    DEFAULT_PREGNANCY,
    ABORT_METHODS,
    BASE_CONCEPTION_CHANCE,
    GESTATION_DAYS_PER_TICK,
    getPregnancy,
    isPregnant,
    trimesterFromDays,
    attemptConception,
    applyAbortion,
    resolveFullTerm,
    tickPregnancies,
    describePregnancy,
    eligibleAbortionMethods,
    allAbortionMethodsForDisplay
  });
})();
