// SEX SLAVE DUNGEON — drug scheduler with pharmacokinetic curves.
// Each intake creates a curve on the girl's body.activeDrugs; tick recomputes current effect.

(function () {
  'use strict';

  // Curve table — all times in ms.
  // Effect peaks at `peakAt`, lingers, then wears off by `wearOffAt`.
  // highContribution is the max amount added to girl.body.high.
  const DRUG_CURVES = {
    coke:    { onsetMs: 60_000,   peakMs: 8 * 60_000,  wearOffMs: 45 * 60_000,  highContribution: 60, speechEffect: 'high_coke',  stackable: true,  itemId: 'coke-bumps' },
    weed:    { onsetMs: 90_000,   peakMs: 30 * 60_000, wearOffMs: 120 * 60_000, highContribution: 40, speechEffect: 'high_weed',  stackable: true,  itemId: 'weed' },
    mdma:    { onsetMs: 30 * 60_000, peakMs: 90 * 60_000, wearOffMs: 4 * 60 * 60_000, highContribution: 70, speechEffect: 'aroused', stackable: false, itemId: 'mdma' },
    acid:    { onsetMs: 45 * 60_000, peakMs: 4 * 60 * 60_000, wearOffMs: 10 * 60 * 60_000, highContribution: 55, speechEffect: 'curious', stackable: false, itemId: 'acid' },
    whiskey: { onsetMs: 5 * 60_000,  peakMs: 20 * 60_000, wearOffMs: 90 * 60_000, highContribution: 45, speechEffect: 'drunk',     stackable: true,  itemId: 'wine' },  // routed through 'wine'/'whiskey' item
    alcohol: { onsetMs: 5 * 60_000,  peakMs: 20 * 60_000, wearOffMs: 90 * 60_000, highContribution: 45, speechEffect: 'drunk',     stackable: true,  itemId: 'wine' },
    ketamine:{ onsetMs: 2 * 60_000,  peakMs: 8 * 60_000,  wearOffMs: 40 * 60_000, highContribution: 75, speechEffect: 'broken',    stackable: false, itemId: 'ketamine' }
  };

  // Administer a drug — consumes an inventory item if available, starts a curve on the girl.
  function administer(girlId, drugKey, { forFree = false } = {}) {
    const curve = DRUG_CURVES[drugKey];
    if (!curve) throw new Error('unknown drug: ' + drugKey);
    const girl = window.SSDGame.state.getGirl(girlId);
    if (!girl) throw new Error('no such girl');

    if (!forFree && curve.itemId) {
      const ok = window.SSDGame.state.consumeItem(curve.itemId, 1);
      if (!ok) throw new Error(`no ${curve.itemId} in inventory`);
    }

    const now = Date.now();
    const active = Array.isArray(girl.body.activeDrugs) ? girl.body.activeDrugs.slice() : [];

    if (!curve.stackable) {
      const existing = active.findIndex(d => (d.name || d) === drugKey);
      if (existing >= 0) active.splice(existing, 1);
    }
    active.push({
      name: drugKey,
      administeredAt: now,
      onsetAt: now + curve.onsetMs,
      peakAt: now + curve.peakMs,
      wearOffAt: now + curve.wearOffMs,
      highContribution: curve.highContribution,
      speechEffect: curve.speechEffect
    });

    window.SSDGame.state.updateGirl(girlId, {
      body: { ...girl.body, activeDrugs: active }
    });
    return { ok: true, curve, activeCount: active.length };
  }

  // Compute current effect per-girl from active curves.
  // Returns { high: 0..100, strongestEffect: 'high_coke' | 'drunk' | ..., activeList: [...] }
  function currentEffect(girl) {
    const now = Date.now();
    const active = Array.isArray(girl.body?.activeDrugs) ? girl.body.activeDrugs : [];
    let highTotal = 0;
    let strongest = null;
    let strongestMag = 0;
    const stillActive = [];

    for (const d of active) {
      if (typeof d !== 'object' || !d.administeredAt) continue;
      if (now >= d.wearOffAt) continue;
      stillActive.push(d);
      const mag = curveMagnitude(d, now);
      highTotal += mag;
      if (mag > strongestMag) {
        strongestMag = mag;
        strongest = d.speechEffect || 'neutral';
      }
    }

    return {
      high: Math.max(0, Math.min(100, Math.round(highTotal))),
      strongestEffect: strongest || 'neutral',
      activeList: stillActive
    };
  }

  // Bell-ish curve — ramps up to peak, holds briefly, decays to wear-off.
  function curveMagnitude(d, now) {
    if (now < d.administeredAt) return 0;
    if (now < d.onsetAt) {
      const p = (now - d.administeredAt) / Math.max(1, d.onsetAt - d.administeredAt);
      return p * d.highContribution * 0.5;
    }
    if (now < d.peakAt) {
      const p = (now - d.onsetAt) / Math.max(1, d.peakAt - d.onsetAt);
      return d.highContribution * (0.5 + 0.5 * p);
    }
    if (now >= d.wearOffAt) return 0;
    const p = (now - d.peakAt) / Math.max(1, d.wearOffAt - d.peakAt);
    return d.highContribution * (1 - p);
  }

  // Called by tick — updates every captive girl's body.high + drug list.
  function tickAll() {
    const s = window.SSDGame.state.current;
    if (!s) return;
    for (const girl of s.roster) {
      if (girl.encounterState !== 'captive') continue;
      const eff = currentEffect(girl);
      // If nothing changed meaningfully, skip.
      const needsUpdate = (eff.high !== girl.body.high) || (eff.activeList.length !== (girl.body.activeDrugs || []).length);
      if (!needsUpdate) continue;
      window.SSDGame.state.updateGirl(girl.id, {
        body: { ...girl.body, high: eff.high, activeDrugs: eff.activeList }
      });
    }
  }

  // Offer/share drug (user-initiated, consent-flavored)
  function offer(girlId, drugKey) {
    return administer(girlId, drugKey, { forFree: false });
  }

  // Get a readable remaining-time summary
  function summarize(girl) {
    const active = Array.isArray(girl.body?.activeDrugs) ? girl.body.activeDrugs : [];
    const now = Date.now();
    return active.filter(d => typeof d === 'object' && d.wearOffAt > now).map(d => ({
      name: d.name,
      mag: Math.round(curveMagnitude(d, now)),
      remainingMin: Math.max(0, Math.round((d.wearOffAt - now) / 60000))
    }));
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.drugs = Object.freeze({
    DRUG_CURVES, administer, offer, currentEffect, tickAll, summarize
  });
})();
