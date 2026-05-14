// DUNGEON MASTER: THE HUNT — shop / inventory purchasing.

(function () {
  'use strict';

  // Items on offer — everything in catalog, priced per entry.
  function listings() {
    return window.DMTHAssets.ITEMS.map(item => ({
      id: item.id,
      displayName: item.displayName,
      emoji: item.emoji,
      subcategory: item.subcategory,
      tier: item.tier || 0,
      price: item.cost || 0,
      notes: item.notes || '',
      prompt: item.prompt
    }));
  }

  function listingsBySubcategory(subcat) {
    return listings().filter(l => l.subcategory === subcat);
  }

  function buy(itemId, qty = 1) {
    const item = window.DMTHAssets.getById('item', itemId);
    if (!item) throw new Error(`unknown item: ${itemId}`);
    const total = (item.cost || 0) * qty;
    const ok = window.DMTHGame.state.spendMoney(total, `buy:${itemId}x${qty}`);
    if (!ok) throw new Error('insufficient funds');
    window.DMTHGame.state.addItem(itemId, qty);
    return { ok: true, itemId, qty, paid: total };
  }

  function use(itemId, context) {
    const item = window.DMTHAssets.getById('item', itemId);
    if (!item) throw new Error(`unknown item: ${itemId}`);
    const ok = window.DMTHGame.state.consumeItem(itemId, 1);
    if (!ok) throw new Error('not in inventory');
    // Context-specific effect handled by caller (capture / feed / etc.)
    return { ok: true, itemId, context };
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.shop = Object.freeze({ listings, listingsBySubcategory, buy, use });
})();
