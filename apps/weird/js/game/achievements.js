// DUNGEON MASTER: THE HUNT — achievements tracker. Logs milestones across all systems.

(function () {
  'use strict';

  const DEFINITIONS = [
    { id: 'first-capture',         emoji: '🎯', title: 'First Acquisition',         description: 'Acquired your first girl', check: s => (s.roster || []).some(g => g.encounterState === 'captive' && g.id !== 'girl_unity') },
    { id: 'first-film',            emoji: '🎬', title: 'First Film',                description: 'Recorded your first film', check: s => (s.films || []).length >= 1 },
    { id: 'first-sale',            emoji: '💰', title: 'First Sale',                description: 'Sold your first film', check: s => (s.films || []).some(f => f.status === 'sold') },
    { id: 'first-property',        emoji: '🏷️', title: 'First Property',            description: 'Bought your first outside-world property', check: s => (s.properties || []).filter(p => p.owned).length >= 1 },
    { id: 'first-disposal',        emoji: '⚱️', title: 'First Disposal',            description: 'Disposed of your first captive', check: s => (s.disposals || []).length >= 1 },
    { id: 'first-propositioner',   emoji: '📬', title: 'First Client',              description: 'Completed your first propositioner engagement', check: s => (s.propositioners?.completed || []).length >= 1 },
    { id: 'first-escape-caught',   emoji: '🔗', title: 'Containment',               description: 'Caught a girl trying to escape', check: s => (s.roster || []).some(g => g.escape?.lastAttempt?.outcome === 'caught') },
    { id: 'bond-l3',               emoji: '👀', title: 'Curious',                   description: 'Raised a captive to bond level 3', check: s => (s.roster || []).some(g => g.bond?.bondLevel >= 3) },
    { id: 'bond-l5',               emoji: '🥵', title: 'Reciprocated Touch',        description: 'Raised a captive to bond level 5', check: s => (s.roster || []).some(g => g.bond?.bondLevel >= 5) },
    { id: 'bond-l9',               emoji: '💖', title: 'Fully Bonded',              description: 'Raised a captive to bond level 9', check: s => (s.roster || []).some(g => g.bond?.bondLevel >= 9) },
    { id: 'ten-films',             emoji: '🎞️', title: 'Prolific',                  description: 'Sold 10 films', check: s => (s.films || []).filter(f => f.status === 'sold').length >= 10 },
    { id: 'hundred-k',             emoji: '💎', title: 'Six Figures',               description: 'Amassed $100,000 total', check: s => s.wallet?.money >= 100000 },
    { id: 'full-town',             emoji: '🏙️', title: 'Town Baron',               description: 'Owned every location in the outside world', check: s => (s.properties || []).filter(p => p.owned).length >= window.DMTHAssets.LOCATIONS.length },
    { id: 'estate-hideout',        emoji: '🏛️', title: 'Kingdom Move',              description: 'Owned the underground-complex endgame hideout', check: s => (s.dungeons || []).some(d => d.templateId === 'underground-complex') },
    { id: 'five-captives',         emoji: '⛓️', title: 'Full Stable',               description: 'Held 5 captives simultaneously', check: s => (s.roster || []).filter(g => g.encounterState === 'captive').length >= 5 },
    { id: 'ten-captives',          emoji: '⛓️⛓️', title: 'Harem Master',             description: 'Held 10 captives simultaneously', check: s => (s.roster || []).filter(g => g.encounterState === 'captive').length >= 10 },
    { id: 'all-archetypes',        emoji: '🌈', title: 'Collector',                 description: 'Held at least one girl from every archetype', check: s => {
      const present = new Set((s.roster || []).filter(g => g.encounterState === 'captive').map(g => g.archetypeTemplate));
      return ['library','club','street','sorority','gym','barista'].every(a => present.has(a));
    }},
    { id: 'finalization-film',     emoji: '🎭', title: 'The End',                   description: 'Produced a finalization film', check: s => (s.films || []).some(f => (f.tags || []).includes('finalization')) },
    { id: 'slave-trade',           emoji: '🔀', title: 'Brokerage',                 description: 'Sold a girl on the slave market', check: s => (s.slaveMarket?.recentSales || []).some(r => r.direction === 'sold') },
    { id: 'full-wardrobe',         emoji: '👗', title: 'Dressed to Impress',        description: 'One captive owns 5+ outfits', check: s => (s.roster || []).some(g => (g.wardrobe || []).length >= 5) }
  ];

  function check() {
    const s = window.DMTHGame.state.current;
    if (!s) return [];
    if (!s.achievements) s.achievements = {};
    const unlocks = [];
    for (const def of DEFINITIONS) {
      if (s.achievements[def.id]) continue;
      try {
        if (def.check(s)) {
          s.achievements[def.id] = { unlockedAt: Date.now() };
          unlocks.push(def);
        }
      } catch {}
    }
    if (unlocks.length) {
      window.DMTHGame.state.save();
    }
    return unlocks;
  }

  function unlocked() {
    const s = window.DMTHGame.state.current;
    return DEFINITIONS.filter(d => s?.achievements?.[d.id]);
  }

  function locked() {
    const s = window.DMTHGame.state.current;
    return DEFINITIONS.filter(d => !s?.achievements?.[d.id]);
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.achievements = Object.freeze({
    DEFINITIONS, check, unlocked, locked
  });
})();
