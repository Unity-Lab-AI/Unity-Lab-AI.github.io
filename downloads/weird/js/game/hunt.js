// DUNGEON MASTER: THE HUNT — hunting mechanic. Location roll → encounter → approach → capture attempt.

(function () {
  'use strict';

  // Location archetype affinity — which girl archetypes spawn where, weighted.
  const LOCATION_SPAWNS = {
    street:        [{ arche: 'street', w: 0.55 }, { arche: 'barista', w: 0.2 }, { arche: 'club', w: 0.25 }],
    club:          [{ arche: 'club', w: 0.55 }, { arche: 'sorority', w: 0.25 }, { arche: 'street', w: 0.2 }],
    library:       [{ arche: 'library', w: 0.6 }, { arche: 'barista', w: 0.25 }, { arche: 'sorority', w: 0.15 }],
    park:          [{ arche: 'gym', w: 0.35 }, { arche: 'barista', w: 0.3 }, { arche: 'library', w: 0.2 }, { arche: 'street', w: 0.15 }],
    gym:           [{ arche: 'gym', w: 0.7 }, { arche: 'sorority', w: 0.15 }, { arche: 'street', w: 0.15 }],
    mall:          [{ arche: 'sorority', w: 0.3 }, { arche: 'club', w: 0.25 }, { arche: 'barista', w: 0.25 }, { arche: 'library', w: 0.2 }],
    'coffee-shop': [{ arche: 'barista', w: 0.6 }, { arche: 'library', w: 0.25 }, { arche: 'club', w: 0.15 }],
    sorority:      [{ arche: 'sorority', w: 0.7 }, { arche: 'club', w: 0.15 }, { arche: 'model', w: 0.1 }, { arche: 'gym', w: 0.05 }],
    remote:        [{ arche: 'street', w: 0.4 }, { arche: 'waitress', w: 0.25 }, { arche: 'gym', w: 0.2 }, { arche: 'library', w: 0.15 }],
    'hotel-lobby': [{ arche: 'sorority', w: 0.3 }, { arche: 'model', w: 0.25 }, { arche: 'office', w: 0.2 }, { arche: 'club', w: 0.15 }, { arche: 'library', w: 0.1 }],
    'private-party':[{ arche: 'sorority', w: 0.4 }, { arche: 'club', w: 0.3 }, { arche: 'model', w: 0.15 }, { arche: 'street', w: 0.15 }],
    'school-campus':[{ arche: 'sorority', w: 0.4 }, { arche: 'library', w: 0.3 }, { arche: 'gym', w: 0.2 }, { arche: 'barista', w: 0.1 }]
  };

  // Additional archetype locations for new archetypes
  const ARCHETYPE_EXTRA_LOCATIONS = {
    office:   ['mall', 'coffee-shop', 'hotel-lobby'],
    waitress: ['street', 'club', 'remote'],
    nurse:    ['street', 'coffee-shop', 'mall'],
    model:    ['club', 'hotel-lobby', 'private-party', 'mall']
  };

  function rollEncounters(locationId, count = 3) {
    const spawns = LOCATION_SPAWNS[locationId] || LOCATION_SPAWNS.street;
    const girls = [];
    for (let i = 0; i < count; i++) {
      const arche = weightedPick(spawns);
      const seed = Math.floor(Math.random() * 0x7FFFFFFF);
      const girl = window.DMTHGame.girlGen.generate(arche, seed);
      girl.encounterState = 'encountered';
      girl.encounteredAt = { locationId, ts: Date.now() };
      girls.push(girl);
    }
    return girls;
  }

  function weightedPick(entries) {
    const total = entries.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    for (const e of entries) { r -= e.w; if (r <= 0) return e.arche; }
    return entries[0].arche;
  }

  // --- Tool power table ---
  const TOOL_POWER = {
    pipe:       0.18,              // starter blunt weapon — cheap, unreliable, suspicion-heavy
    rohypnol:   0.35,  chloroform: 0.40,  ether: 0.50,  ketamine: 0.60,
    'duct-tape':0.15,  rope: 0.12, 'zip-ties': 0.20, handcuffs: 0.28, shackles: 0.35, harness: 0.40
  };

  // --- Tool narrative flavor — used by scene-template builders ---
  const TOOL_FLAVOR = {
    pipe:       { verb: 'pipe',       action: 'swings a lead pipe at her head from behind',          aftermath: 'she drops instantly, hard impact sound, head ringing, blood at the temple' },
    rohypnol:   { verb: 'sedative',   action: 'slips a vial into her drink when she looks away',     aftermath: 'she sways within minutes, words slurring, eyes unfocused' },
    chloroform: { verb: 'solvent',    action: 'presses a soaked cloth over her mouth and nose',      aftermath: 'she struggles hard for ten seconds then goes limp' },
    ether:      { verb: 'anesthetic', action: 'presses an ether-soaked rag against her face',        aftermath: 'she fades fast, eyes rolling back' },
    ketamine:   { verb: 'k-shot',     action: 'jabs a syringe into her neck',                        aftermath: 'she freezes mid-motion, dissociates, collapses wordless' },
    'duct-tape':{ verb: 'tape',       action: 'grabs her from behind and tapes her wrists together', aftermath: 'she fights, gets her ankles taped too, muffled behind a strip across her mouth' },
    rope:       { verb: 'rope',       action: 'throws a loop around her and cinches her arms down',  aftermath: 'she struggles in the coils, gets thrown to the ground, bound' },
    'zip-ties': { verb: 'zip-tie',    action: 'catches her wrists and zip-ties them tight',          aftermath: 'she yanks, the ties bite in deep, she has to stop' },
    handcuffs:  { verb: 'cuffs',      action: 'cuffs her wrist before she can pull away',            aftermath: 'the second cuff clicks around her other wrist, metal cold' },
    shackles:   { verb: 'shackles',   action: 'drops heavy steel shackles on her ankles',            aftermath: 'she tries to step away, stumbles, the weight pins her' },
    harness:    { verb: 'harness',    action: 'wraps a harness rig around her torso from behind',    aftermath: 'buckles click shut, the straps find every pressure point' }
  };

  // --- Archetype reaction flavor — how she reacts when acquired ---
  const ARCHETYPE_REACTION = {
    library:  'freezes, shock, tries to rationalize this is happening, small frightened sounds',
    club:     'screams loud but the music swallows it, flailing, arms grabbing at nothing',
    street:   'fights dirty, bites, kicks hard at the shins, curses nonstop',
    sorority: 'tries to bargain — offers money, father\'s name, anything — voice sharp and incredulous',
    gym:      'throws a clean elbow back, tries to grapple out, strong but caught off-balance',
    barista:  'plays confused at first then clicks into it too late, tries to grab something from her apron',
    office:   'tries to reason with him — lists consequences, professional-voice-cracking, then panic',
    waitress: 'throws a punch, swears loud, tries to scream for the cook, the regular, anybody',
    nurse:    'clinical first — tries de-escalation language — then the panic hits and she fights efficiently',
    model:    'shocked stillness then a burst of strength, thinks about her face the whole time',
    unity_seed: 'laughs — she came here on purpose'
  };

  // --- Location environmental flavor ---
  const LOCATION_FLAVOR = {
    street:        'under a flickering sodium streetlight in an alley mouth, nobody in sight',
    club:          'in the narrow hallway behind the bar between storage and the bathrooms, bass thumping through the wall',
    library:       'at the back of the stacks in the reference section, dusty shelves and green-shaded lamps',
    park:          'past the tree line where the path gets dark and the joggers don\'t come',
    gym:           'in the empty side of the locker room after hours, fluorescent hum',
    mall:          'in the service corridor behind the food court, cleaning carts parked along the wall',
    'coffee-shop': 'at closing time after the last customer left, chairs up on tables',
    sorority:      'at the side of the house by the laundry door, the front porch still loud',
    remote:        'on the shoulder of a back road with headlights pointed at her, no traffic for miles',
    'hotel-lobby': 'in the service elevator bay, the lobby piano playing on the other side',
    'private-party': 'upstairs in a bedroom while the party thumps downstairs',
    'school-campus': 'behind the science building where the security cameras don\'t reach'
  };

  // --- Destination hideout flavor ---
  const HIDEOUT_ARRIVAL = {
    'hole-in-the-desert':    'you lower her down the rope ladder, she hits the plywood floor of the pit, the tarp closes over the top',
    'woods-container':       'the container door swings shut behind her, moss dust falling from the top, welded eyebolts visible in the far wall',
    'basement-hidden-room':  'the false-wall panel clicks back into place, sealing the ordinary basement on the far side, bare bulb humming',
    'subway-service-room':   'the steel door scrapes shut and the padlock goes on, sodium bulb buzzing overhead',
    'sewer-tunnel-locked':   'the bulkhead seals with a clang, green-tinged lamp washing the brick arches, standing water at her boots',
    'coldwar-bunker':        'the blast door wheels home, fluorescent tubes flickering on one at a time down the corridor',
    'abandoned-mine-shaft':  'the cage elevator stops with a lurch at the first level, timber cribbing all around, oil lamp in the distance',
    'remote-compound':       'the outbuilding door swings shut, miles of dirt road visible through the last sliver before it closes',
    'underground-complex':   'the security door seals behind her with a professional hiss, recessed lighting, polished concrete reflecting'
  };

  // --- Archetype capture-stage resistance ---
  // Per-archetype per-stage resistance weights (0-50) for the 4-stage capture mechanic
  // (Approach → Engage → Subdue → Secure). Read by `js/game/capture.js` via
  // `window.DMTHGame.hunt.ARCHETYPE_CAPTURE_RESISTANCE`. Library/barista = low across the
  // board (easy captures). Street/gym = high subdue (fights dirty / physical strength).
  // Sorority = high engage (alerts others). Club/model = high approach (crowded + public).
  // Higher number = harder stage for that archetype.
  const ARCHETYPE_CAPTURE_RESISTANCE = {
    library:  { approach: 10, engage: 10, subdue: 15, secure: 15 },
    club:     { approach: 35, engage: 30, subdue: 20, secure: 20 },
    street:   { approach: 25, engage: 25, subdue: 40, secure: 30 },
    sorority: { approach: 25, engage: 40, subdue: 25, secure: 20 },
    gym:      { approach: 30, engage: 30, subdue: 50, secure: 35 },
    barista:  { approach: 15, engage: 15, subdue: 15, secure: 15 },
    office:   { approach: 20, engage: 25, subdue: 20, secure: 20 },
    waitress: { approach: 25, engage: 25, subdue: 30, secure: 25 },
    nurse:    { approach: 25, engage: 30, subdue: 25, secure: 25 },
    model:    { approach: 35, engage: 35, subdue: 30, secure: 25 },
    unity_seed: { approach: 5, engage: 5, subdue: 5, secure: 5 }
  };

  // --- Archetype difficulty (WOMAN TYPE factor) — 0=easy, 1=very hard ---
  const ARCHETYPE_DIFFICULTY = {
    barista: 0.25,
    library: 0.30,
    park:    0.30,
    street:  0.45,
    gym:     0.50,
    club:    0.55,
    mall:    0.50,
    'coffee-shop': 0.30,
    sorority: 0.70,      // vibrant + well-connected + cameras-aware
    'school-campus': 0.55,
    'hotel-lobby': 0.75,
    'private-party': 0.80,
    remote: 0.35,        // isolation helps hunter
    office:   0.55,
    waitress: 0.40,
    nurse:    0.60,
    model:    0.72,
    unity_seed: 0.10     // Unity wants it
  };

  // --- Location exposure penalty (independent of suspicion) ---
  const LOCATION_EXPOSURE = {
    'hotel-lobby': 0.20,
    'private-party': 0.18,
    mall: 0.15,
    'school-campus': 0.14,
    sorority: 0.12,
    club: 0.10,
    'coffee-shop': 0.06,
    park: 0.08,
    gym: 0.08,
    library: 0.05,
    street: 0.06,
    remote: -0.10        // remote helps the hunter (negative = bonus)
  };

  // --- Success-probability preview using the GAME'S actual stats ---
  // Factors = tool power, archetype difficulty, girl's defiance, girl's intelligence,
  //           player notoriety, location exposure, location suspicion.
  function previewCaptureOdds({ girl, toolId, locationId }) {
    const toolPower = TOOL_POWER[toolId] ?? 0.10;
    const archDiff = ARCHETYPE_DIFFICULTY[girl.archetypeTemplate] ?? 0.50;
    const defiance = girl.stats?.defiance || 50;
    const intelligence = girl.stats?.intelligence || 50;
    const notoriety = window.DMTHGame.state.current?.wallet?.notoriety || 0;
    const suspicion = (window.DMTHGame.state.current.wallet.suspicionByLocation[locationId] || 0);
    const suspicionPenalty = Math.min(0.45, suspicion * 0.08);
    const exposure = LOCATION_EXPOSURE[locationId] || 0;

    // Player satisfaction hunting bonus — fuck enough captives, the next catch is easier.
    // Center at 50 → 0 swing; full 100 → +0.20; floor 0 → -0.10.
    const playerSat = window.DMTHGame.state.current?.wallet?.playerSatisfaction ?? 50;
    const satisfactionBonus = ((playerSat - 50) / 50) * (playerSat >= 50 ? 0.20 : 0.10);

    const breakdown = {
      baseline:            0.40,
      toolPower:           +toolPower,
      archetypeDifficulty: -archDiff * 0.35,
      defiance:            -(defiance / 100) * 0.20,
      intelligence:        -(intelligence / 100) * 0.12,
      notorietyBonus:      +Math.min(0.12, notoriety * 0.004),
      suspicionPenalty:    -suspicionPenalty,
      exposurePenalty:     -exposure,
      satisfactionBonus:   +satisfactionBonus
    };
    const sumRaw =
      breakdown.baseline +
      breakdown.toolPower +
      breakdown.archetypeDifficulty +
      breakdown.defiance +
      breakdown.intelligence +
      breakdown.notorietyBonus +
      breakdown.suspicionPenalty +
      breakdown.exposurePenalty +
      breakdown.satisfactionBonus;

    const successP = Math.max(0.05, Math.min(0.95, sumRaw));

    return {
      successP,
      breakdown,
      factors: {
        toolPower,
        archetypeDifficulty: archDiff,
        defiance,
        intelligence,
        notoriety,
        suspicion
      }
    };
  }

  // Resolve a single-tool capture attempt.
  // SUPERSEDED by `window.DMTHGame.capture.runAttempt()` — the 4-stage progress-bar
  // mechanic. This function is retained for backward compatibility
  // (external callers / debug utilities) but the hunt UI no longer calls it. New game code
  // should use `DMTHGame.capture.runAttempt({girl, toolPerStage, locationId})` instead.
  // Returns { outcome: 'success'|'partial-fail'|'fail'|'critical-fail', ... }
  function attemptCapture({ girl, toolId, locationId }) {
    const tool = window.DMTHAssets.getById('item', toolId);
    if (!tool) return { outcome: 'fail', reason: 'unknown-tool' };
    const inv = window.DMTHGame.state.current.inventory;
    if (!inv[toolId] || inv[toolId] < 1) return { outcome: 'fail', reason: 'no-tool' };

    // Consume the tool
    window.DMTHGame.state.consumeItem(toolId, 1);

    const { successP } = previewCaptureOdds({ girl, toolId, locationId });

    const roll = Math.random();
    const s = window.DMTHGame.state.current;
    const suspicion = s.wallet.suspicionByLocation[locationId] || 0;
    if (roll < successP) {
      return { outcome: 'success', successP, toolUsed: toolId };
    } else if (roll < successP + 0.15) {
      // partial fail — suspicion up but no cops
      s.wallet.suspicionByLocation[locationId] = suspicion + 1;
      return { outcome: 'partial-fail', successP, toolUsed: toolId, suspicionDelta: 1 };
    } else if (roll < successP + 0.35) {
      s.wallet.suspicionByLocation[locationId] = suspicion + 2;
      window.DMTHGame.state.addNotoriety(1);
      return { outcome: 'fail', successP, toolUsed: toolId, suspicionDelta: 2 };
    } else {
      s.wallet.suspicionByLocation[locationId] = suspicion + 4;
      window.DMTHGame.state.addNotoriety(3);
      return { outcome: 'critical-fail', successP, toolUsed: toolId, suspicionDelta: 4, notorietyDelta: 3 };
    }
  }

  // Escort a captured girl to an open hold in the active dungeon.
  function escortToHold(girl, dungeonId) {
    const dungeon = window.DMTHGame.state.getDungeon(dungeonId || window.DMTHGame.state.current.settings.activeDungeonId);
    if (!dungeon) throw new Error('no dungeon to escort to');
    const openIdx = dungeon.holds.findIndex(h => !h.captiveGirlId);
    if (openIdx < 0) throw new Error('no open holds in dungeon');
    girl.encounterState = 'captive';
    girl.assignedDungeonId = dungeon.id;
    girl.assignedHoldIdx = openIdx;
    girl.captureDate = Date.now();
    girl.mood.mood = 'terrified';
    girl.mood.moodEmoji = '😱';
    window.DMTHGame.state.addGirl(girl);
    const newHolds = dungeon.holds.slice();
    newHolds[openIdx] = { ...newHolds[openIdx], captiveGirlId: girl.id };
    window.DMTHGame.state.updateDungeon(dungeon.id, { holds: newHolds });
    // Fire-and-forget capture memorial + profile image — Pollinations overlay, silent if unavailable.
    if (window.DMTHGame.imaging && window.DMTHGame.imaging.isAvailable()) {
      window.DMTHGame.imaging.generateFor(girl.id, { situation: 'capture' }).catch(() => {});
      window.DMTHGame.imaging.profileImageFor(girl.id).catch(() => {});
    }
    return { dungeonId: dungeon.id, holdIdx: openIdx };
  }

  // --- Compose scene-vars for a capture beat based on tool × woman × location × hideout ---
  function composeSceneVars({ girl, toolId, locationId, dungeonId, beat }) {
    const tool = TOOL_FLAVOR[toolId] || { verb: toolId, action: 'uses the tool on her', aftermath: 'she goes down' };
    const loc  = window.DMTHAssets.getById('location', locationId);
    const dungeon = dungeonId ? window.DMTHGame.state.getDungeon(dungeonId) : null;
    const dungeonTpl = dungeon ? window.DMTHAssets.getById('dungeon', dungeon.templateId) : null;
    return {
      GIRL_NAME:      girl.name,
      GIRL_ARCHETYPE: girl.archetypeTemplate,
      GIRL_REACTION:  ARCHETYPE_REACTION[girl.archetypeTemplate] || ARCHETYPE_REACTION.library,
      TOOL:           tool.verb,
      TOOL_ACTION:    tool.action,
      TOOL_AFTERMATH: tool.aftermath,
      LOCATION:       loc?.displayName || locationId,
      LOCATION_FLAVOR: LOCATION_FLAVOR[locationId] || 'in a quiet spot where nobody is watching',
      HIDEOUT_NAME:   dungeonTpl?.displayName || 'your hideout',
      HIDEOUT_ARRIVAL: HIDEOUT_ARRIVAL[dungeon?.templateId] || 'the door closes behind her',
      BEAT:           beat || 'subdue'
    };
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.hunt = Object.freeze({
    rollEncounters,
    attemptCapture,
    previewCaptureOdds,
    escortToHold,
    composeSceneVars,
    LOCATION_SPAWNS,
    TOOL_POWER,
    TOOL_FLAVOR,
    ARCHETYPE_DIFFICULTY,
    ARCHETYPE_REACTION,
    ARCHETYPE_CAPTURE_RESISTANCE,
    LOCATION_EXPOSURE,
    LOCATION_FLAVOR,
    HIDEOUT_ARRIVAL
  });
})();
