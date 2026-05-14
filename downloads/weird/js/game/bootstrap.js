// SEX SLAVE DUNGEON — new-game bootstrap.
// Wires the initial state: wallet, starter dungeon, Unity as seeded starter captive.

(function () {
  'use strict';

  function isStarted() {
    const s = window.SSDGame.state.current;
    return !!(s && s.createdAt);
  }

  async function newGame(opts = {}) {
    const state = window.SSDGame.state.initNew({ mode: opts.mode || 'normal' });

    // Starter dungeon — hole-in-the-desert (1 hold)
    const startTemplate = window.SSDAssets.getById('dungeon', 'hole-in-the-desert');
    const dungeonId = 'dun_' + Date.now().toString(36);
    const dungeon = {
      id: dungeonId,
      templateId: startTemplate.id,
      displayName: 'Your Pit',
      capacity: startTemplate.roomSlots,
      holds: Array.from({ length: startTemplate.roomSlots }, (_, i) => ({
        id: `${dungeonId}_hold_${i}`,
        captiveGirlId: null,
        holdType: startTemplate.holdType,
        restraintStatus: 'standard'
      })),
      locationDescriptor: 'a remote stretch of desert 2 hours east',
      purchasedAt: Date.now()
    };
    window.SSDGame.state.addDungeon(dungeon);
    window.SSDGame.state.current.settings.activeDungeonId = dungeonId;

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

      window.SSDGame.state.addGirl(unity);
      window.SSDGame.state.updateDungeon(dungeonId, {
        holds: dungeon.holds.map((h, i) => i === 0 ? { ...h, captiveGirlId: unity.id } : h)
      });
      window.SSDGame.state.current.settings.activeGirlId = unity.id;
    }

    // Sandbox mode: stock inventory with 99 of every catalog item
    if (opts.mode === 'sandbox') {
      for (const item of window.SSDAssets.ITEMS) {
        window.SSDGame.state.addItem(item.id, 99);
      }
      // Safety — ensure drug-scheduler itemIds are present even if catalog shifts
      for (const id of ['coke-bumps','mdma','acid','wine','weed','ketamine']) {
        if (!window.SSDGame.state.current.inventory[id]) {
          window.SSDGame.state.addItem(id, 99);
        }
      }
    } else {
      // Normal mode: starter inventory — cheap blunt pipe + tape. Classic desperate-early-game kit.
      window.SSDGame.state.addItem('pipe', 1);
      window.SSDGame.state.addItem('duct-tape', 2);
      window.SSDGame.state.addItem('rope', 1);
    }

    await window.SSDGame.state.save();
    return state;
  }

  function buildUnity(dungeonId) {
    const unityTemplate = window.SSDGame.girlGen.ARCHETYPE_POOLS.unity_seed;
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

      body: { arousal: 87, wetness: 94, cumLoad: 2.4, bruises: 6, high: 91, activeDrugs: ['coke','weed'], pose: 'kneeling at the rope ladder, knees spread', outfitState: 'leather opened, tits exposed' },
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
        food:  { tier: 1, stock: 5,  decayPerTick: 1 },
        water: { tier: 1, stock: 10, decayPerTick: 1 },
        light: { tier: 1, hoursPerDay: 14 }
      }
    };
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.bootstrap = Object.freeze({ newGame, isStarted, buildUnity });
})();
