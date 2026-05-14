// SEX SLAVE DUNGEON — film recording + quality scoring.

(function () {
  'use strict';

  let active = null;  // current recording session { girlId, startedAt, startTurnIdx, tags }

  function isRecording() { return !!active; }
  function activeSession() { return active; }

  function startRecording(girlId, tags = []) {
    const girl = window.SSDGame.state.getGirl(girlId);
    if (!girl || girl.encounterState !== 'captive') {
      throw new Error('Can only record captive girls');
    }
    active = {
      girlId,
      startedAt: Date.now(),
      startTurnIdx: (window.SSDGame.state.current.turns[girlId] || []).length,
      tags: tags.slice()
    };
    return active;
  }

  function tagActive(tag) {
    if (!active) return;
    if (!active.tags.includes(tag)) active.tags.push(tag);
  }

  function stopRecording({ title, blurb, basePrice } = {}) {
    if (!active) throw new Error('No active recording');
    const session = active;
    active = null;

    const girl = window.SSDGame.state.getGirl(session.girlId);
    const endTurnIdx = (window.SSDGame.state.current.turns[session.girlId] || []).length;
    const turns = (window.SSDGame.state.current.turns[session.girlId] || [])
      .slice(session.startTurnIdx, endTurnIdx);

    const dungeon = window.SSDGame.state.getDungeon(girl.assignedDungeonId);
    const dungeonTpl = dungeon && window.SSDAssets.getById('dungeon', dungeon.templateId);

    const qualityMarkers = {
      bondLevelAtRecording: girl.bond.bondLevel,
      contentIntensity: computeIntensity(turns, girl),
      girlRarity: girl.archetypeTemplate === 'unity_seed' ? 'legendary' : 'standard',
      settingAesthetic: dungeonTpl?.contentValueMultiplier || 1.0,
      uniqueness: session.tags.includes('first-capture') ? 1.0
                : session.tags.includes('first-bond-up') ? 0.8
                : session.tags.includes('finalization') ? 1.5
                : 0.4
    };

    const computedBase = basePrice || autoPrice(qualityMarkers);

    const film = {
      id: 'film_' + Date.now().toString(36),
      girlId: girl.id,
      girlNameAtRecording: girl.name,
      dungeonId: dungeon?.id || null,
      dungeonTemplateAtRecording: dungeon?.templateId || null,
      startedAt: session.startedAt,
      endedAt: Date.now(),
      durationMinutes: Math.max(1, Math.round((Date.now() - session.startedAt) / 60000)),
      title: title || autoTitle(girl, session.tags),
      blurb: blurb || '',
      transcript: turns,
      keyImages: [],
      tags: session.tags,
      qualityMarkers,
      listedForSale: true,
      basePrice: computedBase,
      currentListPrice: Math.round(computedBase * pricingMultiplier(qualityMarkers, session.tags)),
      saleRecord: null,
      status: 'listed'
    };
    // Multi-session series stitch — if the girl has prior films with same `seriesId` pattern, link this one.
    const existingSeries = window.SSDGame.state.current.films.filter(f => f.girlId === girl.id && f.seriesId).slice(-1)[0];
    if (existingSeries && (Date.now() - existingSeries.endedAt < 24*60*60*1000)) {
      film.seriesId = existingSeries.seriesId;
      film.seriesEpisodeNumber = (existingSeries.seriesEpisodeNumber || 1) + 1;
      film.title = `${film.title} (series pt ${film.seriesEpisodeNumber})`;
      film.currentListPrice = Math.round(film.currentListPrice * 1.08);   // small series bonus
    } else if (qualityMarkers.uniqueness >= 0.8 || session.tags.includes('first-capture')) {
      film.seriesId = `series_${girl.id}_${Date.now().toString(36)}`;
      film.seriesEpisodeNumber = 1;
    }

    window.SSDGame.state.addFilm(film);
    // Apply wardrobe multiplier if she was wearing a non-default outfit
    if (window.SSDGame.wardrobe) {
      const m = window.SSDGame.wardrobe.currentMultiplier(girl);
      if (m !== 1.0) {
        window.SSDGame.state.updateFilm(film.id, {
          currentListPrice: Math.round(film.currentListPrice * m),
          outfitMultiplier: m,
          outfitWorn: girl.currentOutfit
        });
      }
    }
    // Auto-generate cover image IF Pollinations is configured — otherwise text+emoji film lives fine without it.
    if (window.SSDGame.imaging && window.SSDGame.imaging.isAvailable()) {
      window.SSDGame.imaging.filmCover(film.id).catch(() => {});
    }
    return film;
  }

  function computeIntensity(turns, girl) {
    // Heuristic from recent transcript: count intensity keywords + state delta magnitudes.
    const keywords = ['cum','fuck','spread','choke','tear','rip','bleed','scream','gag','bruise','break'];
    let kwHits = 0;
    for (const t of turns) {
      const txt = (t.text || '').toLowerCase();
      for (const kw of keywords) if (txt.includes(kw)) kwHits++;
    }
    const normalized = Math.min(1, kwHits / (turns.length * 2 + 1));
    const bodyWeight = Math.min(1, (girl.body.arousal + girl.body.wetness) / 200) * 0.3;
    const violenceWeight = Math.min(1, girl.body.bruises / 30) * 0.2;
    return Math.min(1, normalized * 0.5 + bodyWeight + violenceWeight);
  }

  function autoPrice(qm) {
    const base = 100;
    return Math.round(
      base
      * (0.6 + 0.15 * (qm.bondLevelAtRecording || 0))
      * (0.7 + 0.6 * (qm.contentIntensity || 0))
      * (qm.girlRarity === 'legendary' ? 1.8 : 1.0)
      * (qm.settingAesthetic || 1)
      * (0.7 + 0.8 * (qm.uniqueness || 0))
    );
  }

  function pricingMultiplier(qm, tags) {
    let m = 1;
    if (tags.includes('finalization')) m *= 3.5;
    if (tags.includes('first-capture')) m *= 1.5;
    if (tags.includes('first-bond-up')) m *= 1.25;
    if (tags.includes('group')) m *= 1.4;
    if (tags.includes('extreme-pain')) m *= 1.3;
    return m;
  }

  function autoTitle(girl, tags) {
    if (tags.includes('finalization')) return `${girl.name}: The End`;
    if (tags.includes('first-capture')) return `${girl.name}'s First Night`;
    if (tags.includes('first-bond-up')) return `${girl.name}, Breaking`;
    const arr = [
      `${girl.name} in the Dark`,
      `Session with ${girl.name}`,
      `${girl.name} — Property`,
      `${girl.name}, Day ${Math.max(1, Math.round((Date.now() - (girl.captureDate || Date.now())) / 86400000))}`
    ];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  window.SSDGame = window.SSDGame || {};
  window.SSDGame.film = Object.freeze({ isRecording, activeSession, startRecording, tagActive, stopRecording });
})();
