// DUNGEON MASTER: THE HUNT — disposal. Bury / incinerate / release / trade / finalization-film / lose-at-sea.

(function () {
  'use strict';

  const METHODS = {
    bury: {
      displayName: 'Bury',
      emoji: '⚱️',
      moneyCost: 0,
      notorietyFactor: (girl, dungeonTpl) => {
        const isolation = dungeonTpl?.isolation || 0.5;
        return isolation > 0.9 ? 0 : isolation > 0.7 ? 1 : 3;
      },
      suspicionSpike: 0,
      notes: 'On-property burial. Safest when dungeon isolation is high.'
    },
    'lose-at-sea': {
      displayName: 'Lose at Sea',
      emoji: '🌊',
      moneyCost: 200,
      notorietyFactor: () => 1,
      suspicionSpike: 0,
      notes: 'Boat + weight + coastal access required. Clean method.'
    },
    incinerate: {
      displayName: 'Incinerate',
      emoji: '🔥',
      moneyCost: 300,
      notorietyFactor: () => 0,
      suspicionSpike: 0,
      requiresFacility: 'incinerator',
      notes: 'Requires an incinerator facility upgrade. Cleanest method.'
    },
    trade: {
      displayName: 'Trade Away',
      emoji: '🤝',
      moneyCost: 0,
      refundOnGirl: true,                    // wired to slave-market listing
      notorietyFactor: () => 0,
      suspicionSpike: 0,
      notes: 'Route to the slave market as a listing.'
    },
    release: {
      displayName: 'Release',
      emoji: '🕊️',
      moneyCost: 0,
      notorietyFactor: (girl) => girl.bond.bondLevel >= 9 ? 0 : 10,
      suspicionSpike: 5,
      notes: 'Let her go. Bond L9 = she won\'t rat. Anything less = major notoriety + suspicion hit.'
    },
    'finalization-film': {
      displayName: 'Finalization Film',
      emoji: '🎬',
      moneyCost: 0,
      generatesFilm: true,
      notorietyFactor: () => 2,
      suspicionSpike: 0,
      notes: 'Record the ending as premium content. Sells at 3–5× base. Single-use per girl.'
    }
  };

  function dispose(girlId, method) {
    const girl = window.DMTHGame.state.getGirl(girlId);
    if (!girl) throw new Error('no such girl');
    const m = METHODS[method];
    if (!m) throw new Error('unknown method');

    // Cost check
    if (m.moneyCost > 0) {
      const ok = window.DMTHGame.state.spendMoney(m.moneyCost, `dispose:${method}`);
      if (!ok) throw new Error('insufficient funds for disposal method');
    }

    const dungeon = window.DMTHGame.state.getDungeon(girl.assignedDungeonId);
    const dungeonTpl = dungeon && window.DMTHAssets.getById('dungeon', dungeon.templateId);

    // Trade route — list on slave market instead of delete
    if (method === 'trade') {
      const price = Math.round(50 + (girl.bond.bondLevel * 30) + (girl.stats.obedience || 0) * 1.5);
      window.DMTHGame.state.listGirlForSale(girl.id, price);
      return { ok: true, method, listedPrice: price };
    }

    // Finalization film — record, then dispose
    let generatedFilmId = null;
    if (m.generatesFilm) {
      try {
        window.DMTHGame.film.startRecording(girl.id, ['finalization']);
        const film = window.DMTHGame.film.stopRecording({ title: `${girl.name}: The End`, basePrice: 500 });
        generatedFilmId = film.id;
      } catch {}
    }

    // Free the hold
    if (dungeon) {
      const newHolds = dungeon.holds.map(h => h.captiveGirlId === girl.id ? { ...h, captiveGirlId: null } : h);
      window.DMTHGame.state.updateDungeon(dungeon.id, { holds: newHolds });
    }

    // Log the disposal
    const notorietyDelta = m.notorietyFactor(girl, dungeonTpl);
    window.DMTHGame.state.addNotoriety(notorietyDelta);
    const log = {
      girlId: girl.id,
      girlNameAtDisposal: girl.name,
      method,
      dungeonId: dungeon?.id || null,
      dungeonTemplateAtDisposal: dungeon?.templateId || null,
      disposalDate: Date.now(),
      notorietyImpact: notorietyDelta,
      suspicionHeatSpike: m.suspicionSpike || 0,
      finalBondLevel: girl.bond.bondLevel,
      generatedFilmId
    };
    window.DMTHGame.state.addDisposal(log);

    // Remove from roster
    window.DMTHGame.state.removeGirl(girl.id);

    return { ok: true, method, log, generatedFilmId };
  }

  // Ollama narration of a disposal scene — called by UI after dispose() returns.
  async function narrateDisposal(girl, method) {
    const sceneKey = {
      bury: 'disposal_bury',
      incinerate: 'disposal_incinerate',
      release: 'disposal_release',
      'finalization-film': 'disposal_finalization'
    }[method];
    if (!sceneKey) return null;
    try {
      const system = window.DMTHTemplates.buildSystemPrompt(girl, 'sexy', sceneKey, {
        BOND_LEVEL: girl.bond.bondLevel
      });
      const { raw, parsed } = await window.DMTHGame.ollama.chatStream({
        system,
        messages: [{ role: 'user', content: '(final beat — narrate from first-person POV)' }]
      });
      return (parsed.cleanText || raw).trim();
    } catch {
      return null;
    }
  }

  window.DMTHGame = window.DMTHGame || {};
  window.DMTHGame.disposal = Object.freeze({ METHODS, dispose, narrateDisposal });
})();
