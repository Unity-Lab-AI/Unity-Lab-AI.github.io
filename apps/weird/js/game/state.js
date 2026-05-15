// DUNGEON MASTER: THE HUNT — central game state. Reactive, IDB-backed.
// Every subsystem reads/writes through DMTHGame.state.*. Mutations emit 'change' events
// for UI refresh. Persisted atomically after every mutation.

(function () {
  'use strict';

  const DEFAULT_STATE = {
    version: 1,
    createdAt: null,
    mode: 'normal',                // 'normal' | 'sandbox'
    tickCount: 0,

    wallet: {
      money: 200,
      notoriety: 0,
      suspicionByLocation: {},
      // Player satisfaction meter (0-100). Sex acts with captives raise it; slow per-tick
      // decay drops it without intimacy. High satisfaction grants a hunting bonus —
      // capture odds get easier the more satisfied the player is.
      playerSatisfaction: 50,
      // BUZZ meter (0-100). Underground word-of-mouth about the operator's dungeons —
      // distinct from `notoriety` which is cop-heat. Bumped by film sales, successful
      // john completions, high-bond captives in the roster, stress-band streaks. Drained
      // by time-decay between income events, failed encounters, captive deaths. Drives
      // a buzzMul = 1 + (buzz/100) on whore-out john arrival rate — BUZZ 100 doubles
      // the johns coming through. Visible as chrome-bar 🐝 BUZZ badge.
      buzz: 0
    },

    inventory: {},                 // { [itemId]: qty }

    dungeons: [],                  // [{ id, templateId, holds:[{id, captiveGirlId|null, upgrades}], purchasedAt }]

    properties: [],                // [{ locationId, owned, passiveIncomePerTick }]

    roster: [],                    // [GirlProfile+state]  id-keyed; see girl-gen.js

    films: [],                     // [Film]  see film.js
    disposals: [],                 // [DisposalLog]
    propositioners: {              // propositioner business sim
      inbox: [],                   // pending offers
      active: [],                  // engagements underway
      completed: [],               // resolved
      repeatClients: {}            // { clientId: {rep, visits, preferredGirls:[]} }
    },

    slaveMarket: {
      listed: [],                  // player listings for sale
      available: [],               // procedural girls for sale by NPCs
      recentSales: []
    },

    turns: {},                     // { girlId: [{role, text, ts}] }  per-girl chat log (bounded)

    settings: {
      mode: 'sexy',                // 'sexy' | 'hurtme' | 'sexy_with_damage'
      activeGirlId: null,
      activeDungeonId: null
    }
  };

  const listeners = new Set();
  function emit() { for (const fn of listeners) { try { fn(state); } catch {} } }
  function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  let state = null;
  let loaded = false;

  async function load() {
    const stored = await window.DMTHStorage.save.get('main');
    state = stored && stored.version === DEFAULT_STATE.version
      ? Object.assign({}, DEFAULT_STATE, stored)
      : null;
    if (state) migrateLoadedState(state);
    loaded = true;
    return state;
  }

  // One-shot migrations on load — repair save shapes that pre-date a schema change.
  // Each migration is idempotent + null-safe so re-running doesn't double-mutate.
  function migrateLoadedState(s) {
    if (!s.roster) return;
    // Known archetype-id → canonical display name fallbacks for the seeded captives.
    // Procedural archetypes (library/club/street/sorority/gym/barista/etc.) use their
    // namePool[0] as a recovery hint when name was wiped or set to the archetype id.
    const NAME_FALLBACKS = {
      'unity_seed':  'Unity',
      'unity':       'Unity'
    };
    const ARCHETYPE_NAME_POOL_HEAD = {
      library: 'Marcy', club: 'Taryn', street: 'Nikki', sorority: 'Ashley',
      gym: 'Alex', barista: 'Juno', office: 'Alison', waitress: 'Candy',
      model: 'Sasha', nurse: 'Jennifer'
    };
    for (const g of s.roster) {
      if (!g) continue;
      // Repair name when it's been persisted as the archetype id (Unity_seed / unity_seed
      // / similar). Bootstrap.js writes 'Unity' correctly going forward; this migration
      // catches existing saves where the name slot got the archetype id.
      const arch = g.archetypeTemplate;
      const nameLooksLikeArchetype = typeof g.name === 'string' && (
        g.name === arch ||
        g.name.toLowerCase() === (arch || '').toLowerCase() ||
        /^[a-z_]+_seed$/i.test(g.name)
      );
      if (nameLooksLikeArchetype) {
        const fixed = NAME_FALLBACKS[arch] || ARCHETYPE_NAME_POOL_HEAD[arch] || 'Captive';
        console.info(`[state-migrate] repaired ${g.id} name "${g.name}" → "${fixed}"`);
        g.name = fixed;
      }
      // Backfill body fields the renderer assumes exist on every captive. Old saves
      // pre-date some of these (cumLoad / stamina / health / lastFedAt / decayedMinutes).
      // The renderer accesses them as bare numbers (g.body.cumLoad.toFixed(1) etc.) and
      // throws when they're undefined — the BUGStwo.38a "page won't open" symptom.
      g.body = g.body || {};
      const BODY_DEFAULTS = {
        arousal: 0, wetness: 0, cumLoad: 0, bruises: 0, high: 0,
        stamina: 70, health: 100,
        activeDrugs: [], outfitState: 'intact'
      };
      for (const [k, v] of Object.entries(BODY_DEFAULTS)) {
        if (g.body[k] == null) g.body[k] = v;
      }
      // bond / mood / escape minimal shape
      g.bond = g.bond || { bondLevel: 0, bondXP: 0, bondDebt: 0, milestones: [] };
      if (g.bond.bondLevel == null) g.bond.bondLevel = 0;
      if (g.bond.bondXP == null) g.bond.bondXP = 0;
      if (g.bond.bondDebt == null) g.bond.bondDebt = 0;
      g.mood = g.mood || { mood: 'neutral', moodEmoji: '🙂', history: [] };
      if (g.mood.mood == null) g.mood.mood = 'neutral';
      if (g.mood.moodEmoji == null) g.mood.moodEmoji = '🙂';
      g.escape = g.escape || { currentRisk: 0.1, factors: {}, lastAttempt: null };
    }
  }

  async function save() {
    if (!state) return;
    // Refuse to save while a wipe is in progress. Without this, an in-flight tick-driven
    // mutate() between wipeAll() and location.reload() would repopulate the save store
    // with the old state, defeating "fresh slate".
    if (window.DMTHGame?.state?._nuking) return;
    await window.DMTHStorage.save.put('main', state);
  }

  function initNew(opts = {}) {
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    state.createdAt = Date.now();
    state.mode = opts.mode || 'normal';
    if (state.mode === 'sandbox') {
      state.wallet.money = window.DMTHConfig.GAME.sandboxMoney;
    } else {
      state.wallet.money = window.DMTHConfig.GAME.startingMoney;
    }
    return state;
  }

  // --- Mutators (each auto-persists + emits) ---

  function mutate(fn) {
    if (!state) throw new Error('[state] not loaded');
    fn(state);
    save();
    emit();
  }

  // wallet
  function addMoney(amount, reason) {
    mutate(s => {
      s.wallet.money += amount;
      s._lastTxn = { amount, reason, at: Date.now() };
    });
  }
  function spendMoney(amount, reason) {
    if (!state || state.wallet.money < amount) return false;
    mutate(s => {
      s.wallet.money -= amount;
      s._lastTxn = { amount: -amount, reason, at: Date.now() };
    });
    return true;
  }
  function addNotoriety(delta) { mutate(s => { s.wallet.notoriety = Math.max(0, s.wallet.notoriety + delta); }); }
  function addSatisfaction(delta, reason) {
    mutate(s => {
      const cur = typeof s.wallet.playerSatisfaction === 'number' ? s.wallet.playerSatisfaction : 50;
      s.wallet.playerSatisfaction = Math.max(0, Math.min(100, cur + delta));
      s.wallet._lastSatisfactionEvent = { delta, reason, at: Date.now() };
    });
  }
  function getSatisfaction() { return typeof state?.wallet?.playerSatisfaction === 'number' ? state.wallet.playerSatisfaction : 50; }
  function addBuzz(delta, reason) {
    mutate(s => {
      const cur = typeof s.wallet.buzz === 'number' ? s.wallet.buzz : 0;
      s.wallet.buzz = Math.max(0, Math.min(100, cur + delta));
      s.wallet._lastBuzzEvent = { delta, reason, at: Date.now() };
    });
  }
  function getBuzz() { return typeof state?.wallet?.buzz === 'number' ? state.wallet.buzz : 0; }

  // inventory
  function addItem(itemId, qty = 1) {
    mutate(s => { s.inventory[itemId] = (s.inventory[itemId] || 0) + qty; });
  }
  function consumeItem(itemId, qty = 1) {
    if (!state || (state.inventory[itemId] || 0) < qty) return false;
    mutate(s => {
      s.inventory[itemId] -= qty;
      if (s.inventory[itemId] <= 0) delete s.inventory[itemId];
    });
    return true;
  }

  // dungeons
  function addDungeon(dungeon) { mutate(s => { s.dungeons.push(dungeon); }); }
  function updateDungeon(id, patch) {
    mutate(s => {
      const d = s.dungeons.find(x => x.id === id);
      if (d) Object.assign(d, patch);
    });
  }
  function getDungeon(id) { return state?.dungeons.find(d => d.id === id); }

  // roster
  function addGirl(girl) { mutate(s => { s.roster.push(girl); }); }
  function updateGirl(id, patch) {
    mutate(s => {
      const g = s.roster.find(x => x.id === id);
      if (g) deepMerge(g, patch);
    });
  }
  function getGirl(id) { return state?.roster.find(g => g.id === id); }
  function removeGirl(id) { mutate(s => { s.roster = s.roster.filter(g => g.id !== id); }); }

  function deepMerge(target, src) {
    for (const k of Object.keys(src)) {
      const v = src[k];
      if (v !== null && typeof v === 'object' && !Array.isArray(v) && typeof target[k] === 'object' && target[k] !== null) {
        deepMerge(target[k], v);
      } else {
        target[k] = v;
      }
    }
  }

  // turns
  function appendTurn(girlId, role, text) {
    mutate(s => {
      if (!s.turns[girlId]) s.turns[girlId] = [];
      s.turns[girlId].push({ role, text, ts: Date.now() });
      if (s.turns[girlId].length > 200) s.turns[girlId] = s.turns[girlId].slice(-200);
    });
  }
  function getTurns(girlId, n = 10) {
    return (state?.turns[girlId] || []).slice(-n);
  }
  // Wipes the per-girl turn log so the room view starts blank. Other girls' logs untouched.
  function clearTurns(girlId) {
    mutate(s => {
      if (s.turns[girlId]) delete s.turns[girlId];
    });
  }

  // films
  function addFilm(film) { mutate(s => { s.films.push(film); }); }
  function updateFilm(id, patch) {
    mutate(s => {
      const f = s.films.find(x => x.id === id);
      if (f) Object.assign(f, patch);
    });
  }
  function getFilm(id) { return state?.films.find(f => f.id === id); }

  // disposals
  function addDisposal(log) { mutate(s => { s.disposals.push(log); }); }

  // propositioners
  function enqueuePropositioner(p) { mutate(s => { s.propositioners.inbox.push(p); }); }
  function acceptPropositioner(id, girlId, terms) {
    mutate(s => {
      const i = s.propositioners.inbox.findIndex(p => p.id === id);
      if (i < 0) return;
      const [p] = s.propositioners.inbox.splice(i, 1);
      p.acceptedAt = Date.now();
      p.girlId = girlId;
      p.terms = terms;
      p.endsAt = Date.now() + (terms.durationMinutes || 60) * 60 * 1000;
      s.propositioners.active.push(p);
    });
  }
  function completePropositioner(id, outcome) {
    mutate(s => {
      const i = s.propositioners.active.findIndex(p => p.id === id);
      if (i < 0) return;
      const [p] = s.propositioners.active.splice(i, 1);
      p.outcome = outcome;
      p.completedAt = Date.now();
      s.propositioners.completed.push(p);
      // Update repeat-client memory
      const key = p.clientId;
      if (!s.propositioners.repeatClients[key]) {
        s.propositioners.repeatClients[key] = { rep: 0, visits: 0, preferredGirls: [] };
      }
      const rc = s.propositioners.repeatClients[key];
      rc.visits++;
      rc.rep += outcome.satisfaction || 0;
      if (outcome.satisfaction > 0.6 && !rc.preferredGirls.includes(p.girlId)) rc.preferredGirls.push(p.girlId);
    });
  }
  function rejectPropositioner(id) {
    mutate(s => {
      s.propositioners.inbox = s.propositioners.inbox.filter(p => p.id !== id);
    });
  }

  // slave market
  function listGirlForSale(girlId, price) {
    mutate(s => {
      s.slaveMarket.listed.push({ girlId, price, listedAt: Date.now() });
    });
  }
  function unlistGirl(girlId) {
    mutate(s => {
      s.slaveMarket.listed = s.slaveMarket.listed.filter(l => l.girlId !== girlId);
    });
  }

  // tick
  function bumpTick() { mutate(s => { s.tickCount++; }); }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.state = {
    get current() { return state; },
    isLoaded: () => loaded,
    load, save, initNew, onChange,
    addMoney, spendMoney, addNotoriety,
    addSatisfaction, getSatisfaction,
    addBuzz, getBuzz,
    addItem, consumeItem,
    addDungeon, updateDungeon, getDungeon,
    addGirl, updateGirl, getGirl, removeGirl,
    appendTurn, getTurns, clearTurns,
    addFilm, updateFilm, getFilm,
    addDisposal,
    enqueuePropositioner, acceptPropositioner, completePropositioner, rejectPropositioner,
    listGirlForSale, unlistGirl,
    bumpTick
  };
})();
