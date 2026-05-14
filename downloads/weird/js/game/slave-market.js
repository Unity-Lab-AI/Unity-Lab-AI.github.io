// DUNGEON MASTER: THE HUNT — slave-market buy/sell (player + NPC buyers).

(function () {
  'use strict';

  function computeSellPrice(girl) {
    const statAgg = Object.values(girl.stats || {}).reduce((s, v) => s + v, 0) / Math.max(1, Object.keys(girl.stats || {}).length);
    const wardrobeMult = 1 + ((girl.wardrobe?.length || 1) - 1) * 0.1;
    const bondMult = 1 + 0.2 * (girl.bond.bondLevel || 0);
    const kinkMult = 1 + ((girl.kinks?.length || 0) * 0.03);
    const rarityMult = girl.archetypeTemplate === 'sorority' ? 1.3 : girl.archetypeTemplate === 'unity_seed' ? 2.5 : 1;
    const base = 80 + statAgg * 1.2;
    return Math.round(base * bondMult * wardrobeMult * kinkMult * rarityMult);
  }

  function listForSale(girlId, price) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) throw new Error('no such girl');
    const finalPrice = price || computeSellPrice(girl);
    window.DMTHGame.state.listGirlForSale(girl.id, finalPrice);
    return { ok: true, listed: girl.id, price: finalPrice };
  }

  function unlistForSale(girlId) {
    window.DMTHGame.state.unlistGirl(girlId);
    return { ok: true };
  }

  // Roll NPC market listings.
  function refreshAvailable() {
    const s = window.DMTHGame.state.current;
    const count = 3 + Math.floor(Math.random() * 3);
    const archetypes = ['library','club','street','sorority','gym','barista'];
    const available = [];
    for (let i = 0; i < count; i++) {
      const arche = archetypes[Math.floor(Math.random() * archetypes.length)];
      const seed = Math.floor(Math.random() * 0x7FFFFFFF);
      const girl = window.DMTHGame.girlGen.generate(arche, seed);
      girl.bond.bondLevel = Math.floor(Math.random() * 6);     // random prior training
      girl.bond.bondXP = girl.bond.bondLevel * 50;
      girl.encounterState = 'market-available';
      const price = Math.round(computeSellPrice(girl) * (0.9 + Math.random() * 0.4));
      available.push({ girl, price, sellerId: `seller_${Math.floor(Math.random() * 10000).toString(36)}` });
    }
    s.slaveMarket.available = available;
  }

  function buyFromNpc(listingIdx) {
    const s = window.DMTHGame.state.current;
    const listing = s.slaveMarket.available[listingIdx];
    if (!listing) throw new Error('no such listing');
    const ok = window.DMTHGame.state.spendMoney(listing.price, `buy-girl:${listing.girl.id}`);
    if (!ok) throw new Error('insufficient funds');
    // Escort to open hold in active dungeon
    const result = window.DMTHGame.hunt.escortToHold(listing.girl, s.settings.activeDungeonId);
    s.slaveMarket.available.splice(listingIdx, 1);
    s.slaveMarket.recentSales.push({ direction: 'bought', girlId: listing.girl.id, price: listing.price, at: Date.now() });
    return { ok: true, dungeonId: result.dungeonId, holdIdx: result.holdIdx };
  }

  // Tick — does anyone buy one of the player's listings?
  function runBuyerTick() {
    const s = window.DMTHGame.state.current;
    const sold = [];
    for (const listing of s.slaveMarket.listed.slice()) {
      if (Math.random() < 0.18) {
        const finalPrice = Math.round(listing.price * (0.85 + Math.random() * 0.25));
        const girl = window.DMTHGame.state.getGirl(listing.girlId);
        if (!girl) continue;
        // Free her hold
        const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
        if (dungeon) {
          const newHolds = dungeon.holds.map(h => h.captiveGirlId === girl.id ? { ...h, captiveGirlId: null } : h);
          window.DMTHGame.state.updateDungeon(dungeon.id, { holds: newHolds });
        }
        window.DMTHGame.state.removeGirl(girl.id);
        window.DMTHGame.state.unlistGirl(girl.id);
        window.DMTHGame.state.addMoney(finalPrice, `sold-girl:${girl.id}`);
        s.slaveMarket.recentSales.push({ direction: 'sold', girlId: girl.id, girlName: girl.name, price: finalPrice, at: Date.now() });
        sold.push({ girlId: girl.id, price: finalPrice });
      }
    }
    return sold;
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.slaveMarket = Object.freeze({
    computeSellPrice, listForSale, unlistForSale, refreshAvailable, buyFromNpc, runBuyerTick
  });
})();
