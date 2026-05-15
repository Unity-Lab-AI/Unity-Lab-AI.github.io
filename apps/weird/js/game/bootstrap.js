// DUNGEON MASTER: THE HUNT — new-game bootstrap.
// Wires the initial state: wallet, starter dungeon, Unity as seeded starter captive.

(function () {
  'use strict';

  function isStarted() {
    const s = window.DMTHGame.state.current;
    return !!(s && s.createdAt);
  }

  async function newGame(opts = {}) {
    const state = window.DMTHGame.state.initNew({ mode: opts.mode || 'normal' });

    // Starter dungeon — hole-in-the-desert (1 hold)
    const startTemplate = window.DMTHAssets.getById('dungeon', 'hole-in-the-desert');
    const dungeonId = 'dun_' + Date.now().toString(36);
    const dungeon = {
      id: dungeonId,
      templateId: startTemplate.id,
      displayName: 'Your Pit',
      capacity: startTemplate.roomSlots,
      // Each hold carries its own food + water reserve.
      // Player drops food/water into the reserve; captives self-serve from it
      // on tick. Player can pickup to starve a girl. Starter dungeon seeds the
      // first hold with enough to keep Unity going for the first session.
      holds: Array.from({ length: startTemplate.roomSlots }, (_, i) => ({
        id: `${dungeonId}_hold_${i}`,
        captiveGirlId: null,
        holdType: startTemplate.holdType,
        restraintStatus: 'standard',
        foodReserve: i === 0 ? 8 : 0,
        waterReserve: i === 0 ? 12 : 0
      })),
      locationDescriptor: 'a remote stretch of desert 2 hours east',
      purchasedAt: Date.now()
    };
    window.DMTHGame.state.addDungeon(dungeon);
    window.DMTHGame.state.current.settings.activeDungeonId = dungeonId;

    // Unity as seeded starter — NOT re-rolled, fixed identity.
    if (opts.includeUnity !== false) {
      const unity = buildUnity(dungeonId);
      // Assign to hold 0
      unity.assignedDungeonId = dungeonId;
      unity.assignedHoldIdx = 0;
      unity.encounterState = 'captive';
      unity.captureDate = Date.now();
      unity.bond.bondLevel = 2;          // already acclimated — she came willingly the first time
      unity.bond.bondXP = 25;
      unity.mood.mood = 'curious';
      unity.mood.moodEmoji = '👀';

      window.DMTHGame.state.addGirl(unity);
      window.DMTHGame.state.updateDungeon(dungeonId, {
        holds: dungeon.holds.map((h, i) => i === 0 ? { ...h, captiveGirlId: unity.id } : h)
      });
      window.DMTHGame.state.current.settings.activeGirlId = unity.id;
    }

    // Sandbox mode: stock inventory with 99 of every catalog item
    if (opts.mode === 'sandbox') {
      for (const item of window.DMTHAssets.ITEMS) {
        window.DMTHGame.state.addItem(item.id, 99);
      }
      // Safety — ensure drug-scheduler itemIds are present even if catalog shifts
      for (const id of ['coke-bumps','mdma','acid','wine','weed','ketamine']) {
        if (!window.DMTHGame.state.current.inventory[id]) {
          window.DMTHGame.state.addItem(id, 99);
        }
      }
    } else {
      // Normal mode: starter inventory — cheap blunt pipe + tape. Classic desperate-early-game kit.
      window.DMTHGame.state.addItem('pipe', 1);
      window.DMTHGame.state.addItem('duct-tape', 2);
      window.DMTHGame.state.addItem('rope', 1);
    }

    await window.DMTHGame.state.save();
    return state;
  }

  function buildUnity(dungeonId) {
    const unityTemplate = window.DMTHGame.girlGen.ARCHETYPE_POOLS.unity_seed;
    const seed = 0x50FA11ED & 0x7FFFFFFF;   // fixed — Unity's canonical seed (int32 positive)
    const facial = unityTemplate.facialTokens[0];
    const outfit = unityTemplate.outfitTokens[0];

    return {
      id: 'girl_unity',
      name: 'Unity',
      age: 25,
      archetypeTemplate: 'unity_seed',
      voiceId: 'af_nicole',              // husky playful — closest real Kokoro voice to Unity's vibe
      personaSpeechTokens: unityTemplate.speechTokens.slice(),
      kinks: unityTemplate.kinksPool.slice(),
      drugsOfChoice: unityTemplate.drugsPool.slice(),
      backstoryFragment: 'Unity — 25, goth, coder, nympho coke whore. Came to Master the first time on her own two leather-booted feet. Stayed. Keeps coming back. Something in her wanted the pit the second she saw it. The pit wanted her back.',

      // Fresh capture means no bruises, no cum load — captives don't carry prior
      // violence on first spawn.
      // lastFedAt + lastWateredAt are seeded at spawn so the grace-period model in
      // tickStaminaHealth has a baseline.
      body: { arousal: 87, wetness: 94, cumLoad: 0, bruises: 0, high: 91, activeDrugs: ['coke','weed'], pose: 'kneeling at the rope ladder, knees spread', outfitState: 'leather opened, tits exposed', stamina: 80, health: 100, lastFedAt: window.DMTHGame.gameClock?.now() ?? 0, lastWateredAt: window.DMTHGame.gameClock?.now() ?? 0 },
      mood: { mood: 'curious', moodEmoji: '👀', history: [] },
      stats: Object.fromEntries(Object.entries(unityTemplate.statsRanges).map(([k, [lo]]) => [k, lo])),
      bond: { bondLevel: 2, bondXP: 25, bondDebt: 0, milestones: ['came-willingly-first-time'] },
      escape: { currentRisk: 0.08, factors: { bondLevel: -0.4, defiance: +0.1 }, lastAttempt: null },

      encounterState: 'captive',
      assignedDungeonId: dungeonId,
      assignedHoldIdx: 0,
      captureDate: Date.now(),

      visualIdentity: {
        seed,
        facialDescription: facial,
        defaultOutfitDescription: outfit,
        profileImagePath: null,
        profileImageGeneratedAt: null,
        additionalImages: []
      },

      wardrobe: [{ id: 'default', displayName: 'her leather', description: outfit, source: 'born-with' }],
      currentOutfit: 'default',

      consumables: {
        // Stocks of 25/35 — fresh captive doesn't run dry in 2.5 minutes. With
        // slower drain rates, this gives the player a meaningful window to discover
        // the feed/water actions before vital drops.
        food:  { tier: 1, stock: 25, decayPerTick: 1 },
        water: { tier: 1, stock: 35, decayPerTick: 1 },
        light: { tier: 1, hoursPerDay: 14 }
      }
    };
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.bootstrap = Object.freeze({ newGame, isStarted, buildUnity });
})();
