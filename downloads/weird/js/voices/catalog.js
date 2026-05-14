// SEX SLAVE DUNGEON — Kokoro voice catalog + emotion-state profiles.
// Kokoro's built-in female voices with archetype-fit tags and emotion modulation helpers.
// Emotions modulate Kokoro speed + text pre-processing (no direct pitch/emo control in Kokoro v1).

(function () {
  'use strict';

  // Female voice catalog — each entry has:
  // id: Kokoro voice ID
  // displayName: human label
  // accent: "american" | "british"
  // timbre: natural-language description
  // archetypeFit: which girl archetype templates this voice fits best
  const VOICES = [
    // --- American female ---
    { id: 'af_heart',    displayName: 'Heart',    accent: 'american', timbre: 'warm, soft, inviting',              archetypeFit: ['library', 'barista', 'sorority']                },
    { id: 'af_nova',     displayName: 'Nova',     accent: 'american', timbre: 'bright, youthful, breathy',          archetypeFit: ['library', 'barista', 'gym']                     },
    { id: 'af_bella',    displayName: 'Bella',    accent: 'american', timbre: 'confident, honey-toned, sultry',     archetypeFit: ['sorority', 'club']                              },
    { id: 'af_sarah',    displayName: 'Sarah',    accent: 'american', timbre: 'clear, girl-next-door',              archetypeFit: ['library', 'barista']                            },
    { id: 'af_sky',      displayName: 'Sky',      accent: 'american', timbre: 'airy, floaty, dreamlike',            archetypeFit: ['library', 'sorority']                           },
    { id: 'af_alloy',    displayName: 'Alloy',    accent: 'american', timbre: 'cool, polished, edged',              archetypeFit: ['street', 'club', 'unity']                       },
    { id: 'af_aoede',    displayName: 'Aoede',    accent: 'american', timbre: 'melodic, sing-song',                  archetypeFit: ['sorority', 'club']                              },
    { id: 'af_jessica',  displayName: 'Jessica',  accent: 'american', timbre: 'smooth, low-register, knowing',      archetypeFit: ['club', 'sorority', 'unity']                     },
    { id: 'af_kore',     displayName: 'Kore',     accent: 'american', timbre: 'young, soft, slightly shy',           archetypeFit: ['library', 'barista']                            },
    { id: 'af_nicole',   displayName: 'Nicole',   accent: 'american', timbre: 'husky, playful, mid-register',        archetypeFit: ['street', 'club', 'unity']                       },
    { id: 'af_river',    displayName: 'River',    accent: 'american', timbre: 'steady, grounded, earthy',            archetypeFit: ['gym', 'street']                                 },

    // --- British female ---
    { id: 'bf_alice',    displayName: 'Alice',    accent: 'british',  timbre: 'refined, precise, icy',              archetypeFit: ['library', 'sorority']                           },
    { id: 'bf_emma',     displayName: 'Emma',     accent: 'british',  timbre: 'warm, slightly posh, sensual',        archetypeFit: ['library', 'sorority']                           },
    { id: 'bf_isabella', displayName: 'Isabella', accent: 'british',  timbre: 'sultry, deliberate, confident',       archetypeFit: ['sorority', 'club']                              },
    { id: 'bf_lily',     displayName: 'Lily',     accent: 'british',  timbre: 'light, flirty, airy',                 archetypeFit: ['library', 'barista']                            }
  ];

  // Emotion profiles — modulate speed + text preprocessing.
  // Kokoro v1 doesn't expose pitch/prosody params directly, so we shape emotion through:
  //   - speed (0.5 - 2.0)
  //   - text tweaks (ellipses for hesitation, exclamations for intensity, vocalizations woven in,
  //     repeated letters for slur effects)
  const EMOTIONS = {
    neutral: {
      speed: 1.0,
      preprocess: t => t
    },
    scared: {
      speed: 0.9,
      preprocess: t => t
        .replace(/\bI\b/g, 'I...')
        .replace(/\.\s/g, '. ... ')
        .replace(/\bplease\b/gi, 'p-please')
    },
    defiant: {
      speed: 1.1,
      preprocess: t => t
        .replace(/!/g, '!!')
        .replace(/fuck/gi, 'FUCK')
    },
    aroused: {
      speed: 1.0,
      preprocess: t => t
        .replace(/oh /gi, 'mmm oh ')
        .replace(/yes/gi, 'yes... yes')
        .replace(/\byour\b/gi, 'yourrr')
    },
    broken: {
      speed: 0.85,
      preprocess: t => t
        .replace(/,/g, '...')
        .replace(/\.\s/g, '... ... ')
    },
    playful: {
      speed: 1.08,
      preprocess: t => t
        .replace(/\bha\b/gi, 'haha')
        .replace(/\b(lol|haha)\b/gi, '*giggles*')
    },
    devoted: {
      speed: 0.95,
      preprocess: t => t
        .replace(/\bMaster\b/g, 'Master...')
    },
    high_coke: {
      speed: 1.25,
      preprocess: t => t
        .replace(/\b(I|me|my)\b/g, '$1,')      // rapid-fire comma bursts
        .replace(/\band\b/g, 'and, and')
    },
    high_weed: {
      speed: 0.95,
      preprocess: t => t
        .replace(/\.\s/g, '... ')
        .replace(/\blike\b/gi, 'like, like')
    },
    drunk: {
      speed: 0.88,
      // slur: repeat vowels selectively
      preprocess: t => t
        .replace(/\b([A-Za-z])o\b/g, '$1ooo')
        .replace(/\bi\b/gi, 'ii')
        .replace(/\.\s/g, '...* ')
    },
    terrified: {
      speed: 0.92,
      preprocess: t => t
        .replace(/\b/g, '')                     // no-op placeholder
        .replace(/no/gi, 'n-no')
        .replace(/please/gi, 'p-please')
        .replace(/,/g, ',,,')
    },
    curious: {
      speed: 1.02,
      preprocess: t => t.replace(/\?/g, '?...')
    }
  };

  // Map StockholmBond level (0-9) → default emotion.
  // This is a floor; specific states (coke high, hurt mode, etc.) override.
  const BOND_TO_EMOTION = [
    'terrified',  // L0
    'scared',     // L1
    'scared',     // L2
    'curious',    // L3
    'neutral',    // L4
    'aroused',    // L5
    'aroused',    // L6
    'devoted',    // L7
    'devoted',    // L8
    'devoted'     // L9
  ];

  // Pick a default voice for a newly generated girl of a given archetype.
  // Deterministic on the girl's visualIdentity.seed so we can persist without storing extra state.
  function pickVoiceForArchetype(archetype, seed) {
    const fit = VOICES.filter(v => v.archetypeFit.includes(archetype));
    const pool = fit.length > 0 ? fit : VOICES;
    const idx = Math.abs(Number(seed) || 0) % pool.length;
    return pool[idx].id;
  }

  // Resolve the active emotion for a girl's current state.
  function pickEmotion(girlState) {
    if (!girlState) return 'neutral';
    if (girlState.mode === 'hurtme')            return 'defiant';
    if (girlState.activeDrugs?.includes('whiskey')) return 'drunk';
    if (girlState.activeDrugs?.includes('coke'))    return 'high_coke';
    if (girlState.activeDrugs?.includes('weed'))    return 'high_weed';
    if (girlState.bondLevel != null) {
      return BOND_TO_EMOTION[Math.max(0, Math.min(9, girlState.bondLevel))];
    }
    return 'neutral';
  }

  // Prepare final speak() params: resolve voice, resolve emotion, apply text preprocessing.
  function buildSpeakParams(girl, girlState, textIn) {
    const voice = girl?.voiceId || 'af_nova';
    const emotionKey = pickEmotion(girlState);
    const profile = EMOTIONS[emotionKey] || EMOTIONS.neutral;
    return {
      voice,
      emotion: emotionKey,
      speed: profile.speed,
      text: profile.preprocess(textIn || '')
    };
  }

  window.SSDVoices = Object.freeze({
    VOICES,
    EMOTIONS: Object.keys(EMOTIONS),
    BOND_TO_EMOTION,
    pickVoiceForArchetype,
    pickEmotion,
    buildSpeakParams,
    getEmotionProfile: k => EMOTIONS[k]
  });
})();
