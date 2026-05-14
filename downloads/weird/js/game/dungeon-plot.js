// SEX SLAVE DUNGEON — per-dungeon interior plot-grid.

(function () {
  'use strict';

  // Room/facility slot-item catalog for dungeon interior plots
  const INTERIOR_ITEMS = [
    { id: 'room-basic',       displayName: 'Basic cell',         emoji: '🚪', category: 'room',     cost: 0,    promptTokens: 'basic bare cell' },
    { id: 'room-standard',    displayName: 'Standard cell',      emoji: '🛏️', category: 'room',     cost: 200,  promptTokens: 'standard cell with mattress and stool' },
    { id: 'room-deluxe',      displayName: 'Deluxe cell',        emoji: '🛌', category: 'room',     cost: 800,  promptTokens: 'deluxe private room with real bed' },
    { id: 'room-themed-medical',   displayName: 'Medical room', emoji: '🏥', category: 'room',     cost: 1500, promptTokens: 'medical-themed exam room' },
    { id: 'room-themed-classroom', displayName: 'Classroom',    emoji: '📚', category: 'room',     cost: 1500, promptTokens: 'classroom-themed room' },
    { id: 'room-themed-bedroom',   displayName: 'Bedroom',       emoji: '💗', category: 'room',     cost: 1800, promptTokens: 'themed intimate bedroom' },
    { id: 'main-hall',        displayName: 'Main hall',          emoji: '🏛️', category: 'facility', cost: 1200, promptTokens: 'common area main hall' },
    { id: 'kitchen',          displayName: 'Kitchen',            emoji: '🍳', category: 'facility', cost: 800,  promptTokens: 'industrial-style kitchen' },
    { id: 'security-office',  displayName: 'Security office',    emoji: '📹', category: 'facility', cost: 1500, promptTokens: 'security office with monitors' },
    { id: 'storage',          displayName: 'Storage',            emoji: '📦', category: 'facility', cost: 400,  promptTokens: 'storage room with shelves' },
    { id: 'utility-closet',   displayName: 'Utility closet',     emoji: '🧹', category: 'facility', cost: 200,  promptTokens: 'small utility closet' },
    { id: 'recording-studio', displayName: 'Recording studio',   emoji: '🎬', category: 'facility', cost: 3000, promptTokens: 'professional recording studio with cameras and lights' },
    { id: 'observation-deck', displayName: 'Observation deck',   emoji: '🪟', category: 'facility', cost: 2500, promptTokens: 'observation deck with one-way mirror' },
    { id: 'playroom',         displayName: 'Playroom',           emoji: '🎭', category: 'facility', cost: 2200, promptTokens: 'themed playroom with equipment rack' }
  ];

  function getItem(id) { return INTERIOR_ITEMS.find(i => i.id === id); }

  // Build a plot grid for a dungeon — width/height sized to capacity (smart-square layout).
  function buildGrid(dungeon) {
    const capacity = dungeon.capacity || dungeon.holds?.length || 1;
    // Square-ish dimensions: width = ceil(sqrt(capacity+facilities)); leave spare slots for facilities
    const side = Math.max(2, Math.ceil(Math.sqrt(capacity * 1.3)));
    const width = side;
    const height = Math.ceil((capacity + 2) / width) + 1;   // +1 row for facilities
    const slots = [];
    for (let i = 0; i < width * height; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      slots.push({ x, y, filled: false, itemId: null, emoji: '▫', label: 'empty', category: null });
    }

    // Place hold-cells first
    const plan = dungeon.plotPlan || {};
    let holdIdx = 0;
    for (let i = 0; i < slots.length && holdIdx < dungeon.holds.length; i++) {
      // Skip positions manually overridden by plotPlan
      if (plan[`${slots[i].x},${slots[i].y}`]) continue;
      const hold = dungeon.holds[holdIdx];
      const assigned = hold.captiveGirlId ? window.SSDGame.state.getGirl(hold.captiveGirlId) : null;
      const roomItem = INTERIOR_ITEMS.find(t => t.id === (hold.roomType || 'room-basic'));
      slots[i] = {
        ...slots[i],
        filled: true,
        itemId: roomItem?.id || 'room-basic',
        emoji: assigned ? assigned.mood.moodEmoji : (roomItem?.emoji || '🚪'),
        label: assigned ? `Hold ${holdIdx+1} · ${assigned.name}` : `Hold ${holdIdx+1}`,
        category: 'room',
        holdIdx,
        assignedGirlId: assigned?.id || null
      };
      holdIdx++;
    }

    // Apply explicit plot-plan overrides (facilities placed by player)
    for (const [coords, itemId] of Object.entries(plan)) {
      const [x, y] = coords.split(',').map(Number);
      const item = getItem(itemId);
      if (!item) continue;
      const idx = y * width + x;
      if (slots[idx] && !slots[idx].filled) {
        slots[idx] = { ...slots[idx], filled: true, itemId, emoji: item.emoji, label: item.displayName, category: item.category };
      }
    }

    return { width, height, slots };
  }

  function hashGrid(grid) {
    const compact = grid.slots.map(s => s.filled ? s.itemId : '·').join('|');
    let h = 5381;
    for (let i = 0; i < compact.length; i++) h = ((h << 5) + h) + compact.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  function renderPrompt(dungeon, grid) {
    const tpl = window.SSDAssets.getById('dungeon', dungeon.templateId);
    const filled = grid.slots.filter(s => s.filled);
    const items = filled.map(s => {
      const item = getItem(s.itemId);
      return item?.promptTokens || s.label;
    }).filter(Boolean).join(', ');
    return [
      'documentary interior photograph cross-section cutaway view',
      `of a ${tpl?.plotTokens || 'predator hideout interior'}`,
      `containing: ${items}`,
      'no people visible',
      'moody lighting appropriate to the aesthetic',
      '35mm film aesthetic',
      'wide cinematic crop',
      'no text no watermark'
    ].join(', ');
  }

  // Place a facility into the plot (spend money + save)
  function placeFacility(dungeonId, x, y, itemId) {
    const item = getItem(itemId);
    if (!item) throw new Error('unknown item');
    if (!window.SSDGame.state.spendMoney(item.cost, `facility:${itemId}:${dungeonId}`)) {
      throw new Error('insufficient funds');
    }
    const dungeon = window.SSDGame.state.getDungeon(dungeonId);
    const plan = { ...(dungeon.plotPlan || {}) };
    plan[`${x},${y}`] = itemId;
    window.SSDGame.state.updateDungeon(dungeonId, { plotPlan: plan });
    return { ok: true, cost: item.cost, itemId };
  }

  function removeFacility(dungeonId, x, y) {
    const dungeon = window.SSDGame.state.getDungeon(dungeonId);
    const plan = { ...(dungeon.plotPlan || {}) };
    delete plan[`${x},${y}`];
    window.SSDGame.state.updateDungeon(dungeonId, { plotPlan: plan });
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.dungeonPlot = Object.freeze({
    INTERIOR_ITEMS, getItem, buildGrid, hashGrid, renderPrompt, placeFacility, removeFacility
  });
})();
