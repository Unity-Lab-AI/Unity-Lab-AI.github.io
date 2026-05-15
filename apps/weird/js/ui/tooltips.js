// DUNGEON MASTER: THE HUNT — universal tooltip engine.
// Concise tooltips attached to every interactive element across every page.
//
// Auto-binds every element with a `data-tooltip="..."` attribute. Hover (200ms delay)
// or long-press (350ms for touch) shows a dark-themed bubble positioned edge-aware so
// it doesn't clip viewport. Single tooltip visible at a time. Voice: ≤ 1 sentence,
// concise, dungeon-game register (vulgar / explicit / direct — NOT corporate or clinical).
//
// Auto-binds via MutationObserver so dynamically-rendered UI (router page changes)
// picks up new [data-tooltip] elements automatically — no per-page wiring needed.

(function () {
  'use strict';

  const HOVER_DELAY_MS = 200;
  const LONG_PRESS_MS = 350;
  const SAFE_MARGIN = 8;          // px from viewport edges

  let bubble = null;
  let showTimer = null;
  let longPressTimer = null;
  let currentTarget = null;
  let touchStartXY = null;

  function ensureBubble() {
    if (bubble) return bubble;
    bubble = document.createElement('div');
    bubble.className = 'ssd-tooltip';
    bubble.setAttribute('role', 'tooltip');
    bubble.style.cssText = `
      position: fixed;
      z-index: 999999;
      max-width: 320px;
      padding: 6px 10px;
      background: #1a1a1a;
      color: #f0e8d8;
      font-size: 13px;
      line-height: 1.35;
      border: 1px solid #444;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,.6);
      pointer-events: none;
      opacity: 0;
      transition: opacity 100ms ease-out;
      font-family: inherit;
      white-space: pre-wrap;
    `;
    document.body.appendChild(bubble);
    return bubble;
  }

  function show(target) {
    const text = target.dataset.tooltip;
    if (!text || !text.trim()) return;
    const b = ensureBubble();
    b.textContent = text;
    b.style.opacity = '0';
    b.style.left = '-9999px';      // measure offscreen first
    b.style.top = '-9999px';
    // Force reflow so width is measured
    void b.offsetWidth;

    const rect = target.getBoundingClientRect();
    const bw = b.offsetWidth;
    const bh = b.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: above the element, centered horizontally
    let top = rect.top - bh - SAFE_MARGIN;
    let left = rect.left + (rect.width / 2) - (bw / 2);

    // If would clip top, flip below
    if (top < SAFE_MARGIN) {
      top = rect.bottom + SAFE_MARGIN;
    }
    // If still clips bottom (very tall tooltip or no room either way), pin to top
    if (top + bh > vh - SAFE_MARGIN) {
      top = Math.max(SAFE_MARGIN, vh - bh - SAFE_MARGIN);
    }
    // Edge-clamp horizontal
    if (left < SAFE_MARGIN) left = SAFE_MARGIN;
    if (left + bw > vw - SAFE_MARGIN) left = vw - bw - SAFE_MARGIN;

    b.style.left = `${left}px`;
    b.style.top = `${top}px`;
    b.style.opacity = '1';
    currentTarget = target;
  }

  function hide() {
    if (bubble) {
      bubble.style.opacity = '0';
      bubble.style.left = '-9999px';
      bubble.style.top = '-9999px';
    }
    currentTarget = null;
  }

  function clearTimers() {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }

  // Resolve event target to the nearest ancestor with [data-tooltip] — handles clicks
  // on inner spans/icons of a button.
  function resolveTarget(el) {
    let n = el;
    while (n && n.nodeType === 1) {
      if (n.hasAttribute && n.hasAttribute('data-tooltip')) return n;
      n = n.parentElement;
    }
    return null;
  }

  function onPointerOver(ev) {
    const t = resolveTarget(ev.target);
    if (!t) return;
    if (t === currentTarget) return;
    clearTimers();
    showTimer = setTimeout(() => show(t), HOVER_DELAY_MS);
  }

  function onPointerOut(ev) {
    const t = resolveTarget(ev.target);
    if (!t) return;
    // If moving to a child of the same tooltip target, don't hide
    const related = ev.relatedTarget && resolveTarget(ev.relatedTarget);
    if (related === t) return;
    clearTimers();
    hide();
  }

  function onTouchStart(ev) {
    const t = resolveTarget(ev.target);
    if (!t) return;
    const touch = ev.touches && ev.touches[0];
    if (touch) touchStartXY = { x: touch.clientX, y: touch.clientY };
    clearTimers();
    longPressTimer = setTimeout(() => {
      show(t);
      longPressTimer = null;
    }, LONG_PRESS_MS);
  }

  function onTouchMove(ev) {
    if (!touchStartXY || !ev.touches || !ev.touches[0]) return;
    const dx = ev.touches[0].clientX - touchStartXY.x;
    const dy = ev.touches[0].clientY - touchStartXY.y;
    if (Math.hypot(dx, dy) > 10) {
      clearTimers();
      hide();
      touchStartXY = null;
    }
  }

  function onTouchEnd() {
    clearTimers();
    touchStartXY = null;
    // Hide after a short delay so the user can read it on tap
    setTimeout(hide, 1500);
  }

  function onScroll(ev) {
    // Only hide if the scroll target actually contains the
    // current tooltip target (i.e., the bubble's anchor element moved). Scrolling an
    // unrelated panel should not dismiss the tooltip.
    if (!currentTarget) return;
    const target = ev.target;
    const isRelevant = target === document || target === window || target === document.documentElement
      || (target && typeof target.contains === 'function' && target.contains(currentTarget));
    if (isRelevant) {
      clearTimers();
      hide();
    }
  }

  function init() {
    // Hover listeners — pointer events handle mouse + pen + touch uniformly,
    // but we use mouseover/mouseout for the hover-delay path because pointer
    // events don't always fire reliably on iOS Safari for hover-style tooltips.
    document.addEventListener('mouseover', onPointerOver, true);
    document.addEventListener('mouseout', onPointerOut, true);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
    // Hide on route changes — router uses hash-based navigation
    window.addEventListener('hashchange', hide);
  }

  // Convenience helper for programmatic registration (rare — most usage is HTML attrs).
  function register(elOrSelector, text) {
    const el = typeof elOrSelector === 'string'
      ? document.querySelector(elOrSelector)
      : elOrSelector;
    if (el) el.setAttribute('data-tooltip', text);
  }

  // Auto-init when DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.DMTHTooltips = Object.freeze({
    register,
    show,
    hide
  });
})();
