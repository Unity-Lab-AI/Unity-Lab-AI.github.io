// SEX SLAVE DUNGEON — town plot-grid layout + slot-array hashing for env renders.

(function () {
  'use strict';

  // The canonical town plot grid — derived from SSDAssets.LOCATIONS gridPlacement.
  function buildGrid() {
    const width = 5, height = 4;
    const slots = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const loc = window.SSDAssets.LOCATIONS.find(l => l.gridPlacement?.x === x && l.gridPlacement?.y === y);
        if (loc) {
          slots.push({
            x, y,
            filled: true,
            itemId: loc.id,
            emoji: loc.emoji,
            label: loc.displayName,
            subcategory: loc.subcategory
          });
        } else {
          slots.push({ x, y, filled: false, itemId: null, emoji: '▫', label: 'empty plot' });
        }
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

  function renderPrompt(grid) {
    const filled = grid.slots.filter(s => s.filled);
    const tokens = filled.map(s => s.label).join(', ');
    return [
      'aerial establishing photograph of a small fictional downtown at dusk',
      `showing these buildings: ${tokens}`,
      'moody documentary aesthetic',
      'no people visible',
      'soft golden-hour light',
      '35mm film look',
      'wide cinematic crop',
      'no text no watermark'
    ].join(', ');
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.townPlot = Object.freeze({ buildGrid, hashGrid, renderPrompt });
})();
