// DUNGEON MASTER: THE HUNT — damage persistence + heal reset.
// /hurtme accumulates bruises; /sexy carries them. User verb "healed" / "100%" resets.

(function () {
  'use strict';

  // Detect a heal verb in the user's turn text
  const HEAL_PATTERN = /\b(healed|heal her|100%|fully healed|clean slate|fresh start)\b/i;

  function shouldHeal(userText) { return HEAL_PATTERN.test(userText || ''); }

  // Full heal — resets body damage + mood to baseline, keeps bond/stats/bond XP.
  function heal(girlId) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return null;
    const newBody = {
      ...girl.body,
      bruises: 0,
      outfitState: 'intact',
      pose: 'standing, relaxed'
    };
    const newMood = {
      mood: girl.bond.bondLevel >= 5 ? 'devoted' : girl.bond.bondLevel >= 3 ? 'curious' : 'acclimating',
      moodEmoji: window.DMTHGame.delta.emojiForMood(newMood?.mood || 'acclimating'),
      history: [...(girl.mood.history || []), { shift: 'healed', ts: Date.now() }]
    };
    // Rebuild emoji after mood is set
    newMood.moodEmoji = window.DMTHGame.delta.emojiForMood(newMood.mood);
    window.DMTHGame.state.updateGirl(girlId, { body: newBody, mood: newMood });
    return { ok: true };
  }

  // Accumulate damage in hurtme mode — called from room turn handler when mode === 'hurtme'
  // and the response contains impact cues. This is a safety net ON TOP OF the delta parser,
  // ensuring bruise accrual even when the model forgets to emit bruise deltas.
  function accumulateFromText(girlId, responseText) {
    if (!responseText) return;
    const patterns = [
      /\b(hit|slap|slapped|punch|punched|smack|smacked)\b/gi,
      /\b(choke|choked|grip|strangle)\b/gi,
      /\b(kick|kicked|stomp|stomped)\b/gi,
      /\b(bite|bit|clamp|clamped)\b/gi
    ];
    let total = 0;
    for (const p of patterns) {
      const m = responseText.match(p);
      if (m) total += m.length;
    }
    if (total === 0) return;
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) return;
    const newBody = { ...girl.body, bruises: Math.min(99, girl.body.bruises + Math.min(total, 3)) };
    window.DMTHGame.state.updateGirl(girlId, { body: newBody });
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.damage = Object.freeze({ shouldHeal, heal, accumulateFromText, HEAL_PATTERN });
})();
