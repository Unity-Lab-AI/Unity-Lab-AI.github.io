// SEX SLAVE DUNGEON — Ollama repair overlay.
//
// Fullscreen modal that appears when SSDOllamaRepair classifies an error as
// 'corrupt' or 'missing'. Shows the diagnosis, lets the user kick off an
// in-game re-pull with a live progress bar, and resolves a promise on success
// so the original chat call can be retried.
//
// Usage:
//   const result = await window.SSDOllamaRepairOverlay.show({
//     diagnosis,        // from SSDOllamaRepair.classifyError or probeModelHealth
//     modelId,          // optional override; falls back to diagnosis.modelId
//     reason            // human-readable hint for why this opened
//   });
//   // result: { repaired: bool, modelId, cancelled: bool }

(function () {
  'use strict';

  let activePromise = null;     // singleton — only one repair flow at a time
  let activeResolve = null;
  let overlayEl = null;

  function ensureStyles() {
    if (document.getElementById('ssd-repair-overlay-styles')) return;
    const style = document.createElement('style');
    style.id = 'ssd-repair-overlay-styles';
    style.textContent = `
      .ssd-repair-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,0.86); display: flex; align-items: center;
        justify-content: center; padding: 24px;
        font-family: system-ui, -apple-system, sans-serif; color: #eee2f2;
      }
      .ssd-repair-card {
        max-width: 600px; width: 100%; background: #1a1018;
        border: 1px solid #ff3d8a; border-radius: 12px; padding: 24px;
        box-shadow: 0 12px 48px rgba(255,61,138,0.18);
      }
      .ssd-repair-card h2 {
        margin: 0 0 12px 0; color: #ff3d8a;
        font-size: 1.3rem; letter-spacing: 0.02em;
      }
      .ssd-repair-card .ssd-repair-label {
        font-size: 1rem; font-weight: 600; margin-bottom: 8px;
      }
      .ssd-repair-card .ssd-repair-detail {
        font-size: 0.92rem; line-height: 1.5; opacity: 0.86;
        margin-bottom: 16px;
      }
      .ssd-repair-card .ssd-repair-fix {
        font-size: 0.88rem; padding: 12px; border-radius: 6px;
        background: #2a162a; border-left: 3px solid #ff3d8a;
        margin-bottom: 18px; font-family: ui-monospace, Menlo, monospace;
      }
      .ssd-repair-card .ssd-repair-progress {
        margin-top: 14px; display: none;
      }
      .ssd-repair-card .ssd-repair-progress.active { display: block; }
      .ssd-repair-bar {
        height: 14px; background: #2a1828; border-radius: 7px;
        overflow: hidden; border: 1px solid #3a2438;
      }
      .ssd-repair-bar > div {
        height: 100%; background: linear-gradient(90deg, #ff3d8a, #d94872);
        width: 0%; transition: width 0.2s ease-out;
      }
      .ssd-repair-status {
        font-size: 0.82rem; opacity: 0.78; margin-top: 6px;
        font-family: ui-monospace, Menlo, monospace;
      }
      .ssd-repair-buttons {
        display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap;
      }
      .ssd-repair-buttons button {
        flex: 1; min-width: 140px; padding: 10px 14px;
        font-size: 0.95rem; font-weight: 600; border-radius: 6px;
        border: 1px solid #ff3d8a; cursor: pointer;
        transition: background 0.15s, transform 0.15s;
      }
      .ssd-repair-btn-primary {
        background: #ff3d8a; color: #1a1018;
      }
      .ssd-repair-btn-primary:hover { background: #ff5499; }
      .ssd-repair-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .ssd-repair-btn-secondary {
        background: transparent; color: #eee2f2;
      }
      .ssd-repair-btn-secondary:hover { background: #2a162a; }
      .ssd-repair-details-toggle {
        font-size: 0.82rem; opacity: 0.6; cursor: pointer;
        text-decoration: underline; margin-top: 8px; display: inline-block;
      }
      .ssd-repair-raw {
        font-family: ui-monospace, Menlo, monospace; font-size: 0.78rem;
        background: #0a0408; padding: 10px; border-radius: 4px;
        margin-top: 8px; max-height: 140px; overflow: auto;
        white-space: pre-wrap; word-break: break-all; display: none;
        border: 1px solid #2a1828;
      }
      .ssd-repair-raw.show { display: block; }
      .ssd-repair-note {
        font-size: 0.84rem; opacity: 0.78; margin: 12px 0 0 0;
        padding: 8px 10px; border-radius: 4px;
        background: #221422; border-left: 2px solid #ff3d8a;
      }
      .ssd-repair-note b { color: #ff7aa8; }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function buildOverlay({ diagnosis, modelId, reason }) {
    ensureStyles();
    const overlay = document.createElement('div');
    overlay.className = 'ssd-repair-overlay';
    const m = modelId || (diagnosis && diagnosis.modelId) || window.SSDConfig?.OLLAMA?.activeModel || '';
    const codeBadge = diagnosis?.code ? `[${diagnosis.code}]` : '';
    // Hard repair (delete-then-pull) is the default for corruption-class errors —
    // a soft pull alone can short-circuit when Ollama sees the stale manifest as
    // already-installed.  User-requested fix:
    //   "we need to clear the ollam log that shows its installed or something"
    const isCorruption = diagnosis?.code === 'corrupt' || diagnosis?.code === 'missing';
    overlay.innerHTML = `
      <div class="ssd-repair-card" role="dialog" aria-modal="true" aria-labelledby="ssd-repair-title">
        <h2 id="ssd-repair-title">🔧 Ollama needs repair ${codeBadge}</h2>
        <div class="ssd-repair-label">${escapeHtml(diagnosis?.label || 'Something is wrong with Ollama')}</div>
        <div class="ssd-repair-detail">${escapeHtml(diagnosis?.detail || reason || '')}</div>
        <div class="ssd-repair-fix">${escapeHtml(diagnosis?.fix || '')}</div>
        <div class="ssd-repair-buttons">
          <button class="ssd-repair-btn-primary" data-action="hard-repair" ${!m ? 'disabled' : ''}>
            🔧 Delete + re-pull ${escapeHtml(m || 'model')}
          </button>
          <button class="ssd-repair-btn-secondary" data-action="soft-repair" ${!m ? 'disabled' : ''} title="Pull without deleting first. Try this if hard repair fails or you want to preserve the manifest.">
            ↻ Soft re-pull only
          </button>
          <button class="ssd-repair-btn-secondary" data-action="cancel">Cancel</button>
        </div>
        ${isCorruption ? `<p class="ssd-repair-note">Default is <b>delete + re-pull</b>: clears the stale manifest entry first so Ollama can't short-circuit on a half-installed model. If the soft pull alone worked before, the hard repair always works after.</p>` : ''}
        <div class="ssd-repair-progress" id="ssd-repair-progress">
          <div class="ssd-repair-bar"><div id="ssd-repair-fill"></div></div>
          <div class="ssd-repair-status" id="ssd-repair-status">starting…</div>
        </div>
        <span class="ssd-repair-details-toggle" data-action="toggle-raw">show technical details</span>
        <div class="ssd-repair-raw" id="ssd-repair-raw">${escapeHtml(diagnosis?.detail || '')}\n\nModel: ${escapeHtml(m)}\nReason: ${escapeHtml(reason || 'auto-triggered')}</div>
      </div>
    `;
    return { overlay, modelId: m };
  }

  function close() {
    if (overlayEl && overlayEl.parentNode) overlayEl.parentNode.removeChild(overlayEl);
    overlayEl = null;
  }

  function finish(result) {
    const resolve = activeResolve;
    activeResolve = null;
    activePromise = null;
    close();
    if (resolve) resolve(result);
  }

  // mode: 'hard' (delete + pull, default) or 'soft' (pull only)
  async function runRepair(modelId, overlay, mode = 'hard') {
    const progressBox = overlay.querySelector('#ssd-repair-progress');
    const fill = overlay.querySelector('#ssd-repair-fill');
    const status = overlay.querySelector('#ssd-repair-status');
    const hardBtn = overlay.querySelector('[data-action="hard-repair"]');
    const softBtn = overlay.querySelector('[data-action="soft-repair"]');
    const cancelBtn = overlay.querySelector('[data-action="cancel"]');

    progressBox.classList.add('active');
    if (hardBtn) hardBtn.disabled = true;
    if (softBtn) softBtn.disabled = true;
    const activeBtn = mode === 'hard' ? hardBtn : softBtn;
    if (activeBtn) activeBtn.textContent = mode === 'hard' ? '⏳ deleting + pulling…' : '⏳ pulling…';
    cancelBtn.textContent = 'Close (continues in background)';

    let lastPct = 0;
    try {
      const op = mode === 'hard'
        ? window.SSDOllamaRepair.hardRepairModel
        : window.SSDOllamaRepair.repairModel;
      await op(modelId, (msg) => {
        // Phase-aware progress: the synthetic 'delete' / 'pulled-cleared' phases
        // from hardRepairModel don't carry total/completed, so we hold the bar
        // at 0% until the actual pull starts streaming byte counts.
        if (msg.phase === 'delete') {
          fill.style.width = '2%';
          status.textContent = '🗑 ' + (msg.status || 'clearing manifest');
          return;
        }
        if (msg.phase === 'pulled-cleared') {
          fill.style.width = '4%';
          status.textContent = '↓ ' + (msg.status || 'starting fresh pull');
          return;
        }
        if (msg.phase === 'delete-warn') {
          status.textContent = '⚠ ' + (msg.status || 'delete warning');
          return;
        }
        const total = msg.total || 0;
        const done = msg.completed || 0;
        const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : lastPct;
        if (total > 0) lastPct = pct;
        fill.style.width = pct + '%';
        const mb = total > 0 ? ` (${(done/1024/1024).toFixed(0)} / ${(total/1024/1024).toFixed(0)} MB)` : '';
        status.textContent = `${msg.status || 'working…'}${mb}`;
      });
      fill.style.width = '100%';
      status.textContent = '✓ pull complete';

      // Verify with a health probe before declaring victory
      status.textContent = 'verifying weights…';
      const probe = await window.SSDOllamaRepair.probeModelHealth(modelId);
      if (probe.status === 'ok') {
        status.textContent = '✓ weights verified — closing in 1.5s';
        if (window.SSDNotify) {
          window.SSDNotify.show(`🔧 ${modelId} repaired — chat is live again`, { type: 'success', durationMs: 4000 });
        }
        setTimeout(() => finish({ repaired: true, modelId, cancelled: false }), 1500);
      } else {
        status.textContent = `⚠ pull finished but probe says: ${probe.diagnosis?.label || 'still broken'}`;
        if (hardBtn) { hardBtn.disabled = false; hardBtn.textContent = `🔧 Delete + re-pull ${modelId}`; }
        if (softBtn) { softBtn.disabled = false; softBtn.textContent = '↻ Soft re-pull only'; }
      }
    } catch (err) {
      status.textContent = `✗ ${mode} repair failed: ${err.message}`;
      if (hardBtn) { hardBtn.disabled = false; hardBtn.textContent = `🔧 Delete + re-pull ${modelId}`; }
      if (softBtn) { softBtn.disabled = false; softBtn.textContent = '↻ Soft re-pull only'; }
    }
  }

  // Public API — show the overlay. Returns a promise that resolves when the
  // user cancels OR a repair succeeds. Singleton: a second call while one is
  // open returns the existing promise.
  function show({ diagnosis, modelId, reason } = {}) {
    if (activePromise) return activePromise;

    const { overlay, modelId: resolvedModelId } = buildOverlay({ diagnosis, modelId, reason });
    overlayEl = overlay;
    document.body.appendChild(overlay);

    activePromise = new Promise((resolve) => {
      activeResolve = resolve;
    });

    const hardBtnEl = overlay.querySelector('[data-action="hard-repair"]');
    const softBtnEl = overlay.querySelector('[data-action="soft-repair"]');
    if (hardBtnEl) hardBtnEl.onclick = () => runRepair(resolvedModelId, overlay, 'hard');
    if (softBtnEl) softBtnEl.onclick = () => runRepair(resolvedModelId, overlay, 'soft');
    overlay.querySelector('[data-action="cancel"]').onclick = () => {
      finish({ repaired: false, modelId: resolvedModelId, cancelled: true });
    };
    overlay.querySelector('[data-action="toggle-raw"]').onclick = (ev) => {
      const raw = overlay.querySelector('#ssd-repair-raw');
      raw.classList.toggle('show');
      ev.target.textContent = raw.classList.contains('show')
        ? 'hide technical details'
        : 'show technical details';
    };

    // ESC = cancel
    function escHandler(ev) {
      if (ev.key === 'Escape') {
        document.removeEventListener('keydown', escHandler);
        finish({ repaired: false, modelId: resolvedModelId, cancelled: true });
      }
    }
    document.addEventListener('keydown', escHandler);

    return activePromise;
  }

  // Diagnostic helper — runs a health probe on the active model and shows the
  // overlay if it's broken. Returns the probe result. Safe to call from
  // anywhere (router, settings panel, manual button).
  async function autoCheck() {
    if (!window.SSDOllamaRepair) return { status: 'unknown' };
    const modelId = window.SSDConfig?.OLLAMA?.activeModel;
    if (!modelId) return { status: 'unknown' };
    const probe = await window.SSDOllamaRepair.probeModelHealth(modelId);
    if (probe.status === 'corrupt' || probe.status === 'missing') {
      await show({
        diagnosis: probe.diagnosis,
        modelId,
        reason: 'auto-check at boot found broken model state'
      });
    }
    return probe;
  }

  window.SSDOllamaRepairOverlay = Object.freeze({ show, autoCheck, close });
})();
