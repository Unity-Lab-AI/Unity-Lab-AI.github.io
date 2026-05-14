// SEX SLAVE DUNGEON — hunt / outside world page.

(function () {
  'use strict';

  function render(el, params) {
    const stage = params.stage || 'map';
    if (stage === 'map')       { window.SSDRouter.go('town'); return; }   // redirect to the plot page
    if (stage === 'location') return renderLocation(el, params);
    if (stage === 'approach') return renderApproach(el, params);
  }

  function renderLocation(el, params) {
    const locId = params.loc;
    const loc = window.SSDAssets.getById('location', locId);
    if (!loc) { el.innerHTML = `<p>unknown location</p>`; return; }
    const encounters = window.SSDGame.hunt.rollEncounters(locId, 3);
    const inv = window.SSDGame.state.current.inventory;

    el.innerHTML = `
      <div class="panel">
        <h2>${loc.emoji} ${loc.displayName}</h2>
        <p class="small muted">${loc.notes}</p>
        <div class="stat-row small"><span>Notoriety</span><b>${window.SSDGame.state.current.wallet.notoriety}</b>
          <span class="muted">(experience bonus applied to acquisitions)</span></div>
        <a href="#hunt" class="btn-small">← back to map</a>
      </div>
      <div class="panel">
        <h2>Girls available to acquire</h2>
        <div class="girl-grid">
          ${encounters.map(g => {
            const archDiff = window.SSDGame.hunt.ARCHETYPE_DIFFICULTY[g.archetypeTemplate] ?? 0.5;
            const captureTools = ['rohypnol','chloroform','ether','ketamine','duct-tape','rope','zip-ties','handcuffs'].filter(id => inv[id] > 0);
            const bestOdds = captureTools.length === 0 ? null : Math.max(...captureTools.map(tid =>
              window.SSDGame.hunt.previewCaptureOdds({ girl: g, toolId: tid, locationId: locId }).successP
            ));
            const oddsLabel = bestOdds === null ? 'no tool owned' : `${Math.round(bestOdds * 100)}% best odds`;
            return `
            <div class="girl-card approach-card">
              <div class="girl-emoji">${moodEmoji(g)}</div>
              <div class="girl-name">${g.name} <span class="muted small">(${g.age})</span></div>
              <div class="girl-meta">
                <span>${g.archetypeTemplate}</span>
                <span>type diff ${Math.round(archDiff*100)}%</span>
              </div>
              <div class="small muted">${g.backstoryFragment}</div>
              <div class="stat-row small"><span>Defiance</span><b>${g.stats.defiance}</b></div>
              <div class="stat-row small"><span>Intelligence</span><b>${g.stats.intelligence}</b></div>
              <div class="stat-row small"><span>Stamina</span><b>${g.stats.stamina}</b></div>
              <div class="stat-row small"><span>Pain tolerance</span><b>${g.stats.painTolerance}</b></div>
              <div class="stat-row small"><span>Acquire odds</span><b class="${bestOdds && bestOdds > 0.5 ? 'gold' : (bestOdds && bestOdds > 0.3 ? '' : 'danger')}">${oddsLabel}</b></div>
              <div class="btn-row">
                <button data-approach="${g.id}" class="btn-small btn-primary">Acquire →</button>
                <button data-walk="${g.id}" class="btn-small">Walk away</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    // Stash current roll in module state so approach page can find them
    window._SSD_lastEncounters = encounters;
    window._SSD_lastLocationId = locId;

    el.querySelectorAll('[data-approach]').forEach(b => {
      b.onclick = () => window.SSDRouter.go('hunt', { stage: 'approach', girl: b.dataset.approach, loc: locId });
    });
    el.querySelectorAll('[data-walk]').forEach(b => {
      b.onclick = () => window.SSDRouter.go('hunt');
    });

    // Make the whole card clickable — click anywhere on a girl card to approach her
    el.querySelectorAll('.approach-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = (ev) => {
        // Ignore clicks on inner buttons (they have their own handlers)
        if (ev.target.closest('button, a')) return;
        const id = card.querySelector('[data-approach]')?.dataset.approach;
        if (id) window.SSDRouter.go('hunt', { stage: 'approach', girl: id, loc: locId });
      };
    });

    // Per-encounter thumbnail generation — SEQUENTIAL (one at a time, in order).
    // Pass girl object directly (not via state) so we don't pollute roster with encounters.
    (async () => {
      for (let i = 0; i < encounters.length; i++) {
        const g = encounters[i];
        const card = el.querySelector(`[data-approach="${g.id}"]`)?.closest('.girl-card');
        if (!card) continue;
        const slot = document.createElement('div');
        slot.className = 'hunt-thumb-slot small muted';
        slot.textContent = `📷 generating ${i+1}/${encounters.length}…`;
        card.insertBefore(slot, card.firstChild.nextSibling);

        const situation = `hunt-encounter-${locId}`;
        try {
          const result = await window.SSDGame.imaging.generateFor(g, { situation, locationId: locId });
          if (result && result.url) {
            slot.innerHTML = `<img src="${result.url}" alt="${g.name}" class="gen-img hunt-thumb" onerror="this.outerHTML='<div class=\\'small muted\\'>(image blocked — click to approach anyway)</div>';" />`;
          } else {
            slot.innerHTML = `<div class="small muted">(no thumb — ${result?.error || 'skipped'})</div>`;
          }
        } catch (err) {
          slot.innerHTML = `<div class="small muted">(thumb error — click to approach anyway)</div>`;
        }
      }
    })();
  }

  function renderApproach(el, params) {
    const encounters = window._SSD_lastEncounters || [];
    const girl = encounters.find(g => g.id === params.girl);
    const locId = params.loc;
    if (!girl) { el.innerHTML = `<p>encounter expired — <a href="#hunt">back to map</a></p>`; return; }
    const inv = window.SSDGame.state.current.inventory;
    const captureTools = ['rohypnol','chloroform','ether','ketamine','duct-tape','rope','zip-ties','handcuffs'].filter(id => inv[id] > 0);
    const locName = window.SSDAssets.getById('location', locId)?.displayName;

    el.innerHTML = `
      <div class="panel">
        <h2>Approach: ${moodEmoji(girl)} ${girl.name}</h2>
        <p class="small muted">${girl.backstoryFragment}</p>
        <div class="stat-row small"><span>Archetype</span><b>${girl.archetypeTemplate}</b></div>
        <div class="stat-row small"><span>Defiance / Intelligence</span><b>${girl.stats.defiance} / ${girl.stats.intelligence}</b></div>
        <div class="stat-row small"><span>Stamina / Pain tolerance</span><b>${girl.stats.stamina} / ${girl.stats.painTolerance}</b></div>
        <div class="btn-row">
          <a href="#hunt?stage=location&loc=${locId}" class="btn-small">← back</a>
        </div>
      </div>
      <div class="panel">
        <h2>Talk first</h2>
        <div class="btn-col">
          <button data-action="talk" class="btn-small">💬 Open with a line (low commitment)</button>
          <button data-action="walk" class="btn-small">🚪 Walk away</button>
        </div>
      </div>
      <div class="panel">
        <h2>Acquire her</h2>
        ${captureTools.length === 0
          ? `<p class="muted small">No acquire tools in inventory. <a href="#shop">Shop →</a></p>`
          : `<div class="btn-col">${captureTools.map(id => {
              const item = window.SSDAssets.getById('item', id);
              const preview = window.SSDGame.hunt.previewCaptureOdds({ girl, toolId: id, locationId: locId });
              const pct = Math.round(preview.successP * 100);
              const cls = preview.successP > 0.6 ? 'gold' : preview.successP > 0.35 ? '' : 'danger';
              return `<button data-capture="${id}" class="btn-small btn-danger" title="tool=${Math.round(preview.factors.toolPower*100)}% · type diff=${Math.round(preview.factors.archetypeDifficulty*100)}% · defiance=${preview.factors.defiance} · intelligence=${preview.factors.intelligence} · suspicion=${preview.factors.suspicion} · notoriety=${preview.factors.notoriety}">
                ${item.emoji} ${item.displayName} — <span class="${cls}">${pct}%</span> (have ${inv[id]})
              </button>`;
            }).join('')}</div>`
        }
      </div>
      <div id="result"></div>
    `;

    el.querySelector('[data-action="talk"]').onclick = async () => {
      const resultEl = el.querySelector('#result');
      resultEl.innerHTML = `<div class="panel"><p class="small muted">${girl.name} turns to look at you…</p></div>`;
      await runSceneNarration({
        girl, sceneKey: 'first_encounter', sceneVars: { LOCATION: locName },
        userText: '', resultEl, heading: `${girl.name} says:`
      });
    };
    el.querySelector('[data-action="walk"]').onclick = () => window.SSDRouter.go('hunt');

    el.querySelectorAll('[data-capture]').forEach(b => {
      b.onclick = async () => {
        const toolId = b.dataset.capture;
        const tool = window.SSDAssets.getById('item', toolId);
        const outcome = window.SSDGame.hunt.attemptCapture({ girl, toolId, locationId: locId });
        const resultEl = el.querySelector('#result');
        const sceneMap = {
          'success':         'acquire_success',
          'partial-fail':    'acquire_partial_fail',
          'fail':            'acquire_fail',
          'critical-fail':   'acquire_critical_fail'
        };
        const sceneKey = sceneMap[outcome.outcome] || 'acquire_fail';
        const heading = outcome.outcome === 'success'       ? '🎯 ACQUIRED — her last conscious moments'
                       : outcome.outcome === 'partial-fail' ? '⚠️ She slipped'
                       : outcome.outcome === 'fail'         ? '❌ Blown it'
                                                            : '🚨 CATASTROPHIC FAIL';
        // Mechanical summary block
        const mechanical = buildMechanicalSummary(outcome, tool);
        resultEl.innerHTML = `<div class="panel"><h3>${heading}</h3>${mechanical}<div class="log"><div class="log-entry assistant streaming"><b>${girl.name}:</b> <span id="acquire-narr"></span></div></div></div>`;

        // Ollama narrates the scene
        await runSceneNarration({
          girl, sceneKey,
          sceneVars: { LOCATION: locName, TOOL: tool.displayName },
          userText: '',
          injectInto: resultEl.querySelector('#acquire-narr')
        });

        // On success — play full 4-beat capture transition sequence
        if (outcome.outcome === 'success') {
          const escortResult = window.SSDGame.hunt.escortToHold(girl);
          const sceneVars = window.SSDGame.hunt.composeSceneVars({
            girl, toolId, locationId: locId, dungeonId: escortResult.dungeonId
          });
          await playTransitionSequence({ resultEl, girl, sceneVars });
          const followup = document.createElement('div');
          followup.className = 'btn-row';
          followup.innerHTML = `<a href="#room?girl=${girl.id}" class="btn-primary">Enter her hold →</a>`;
          resultEl.querySelector('.panel').appendChild(followup);
        }
      };
    });
  }

  // Play the 4-beat capture transition as sequential Ollama scenes.
  async function playTransitionSequence({ resultEl, girl, sceneVars }) {
    const beats = [
      { key: 'transition_subdue',        heading: '🔸 beat 1 — subdue' },
      { key: 'transition_transport',     heading: '🔸 beat 2 — transport' },
      { key: 'transition_arrival',       heading: '🔸 beat 3 — arrival' },
      { key: 'transition_first_moment',  heading: '🔸 beat 4 — first moment in her hold' }
    ];
    const container = document.createElement('div');
    container.className = 'panel transition-panel';
    container.innerHTML = `<h3>📽️ Capture transition</h3><div class="transition-log"></div>`;
    resultEl.appendChild(container);
    const logEl = container.querySelector('.transition-log');

    for (const beat of beats) {
      const beatDiv = document.createElement('div');
      beatDiv.className = 'log-entry assistant streaming';
      beatDiv.innerHTML = `<b>${beat.heading}</b><br><span></span>`;
      logEl.appendChild(beatDiv);
      const spanEl = beatDiv.querySelector('span');
      try {
        const system = window.SSDTemplates.buildSystemPrompt(girl, 'sexy', beat.key, sceneVars);
        const { raw, parsed } = await window.SSDGame.ollama.chatStream({
          system,
          messages: [{ role: 'user', content: '(play out this beat in first person from her POV)' }],
          onChunk: (chunk, full) => {
            spanEl.textContent = full.replace(/<delta>[\s\S]*?<\/delta>/g, '').trim();
            logEl.scrollTop = logEl.scrollHeight;
          }
        });
        spanEl.textContent = (parsed.cleanText || raw).trim();
        beatDiv.classList.remove('streaming');
        // Append to girl's turn log so she remembers her own narration
        window.SSDGame.state.appendTurn(girl.id, 'assistant', `[${beat.heading}] ${spanEl.textContent}`);
      } catch (err) {
        spanEl.textContent = `(Ollama unreachable — beat skipped: ${err.message})`;
        beatDiv.classList.remove('streaming');
      }
    }
  }

  // Run a scene narration — calls Ollama with the scene template, streams text into a DOM target.
  async function runSceneNarration({ girl, sceneKey, sceneVars, userText = '', resultEl, heading, injectInto }) {
    try {
      const system = window.SSDTemplates.buildSystemPrompt(girl, 'sexy', sceneKey, sceneVars);
      let target = injectInto;
      if (!target && resultEl) {
        resultEl.innerHTML = `<div class="panel"><h3>${heading || girl.name}</h3><div class="log"><div class="log-entry assistant streaming"><b>${girl.name}:</b> <span id="narr-txt"></span></div></div></div>`;
        target = resultEl.querySelector('#narr-txt');
      }
      const { raw, parsed } = await window.SSDGame.ollama.chatStream({
        system,
        messages: [{ role: 'user', content: userText || `(Master initiates the scene — narrate from your POV.)` }],
        onChunk: (chunk, full) => {
          if (!target) return;
          target.textContent = full.replace(/<delta>[\s\S]*?<\/delta>/g, '').trim();
        }
      });
      if (target) target.textContent = (parsed.cleanText || raw).trim();
    } catch (err) {
      if (resultEl) {
        resultEl.insertAdjacentHTML('beforeend', `<p class="small danger">(Ollama unreachable: ${err.message} — game mechanics still applied.)</p>`);
      } else if (injectInto) {
        injectInto.textContent = `(Ollama unreachable: ${err.message} — mechanics applied.)`;
      }
    }
  }

  function buildMechanicalSummary(outcome, tool) {
    const rows = [];
    rows.push(`<div class="stat-row small"><span>Roll vs</span><b>${Math.round(outcome.successP*100)}% success</b></div>`);
    rows.push(`<div class="stat-row small"><span>Tool consumed</span><b>${tool.emoji} ${tool.displayName}</b></div>`);
    if (outcome.suspicionDelta)   rows.push(`<div class="stat-row small"><span>Location suspicion</span><b class="warn">+${outcome.suspicionDelta}</b></div>`);
    if (outcome.notorietyDelta)   rows.push(`<div class="stat-row small"><span>Notoriety</span><b class="warn">+${outcome.notorietyDelta}</b></div>`);
    return `<div class="mechanical-summary">${rows.join('')}</div>`;
  }

  function moodEmoji(g) { return g.mood?.moodEmoji || '😐'; }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  window.SSDRouter.register('hunt', render);
})();
