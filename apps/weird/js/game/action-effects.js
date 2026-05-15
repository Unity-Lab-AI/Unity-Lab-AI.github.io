// DUNGEON MASTER: THE HUNT — central per-action stat-impact spec.
// Every actionable button (sex, drugs, violence, care) carries its own stamina/health/
// mood/arousal/bondXP delta envelope. Some heal, some hurt, some drain stamina, some
// rebuild it. This file is the single source of truth for those deltas.
//
// Every actionable button or in-dungeon event consults this table to learn its per-stat
// delta envelope. Keys are action IDs; values are signed integer deltas applied to body
// fields. Negative = drains, positive = boosts. UI tooltips can preview costs by reading
// the entry directly.
//
// Schema (all fields optional, default 0):
//   {
//     stamina:   -100..+100   // 0-100 capped, drains or boosts
//     health:    -100..+100   // 0-100 capped, harder to refill than stamina
//     mood:      -20..+20     // mood-shift word selection
//     arousal:   -30..+30     // 0-100 capped
//     wetness:   -30..+30
//     bruises:   -10..+15     // 0-99 capped
//     cumLoad:   -2..+2       // float, no upper cap
//     bondXP:    -20..+20
//     bondDebt:  -20..+20
//     notoriety: -5..+5       // bumps the wallet, not the body
//     notes:     string       // human-readable label, used in tooltip previews
//   }

(function () {
  'use strict';

  const ACTIONS = Object.freeze({
    // -----------------------------------------------------------------
    // CARETAKING — generally restore stamina/health/bond
    // -----------------------------------------------------------------
    'feed-basic': {
      stamina: +6, health: +2, mood: +3, bondXP: +1, satisfaction: +1,
      notes: 'Basic meal — light stamina + health restore. Modest bond.'
    },
    'feed-gourmet': {
      stamina: +12, health: +5, mood: +6, bondXP: +3, satisfaction: +1,
      notes: 'Gourmet meal — stronger restore + bond bump. She remembers who fed her well.'
    },
    'water-bottled': {
      stamina: +4, health: +2, mood: +2, bondXP: +1, satisfaction: 0,
      notes: 'Bottled water — hydration restore.'
    },
    'water-filtered': {
      stamina: +6, health: +3, mood: +3, bondXP: +2, satisfaction: 0,
      notes: 'Filtered water — better hydration + small bond bump.'
    },
    'heal': {
      stamina: +10, health: +20, mood: +6, bruises: -10, satisfaction: +1,
      notes: 'Heal — major bruise reset + meaningful health restore.'
    },
    'rest-tick': {                  // passive, fired from tick.js when no scene happens
      stamina: +8, health: +2, satisfaction: 0,
      notes: 'Passive rest — quiet tick, mild stamina regen.'
    },

    // -----------------------------------------------------------------
    // LOVE / SENSUAL — gentle care + bond restoration. Rebuilds stamina/health/Stockholm
    // when she's low. Reduces accumulated bondDebt — past harshness can be forgiven.
    // -----------------------------------------------------------------
    'love-kiss-gentle': {
      stamina: +4, health: +2, mood: +5, bondXP: +3, bondDebt: -1, satisfaction: +1,
      notes: 'Gentle kiss — small stamina + bond bump, mood lift.'
    },
    'love-cuddle': {
      stamina: +8, health: +4, mood: +6, bondXP: +4, bondDebt: -2, satisfaction: +2,
      notes: 'Cuddle — stronger stamina restore + bond bump + bondDebt forgiveness.'
    },
    'love-praise': {
      stamina: +2, health: +1, mood: +8, bondXP: +5, bondDebt: -1, satisfaction: +1,
      notes: 'Whispered praise — heavy mood + bond hit, minor body restore.'
    },
    'love-massage': {
      stamina: +12, health: +6, mood: +5, bondXP: +3, bondDebt: -2, satisfaction: +2,
      notes: 'Massage — major stamina + health restore, modest bond.'
    },
    'love-bathe-her': {
      stamina: +10, health: +8, mood: +6, bondXP: +4, bondDebt: -2, cumLoad: -3, satisfaction: +2,
      notes: 'Bathe her — strong health + stamina rebuild, real intimacy. Drains cumLoad in the bath.'
    },
    'wipe-down': {
      stamina: +2, health: +1, mood: +3, bondXP: +1, bondDebt: -1, cumLoad: -2, satisfaction: +1,
      notes: 'Wipe her down — drains accumulated cum. Faster than a full bath, less recovery.'
    },
    'love-feed-by-hand': {
      stamina: +8, health: +5, mood: +7, bondXP: +5, bondDebt: -2, satisfaction: +2,
      notes: 'Feed her by hand — caretaking intimacy. Strong bond gain.'
    },
    'love-hair-brush': {
      stamina: +4, health: +2, mood: +5, bondXP: +4, bondDebt: -1, satisfaction: +1,
      notes: 'Brush her hair — slow, intimate, rebuilds trust.'
    },
    'love-lullaby': {
      stamina: +6, health: +2, mood: +8, bondXP: +5, bondDebt: -2, satisfaction: +1,
      notes: 'Lullaby — sing or hum her to sleep. Big mood + bond.'
    },
    'love-hold-her': {
      stamina: +5, health: +3, mood: +6, bondXP: +4, bondDebt: -1, satisfaction: +1,
      notes: 'Just hold her — quiet, no demands. Steady bond gain.'
    },
    'love-aftercare': {
      stamina: +15, health: +10, mood: +10, bondXP: +6, bondDebt: -4, bruises: -2, satisfaction: +3,
      notes: 'Full aftercare — water, blanket, treat bruises, hold her until she sleeps.'
    },
    'love-forehead-kiss': {
      stamina: +2, health: +1, mood: +4, bondXP: +3, bondDebt: -1, satisfaction: +1,
      notes: 'Forehead kiss — small but emotionally weighted.'
    },
    'love-promise-sweet': {
      stamina: +1, health: 0, mood: +6, bondXP: +5, bondDebt: -2, satisfaction: +1,
      notes: 'Whispered promise — even if hollow, she\'ll cling to it. Big bond gain.'
    },

    // -----------------------------------------------------------------
    // DRUGS — artificial stamina bumps + health hits
    // -----------------------------------------------------------------
    'drug-coke': {
      stamina: +20, health: -2, mood: +5, arousal: +5, satisfaction: +2,
      notes: 'Cocaine — artificial stamina spike, small health cost.'
    },
    'drug-weed': {
      stamina: +3, health: 0, mood: +4, arousal: +3, satisfaction: +1,
      notes: 'Weed — mild stamina boost, no health cost. Relaxes her.'
    },
    'drug-mdma': {
      stamina: +15, health: -3, mood: +12, bondXP: +2, arousal: +12, wetness: +15, satisfaction: +2,
      notes: 'MDMA — euphoric stamina lift + arousal flood. Small health hit.'
    },
    'drug-acid': {
      stamina: +5, health: -2, mood: +8, arousal: +5, satisfaction: +2,
      notes: 'Acid — long curve. Mind-altering more than body-altering.'
    },
    'drug-whiskey': {
      stamina: -3, health: -3, mood: +5, arousal: +6, satisfaction: +1,
      notes: 'Whiskey — actually drops stamina (depressant) but loosens her up.'
    },
    'drug-ketamine': {
      stamina: -15, health: -4, mood: -5, satisfaction: +2,
      notes: 'Ketamine — heavy stamina drain (dissociation), health hit.'
    },
    'drug-tranquilizer': {
      stamina: -30, health: -2, mood: -8, satisfaction: +3,
      notes: 'Tranquilizer dart — knocks her out. Heavy stamina drain.'
    },

    // -----------------------------------------------------------------
    // SEXUAL — drain stamina + arousal/wetness/cumLoad shifts
    // -----------------------------------------------------------------
    'sex-gentle': {
      stamina: -8, health: 0, mood: +2, arousal: +12, wetness: +15, cumLoad: +0.6, bondXP: +2, satisfaction: +3,
      notes: 'Gentle sex — moderate stamina cost, positive mood + bond.'
    },
    'sex-rough': {
      stamina: -18, health: -3, mood: -4, arousal: +18, wetness: +20, cumLoad: +0.9, bruises: +2, bondDebt: +3, satisfaction: +5,
      notes: 'Rough sex — bigger stamina hit + bruise accumulation + bond-debt.'
    },
    'sex-anal': {
      stamina: -15, health: -2, mood: -2, arousal: +12, wetness: +10, cumLoad: +0.7, bondDebt: +2, satisfaction: +4,
      notes: 'Anal — high stamina cost, some bond debt.'
    },
    'sex-oral': {
      stamina: -6, health: -1, mood: 0, arousal: +8, wetness: +8, cumLoad: +0.5, satisfaction: +2,
      notes: 'Oral — lower stamina cost, no breeding risk (vag-only gate).'
    },
    'sex-cum-inside': {              // vaginal cum delivery — fires pregnancy conception roll
      stamina: -3, health: 0, mood: -2, cumLoad: +1.2, bondDebt: +2, satisfaction: +6,
      notes: 'Cum inside her pussy — adds bondDebt, fires pregnancy conception roll.'
    },

    // -----------------------------------------------------------------
    // VIOLENCE / HURTME — bruise accumulation + health hits
    // -----------------------------------------------------------------
    'slap': {
      stamina: -2, health: -3, mood: -8, bruises: +1, bondDebt: +3, satisfaction: +3,
      notes: 'Slap — small physical cost, mood hit, bruise.'
    },
    'choke': {
      stamina: -8, health: -5, mood: -6, arousal: +6, bruises: +2, bondDebt: +4, satisfaction: +5,
      notes: 'Choke — stamina drain + health hit + bond debt. Arousal spike for kink fit.'
    },
    'whip': {
      stamina: -10, health: -8, mood: -10, bruises: +4, bondDebt: +6, satisfaction: +6,
      notes: 'Whip — heavy bruise count + health hit. Bond-debt accumulates.'
    },
    'punch': {
      stamina: -5, health: -6, mood: -10, bruises: +3, bondDebt: +5, satisfaction: +4,
      notes: 'Punch — meaningful health hit + bruise + mood + bond debt.'
    },

    // -----------------------------------------------------------------
    // RESTRAINT — low stamina, mood drop
    // -----------------------------------------------------------------
    'restrain': {
      stamina: -1, health: 0, mood: -3, bondDebt: +1, satisfaction: +1,
      notes: 'Restrain her — minimal physical cost, mood drop, bond-debt blip.'
    },

    // -----------------------------------------------------------------
    // PASSIVE STARVATION / DEHYDRATION — applied by tick.js when supplies hit 0
    // -----------------------------------------------------------------
    // Drain rates are intentionally soft. Previous combined starve+dehydrate drain
    // (-8 health/tick) plus 30-second ticks meant a captive went from 100 health to
    // terminal in ~10 real minutes even with regular feeding. New rates give the player
    // a meaningful window to react (~30-40 min from healthy to critical if completely
    // neglected) while still rewarding attention.
    'starve-tick': {
      stamina: -1, health: -1, mood: -3,
      notes: 'Food at 0 — gentle starvation drain. Mood hits harder than health.'
    },
    'dehydrate-tick': {
      stamina: -2, health: -2, mood: -4,
      notes: 'Water at 0 — dehydration drains slightly faster than starvation but still gentle.'
    },
    'chronic-bruise-tick': {
      stamina: -1, health: -1, mood: -2,
      notes: 'Bruises ≥ 15 — chronic injury drain per tick. Soft.'
    },

    // -----------------------------------------------------------------
    // WHORE-OUT — johns drain stamina per encounter
    // -----------------------------------------------------------------
    'john-gentle': {
      stamina: -5, health: 0, mood: -2, cumLoad: +0.5, bondDebt: +2,
      notes: 'Gentle john — moderate stamina cost, light bond debt.'
    },
    'john-rough': {
      stamina: -15, health: -3, mood: -8, cumLoad: +1.0, bruises: +1, bondDebt: +5,
      notes: 'Rough john — heavy stamina cost + health hit + bond debt.'
    },
    'john-quick': {
      stamina: -3, health: 0, mood: -1, cumLoad: +0.3, bondDebt: +1,
      notes: 'Quick john — minimal stamina cost, premium per-minute pay.'
    },
    'john-degrader': {
      stamina: -10, health: -2, mood: -15, cumLoad: +0.8, bondDebt: +8,
      notes: 'Degrader john — mood and bond destruction.'
    },
    // Postmortem-john — no body shifts apply meaningfully to a corpse (stamina/health/
    // mood are already terminal). cumLoad still accrues so recordings still get the
    // "ruined" multiplier; satisfaction registers for the player.
    'john-postmortem': {
      stamina: 0, health: 0, mood: 0, cumLoad: +1.0, bondDebt: 0, satisfaction: +1,
      notes: 'Postmortem use — body inert. cumLoad accrues; no other vital shifts apply on a corpse.'
    }
  });

  // Threshold below which actions become gated. Returns the minimum stamina required
  // for the action to land cleanly. Stamina < required = action still runs but takes
  // a bigger health hit + bigger mood penalty.
  const STAMINA_THRESHOLD_FOR_STRAIN = 20;

  // Apply an action's deltas to a girl. Optional opts:
  //   { strain: true } — applies a strain multiplier (1.5x cost on negative effects)
  function applyAction(girlId, actionId, opts = {}) {
    const action = ACTIONS[actionId];
    if (!action) {
      console.warn(`[action-effects] unknown action: ${actionId}`);
      return { ok: false, reason: 'unknown action' };
    }
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return { ok: false, reason: 'no such girl' };

    const strainMul = opts.strain ? 1.5 : 1.0;
    const body = { ...girl.body };
    const bond = { ...girl.bond };
    const mood = { ...girl.mood };

    if (action.health) {
      const d = action.health < 0 ? action.health * strainMul : action.health;
      body.health = clamp((body.health ?? 100) + d, 0, 100);
    }
    if (action.stamina) {
      const d = action.stamina < 0 ? action.stamina * strainMul : action.stamina;
      // Stamina capped by current health. Low health pulls down the stamina
      // ceiling so a half-dead captive can't run at full stamina.
      const ceiling = body.health ?? 100;
      body.stamina = clamp((body.stamina ?? 70) + d, 0, ceiling);
    }

    // Feed/water actions reset the corresponding "last fed at" / "last watered at"
    // game-clock timestamps so the grace-period
    // model in tickStaminaHealth resets. Any action id starting with 'feed-'
    // touches lastFedAt; any starting with 'water-' touches lastWateredAt.
    if (window.DMTHGame.gameClock) {
      const now = window.DMTHGame.gameClock.now();
      if (actionId.startsWith('feed-')) body.lastFedAt = now;
      if (actionId.startsWith('water-')) body.lastWateredAt = now;
    }
    if (action.arousal) body.arousal = clamp((body.arousal ?? 0) + action.arousal, 0, 100);
    if (action.wetness) body.wetness = clamp((body.wetness ?? 0) + action.wetness, 0, 100);
    if (action.bruises) body.bruises = clamp((body.bruises ?? 0) + (action.bruises < 0 ? action.bruises : action.bruises * strainMul), 0, 99);
    if (action.cumLoad) body.cumLoad = Math.max(0, (body.cumLoad ?? 0) + action.cumLoad);

    // Mood was previously declared in 30+ ACTIONS entries but never applied. moodPressure
    // tracks cumulative drift so the model name reclassifies
    // at threshold boundaries. johnHappinessForGirl already reads mood.mood; this gives
    // the action-effects layer a way to push mood meaningfully.
    if (action.mood) {
      const moodDelta = action.mood < 0 ? action.mood * strainMul : action.mood;
      mood.moodPressure = (mood.moodPressure || 0) + moodDelta;
      // Reclassify mood.mood at major threshold boundaries — keep mood-string in sync
      // with cumulative pressure so johnHappinessForGirl + UI mood-name read correct.
      const p = mood.moodPressure;
      if (p <= -30 && mood.mood !== 'broken') { mood.mood = 'broken'; mood.moodEmoji = '😵'; }
      else if (p <= -15 && !['broken','traumatized'].includes(mood.mood)) { mood.mood = 'subdued'; mood.moodEmoji = '😔'; }
      else if (p <= -5 && ['ambivalent','curious','reciprocated','dependent','partner','devoted','fully-bonded'].includes(mood.mood)) {
        mood.mood = 'wary'; mood.moodEmoji = '😐';
      }
      else if (p >= 30 && ['terrified','wary','broken','catatonic','subdued','traumatized'].includes(mood.mood)) {
        mood.mood = 'reciprocated'; mood.moodEmoji = '😏';
      }
      else if (p >= 15 && ['terrified','wary','broken','catatonic'].includes(mood.mood)) {
        mood.mood = 'acclimating'; mood.moodEmoji = '😶';
      }
      mood.history = [...(mood.history || []), { actionId, deltaPressure: moodDelta, ts: Date.now() }].slice(-30);
    }

    if (action.bondXP) bond.bondXP = Math.max(0, (bond.bondXP ?? 0) + action.bondXP);
    if (action.bondDebt) {
      const d = action.bondDebt < 0 ? action.bondDebt : action.bondDebt * strainMul;
      bond.bondDebt = Math.max(0, (bond.bondDebt ?? 0) + d);
    }

    if (action.notoriety && window.DMTHGame.state.addNotoriety) {
      window.DMTHGame.state.addNotoriety(action.notoriety);
    }

    // Player satisfaction — every action sexualizes; the meter reads action.satisfaction.
    // John actions intentionally have satisfaction=0 in their spec (proxied service, not
    // direct intimacy). Mercy / passive ticks have 0 too. Hunting bonus draws from this
    // meter via hunt.previewCaptureOdds.
    if (action.satisfaction && window.DMTHGame.state.addSatisfaction) {
      window.DMTHGame.state.addSatisfaction(action.satisfaction, actionId);
    }

    window.DMTHGame.state.updateGirl(girlId, { body, bond, mood });
    return { ok: true, action, strain: !!opts.strain };
  }

  // Lookup the compact cost summary for tooltip rendering. Returns a short tight
  // string suitable for hover tooltips:
  //   "ST-8 · MD+3 · AR+12 · WT+15 · CL+0.6 · BX+2 · SAT+3"
  // Codes:
  //   ST=stamina, HP=health, MD=mood, AR=arousal, WT=wetness, BR=bruises, CL=cumLoad,
  //   BX=bondXP, BD=bondDebt, NT=notoriety, SAT=satisfaction
  const COST_CODES = {
    stamina: 'ST', health: 'HP', mood: 'MD', arousal: 'AR', wetness: 'WT',
    bruises: 'BR', cumLoad: 'CL', bondXP: 'BX', bondDebt: 'BD',
    notoriety: 'NT', satisfaction: 'SAT'
  };
  function previewCost(actionId) {
    const a = ACTIONS[actionId];
    if (!a) return '';
    const parts = [];
    for (const k of Object.keys(COST_CODES)) {
      if (a[k] != null && a[k] !== 0) {
        const sign = a[k] > 0 ? '+' : '';
        parts.push(`${COST_CODES[k]}${sign}${a[k]}`);
      }
    }
    return parts.join(' · ');
  }

  // Build a complete tooltip line combining a human-readable label + the cost preview.
  // Used by every UI surface that needs "what does this button do + what stats it shifts"
  // hover info. Returns just the label when the action isn't in the ACTIONS catalog.
  function tooltipForAction(actionId, label) {
    const cost = previewCost(actionId);
    if (!label) return cost ? `📊 ${cost}` : '';
    return cost ? `${label}\n📊 ${cost}` : label;
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  // Defensive helper for any subsystem that needs to advance the body fields per-tick.
  // Used by tick.js to evaluate health-decline factors + passive rest regen.
  // Grace-period model + stamina-capped-by-health: a captive goes 3 game days without
  // water and 5 game days without food before health starts dropping. Below grace,
  // health drains; max stamina falls in lockstep, so if health is lower
  // the maximum stamina can reach is reduced also".
  //
  // Health drain ONLY kicks in once the grace period expires:
  //   - Water grace: 3 game days (body.lastWateredAt vs gameClock.now())
  //   - Food grace:  5 game days (body.lastFedAt vs gameClock.now())
  // Before the grace expires, the captive sits in passive-rest regen even
  // when her consumable stocks are 0.
  //
  // Stamina max-cap = body.health. Low health pulls down the stamina ceiling,
  // so a half-dead captive can't run at full stamina even when rested.
  // Stress-state bonus. The player earns a payout for keeping a captive in a
  // visibly-stressed health band — a bonus
  // or super bonus if a certain range is maintained".
  //
  // Stress range: body.health 25-55 (above terminal, below comfortable — she's
  // alive but visibly struggling, the cinematic "tense" zone). Streak counter
  // accumulates game-MINUTES while in range; resets when she leaves the band.
  // Two reward tiers per girl (one-time award each, persists for life):
  //   Tier 1 at  5 game days =  7200 stress-minutes — $500  + stressFilmMultiplier 1.15
  //   Tier 2 at 15 game days = 21600 stress-minutes — $2000 + stressFilmMultiplier 1.35
  //
  // stressFilmMultiplier is consumed by js/game/film.js stopRecording when listing
  // a film, mirroring the wardrobe multiplier pattern.
  const STRESS_RANGE_MIN = 25;
  const STRESS_RANGE_MAX = 55;
  const STRESS_TIER_1_MIN = 5 * 1440;   // 7200 stress game-minutes (5 game days)
  const STRESS_TIER_2_MIN = 15 * 1440;  // 21600 stress game-minutes (15 game days)
  const STRESS_TIER_1_PAYOUT = 500;
  const STRESS_TIER_2_PAYOUT = 2000;
  const STRESS_TIER_1_FILM_MUL = 1.15;
  const STRESS_TIER_2_FILM_MUL = 1.35;

  const WATER_GRACE_DAYS = 3;
  const FOOD_GRACE_DAYS = 5;
  // Captives self-serve from the hold's reserve when their
  // grace timer gets halfway low. Set well before the grace expires so a fresh
  // captive with reserve in her hold doesn't even approach starvation.
  const FOOD_AUTOCONSUME_DAYS = 2.5;    // half the 5-day food grace
  const WATER_AUTOCONSUME_DAYS = 1.5;   // half the 3-day water grace
  function tickStaminaHealth() {
    const s = window.DMTHGame.state.current;
    if (!s) return;
    const clock = window.DMTHGame.gameClock;
    for (const girl of s.roster) {
      if (girl.encounterState !== 'captive') continue;
      const body = { ...(girl.body || {}) };
      const bruises = body.bruises || 0;

      // Look up the hold once — used for self-serve consumption + plumbing check.
      const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
      const holdIdx = girl.assignedHoldIdx ?? 0;
      const hold = dungeon?.holds?.[holdIdx];
      const toiletTier = hold?.upgrades?.toilet ?? 0;
      const waterSupplyTier = hold?.upgrades?.waterSupply ?? 0;
      const waterPlumbed = toiletTier >= 2 || waterSupplyTier >= 2;

      // ── Self-serve auto-consumption ──────────────────────────────────────
      // Captive pulls from the hold reserve when she's getting hungry/thirsty.
      // Plumbed water means she auto-refreshes the water timestamp without
      // consuming any reserve at all (toilet-fed faucet / drainback supply).
      let daysSinceFed = clock ? clock.daysSince(body.lastFedAt) : 0;
      let daysSinceWatered = clock ? clock.daysSince(body.lastWateredAt) : 0;
      let holdDirty = false;
      const holdPatch = hold ? { ...hold } : null;

      if (waterPlumbed) {
        // Auto-drinks from plumbed source — never needs reserve, never dehydrates.
        if (clock) body.lastWateredAt = clock.now();
        daysSinceWatered = 0;
      } else if (holdPatch && daysSinceWatered > WATER_AUTOCONSUME_DAYS && (holdPatch.waterReserve || 0) > 0) {
        holdPatch.waterReserve = (holdPatch.waterReserve || 0) - 1;
        if (clock) body.lastWateredAt = clock.now();
        daysSinceWatered = 0;
        holdDirty = true;
      }

      if (holdPatch && daysSinceFed > FOOD_AUTOCONSUME_DAYS && (holdPatch.foodReserve || 0) > 0) {
        holdPatch.foodReserve = (holdPatch.foodReserve || 0) - 1;
        if (clock) body.lastFedAt = clock.now();
        daysSinceFed = 0;
        holdDirty = true;
      }

      if (holdDirty && dungeon) {
        const newHolds = dungeon.holds.map((h, i) => i === holdIdx ? holdPatch : h);
        window.DMTHGame.state.updateDungeon(dungeon.id, { holds: newHolds });
      }

      // ── Drain evaluation ────────────────────────────────────────────────
      const starving = daysSinceFed > FOOD_GRACE_DAYS;
      const dehydrated = !waterPlumbed && daysSinceWatered > WATER_GRACE_DAYS;

      let staminaDelta = 0;
      let healthDelta = 0;
      const reasons = [];

      if (starving) {
        staminaDelta += ACTIONS['starve-tick'].stamina;
        healthDelta += ACTIONS['starve-tick'].health;
        reasons.push('starving');
      }
      if (dehydrated) {
        staminaDelta += ACTIONS['dehydrate-tick'].stamina;
        healthDelta += ACTIONS['dehydrate-tick'].health;
        reasons.push('dehydrated');
      }
      if (bruises >= 15) {
        staminaDelta += ACTIONS['chronic-bruise-tick'].stamina;
        healthDelta += ACTIONS['chronic-bruise-tick'].health;
        reasons.push('chronic-injury');
      }

      // Passive rest regen — when no negative pressure this tick.
      if (staminaDelta === 0 && healthDelta === 0) {
        staminaDelta += ACTIONS['rest-tick'].stamina;
        healthDelta += ACTIONS['rest-tick'].health;
      }

      // Apply deltas. Note `body` was already shallow-cloned at the top of the
      // loop and may carry self-serve updates to lastFedAt / lastWateredAt — so
      // we always persist the body, even if both deltas are zero, so those
      // timestamp resets aren't lost.
      const newHealth = clamp((body.health ?? 100) + healthDelta, 0, 100);
      // Stamina capped by health — low health pulls down the stamina ceiling.
      body.health = newHealth;
      body.stamina = clamp((body.stamina ?? 70) + staminaDelta, 0, newHealth);

      // Stress-state streak tracking. Increment counter while in band;
      // reset out of band. Each tick adds ~30 game-minutes (one tick of game time).
      const inStressBand = newHealth >= STRESS_RANGE_MIN && newHealth <= STRESS_RANGE_MAX;
      const prevStreak = body.stressStreakMin || 0;
      if (inStressBand) {
        body.stressStreakMin = prevStreak + 30;
      } else {
        body.stressStreakMin = 0;
      }

      // Milestone award checks. bonuses block is created lazily.
      const bonuses = { ...(girl.bonuses || { stressBonusTier: 0, stressFilmMultiplier: 1.0 }) };
      let payout = 0;
      let unlockedTier = null;
      if (bonuses.stressBonusTier < 1 && body.stressStreakMin >= STRESS_TIER_1_MIN) {
        bonuses.stressBonusTier = 1;
        bonuses.stressFilmMultiplier = STRESS_TIER_1_FILM_MUL;
        payout = STRESS_TIER_1_PAYOUT;
        unlockedTier = 1;
      }
      if (bonuses.stressBonusTier < 2 && body.stressStreakMin >= STRESS_TIER_2_MIN) {
        bonuses.stressBonusTier = 2;
        bonuses.stressFilmMultiplier = STRESS_TIER_2_FILM_MUL;
        payout = STRESS_TIER_2_PAYOUT;
        unlockedTier = 2;
      }

      window.DMTHGame.state.updateGirl(girl.id, { body, bonuses, _lastStaminaReasons: reasons });

      if (payout > 0) {
        window.DMTHGame.state.addMoney(payout);
        if (window.DMTHNotify) {
          const label = unlockedTier === 2 ? '⚡ SUPER STRESS BONUS' : '💢 STRESS BONUS';
          const mul = unlockedTier === 2 ? STRESS_TIER_2_FILM_MUL : STRESS_TIER_1_FILM_MUL;
          window.DMTHNotify.show(`${label} — ${girl.name} kept tense for ${unlockedTier === 2 ? 15 : 5} days. +$${payout.toLocaleString()} + ${mul}× film multiplier on her recordings.`, { type: 'success', durationMs: 6000 });
        }
      }
    }
  }

  // Better-trained girls earn more — computes a 0..1.5 happiness multiplier for a girl,
  // suitable for multiplying basePay in the john-resolver. Inputs: Stockholm bond
  // (trained = bigger payout), stamina + health (above threshold = good service),
  // mood (happy mood = happy john), outfit multiplier. Returns the multiplier + a
  // diagnostic breakdown for tooltip display.
  //
  // The john-resolver should call this when computing per-encounter pay:
  //   const { multiplier } = DMTHGame.actionEffects.johnHappinessForGirl(girl);
  //   const finalPay = basePay * multiplier;
  function johnHappinessForGirl(girl) {
    if (!girl) return { multiplier: 1.0, breakdown: {} };
    const body = girl.body || {};
    const bond = girl.bond || {};
    const stamina = body.stamina ?? 70;
    const health = body.health ?? 100;
    const mood = girl.mood?.mood || 'neutral';
    const currentOutfit = (girl.wardrobe || []).find(w => w.id === girl.currentOutfit);
    const outfitMul = currentOutfit?.multiplier || 1.0;

    // Stockholm bond — every level multiplies pay by ~10%. Cap at 1.9 (L9).
    const bondFactor = 1 + (bond.bondLevel || 0) * 0.10;

    // Stamina — above STAMINA_THRESHOLD_FOR_STRAIN = full, below = degraded
    const staminaFactor = stamina >= STAMINA_THRESHOLD_FOR_STRAIN
      ? Math.min(1.2, 0.6 + stamina / 100 * 0.6)
      : Math.max(0.3, stamina / STAMINA_THRESHOLD_FOR_STRAIN * 0.6);

    // Health — same shape but harder to recover from
    const healthFactor = health >= 30
      ? Math.min(1.15, 0.7 + health / 100 * 0.45)
      : Math.max(0.4, health / 30 * 0.7);

    // Mood — happy moods multiply, broken moods penalize
    const moodTable = {
      'fully-bonded': 1.20, 'devoted': 1.15, 'partner': 1.10, 'dependent': 1.05,
      'reciprocated': 1.05, 'ambivalent': 1.00, 'curious': 1.02, 'acclimating': 0.95,
      'wary': 0.85, 'terrified': 0.75, 'broken': 0.60, 'catatonic': 0.50,
      'aroused': 1.10, 'needy': 1.08, 'playful': 1.05,
      'defiant': 0.70, 'traumatized': 0.55, 'subdued': 0.85
    };
    let moodFactor = 1.0;
    for (const [k, v] of Object.entries(moodTable)) {
      if (mood.includes(k)) { moodFactor = v; break; }
    }

    const multiplier = clamp(bondFactor * staminaFactor * healthFactor * moodFactor * outfitMul, 0.2, 3.0);
    return {
      multiplier,
      breakdown: {
        bondFactor, staminaFactor, healthFactor, moodFactor, outfitMul,
        stamina, health, mood, bondLevel: bond.bondLevel || 0
      }
    };
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.actionEffects = Object.freeze({
    ACTIONS,
    STAMINA_THRESHOLD_FOR_STRAIN,
    COST_CODES,
    applyAction,
    previewCost,
    tooltipForAction,
    tickStaminaHealth,
    johnHappinessForGirl
  });
})();
