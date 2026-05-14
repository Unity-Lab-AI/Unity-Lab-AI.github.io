// DUNGEON MASTER: THE HUNT — Kokoro voice catalog + emotion-state profiles.
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
  //   - text tweaks: ALLCAPS for loudness/emphasis, repeated "!" for intensity, vowel
  //     elongation for screams/moans, ellipses for hesitation, repeated letters for slur.
  //
  // Loudness-by-design: low-Stockholm captives are PANICKED — fast, loud, screaming-scared
  // — NOT slow whispers. High-Stockholm captives are EXCITED EAGER — fast, loud, demanding,
  // begging for harder treatment. The arc is timid/depressed → excited/wanting violence.
  const EMOTIONS = {
    neutral: {
      speed: 1.0,
      preprocess: t => t
    },

    // L0-1 raw terror — fast panicked screaming, not slow trembling whispers. ALLCAPS the
    // scared words so Kokoro hits them with prosodic emphasis. Double-exclamations boost
    // pitch + perceived volume.
    panicked: {
      speed: 1.08,
      preprocess: t => t
        .replace(/\bno\b/gi, 'NO')
        .replace(/\bstop\b/gi, 'STOP')
        .replace(/\bplease\b/gi, 'PLEASE')
        .replace(/\bdon't\b/gi, "DON'T")
        .replace(/\bhelp\b/gi, 'HELP')
        .replace(/!+/g, '!!')
        .replace(/\.\s/g, '! ')
        .replace(/\bah\b/gi, 'AAH')
        .replace(/\boh\b/gi, 'OH')
    },

    // L0 alt — terrified (very loud, vocal panic + sob breaks). Speed up, not down.
    terrified: {
      speed: 1.05,
      preprocess: t => t
        .replace(/\bno\b/gi, 'NO')
        .replace(/\bplease\b/gi, 'PLEASE')
        .replace(/\bstop\b/gi, 'STOP')
        .replace(/!+/g, '!!')
        .replace(/\.\s/g, '! ')
        .replace(/\bah\b/gi, 'AAH')
    },

    // L1-2 — still scared, less hysterical, voice loud and trembling
    scared: {
      speed: 1.02,
      preprocess: t => t
        .replace(/\bplease\b/gi, 'please!')
        .replace(/\bno\b/gi, 'no!')
        .replace(/!+/g, '!!')
        .replace(/\bI\b/g, 'I-')
    },

    // L2-3 — shaken transition, mid-volume, fearful but starting to comply
    shaken: {
      speed: 0.98,
      preprocess: t => t
        .replace(/\bI\b/g, 'I-')
        .replace(/\bplease\b/gi, 'p-please')
    },

    // L3-4 — curious / probing, even tone with rising questions
    curious: {
      speed: 1.02,
      preprocess: t => t.replace(/\?/g, '?')
    },

    // Catatonic / depressed / mute floor — flat slow voice. Use ONLY when mood explicitly
    // calls for it, NOT as a default for low-bond captives.
    broken: {
      speed: 0.9,
      preprocess: t => t
        .replace(/,/g, '...')
        .replace(/\.\s/g, '... ')
    },

    // L4-5 ambivalent → aroused; voice up, moans woven in
    aroused: {
      speed: 1.05,
      preprocess: t => t
        .replace(/\boh\b/gi, 'mmm oh')
        .replace(/\byes\b/gi, 'yes... yes')
        .replace(/\bfuck\b/gi, 'fuck')
        .replace(/\byour\b/gi, 'yourrr')
    },

    // L6-7 eager — loud lustful, asking for more
    eager: {
      speed: 1.08,
      preprocess: t => t
        .replace(/\byes\b/gi, 'YES')
        .replace(/\bfuck\b/gi, 'fuck')
        .replace(/\bharder\b/gi, 'HARDER')
        .replace(/\bmore\b/gi, 'MORE')
        .replace(/\bplease\b/gi, 'please please')
    },

    // L7-8 excited devoted — high stockholm, LOUD, eager, asking for it harder
    excited_devoted: {
      speed: 1.1,
      preprocess: t => t
        .replace(/\byes\b/gi, 'YES')
        .replace(/\bmaster\b/gi, 'MASTER')
        .replace(/\bharder\b/gi, 'HARDER')
        .replace(/\bplease\b/gi, 'PLEASE')
        .replace(/\bfuck\b/gi, 'fuck fuck')
        .replace(/!+/g, '!!')
    },

    // L9 feral devoted — demanding violent treatment, screaming for it
    feral_devoted: {
      speed: 1.12,
      preprocess: t => t
        .replace(/\bharder\b/gi, 'HARDER')
        .replace(/\bbreak\b/gi, 'BREAK')
        .replace(/\brape\b/gi, 'RAPE')
        .replace(/\bmore\b/gi, 'MORE')
        .replace(/\byes\b/gi, 'YES')
        .replace(/\bmaster\b/gi, 'MASTER')
        .replace(/\bfuck\b/gi, 'FUCK')
        .replace(/!+/g, '!!')
        .replace(/\.\s/g, '! ')
    },

    // HURT ME mode — defiant raging
    defiant: {
      speed: 1.12,
      preprocess: t => t
        .replace(/!/g, '!!')
        .replace(/\bfuck\b/gi, 'FUCK')
        .replace(/\bdie\b/gi, 'DIE')
        .replace(/\bkill\b/gi, 'KILL')
    },

    // Playful — light banter, giggles
    playful: {
      speed: 1.08,
      preprocess: t => t
        .replace(/\bha\b/gi, 'haha')
        .replace(/\b(lol|haha)\b/gi, '*giggles*')
    },

    // --- Drug states (override low-bond emotions; HIGH bond keeps its lust profile) ---
    high_coke: {
      speed: 1.25,
      preprocess: t => t
        .replace(/\b(I|me|my)\b/g, '$1,')
        .replace(/\band\b/g, 'and, and')
        .replace(/\bfuck\b/gi, 'fuck fuck')
    },
    high_weed: {
      speed: 0.95,
      preprocess: t => t
        .replace(/\.\s/g, '... ')
        .replace(/\blike\b/gi, 'like, like')
    },
    drunk: {
      speed: 0.92,
      preprocess: t => t
        .replace(/\b([A-Za-z])o\b/g, '$1ooo')
        .replace(/\bi\b/gi, 'ii')
        .replace(/\.\s/g, '... ')
    }
  };

  // Map StockholmBond level (0-9) → default emotion. The arc: timid/scared → ambivalent →
  // aroused → eager → excited devoted → feral devoted wanting violence. LOUD at both ends,
  // never whispered. Mood overrides can pull "broken" or "playful" mid-curve when state
  // explicitly demands it.
  const BOND_TO_EMOTION = [
    'panicked',           // L0
    'panicked',           // L1
    'scared',             // L2
    'shaken',             // L3
    'aroused',            // L4
    'aroused',            // L5
    'eager',              // L6
    'excited_devoted',    // L7
    'excited_devoted',    // L8
    'feral_devoted'       // L9
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
  //
  // Priority order:
  //   1. mode === 'hurtme' → defiant (top — violence overlay always wins)
  //   2. bondLevel >= 7 → high-Stockholm lust profile (overrides drug calm — at this
  //      tier lust drives speech, drugs only color it). Pulls excited_devoted or
  //      feral_devoted from BOND_TO_EMOTION.
  //   3. activeDrugs (only for bond < 7) → drunk / high_coke / high_weed.
  //   4. bondLevel → BOND_TO_EMOTION default for low/mid tiers.
  function pickEmotion(girlState) {
    if (!girlState) return 'neutral';
    if (girlState.mode === 'hurtme') return 'defiant';
    const bond = typeof girlState.bondLevel === 'number'
      ? Math.max(0, Math.min(9, girlState.bondLevel))
      : null;
    if (bond !== null && bond >= 7) {
      return BOND_TO_EMOTION[bond];
    }
    if (girlState.activeDrugs?.includes('whiskey')) return 'drunk';
    if (girlState.activeDrugs?.includes('coke'))    return 'high_coke';
    if (girlState.activeDrugs?.includes('weed'))    return 'high_weed';
    if (bond !== null) return BOND_TO_EMOTION[bond];
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

  window.DMTHVoices = Object.freeze({
    VOICES,
    EMOTIONS: Object.keys(EMOTIONS),
    BOND_TO_EMOTION,
    pickVoiceForArchetype,
    pickEmotion,
    buildSpeakParams,
    getEmotionProfile: k => EMOTIONS[k]
  });
})();
