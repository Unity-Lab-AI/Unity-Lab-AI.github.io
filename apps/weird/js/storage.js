// DUNGEON MASTER: THE HUNT — IndexedDB abstraction.
// Primary persistence for player economy, roster, dungeon, rooms, episodes, market, per-girl state.
// Exposes a small promise-based API. No dependencies.

(function () {
  'use strict';

  const { idbName, idbVersion, stores } = window.DMTHConfig?.STORAGE || {
    idbName: 'dungeon_master_the_hunt', idbVersion: 1,
    stores: { save: 'save', girls: 'girls', episodes: 'episodes', cache: 'cache', audio: 'audio' }
  };

  let dbPromise = null;

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(idbName, idbVersion);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of Object.values(stores)) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB blocked'));
    });
    return dbPromise;
  }

  function tx(storeName, mode) {
    return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
  }

  async function get(store, key) {
    const s = await tx(store, 'readonly');
    return new Promise((res, rej) => {
      const r = s.get(key);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }

  async function put(store, key, value) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => {
      const r = s.put(value, key);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  }

  async function del(store, key) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => {
      const r = s.delete(key);
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  }

  async function getAll(store) {
    const s = await tx(store, 'readonly');
    return new Promise((res, rej) => {
      const r = s.getAll();
      r.onsuccess = () => res(r.result || []);
      r.onerror = () => rej(r.error);
    });
  }

  async function clear(store) {
    const s = await tx(store, 'readwrite');
    return new Promise((res, rej) => {
      const r = s.clear();
      r.onsuccess = () => res(true);
      r.onerror = () => rej(r.error);
    });
  }

  // --- High-level save/load across all stores for export / import / wipe ---

  async function exportAll() {
    const result = {};
    for (const [k, store] of Object.entries(stores)) {
      const s = await tx(store, 'readonly');
      const keysReq = s.getAllKeys();
      const valsReq = s.getAll();
      const [keys, vals] = await Promise.all([
        new Promise((res, rej) => { keysReq.onsuccess = () => res(keysReq.result); keysReq.onerror = () => rej(keysReq.error); }),
        new Promise((res, rej) => { valsReq.onsuccess = () => res(valsReq.result); valsReq.onerror = () => rej(valsReq.error); })
      ]);
      result[k] = keys.map((key, i) => ({ key, value: vals[i] }));
    }
    result.__meta = { exportedAt: new Date().toISOString(), version: window.DMTHConfig.GAME.version };
    return result;
  }

  async function importAll(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
    for (const [k, store] of Object.entries(stores)) {
      if (!Array.isArray(payload[k])) continue;
      await clear(store);
      for (const entry of payload[k]) {
        await put(store, entry.key, entry.value);
      }
    }
    return true;
  }

  async function wipeAll() {
    for (const store of Object.values(stores)) {
      await clear(store);
    }
    return true;
  }

  window.DMTHStorage = Object.freeze({
    get,
    put,
    del,
    getAll,
    clear,
    exportAll,
    importAll,
    wipeAll,
    // Namespaced helpers
    save:     { get: k => get(stores.save, k),     put: (k, v) => put(stores.save, k, v),     getAll: () => getAll(stores.save),     clear: () => clear(stores.save) },
    girls:    { get: k => get(stores.girls, k),    put: (k, v) => put(stores.girls, k, v),    getAll: () => getAll(stores.girls),    clear: () => clear(stores.girls) },
    episodes: { get: k => get(stores.episodes, k), put: (k, v) => put(stores.episodes, k, v), getAll: () => getAll(stores.episodes), clear: () => clear(stores.episodes) },
    cache:    { get: k => get(stores.cache, k),    put: (k, v) => put(stores.cache, k, v),    getAll: () => getAll(stores.cache),    clear: () => clear(stores.cache) },
    audio:    { get: k => get(stores.audio, k),    put: (k, v) => put(stores.audio, k, v),    getAll: () => getAll(stores.audio),    clear: () => clear(stores.audio) }
  });
})();
