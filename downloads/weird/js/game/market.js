// DUNGEON MASTER: THE HUNT — content market auto-sell + sell-negatives premium.
//
// Films auto-sell on tick — no manual "sales pass" button. Films are never consumed:
// they're permanent infinite-copy assets. The only way to remove one is "sell negatives",
// which destroys the master for a one-time premium payout (much bigger than the lifetime
// passive but the film stops earning thereafter).
//
// Films are permanent passive-income assets that
// auto-sell every market tick at small per-tick rates (basePrice × tickRate × demand
// multipliers). The "sales pass" button is gone; `tick.js` schedule drives the income.
//
// New `sellNegatives(filmId)` action destroys the master / removes the film from the
// catalog in exchange for a one-time premium payout (3.5× × demand multiplier). That's
// the "sell the negatives" mechanic — much bigger one-time payout, but the film stops
// generating passive income.
//
// Backwards-compat: existing saves' film records continue to work. Films with the legacy
// `status: 'sold'` are skipped by `runSaleTick()` (they were one-shot consumables under
// the old model); they continue to render in the "Sold history" section of the UI.

(function () {
  'use strict';

  const DEMAND = {
    tags: { 'first-capture': 1.4, 'finalization': 2.5, 'group': 1.3, 'extreme-pain': 1.35, 'bond-up': 1.2, 'coke+weed': 1.1, 'rough': 1.15 },
    archetypes: { library: 1.15, club: 1.2, street: 1.0, sorority: 1.4, gym: 1.1, barista: 1.05, unity_seed: 2.0 },
    overallBase: 1.0
  };

  // Per-tick passive income rate — small fraction of basePrice paid every market tick.
  // Tuned so a typical $500 film earns ~$15/tick at neutral demand. Most films will pay
  // back their basePrice over ~20-40 ticks of passive income, then continue indefinitely
  // until the player chooses to sell negatives for the big lump-sum.
  const TICK_RATE_BASE = 0.03;

  // Sell-negatives premium multiplier — one-time payout = basePrice × this × demandMults.
  // 3.5× chosen so destroying a film yields roughly the next ~100 ticks of passive income
  // up-front (tradeoff: certainty of cash now vs. uncertain future passive). Bigger
  // demand-multiplier films benefit more from selling negatives because the multiplier
  // compounds through the premium.
  const SELL_NEGATIVES_MULT = 3.5;

  function runSaleTick() {
    const s = window.DMTHGame.state.current;
    if (!s) return { earnings: 0, perFilm: [] };
    const listed = s.films.filter(f => f.status === 'listed');
    if (!listed.length) return { earnings: 0, perFilm: [] };

    const perFilm = [];
    let totalEarnings = 0;

    for (const film of listed) {
      const archMult = DEMAND.archetypes[getArchetypeOfFilm(film)] || 1;
      const tagMult = (film.tags || []).reduce((m, t) => m * (DEMAND.tags[t] || 1), 1);
      const demandMult = DEMAND.overallBase;
      const rng = 0.7 + Math.random() * 0.6;   // 0.7-1.3 per-tick variance
      const base = film.basePrice || film.currentListPrice || 0;
      const tickEarnings = Math.round(base * TICK_RATE_BASE * archMult * tagMult * demandMult * rng);
      if (tickEarnings <= 0) continue;
      window.DMTHGame.state.updateFilm(film.id, {
        passiveEarnings: (film.passiveEarnings || 0) + tickEarnings,
        lastTickEarnings: tickEarnings,
        lastTickAt: Date.now()
      });
      window.DMTHGame.state.addMoney(tickEarnings, `film-passive: ${film.id}`);
      perFilm.push({ filmId: film.id, tickEarnings });
      totalEarnings += tickEarnings;
    }

    // Tiny notoriety creep — content circulating in the wild generates background heat.
    if (totalEarnings > 0) {
      const notorietyTick = Math.max(1, Math.round(perFilm.length * 0.3));
      window.DMTHGame.state.addNotoriety(notorietyTick);
    }

    // Demand drift — too many tracks for sale softens the market; quieter markets recover.
    if (perFilm.length > 5) DEMAND.overallBase = Math.max(0.6, DEMAND.overallBase - 0.01);
    else                    DEMAND.overallBase = Math.min(1.4, DEMAND.overallBase + 0.005);

    return { earnings: totalEarnings, perFilm };
  }

  function sellNegatives(filmId) {
    const s = window.DMTHGame.state.current;
    const film = s.films.find(f => f.id === filmId);
    if (!film) throw new Error('no such film');
    if (film.status === 'destroyed') throw new Error('negatives already sold for this film');
    const archMult = DEMAND.archetypes[getArchetypeOfFilm(film)] || 1;
    const tagMult = (film.tags || []).reduce((m, t) => m * (DEMAND.tags[t] || 1), 1);
    const demandMult = DEMAND.overallBase;
    const base = film.basePrice || film.currentListPrice || 0;
    const premiumPayout = Math.round(base * SELL_NEGATIVES_MULT * archMult * tagMult * demandMult);
    window.DMTHGame.state.updateFilm(filmId, {
      status: 'destroyed',
      destroyedAt: Date.now(),
      negativesSalePrice: premiumPayout
    });
    window.DMTHGame.state.addMoney(premiumPayout, `negatives-sale: ${filmId}`);
    // Destroying the master is the BIG-money play — bigger notoriety hit than passive sales.
    window.DMTHGame.state.addNotoriety(2);
    return { ok: true, premiumPayout, filmId };
  }

  // Estimated passive earnings per tick for UI display (pre-RNG, mid-RNG value).
  function estimatePerTick(film) {
    if (!film || film.status !== 'listed') return 0;
    const archMult = DEMAND.archetypes[getArchetypeOfFilm(film)] || 1;
    const tagMult = (film.tags || []).reduce((m, t) => m * (DEMAND.tags[t] || 1), 1);
    const base = film.basePrice || film.currentListPrice || 0;
    return Math.round(base * TICK_RATE_BASE * archMult * tagMult * DEMAND.overallBase);
  }

  // Estimated sell-negatives payout for UI display.
  function estimateNegativesPayout(film) {
    if (!film) return 0;
    const archMult = DEMAND.archetypes[getArchetypeOfFilm(film)] || 1;
    const tagMult = (film.tags || []).reduce((m, t) => m * (DEMAND.tags[t] || 1), 1);
    const base = film.basePrice || film.currentListPrice || 0;
    return Math.round(base * SELL_NEGATIVES_MULT * archMult * tagMult * DEMAND.overallBase);
  }

  function getArchetypeOfFilm(film) {
    const g = window.DMTHGame.state.getGirl(film.girlId);
    return g?.archetypeTemplate || 'library';
  }

  function unlist(filmId) { window.DMTHGame.state.updateFilm(filmId, { listedForSale: false, status: 'archived' }); }
  function relist(filmId) { window.DMTHGame.state.updateFilm(filmId, { listedForSale: true,  status: 'listed' }); }
  function getDemand() { return { ...DEMAND }; }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.market = Object.freeze({
    runSaleTick, sellNegatives, estimatePerTick, estimateNegativesPayout,
    unlist, relist, getDemand,
    TICK_RATE_BASE, SELL_NEGATIVES_MULT
  });
})();
