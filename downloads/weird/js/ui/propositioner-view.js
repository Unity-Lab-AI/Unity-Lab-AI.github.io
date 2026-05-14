// SEX SLAVE DUNGEON — propositioner inbox page (business sim).

(function () {
  'use strict';

  function render(el) {
    const s = window.SSDGame.state.current;
    const inbox = s.propositioners.inbox;
    const active = s.propositioners.active;
    const completed = s.propositioners.completed.slice(-20).reverse();

    el.innerHTML = `
      <div class="panel">
        <h2>📬 Propositioner Inbox</h2>
        <div class="btn-row">
          <button id="force-roll" class="btn-small">Force a new arrival</button>
        </div>
      </div>

      <div class="panel">
        <h2>Pending (${inbox.length})</h2>
        ${inbox.length === 0 ? `<p class="muted small">No pending offers.</p>` :
          `<div class="prop-list">${inbox.map(renderPendingCard).join('')}</div>`
        }
      </div>

      <div class="panel">
        <h2>Active engagements (${active.length})</h2>
        ${active.length === 0 ? `<p class="muted small">Nothing running.</p>` :
          `<div class="prop-list">${active.map(renderActiveCard).join('')}</div>`
        }
      </div>

      <div class="panel">
        <h2>Completed (${completed.length})</h2>
        ${completed.length === 0 ? `<p class="muted small">No completions yet.</p>` :
          `<ul class="small">${completed.map(p => `
            <li>${new Date(p.completedAt).toLocaleString()} — <b>${p.clientName}</b> + ${window.SSDGame.state.getGirl(p.girlId)?.name || p.girlId} · satisfaction ${Math.round((p.outcome?.satisfaction || 0) * 100)}% · +$${p.outcome?.revenue || 0}${p.outcome?.riskTrigger ? ' · ⚠️ BAD ACTOR' : ''}</li>
          `).join('')}</ul>`
        }
      </div>
    `;

    el.querySelector('#force-roll').onclick = () => {
      const p = window.SSDGame.propositioner.rollPropositioner();
      window.SSDGame.state.enqueuePropositioner(p);
      window.SSDRouter.handle();
    };

    el.querySelectorAll('[data-accept]').forEach(b => {
      b.onclick = () => {
        const propId = b.dataset.accept;
        const girlId = el.querySelector(`[data-pick-girl-for="${propId}"]`)?.value;
        if (!girlId) { alert('Pick a girl first'); return; }
        window.SSDGame.propositioner.acceptWithGirl(propId, girlId);
        window.SSDRouter.handle();
      };
    });
    el.querySelectorAll('[data-reject]').forEach(b => {
      b.onclick = () => {
        window.SSDGame.state.rejectPropositioner(b.dataset.reject);
        window.SSDRouter.handle();
      };
    });
    el.querySelectorAll('[data-resolve]').forEach(b => {
      b.onclick = async () => {
        const propId = b.dataset.resolve;
        const prop = s.propositioners.active.find(p => p.id === propId);
        const girlSnapshot = prop ? JSON.parse(JSON.stringify(window.SSDGame.state.getGirl(prop.girlId))) : null;

        const out = window.SSDGame.propositioner.resolveEngagement(propId);

        // Ollama narration of the scene
        let narration = null;
        if (girlSnapshot && prop) {
          try {
            const system = window.SSDTemplates.buildSystemPrompt(girlSnapshot, 'sexy', 'proposition_scene', {
              CLIENT_NAME: prop.clientName,
              DURATION: prop.terms.durationMinutes,
              ACTS: prop.terms.actsPermitted.join(', '),
              QUIRKS: (prop.quirks || []).join(', ') || 'neutral'
            });
            const { raw, parsed } = await window.SSDGame.ollama.chatStream({
              system,
              messages: [{ role: 'user', content: '(narrate the booking from your first-person POV)' }]
            });
            narration = (parsed.cleanText || raw).trim();
          } catch {}
        }

        const msg = `Engagement resolved — satisfaction ${Math.round(out.satisfaction*100)}%, revenue $${out.revenue}.${out.riskTrigger ? ' ⚠️ BAD ACTOR — notoriety spiked.' : ''}`;
        if (window.SSDNotify) window.SSDNotify.show(msg, { type: out.riskTrigger ? 'error' : 'success' });

        if (narration) {
          const narrPanel = document.createElement('div');
          narrPanel.className = 'panel';
          narrPanel.innerHTML = `<h3>${girlSnapshot.name} on the ${prop.clientName} booking</h3><div class="log"><div class="log-entry assistant"><b>${girlSnapshot.name}:</b> ${narration.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</div></div>`;
          el.insertBefore(narrPanel, el.firstChild);
        }
        window.SSDRouter.handle();
      };
    });

    function renderPendingCard(p) {
      const captives = s.roster.filter(g => g.encounterState === 'captive');
      const matchScores = captives.map(g => ({ g, s: window.SSDGame.propositioner.matchScore(g, p) })).sort((a, b) => b.s - a.s);
      const danger = p.quirks.some(q => ['dangerous','bad-actor'].includes(q));
      const generous = p.quirks.includes('generous');
      return `
        <div class="prop-card ${danger ? 'danger-outline' : ''} ${generous ? 'gold-outline' : ''}">
          <h3>${p.clientName} <span class="muted small">· budget $${p.budget}</span></h3>
          <div class="stat-row small"><span>Wants archetype</span><b>${p.archetypesWanted.join(', ')}</b></div>
          <div class="stat-row small"><span>Kinks</span><b>${p.kinksWanted.join(', ')}</b></div>
          <div class="stat-row small"><span>Acts</span><b>${p.actsWanted.join(', ')}</b></div>
          <div class="stat-row small"><span>Duration</span><b>${p.durationMinutes} min</b></div>
          <div class="stat-row small"><span>Quirks</span><b>${p.quirks.join(', ') || '—'}</b></div>
          <hr />
          <label class="field small"><span>Assign girl</span>
            <select data-pick-girl-for="${p.id}">
              <option value="">— choose —</option>
              ${matchScores.map(m => `<option value="${m.g.id}">${m.g.name} (${m.g.archetypeTemplate}) — match ${Math.round(m.s*100)}%</option>`).join('')}
            </select>
          </label>
          <div class="btn-row">
            <button class="btn-small btn-primary" data-accept="${p.id}">Accept</button>
            <button class="btn-small" data-reject="${p.id}">Reject</button>
          </div>
        </div>
      `;
    }
    function renderActiveCard(p) {
      const g = window.SSDGame.state.getGirl(p.girlId);
      const timeLeft = Math.max(0, Math.round((p.endsAt - Date.now()) / 60000));
      return `
        <div class="prop-card">
          <h3>${p.clientName} + ${g?.name || p.girlId}</h3>
          <div class="stat-row small"><span>Duration</span><b>${p.terms.durationMinutes} min</b></div>
          <div class="stat-row small"><span>Price</span><b>$${p.terms.price}</b></div>
          <div class="stat-row small"><span>Time left</span><b>${timeLeft} min</b></div>
          <button class="btn-small btn-primary" data-resolve="${p.id}">Resolve now</button>
        </div>
      `;
    }
  }

  window.SSDRouter.register('propositioners', render);
})();
