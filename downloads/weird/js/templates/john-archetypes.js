// DUNGEON MASTER: THE HUNT — john archetype catalog.
// Captives generate passive income through john encounters; the ledger tracks every john
// (act / payment / quirks) so the captive can talk about her johns in chat.
//
// Distinct from Propositioner archetypes (bespoke single deals, upmarket clientele):
// johns are general-public flow, batch-resolved per tick. 10 archetypes representing the
// johns who show up for the whored-out girl.
//
// Each archetype carries:
//   arrivalWeight       relative chance of arrival per tick-roll
//   payRange            [min, max] base pay before johnHappiness multiplier
//   tipChance           0..1 chance of an extra tip
//   tipMul              tip-multiplier on top of base pay when tip rolls
//   permittedActsPreference  preferred act tags this john emits — drives the JohnEncounter.acts array
//   intensity           1..5 scaling for stamina drain via action-effects.js john-* entries
//   moodImpact          ±N mood shift inflicted on the girl
//   bruisesAdded        per-encounter bruise count (negative = no bruise risk)
//   condomCompliance    0..1 chance the john uses a condom IF girl.whoreOut.condomRequired
//   dialogueTone        flavor word for memory recall (Ollama context can use this)
//   pregnantWantBias    ±N multiplier when girl is pregnant — some johns avoid, some seek

(function () {
  'use strict';

  const JOHN_ARCHETYPES = Object.freeze({
    regular: {
      displayName: 'Regular',
      arrivalWeight: 25,
      payRange: [40, 80],
      tipChance: 0.20,
      tipMul: 1.25,
      permittedActsPreference: ['sex-gentle', 'oral'],
      intensity: 2,
      moodImpact: -2,
      bruisesAdded: 0,
      condomCompliance: 0.85,
      dialogueTone: 'polite, transactional, quick',
      pregnantWantBias: 0.85,
      johnActionId: 'john-gentle'
    },
    rough: {
      displayName: 'Rough Trade',
      arrivalWeight: 15,
      payRange: [55, 110],
      tipChance: 0.10,
      tipMul: 1.15,
      permittedActsPreference: ['sex-rough', 'anal', 'creampie'],
      intensity: 4,
      moodImpact: -8,
      bruisesAdded: 1,
      condomCompliance: 0.50,
      dialogueTone: 'aggressive, demanding, leaves her shaking',
      pregnantWantBias: 0.50,
      johnActionId: 'john-rough'
    },
    cheap: {
      displayName: 'Cheap-skate',
      arrivalWeight: 18,
      payRange: [20, 40],
      tipChance: 0.05,
      tipMul: 1.10,
      permittedActsPreference: ['oral', 'sex-gentle'],
      intensity: 2,
      moodImpact: -3,
      bruisesAdded: 0,
      condomCompliance: 0.70,
      dialogueTone: 'haggling, sweaty, looks her up and down',
      pregnantWantBias: 0.80,
      johnActionId: 'john-gentle'
    },
    generous: {
      displayName: 'Big Tipper',
      arrivalWeight: 8,
      payRange: [100, 200],
      tipChance: 0.65,
      tipMul: 1.60,
      permittedActsPreference: ['sex-gentle', 'oral', 'foreplay'],
      intensity: 2,
      moodImpact: +2,
      bruisesAdded: 0,
      condomCompliance: 0.90,
      dialogueTone: 'wealthy, complimentary, leaves cash on the bedside',
      pregnantWantBias: 1.10,
      johnActionId: 'john-gentle'
    },
    repeat: {
      displayName: 'Repeat Client',
      arrivalWeight: 10,
      payRange: [60, 120],
      tipChance: 0.30,
      tipMul: 1.30,
      permittedActsPreference: ['sex-gentle', 'oral'],
      intensity: 2,
      moodImpact: -1,
      bruisesAdded: 0,
      condomCompliance: 0.80,
      dialogueTone: 'familiar, knows her name, asks how she\'s been',
      pregnantWantBias: 1.20,
      johnActionId: 'john-gentle',
      repeatable: true
    },
    weirdo: {
      displayName: 'Weirdo Kink',
      arrivalWeight: 8,
      payRange: [80, 150],
      tipChance: 0.25,
      tipMul: 1.40,
      permittedActsPreference: ['fetish', 'roleplay', 'toys'],
      intensity: 3,
      moodImpact: -5,
      bruisesAdded: 0,
      condomCompliance: 0.65,
      dialogueTone: 'specific kink demand, unsettling specificity, lingering',
      pregnantWantBias: 1.00,
      johnActionId: 'john-gentle'
    },
    quick: {
      displayName: 'Quick Visit',
      arrivalWeight: 12,
      payRange: [50, 90],
      tipChance: 0.15,
      tipMul: 1.20,
      permittedActsPreference: ['oral', 'sex-gentle'],
      intensity: 1,
      moodImpact: -1,
      bruisesAdded: 0,
      condomCompliance: 0.80,
      dialogueTone: 'in and out, doesn\'t even take his shoes off',
      pregnantWantBias: 0.90,
      johnActionId: 'john-quick'
    },
    talkative: {
      displayName: 'Talker',
      arrivalWeight: 6,
      payRange: [70, 130],
      tipChance: 0.35,
      tipMul: 1.25,
      permittedActsPreference: ['sex-gentle', 'oral', 'foreplay'],
      intensity: 2,
      moodImpact: 0,
      bruisesAdded: 0,
      condomCompliance: 0.85,
      dialogueTone: 'overshares his life story, wants her to listen, takes forever',
      pregnantWantBias: 1.00,
      johnActionId: 'john-gentle'
    },
    'pregnant-want': {
      displayName: 'Breeder',
      arrivalWeight: 4,
      payRange: [120, 250],
      tipChance: 0.40,
      tipMul: 1.50,
      permittedActsPreference: ['sex-rough', 'creampie', 'breeding'],
      intensity: 3,
      moodImpact: -6,
      bruisesAdded: 0,
      condomCompliance: 0.05,                  // breeder almost never uses condom
      dialogueTone: 'fetish for breeding, wants to cum inside, talks about it explicitly',
      pregnantWantBias: 1.80,                   // strongly drawn to already-pregnant
      johnActionId: 'john-rough'
    },
    degrader: {
      displayName: 'Degrader',
      arrivalWeight: 6,
      payRange: [90, 180],
      tipChance: 0.20,
      tipMul: 1.30,
      permittedActsPreference: ['sex-rough', 'oral', 'humiliation'],
      intensity: 4,
      moodImpact: -15,
      bruisesAdded: 1,
      condomCompliance: 0.40,
      dialogueTone: 'verbal abuse, calls her names, leaves her crying',
      pregnantWantBias: 0.70,
      johnActionId: 'john-degrader'
    }
  });

  // Pick a john archetype weighted by arrivalWeight + pregnantWantBias if applicable.
  function rollJohnArchetype(rng, opts = {}) {
    const isPregnant = !!opts.isPregnant;
    const entries = Object.entries(JOHN_ARCHETYPES);
    const weighted = entries.map(([id, a]) => {
      const w = isPregnant
        ? a.arrivalWeight * (a.pregnantWantBias || 1.0)
        : a.arrivalWeight;
      return [id, w];
    });
    const total = weighted.reduce((t, [, w]) => t + w, 0);
    let roll = (rng || Math.random)() * total;
    for (const [id, w] of weighted) {
      roll -= w;
      if (roll <= 0) return id;
    }
    return weighted[weighted.length - 1][0];
  }

  // Pick acts from this john's preferences — returns an array of 1-3 act tags.
  function rollJohnActs(archetypeId, rng) {
    const a = JOHN_ARCHETYPES[archetypeId];
    if (!a) return ['sex-gentle'];
    const r = rng || Math.random;
    const preferred = a.permittedActsPreference;
    const count = 1 + Math.floor(r() * Math.min(3, preferred.length));
    const shuffled = [...preferred].sort(() => r() - 0.5);
    return shuffled.slice(0, count);
  }

  window.DMTHTemplates = window.DMTHTemplates || {};
  // Note: DMTHTemplates is frozen elsewhere — this is a sibling registry.
  window.DMTHJohnArchetypes = Object.freeze({
    JOHN_ARCHETYPES,
    rollJohnArchetype,
    rollJohnActs
  });
})();
