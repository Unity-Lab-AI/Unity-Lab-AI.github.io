// SEX SLAVE DUNGEON — content market auto-sell + demand.

(function () {
  'use strict';

  const DEMAND = {
    tags: { 'first-capture': 1.4, 'finalization': 2.5, 'group': 1.3, 'extreme-pain': 1.35, 'bond-up': 1.2, 'coke+weed': 1.1, 'rough': 1.15 },
    archetypes: { library: 1.15, club: 1.2, street: 1.0, sorority: 1.4, gym: 1.1, barista: 1.05, unity_seed: 2.0 },
    overallBase: 1.0
  };

  function buyerPool() {
    // Procedural buyer names with budget brackets.
    const names = ['basement_wizard_47','night_market_83','collector_0x','dark_aficionado','bagholder_9k','private_dom_alpha','midnight_curator','vault_archivist','off_grid_buyer','anon_patron_11'];
    return names.map(n => ({ id: n, budgetCap: Math.round(Math.random() * 800 + 50), tag: 'generic' }));
  }

  function runSaleTick() {
    const s = window.SSDGame.state.current;
    if (!s) return [];
    const listed = s.films.filter(f => f.status === 'listed');
    const sold = [];
    const buyers = buyerPool();

    for (const film of listed) {
      // roll against buyer pool — film sells if any buyer has budget >= listPrice AND random selection hits
      const candidates = buyers.filter(b => b.budgetCap >= film.currentListPrice * 0.7);
      if (!candidates.length) continue;
      // Sale chance scales with demand
      const archMult = DEMAND.archetypes[getArchetypeOfFilm(film)] || 1;
      const tagMult = (film.tags || []).reduce((m, t) => m * (DEMAND.tags[t] || 1), 1);
      const chance = Math.min(0.92, 0.25 * archMult * tagMult * DEMAND.overallBase);
      if (Math.random() > chance) continue;
      const buyer = candidates[Math.floor(Math.random() * candidates.length)];
      const price = Math.round(film.currentListPrice * (0.8 + Math.random() * 0.4));
      window.SSDGame.state.updateFilm(film.id, {
        status: 'sold',
        saleRecord: { buyer: buyer.id, price, soldAt: Date.now() }
      });
      window.SSDGame.state.addMoney(price, `film-sale: ${film.id}`);
      window.SSDGame.state.addNotoriety(1);
      sold.push({ filmId: film.id, price, buyer: buyer.id });
    }

    // Nudge demand — overproduction softens, rarity strengthens
    if (sold.length > 3) DEMAND.overallBase = Math.max(0.6, DEMAND.overallBase - 0.02);
    else                 DEMAND.overallBase = Math.min(1.4, DEMAND.overallBase + 0.01);

    return sold;
  }

  function getArchetypeOfFilm(film) {
    const g = window.SSDGame.state.getGirl(film.girlId);
    return g?.archetypeTemplate || 'library';
  }

  function unlist(filmId) { window.SSDGame.state.updateFilm(filmId, { listedForSale: false, status: 'archived' }); }
  function relist(filmId) { window.SSDGame.state.updateFilm(filmId, { listedForSale: true,  status: 'listed' }); }
  function getDemand() { return { ...DEMAND }; }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.market = Object.freeze({ runSaleTick, unlist, relist, getDemand });
})();
