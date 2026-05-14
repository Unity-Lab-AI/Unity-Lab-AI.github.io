// DUNGEON MASTER: THE HUNT — per-girl timeline / history view.

(function () {
  'use strict';

  function render(el, params) {
    const girl = window.DMTHGame.state.getGirl(params.girl);
    if (!girl) { el.innerHTML = `<p>no such girl · <a href="#roster">Roster</a></p>`; return; }
    const s = window.DMTHGame.state.current;
    const events = buildEvents(girl, s);

    el.innerHTML = `
      <div class="panel">
        <h2>📖 ${girl.name}'s timeline</h2>
        <p class="small muted">${girl.backstoryFragment}</p>
        <a href="#room?girl=${girl.id}" class="btn-small">← back to her room</a>
      </div>

      <div class="panel">
        <h2>Events (${events.length})</h2>
        ${events.length === 0 ? `<p class="muted small">No events yet.</p>` :
          `<ul class="timeline">${events.map(e => `
            <li class="timeline-entry">
              <span class="timeline-emoji">${e.emoji}</span>
              <div class="timeline-body">
                <div class="timeline-title"><b>${e.title}</b> <span class="muted small">· ${new Date(e.ts).toLocaleString()}</span></div>
                <div class="timeline-detail small">${e.detail || ''}</div>
              </div>
            </li>
          `).join('')}</ul>`
        }
      </div>
    `;
  }

  function buildEvents(girl, s) {
    const events = [];
    if (girl.captureDate) {
      events.push({ ts: girl.captureDate, emoji: '🎯', title: 'Acquired', detail: `assigned to hold ${(girl.assignedHoldIdx ?? 0) + 1}` });
    }
    for (const m of girl.bond?.milestones || []) {
      // milestone string format: "bond-up-L3-2026-04-21..."
      const matches = String(m).match(/bond-up-L(\d+)-(.+)/);
      if (matches) {
        events.push({ ts: Date.parse(matches[2]) || Date.now(), emoji: '💖', title: `Bond level up → L${matches[1]}`, detail: '' });
      } else if (m === 'came-willingly-first-time') {
        events.push({ ts: girl.captureDate || Date.now(), emoji: '😏', title: 'Came willingly', detail: 'her choice, day one' });
      } else {
        events.push({ ts: Date.now(), emoji: '✨', title: m, detail: '' });
      }
    }
    for (const f of (s.films || []).filter(f => f.girlId === girl.id)) {
      events.push({ ts: f.endedAt || f.startedAt, emoji: '🎬', title: f.title, detail: `tags: ${(f.tags || []).join(', ')} · $${f.currentListPrice}${f.saleRecord ? ` sold for $${f.saleRecord.price}` : ''}` });
    }
    for (const p of (s.propositioners.completed || []).filter(p => p.girlId === girl.id)) {
      events.push({ ts: p.completedAt, emoji: '📬', title: `Engagement: ${p.clientName}`, detail: `$${p.outcome?.revenue || 0}, satisfaction ${Math.round((p.outcome?.satisfaction || 0) * 100)}%${p.outcome?.riskTrigger ? ' · ⚠️ bad-actor' : ''}` });
    }
    for (const d of (s.disposals || []).filter(d => d.girlId === girl.id)) {
      events.push({ ts: d.disposalDate, emoji: '⚱️', title: `Disposed: ${d.method}`, detail: `notoriety +${d.notorietyImpact}${d.generatedFilmId ? ' · finalization film recorded' : ''}` });
    }
    if (girl.escape?.lastAttempt) {
      events.push({
        ts: girl.escape.lastAttempt.ts || Date.now(),
        emoji: girl.escape.lastAttempt.outcome === 'caught' ? '🔗' : '🏃',
        title: `Escape attempt: ${girl.escape.lastAttempt.outcome}`,
        detail: ''
      });
    }
    // Wardrobe acquisitions
    for (const w of girl.wardrobe || []) {
      if (w.acquiredAt) {
        events.push({ ts: w.acquiredAt, emoji: '👗', title: `Outfit acquired: ${w.displayName}`, detail: '' });
      }
    }
    events.sort((a, b) => a.ts - b.ts);
    return events;
  }

  window.DMTHRouter.register('timeline', render);
})();
