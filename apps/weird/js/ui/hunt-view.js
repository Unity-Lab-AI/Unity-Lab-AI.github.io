// DUNGEON MASTER: THE HUNT — hunt / outside world page.

(function () {
  'use strict';

  function render(el, params) {
    const stage = params.stage || 'map';
    if (stage === 'map')       { window.DMTHRouter.go('town'); return; }   // redirect to the plot page
    if (stage === 'location') return renderLocation(el, params);
    if (stage === 'approach') return renderApproach(el, params);
  }

  function renderLocation(el, params) {
    const locId = params.loc;
    const loc = window.DMTHAssets.getById('location', locId);
    if (!loc) { el.innerHTML = `<p>unknown location</p>`; return; }
    const encounters = window.DMTHGame.hunt.rollEncounters(locId, 3);
    const inv = window.DMTHGame.state.current.inventory;

    el.innerHTML = `
      <div class="panel">
        <h2>${loc.emoji} ${loc.displayName}</h2>
        <p class="small muted">${loc.notes}</p>
        <div class="stat-row small"><span>Notoriety</span><b>${window.DMTHGame.state.current.wallet.notoriety}</b>
          <span class="muted">(experience bonus applied to acquisitions)</span></div>
        <a href="#hunt" class="btn-small">← back to map</a>
      </div>
      <div class="panel">
        <h2>Girls available to acquire</h2>
        <div class="girl-grid">
          ${encounters.map(g => {
            const archDiff = window.DMTHGame.hunt.ARCHETYPE_DIFFICULTY[g.archetypeTemplate] ?? 0.5;
            const captureTools = ['rohypnol','chloroform','ether','ketamine','duct-tape','rope','zip-ties','handcuffs'].filter(id => inv[id] > 0);
            const bestOdds = captureTools.length === 0 ? null : Math.max(...captureTools.map(tid =>
              window.DMTHGame.hunt.previewCaptureOdds({ girl: g, toolId: tid, locationId: locId }).successP
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
                <button data-approach="${g.id}" class="btn-small btn-primary" data-tooltip="Open the capture-loadout view. Pick a tool per stage, fire the 4-stage attempt.">Acquire →</button>
                <button data-walk="${g.id}" class="btn-small" data-tooltip="Skip her. No cost, no notoriety.">Walk away</button>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;

    // Stash current roll in module state so approach page can find them
    window._DMTH_lastEncounters = encounters;
    window._DMTH_lastLocationId = locId;

    el.querySelectorAll('[data-approach]').forEach(b => {
      b.onclick = () => window.DMTHRouter.go('hunt', { stage: 'approach', girl: b.dataset.approach, loc: locId });
    });
    el.querySelectorAll('[data-walk]').forEach(b => {
      b.onclick = () => window.DMTHRouter.go('hunt');
    });

    // Make the whole card clickable — click anywhere on a girl card to approach her
    el.querySelectorAll('.approach-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.onclick = (ev) => {
        // Ignore clicks on inner buttons (they have their own handlers)
        if (ev.target.closest('button, a')) return;
        const id = card.querySelector('[data-approach]')?.dataset.approach;
        if (id) window.DMTHRouter.go('hunt', { stage: 'approach', girl: id, loc: locId });
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
          const result = await window.DMTHGame.imaging.generateFor(g, { situation, locationId: locId });
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

  // Simple single-tool capture UI with escalating wrangle. Player picks one item per
  // attempt; each failed attempt escalates her struggle (calm → suspicious → fighting →
  // screaming → running). Chance multiplier drops per tier; at tier 4 (running) the
  // encounter ends and she escapes. Player gets ~4 attempts max, fewer with cheap tools.
  function renderApproach(el, params) {
    const encounters = window._DMTH_lastEncounters || [];
    const girl = encounters.find(g => g.id === params.girl);
    const locId = params.loc;
    if (!girl) { el.innerHTML = `<p>encounter expired — <a href="#hunt">back to map</a></p>`; return; }
    const locName = window.DMTHAssets.getById('location', locId)?.displayName;
    const cap = window.DMTHGame.capture;

    // Encounter-scoped wrangle state — survives re-renders of the picker, resets if
    // the user navigates away.
    let escalationTier = 0;
    const attemptHistory = [];   // [{toolId, outcome, roll, chance}]

    function rerender() {
      const tools = cap.eligibleSimpleTools();
      const suspicionNow = window.DMTHGame.state.current?.wallet?.suspicionByLocation?.[locId] || 0;
      const tierMul = cap.escalationMultiplier(escalationTier);
      const tierLabel = cap.escalationLabel(escalationTier);
      const tierEmoji = ['😐','😟','😠','😱','💨'][escalationTier] || '·';
      const tierColor = ['','','warn','danger','danger'][escalationTier] || '';

      const toolCards = tools.length === 0
        ? `<p class="small danger">No capture tools in inventory. <a href="#shop">Shop →</a></p>`
        : tools.map(t => {
            const item = window.DMTHAssets.getById('item', t.id);
            const adjChance = Math.max(0.05, t.chance * tierMul);
            const pct = Math.round(adjChance * 100);
            const colorClass = pct >= 90 ? 'highgreen' : pct >= 70 ? '' : pct >= 60 ? 'warn' : 'danger';
            return `
              <button class="btn-small simple-capture-btn" data-tool="${t.id}" data-tooltip="${item?.notes || ''}" style="display:flex;align-items:center;gap:8px;padding:10px 14px;">
                <span style="font-size:1.4rem;">${item?.emoji || '🔧'}</span>
                <span style="flex:1;text-align:left;">
                  <b>${item?.displayName || t.id}</b><br>
                  <span class="small muted">have ×${t.owned} · base ${Math.round(t.chance * 100)}% × ${tierLabel} ${Math.round(tierMul * 100)}%</span>
                </span>
                <span class="bar-fill ${colorClass}" style="padding:4px 10px;border-radius:4px;font-weight:700;">${pct}%</span>
              </button>
            `;
          }).join('');

      const historyHtml = attemptHistory.length === 0 ? '' : `
        <div class="small muted" style="margin-top:10px;">
          <b>Misses this encounter:</b>
          <ul style="margin:4px 0 0;padding-left:20px;">
            ${attemptHistory.map((a, i) => {
              const it = window.DMTHAssets.getById('item', a.toolId);
              return `<li>#${i+1} ${it?.emoji || ''} ${it?.displayName || a.toolId} → rolled ${Math.round(a.roll * 100)} vs ${Math.round(a.chance * 100)}% — ${a.outcome.toUpperCase()}</li>`;
            }).join('')}
          </ul>
        </div>
      `;

      el.innerHTML = `
        <div class="panel">
          <h2>Approach: ${moodEmoji(girl)} ${girl.name}</h2>
          <p class="small muted">${girl.backstoryFragment}</p>
          <div class="stat-row small"><span>Archetype</span><b>${girl.archetypeTemplate}</b></div>
          <div class="stat-row small"><span>Location</span><b>${locName}</b></div>
          <div class="stat-row small"><span>Location suspicion</span><b class="${suspicionNow > 5 ? 'warn' : ''}">${suspicionNow}</b></div>
          <div class="btn-row">
            <a href="#hunt?stage=location&loc=${locId}" class="btn-small">← back</a>
          </div>
        </div>

        <div class="panel">
          <h2>Talk first</h2>
          <div class="btn-col">
            <button data-action="talk" class="btn-small" data-tooltip="Ollama-narrated first-encounter scene from her POV. Low commitment.">💬 Open with a line (low commitment)</button>
            <button data-action="walk" class="btn-small" data-tooltip="Leave the encounter. No cost, no notoriety, no inventory loss.">🚪 Walk away</button>
          </div>
        </div>

        <div class="panel">
          <h2>Capture</h2>
          <div class="stat-row" style="margin-bottom:10px;"><span>Her state</span><b class="${tierColor}">${tierEmoji} ${tierLabel.toUpperCase()} · chance × ${Math.round(tierMul * 100)}%</b></div>
          <p class="small muted">Pick a tool. Cheap items 50-60%, mid-tier 70-80%, heavy sedatives 90-100%. Each miss escalates her struggle and tightens the odds. After 4 misses she breaks free and runs.</p>
          <div class="btn-col" style="gap:6px;">
            ${toolCards}
          </div>
          ${historyHtml}
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
      el.querySelector('[data-action="walk"]').onclick = () => window.DMTHRouter.go('hunt');

      el.querySelectorAll('.simple-capture-btn').forEach(btn => {
        btn.onclick = async () => {
          const toolId = btn.dataset.tool;
          el.querySelectorAll('.simple-capture-btn').forEach(b => { b.disabled = true; });
          const result = cap.simpleAttempt({ girl, toolId, locationId: locId, escalationTier });

          const item = window.DMTHAssets.getById('item', toolId);
          const resultEl = el.querySelector('#result');

          if (result.outcome === 'success' || result.outcome === 'success-no-room') {
            const heading = result.outcome === 'success'
              ? `<h3>🎯 ACQUIRED — ${item?.emoji} ${item?.displayName} landed</h3>`
              : `<h3>⚠️ CAUGHT BUT NO ROOM</h3><p class="warn small">${result.error || 'no open holds in active dungeon'} — upgrade or buy a dungeon first.</p>`;
            resultEl.innerHTML = `
              <div class="panel">
                ${heading}
                <div class="stat-row small"><span>Rolled</span><b>${Math.round(result.roll * 100)}</b> vs <b>${Math.round(result.chance * 100)}%</b></div>
                <div class="log"><div class="log-entry assistant streaming"><b>${girl.name}:</b> <span id="acquire-narr"></span></div></div>
              </div>
            `;
            await runSceneNarration({
              girl, sceneKey: result.outcome === 'success' ? 'acquire_success' : 'acquire_partial_fail',
              sceneVars: { LOCATION: locName, TOOL: item?.displayName || toolId },
              userText: '',
              injectInto: resultEl.querySelector('#acquire-narr')
            });
            if (result.outcome === 'success' && result.escort) {
              const sceneVars = window.DMTHGame.hunt.composeSceneVars({
                girl, toolId, locationId: locId, dungeonId: result.escort.dungeonId
              });
              await playTransitionSequence({ resultEl, girl, sceneVars });
              const followup = document.createElement('div');
              followup.className = 'btn-row';
              followup.innerHTML = `<a href="#room?girl=${girl.id}" class="btn-primary">Enter her hold →</a>`;
              resultEl.querySelector('.panel').appendChild(followup);
            }
            return;
          }

          if (result.outcome === 'escaped') {
            attemptHistory.push({ toolId, outcome: 'miss', roll: result.roll, chance: result.chance });
            escalationTier = result.escalationTier;
            resultEl.innerHTML = `
              <div class="panel">
                <h3>💨 SHE GOT AWAY</h3>
                <p class="small">${cap.escalationNarration(escalationTier)}</p>
                <div class="stat-row small"><span>Notoriety</span><b class="warn">+${result.notorietyDelta || 2}</b></div>
                <div class="log"><div class="log-entry assistant streaming"><b>${girl.name}:</b> <span id="acquire-narr"></span></div></div>
                <div class="btn-row" style="margin-top:10px;">
                  <a href="#hunt?stage=location&loc=${locId}" class="btn-small">← back to location</a>
                  <a href="#hunt" class="btn-small">map</a>
                </div>
              </div>
            `;
            await runSceneNarration({
              girl, sceneKey: 'acquire_fail',
              sceneVars: { LOCATION: locName, TOOL: item?.displayName || toolId },
              userText: '',
              injectInto: resultEl.querySelector('#acquire-narr')
            });
            return;
          }

          // Plain miss — she escalates but encounter continues.
          attemptHistory.push({ toolId, outcome: 'miss', roll: result.roll, chance: result.chance });
          escalationTier = result.escalationTier;
          const struggleLine = cap.escalationNarration(escalationTier) || 'she pulls back';
          resultEl.innerHTML = `
            <div class="panel">
              <h3>❌ MISSED — ${item?.emoji} ${item?.displayName} didn't connect</h3>
              <div class="stat-row small"><span>Rolled</span><b>${Math.round(result.roll * 100)}</b> vs <b>${Math.round(result.chance * 100)}%</b></div>
              <div class="stat-row small"><span>Her state</span><b class="warn">${cap.escalationLabel(escalationTier).toUpperCase()} — ${struggleLine}</b></div>
              <p class="small muted">Try again with a different tool. The longer this drags on the harder it gets.</p>
            </div>
          `;
          // Re-render the picker with updated odds + history (after a short beat).
          setTimeout(rerender, 1200);
        };
      });
    }

    rerender();
  }

  // Animate one progress bar from 0% to its final value over ~600ms.
  function animateProgressBar(meterEl, finalProgress, cleared) {
    return new Promise(resolve => {
      const bar = meterEl.querySelector('.capture-progress-bar');
      const pct = meterEl.querySelector('.capture-progress-pct');
      if (!bar || !pct) { resolve(); return; }
      const start = performance.now();
      const duration = 600;
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = Math.round(finalProgress * eased);
        bar.style.width = current + '%';
        pct.textContent = current + '%' + (cleared && t >= 1 ? ' ✓' : '');
        if (t < 1) requestAnimationFrame(step);
        else {
          if (cleared) meterEl.classList.add('cleared');
          else meterEl.classList.add('failed');
          meterEl.classList.remove('in-progress', 'idle');
          resolve();
        }
      }
      meterEl.classList.add('in-progress');
      requestAnimationFrame(step);
    });
  }

  // Pick the highest-stage-stat tool from the cleared stages (for narration "TOOL").
  function pickHeroToolFromStages(stages) {
    let best = null;
    let bestStat = -1;
    for (const s of stages) {
      if (!s.toolId || !s.cleared) continue;
      if (s.toolBonus > bestStat) {
        bestStat = s.toolBonus;
        best = s.toolId;
      }
    }
    return best;
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
        const system = window.DMTHTemplates.buildSystemPrompt(girl, 'sexy', beat.key, sceneVars);
        const { raw, parsed } = await window.DMTHGame.ollama.chatStream({
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
        window.DMTHGame.state.appendTurn(girl.id, 'assistant', `[${beat.heading}] ${spanEl.textContent}`);
      } catch (err) {
        spanEl.textContent = `(Ollama unreachable — beat skipped: ${err.message})`;
        beatDiv.classList.remove('streaming');
      }
    }
  }

  // Run a scene narration — calls Ollama with the scene template, streams text into a DOM target.
  async function runSceneNarration({ girl, sceneKey, sceneVars, userText = '', resultEl, heading, injectInto }) {
    try {
      const system = window.DMTHTemplates.buildSystemPrompt(girl, 'sexy', sceneKey, sceneVars);
      let target = injectInto;
      if (!target && resultEl) {
        resultEl.innerHTML = `<div class="panel"><h3>${heading || girl.name}</h3><div class="log"><div class="log-entry assistant streaming"><b>${girl.name}:</b> <span id="narr-txt"></span></div></div></div>`;
        target = resultEl.querySelector('#narr-txt');
      }
      const { raw, parsed } = await window.DMTHGame.ollama.chatStream({
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

  function moodEmoji(g) { return g.mood?.moodEmoji || '😐'; }
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  window.DMTHRouter.register('hunt', render);
})();
