// SEX SLAVE DUNGEON — content market page (films).

(function () {
  'use strict';

  function render(el) {
    const s = window.SSDGame.state.current;
    const listed = s.films.filter(f => f.status === 'listed');
    const sold = s.films.filter(f => f.status === 'sold').slice(-20).reverse();
    const archived = s.films.filter(f => f.status === 'archived');

    el.innerHTML = `
      <div class="panel">
        <h2>🎬 Content Market</h2>
        <div class="btn-row">
          <button id="run-tick" class="btn-small btn-primary">Run sale pass now</button>
        </div>
        <div class="stat-row"><span>Demand multiplier</span><b>${window.SSDGame.market.getDemand().overallBase.toFixed(2)}×</b></div>
      </div>

      <div class="panel">
        <h2>Listed (${listed.length})</h2>
        ${listed.length === 0 ? `<p class="muted small">No films listed. Record some in a captive's hold.</p>` :
          `<ul class="film-list">${listed.map(f => `
            <li class="film-item">
              <div>
                <b>${escapeHtml(f.title)}</b>
                <span class="muted small">· ${f.girlNameAtRecording} · ${f.durationMinutes}min · ${f.tags.join(' ') || '—'}</span>
              </div>
              <div class="stat-row">
                <span>$${f.currentListPrice.toLocaleString()}</span>
                <button class="btn-small" data-unlist="${f.id}">Unlist</button>
              </div>
            </li>
          `).join('')}</ul>`
        }
      </div>

      <div class="panel">
        <h2>Recent sales (${sold.length})</h2>
        ${sold.length === 0 ? `<p class="muted small">No sales yet.</p>` :
          `<ul class="film-list">${sold.map(f => `
            <li class="film-item">
              <div>
                <b>${escapeHtml(f.title)}</b>
                <span class="muted small">· ${f.girlNameAtRecording}</span>
              </div>
              <div>
                <span>$${f.saleRecord?.price.toLocaleString() || '?'}</span>
                <span class="muted small">· ${f.saleRecord?.buyer || '?'}</span>
              </div>
            </li>
          `).join('')}</ul>`
        }
      </div>

      <div class="panel">
        <h2>Archived (${archived.length})</h2>
        ${archived.length === 0 ? `<p class="muted small">Nothing archived.</p>` :
          `<ul class="small">${archived.map(f => `<li>${escapeHtml(f.title)} — <a href="#" data-relist="${f.id}">relist</a></li>`).join('')}</ul>`
        }
      </div>
    `;

    el.querySelector('#run-tick').onclick = () => {
      const sold = window.SSDGame.market.runSaleTick();
      alert(`Sale pass: ${sold.length} film${sold.length === 1 ? '' : 's'} sold for $${sold.reduce((t,s) => t + s.price, 0)}`);
      window.SSDRouter.handle();
    };
    el.querySelectorAll('[data-unlist]').forEach(b => { b.onclick = () => { window.SSDGame.market.unlist(b.dataset.unlist); window.SSDRouter.handle(); }; });
    el.querySelectorAll('[data-relist]').forEach(a => { a.onclick = e => { e.preventDefault(); window.SSDGame.market.relist(a.dataset.relist); window.SSDRouter.handle(); }; });
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  window.SSDRouter.register('market', render);
})();
