// SEX SLAVE DUNGEON — state delta applier.
// Parses the trailing <delta>{}</delta> from Ollama responses and applies it to a girl.

(function () {
  'use strict';

  function applyDelta(girlId, delta) {
    if (!delta) return;
    const girl = window.SSDGame.state.getGirl(girlId);
    if (!girl) return;

    // Pre-clamp the delta itself to safe per-turn ranges — defensive against bad model output
    const safeDelta = {
      arousal:  clamp(delta.arousal  || 0, -30, 30),
      wetness:  clamp(delta.wetness  || 0, -30, 30),
      cumLoad:  clamp(delta.cumLoad  || 0, -2, 2),
      bruises:  clamp(delta.bruises  || 0, -10, 15),
      high:     clamp(delta.high     || 0, -30, 30),
      bondXP:   clamp(delta.bondXP   || 0, -20, 20),
      bondDebt: clamp(delta.bondDebt || 0, -20, 20),
      moodShift: typeof delta.moodShift === 'string' ? delta.moodShift.slice(0, 60) : '',
      tags:     Array.isArray(delta.tags) ? delta.tags.slice(0, 8) : []
    };

    const body = { ...girl.body };
    body.arousal = clamp(body.arousal + safeDelta.arousal, 0, 100);
    body.wetness = clamp(body.wetness + safeDelta.wetness, 0, 100);
    body.cumLoad = Math.max(0, body.cumLoad + safeDelta.cumLoad);
    body.bruises = Math.max(0, Math.min(99, body.bruises + safeDelta.bruises));
    body.high = clamp(body.high + safeDelta.high, 0, 100);
    delta = safeDelta;   // use the clamped version for everything below

    const mood = { ...girl.mood };
    if (delta.moodShift) {
      mood.mood = String(delta.moodShift).split(/[-→]/).pop().trim() || mood.mood;
      mood.moodEmoji = emojiForMood(mood.mood);
      mood.history = [...(mood.history || []), { shift: delta.moodShift, ts: Date.now() }].slice(-20);
    }

    const bond = { ...girl.bond };
    if (typeof delta.bondXP === 'number')   bond.bondXP   = Math.max(0, bond.bondXP + delta.bondXP);
    if (typeof delta.bondDebt === 'number') bond.bondDebt = Math.max(0, bond.bondDebt + delta.bondDebt);

    // Level up if XP crosses threshold — balancing curve lookup (50/100/150/200/250/340/450/600/800)
    const nextLevelXP = window.SSDGame.balancing
      ? window.SSDGame.balancing.xpForLevel(bond.bondLevel + 1)
      : (bond.bondLevel + 1) * 50;
    const prevLevel = bond.bondLevel;
    if (bond.bondXP >= nextLevelXP && bond.bondLevel < 9) {
      bond.bondLevel++;
      bond.milestones = [...(bond.milestones || []), `bond-up-L${bond.bondLevel}-${new Date().toISOString()}`];
    }
    // Fire memorial image on level-up (fire-and-forget, optional overlay)
    if (bond.bondLevel > prevLevel && window.SSDGame.imaging && window.SSDGame.imaging.isAvailable()) {
      window.SSDGame.imaging.bondMilestone(girlId, bond.bondLevel).catch(() => {});
    }

    // Escape risk recompute from factors
    const escape = { ...girl.escape };
    escape.currentRisk = clamp(
      0.5
      - 0.05 * (bond.bondLevel || 0)
      + 0.01 * ((girl.stats?.defiance || 0) / 10)
      + 0.01 * ((girl.stats?.intelligence || 0) / 20)
      - (body.bruises > 10 ? -0.05 : 0),
      0, 1
    );

    window.SSDGame.state.updateGirl(girlId, {
      body, mood, bond, escape,
      _lastTags: Array.isArray(delta.tags) ? delta.tags : []
    });
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function emojiForMood(mood) {
    const map = {
      terrified: '😱', scared: '😟', wary: '😐', guarded: '😐',
      neutral: '😶', acclimating: '😔', curious: '👀',
      ambivalent: '🤔', attached: '🥺', playful: '😏',
      aroused: '😈', needy: '🥵', devoted: '🥰',
      defiant: '😤', broken: '😵', dependent: '🥺',
      'partner-self-identified': '💕', 'fully-bonded': '💖'
    };
    for (const [k, v] of Object.entries(map)) if (mood.includes(k)) return v;
    return '😶';
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.delta = Object.freeze({ applyDelta, emojiForMood });
})();
