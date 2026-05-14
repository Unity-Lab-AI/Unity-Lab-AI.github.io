// DUNGEON MASTER: THE HUNT — asset image loader with auto-discovery.
// For each asset, tries a fallback chain of filenames under its folder.
// If no image is found, the game shows the emoji fallback from the catalog.
// Works on static hosts (GitHub Pages, any CDN) — uses standard img onerror chain.

(function () {
  'use strict';

  // Filename candidates tried in order for each asset folder.
  // First one that loads wins. If all 404, emoji fallback renders.
  const CANDIDATES = [
    'cover.png',
    'cover.jpg',
    'cover.jpeg',
    'cover.webp',
    'image.png',
    'image.jpg'
  ];

  // Cache — once we've resolved an image URL (or confirmed none exists), don't re-probe.
  const resolved = new Map();  // key = `${category}/${id}` -> resolvedUrl | 'MISSING'

  function cacheKey(category, id) { return `${category}/${id}`; }

  // Probe a URL via fetch HEAD — 404s do NOT spam the Console tab the way Image() onerror does.
  // This is the primary reason for the HEAD switch: it's quieter in devtools.
  async function imgExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD', cache: 'force-cache' });
      return res.ok;
    } catch { return false; }
  }

  // Global kill-switch — once first probe fails for any asset, check if a manifest exists.
  // If no manifest AND no first-probe hits, disable ALL subsequent asset probes for this session.
  // User can opt back in by setting localStorage.dmth_asset_probes_enabled = 'true'.
  let _probesDisabled = null;
  async function probesAreDisabled() {
    if (_probesDisabled !== null) return _probesDisabled;
    if (localStorage.getItem('dmth_asset_probes_enabled') === 'true') { _probesDisabled = false; return false; }
    // Check for a manifest — if present, honor it (assets definitely exist somewhere)
    try {
      const res = await fetch('assets/manifest.json', { method: 'HEAD', cache: 'force-cache' });
      if (res.ok) { _probesDisabled = false; return false; }
    } catch {}
    // No manifest — probe ONE canary path. If it 404s, disable probes for the session.
    try {
      const canary = await fetch('assets/locations/street/cover.png', { method: 'HEAD', cache: 'force-cache' });
      if (canary.ok) { _probesDisabled = false; return false; }
    } catch {}
    _probesDisabled = true;
    console.debug('[asset-loader] no local assets/ files detected — disabling probes for this session (emoji fallback only). Drop a file + set localStorage.dmth_asset_probes_enabled=true to re-enable.');
    return true;
  }

  // Resolve an asset's image URL. Returns null if no image could be discovered.
  async function resolveImageUrl(category, id) {
    const key = cacheKey(category, id);
    if (resolved.has(key)) {
      const v = resolved.get(key);
      return v === 'MISSING' ? null : v;
    }
    if (await probesAreDisabled()) {
      resolved.set(key, 'MISSING');
      return null;
    }
    const folder = window.DMTHAssets.assetFolderPath(category, id);
    for (const fname of CANDIDATES) {
      const url = folder + fname;
      // eslint-disable-next-line no-await-in-loop
      if (await imgExists(url)) {
        resolved.set(key, url);
        return url;
      }
    }
    // Also try `${id}.png` / `${id}.jpg` as a convenience (file named after asset id)
    const idPng = folder + id + '.png';
    if (await imgExists(idPng)) { resolved.set(key, idPng); return idPng; }
    const idJpg = folder + id + '.jpg';
    if (await imgExists(idJpg)) { resolved.set(key, idJpg); return idJpg; }
    resolved.set(key, 'MISSING');
    return null;
  }

  // Render an asset as either an <img> (if resolved) or an emoji placeholder.
  // Returns an HTMLElement ready to insert into the DOM.
  async function renderAsset(category, id, opts = {}) {
    const entry = window.DMTHAssets.getById(category, id);
    if (!entry) {
      const span = document.createElement('span');
      span.textContent = '❓';
      span.title = `unknown asset: ${category}/${id}`;
      return span;
    }
    const url = await resolveImageUrl(category, id);
    if (url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = entry.displayName;
      img.title = entry.displayName;
      img.classList.add('asset-img');
      if (opts.width)  img.width  = opts.width;
      if (opts.height) img.height = opts.height;
      return img;
    }
    // Fallback: emoji + label
    const span = document.createElement('span');
    span.classList.add('asset-emoji');
    span.textContent = entry.emoji || '▫';
    span.title = entry.displayName;
    if (opts.showLabel) {
      const lab = document.createElement('span');
      lab.classList.add('asset-label');
      lab.textContent = ' ' + entry.displayName;
      span.appendChild(lab);
    }
    return span;
  }

  // Utility — get the copy-paste prompt for an asset (for users feeding it into an image generator).
  function getPromptText(category, id) {
    return window.DMTHAssets.getPrompt(category, id);
  }

  // Utility — enumerate every asset in the catalog with its folder path + prompt.
  // Useful for bulk-generating images ahead of time.
  function allAssetsWithPaths() {
    const out = [];
    for (const category of ['location', 'item', 'dungeon', 'room', 'facility']) {
      for (const entry of window.DMTHAssets.getAll(category)) {
        out.push({
          category,
          id: entry.id,
          displayName: entry.displayName,
          emoji: entry.emoji,
          folder: window.DMTHAssets.assetFolderPath(category, entry.id),
          prompt: entry.prompt
        });
      }
    }
    return out;
  }

  window.DMTHAssetLoader = Object.freeze({
    resolveImageUrl,
    renderAsset,
    getPromptText,
    allAssetsWithPaths
  });
})();
