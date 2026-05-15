// DUNGEON MASTER: THE HUNT — propositioner rent-out business sim.

(function () {
  'use strict';

  const CLIENT_ARCHETYPES = [
    { id: 'exec_rough',   name: 'Executive',     budgetBase: 400, kinks: ['rough','degradation','oral'],              actsPref: ['oral','anal'],                quirks: ['rough','picky'],               rep: 0 },
    { id: 'politician',   name: 'Politician',    budgetBase: 1200, kinks: ['exhibition','roleplay','generous'],       actsPref: ['vanilla','roleplay'],        quirks: ['paranoid','generous','premium-rare'], rep: 0 },
    { id: 'junior_dom',   name: 'Junior Dom',    budgetBase: 150, kinks: ['light-bondage','praise','edging'],         actsPref: ['oral','vanilla','edging'],    quirks: ['tentative','low-budget'],       rep: 0 },
    { id: 'gang_leader',  name: 'Gang Leader',   budgetBase: 600, kinks: ['rough','group','degradation'],             actsPref: ['group','rough','anal'],       quirks: ['dangerous','group'],           rep: 0 },
    { id: 'rich_collector',name:'Rich Collector',budgetBase: 2500, kinks: ['exhibition','rare-archetypes','premium'], actsPref: ['full-session','vanilla'],    quirks: ['generous','picky','premium-rare'], rep: 0 },
    { id: 'kink_community',name:'Kink Community',budgetBase: 300, kinks: ['bdsm','endurance','public'],               actsPref: ['endurance','bdsm','group'],   quirks: ['safe','paying'],               rep: 0 },
    { id: 'trafficker',   name: 'Trafficker',    budgetBase: 900, kinks: ['broken','long-duration','compliant'],      actsPref: ['long-term','compliance-test'],quirks: ['dangerous','bad-actor'],        rep: 0 }
  ];

  const PROP_ACTS = ['oral','vanilla','anal','rough','edging','endurance','roleplay','group','bdsm','long-term'];

  function rollPropositioner() {
    const archetype = CLIENT_ARCHETYPES[Math.floor(Math.random() * CLIENT_ARCHETYPES.length)];
    const s = window.DMTHGame.state.current;
    const notorietyMult = 1 + (s.wallet.notoriety / 50);
    const budget = Math.round(archetype.budgetBase * notorietyMult * (0.8 + Math.random() * 0.4));
    const duration = [30, 60, 120, 240, 480][Math.floor(Math.random() * 5)];
    const actsWanted = pickN(archetype.actsPref, 1 + Math.floor(Math.random() * 2));
    const kinksWanted = pickN(archetype.kinks, 1 + Math.floor(Math.random() * 2));
    const archetypePref = pickN(['library','club','street','sorority','gym','barista'], 1 + Math.floor(Math.random() * 2));

    return {
      id: 'prop_' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
      clientId: archetype.id,
      clientName: archetype.name,
      budget,
      kinksWanted,
      actsWanted,
      archetypesWanted: archetypePref,
      durationMinutes: duration,
      quirks: archetype.quirks.slice(),
      arrivedAt: Date.now(),
      responseDeadline: Date.now() + 30 * 60 * 1000
    };
  }

  function pickN(arr, n) {
    const out = [];
    const copy = arr.slice();
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  }

  // Match a girl against a propositioner's preferences — returns 0..1
  function matchScore(girl, prop) {
    let score = 0;
    if (prop.archetypesWanted.includes(girl.archetypeTemplate)) score += 0.4;
    const kinkMatch = (girl.kinks || []).filter(k => prop.kinksWanted.some(w => k.toLowerCase().includes(w.toLowerCase()))).length;
    score += Math.min(0.4, kinkMatch * 0.15);
    score += Math.min(0.2, (girl.bond.bondLevel || 0) / 45);
    return Math.min(1, score);
  }

  // Accept a prop with a selected girl + terms
  function acceptWithGirl(propId, girlId, terms) {
    const s = window.DMTHGame.state.current;
    const prop = s.propositioners.inbox.find(p => p.id === propId);
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!prop || !girl) throw new Error('invalid prop or girl');
    const finalTerms = {
      price: terms?.price ?? prop.budget,
      actsPermitted: terms?.acts || prop.actsWanted,
      durationMinutes: terms?.durationMinutes || prop.durationMinutes,
      restrictedToys: terms?.restrictedToys || [],
      walkIfOver: terms?.walkIfOver ?? null
    };
    window.DMTHGame.state.acceptPropositioner(propId, girlId, finalTerms);
    return finalTerms;
  }

  // Resolve an active engagement.
  function resolveEngagement(propId) {
    const s = window.DMTHGame.state.current;
    const prop = s.propositioners.active.find(p => p.id === propId);
    if (!prop) throw new Error('no active engagement with that id');
    const girl = window.DMTHGame.state.getGirl(prop.girlId);
    if (!girl) throw new Error('girl missing');

    const match = matchScore(girl, prop);
    const stressFactor = prop.quirks.includes('rough') ? 0.4 : 0;
    const dangerFactor = prop.quirks.includes('dangerous') || prop.quirks.includes('bad-actor') ? 0.3 : 0;
    const generousFactor = prop.quirks.includes('generous') ? 0.2 : 0;
    const paranoidFactor = prop.quirks.includes('paranoid') ? 0.1 : 0;
    const satisfaction = Math.max(0, Math.min(1, match - stressFactor * 0.3 + Math.random() * 0.2));

    const baseTip = Math.round(prop.terms.price * (generousFactor + (satisfaction - 0.5) * 0.3));
    const tip = Math.max(-prop.terms.price * 0.2, baseTip);   // grumpy client can withhold portion
    const revenue = Math.max(0, prop.terms.price + tip);

    // Apply outcome to girl
    const bodyDelta = {
      bruises: prop.quirks.includes('rough') ? Math.floor(Math.random() * 4 + 2) : Math.floor(Math.random() * 2),
      arousal: Math.floor(Math.random() * 20) - 5,
      wetness: Math.floor(Math.random() * 20) - 5,
      cumLoad: Math.random() * 1.2
    };
    const bondXPDelta = satisfaction > 0.7 ? 5 : (satisfaction < 0.3 ? -5 : 1);
    const moodShift = satisfaction > 0.7 ? 'playful'
                    : satisfaction > 0.5 ? 'acclimating'
                    : satisfaction > 0.3 ? 'wary'
                                         : 'scared';

    const newBody = { ...girl.body };
    newBody.bruises = Math.max(0, newBody.bruises + bodyDelta.bruises);
    newBody.arousal = Math.max(0, Math.min(100, newBody.arousal + bodyDelta.arousal));
    newBody.wetness = Math.max(0, Math.min(100, newBody.wetness + bodyDelta.wetness));
    newBody.cumLoad = newBody.cumLoad + bodyDelta.cumLoad;

    const newMood = { mood: moodShift, moodEmoji: window.DMTHGame.delta.emojiForMood(moodShift), history: [...(girl.mood.history || []), { shift: `proposition-${moodShift}`, ts: Date.now() }] };
    const newBond = { ...girl.bond, bondXP: Math.max(0, girl.bond.bondXP + bondXPDelta), bondDebt: girl.bond.bondDebt + (bondXPDelta < 0 ? Math.abs(bondXPDelta) : 0) };
    window.DMTHGame.state.updateGirl(girl.id, { body: newBody, mood: newMood, bond: newBond });

    window.DMTHGame.state.addMoney(revenue, `prop:${prop.clientName}`);

    // Notoriety bump
    window.DMTHGame.state.addNotoriety(1);

    // Risk: bad actor might trigger escape or dungeon exposure
    const riskTrigger = (dangerFactor > 0 && Math.random() < 0.15);
    if (riskTrigger) {
      window.DMTHGame.state.addNotoriety(3);
    }

    const outcome = {
      satisfaction, revenue, tip, bodyDelta, bondXPDelta, moodShift, riskTrigger,
      notes: riskTrigger ? 'CLIENT WAS BAD ACTOR — notoriety spiked' : (satisfaction > 0.7 ? 'client overjoyed' : satisfaction < 0.3 ? 'client displeased' : 'client satisfied'),
      completedAt: Date.now()
    };
    window.DMTHGame.state.completePropositioner(propId, outcome);
    return outcome;
  }

  // Should a new prop arrive this tick?
  function shouldArriveThisTick() {
    const s = window.DMTHGame.state.current;
    if (!s) return false;
    if (s.propositioners.inbox.length >= 5) return false; // cap inbox
    const baseChance = 0.15 + (s.wallet.notoriety / 200);
    return Math.random() < Math.min(0.8, baseChance);
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.propositioner = Object.freeze({
    rollPropositioner, matchScore, acceptWithGirl, resolveEngagement, shouldArriveThisTick, CLIENT_ARCHETYPES
  });
})();
