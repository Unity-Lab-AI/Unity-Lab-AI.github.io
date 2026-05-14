// SEX SLAVE DUNGEON — escape-recovery hunt page.

(function () {
  'use strict';

  function render(el) {
    const recoverable = window.SSDGame.escapeRecovery.recoverable();
    const s = window.SSDGame.state.current;
    const inv = s.inventory;
    const tools = ['pipe','rohypnol','chloroform','ether','ketamine','duct-tape','rope','zip-ties','handcuffs','shackles'].filter(id => inv[id] > 0);

    el.innerHTML = `
      <div class="panel">
        <h2>🏃 Escapees on the run (${recoverable.length})</h2>
        <p class="small muted">You have 3 hours real-time to re-capture an escaped girl before she's gone forever. Re-capture is harder — she's on alert and running.</p>
      </div>

      ${recoverable.length === 0 ? `<div class="panel"><p class="muted small">No escapees to chase. Good containment.</p></div>` :
        `<div class="panel">
          <div class="girl-grid">
            ${recoverable.map(g => {
              const remainingMin = Math.round(window.SSDGame.escapeRecovery.timeRemaining(g) / 60000);
              return `<div class="girl-card">
                <div class="girl-emoji">${g.mood.moodEmoji}</div>
                <div class="girl-name">${g.name}</div>
                <div class="girl-meta">
                  <span>${g.archetypeTemplate}</span>
                  <span>L${g.bond.bondLevel}</span>
                  <span class="warn">${remainingMin}min left</span>
                </div>
                <div class="small muted">${g.backstoryFragment}</div>
                <div class="stat-row small"><span>Defiance (+20 alert)</span><b>${g.stats.defiance + 20}</b></div>
                <h4>Re-capture with:</h4>
                ${tools.length === 0 ? `<p class="muted small">No tools. <a href="#shop">Shop →</a></p>` :
                  `<div class="btn-col">${tools.map(tid => {
                    const tool = window.SSDAssets.getById('item', tid);
                    const boosted = { ...g, stats: { ...g.stats, defiance: Math.min(99, g.stats.defiance + 20) } };
                    const odds = window.SSDGame.hunt.previewCaptureOdds({ girl: boosted, toolId: tid, locationId: 'street' });
                    const pct = Math.round(odds.successP * 100);
                    return `<button class="btn-small btn-danger" data-recapture="${g.id}" data-tool="${tid}">
                      ${tool.emoji} ${tool.displayName} — <b>${pct}%</b> (have ${inv[tid]})
                    </button>`;
                  }).join('')}</div>`
                }
              </div>`;
            }).join('')}
          </div>
        </div>`
      }

      <div id="result"></div>
    `;

    el.querySelectorAll('[data-recapture]').forEach(b => {
      b.onclick = async () => {
        const girlId = b.dataset.recapture;
        const toolId = b.dataset.tool;
        const girl = window.SSDGame.state.getGirl(girlId);
        const resultEl = el.querySelector('#result');
        try {
          const r = window.SSDGame.escapeRecovery.attemptRecapture({ girl, toolId });
          const tool = window.SSDAssets.getById('item', toolId);
          const heading = r.outcome === 'recaptured' ? '🔗 RECAPTURED' : '❌ LOST — gone forever';
          const sceneKey = r.outcome === 'recaptured' ? 'recapture_success' : 'escape_on_the_run';
          resultEl.innerHTML = `<div class="panel"><h3>${heading}</h3><div class="log"><div class="log-entry assistant streaming"><b>${girl.name}:</b> <span id="rec-narr"></span></div></div></div>`;
          // Ollama narrates
          const system = window.SSDTemplates.buildSystemPrompt(girl, 'sexy', sceneKey, {
            TOOL: tool.displayName,
            INTELLIGENCE: girl.stats.intelligence,
            DEFIANCE: girl.stats.defiance
          });
          const target = resultEl.querySelector('#rec-narr');
          try {
            const { raw, parsed } = await window.SSDGame.ollama.chatStream({
              system,
              messages: [{ role: 'user', content: '(play this moment out first-person)' }],
              onChunk: (chunk, full) => { target.textContent = full.replace(/<delta>[\s\S]*?<\/delta>/g, '').trim(); }
            });
            target.textContent = (parsed.cleanText || raw).trim();
          } catch (err) {
            target.textContent = `(Ollama unreachable: ${err.message})`;
          }
          window.SSDRouter.handle();
        } catch (e) { alert(e.message); }
      };
    });
  }

  window.SSDRouter.register('escape-recovery', render);
})();
