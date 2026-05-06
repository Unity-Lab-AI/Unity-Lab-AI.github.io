/**
 * Unity AI Lab — Gothic Init
 * Creators: Hackall360, Sponge, GFourteen, Alfredo, Red
 * https://www.unityailab.com
 * contact@unityailab.com
 * Version: v2.1.5
 *
 * Lightweight non-module init for the redesigned (Gothic) pages.
 * Replaces the old `js/init.js` ES-module orchestrator on:
 *   index.html  ·  about.html  ·  services.html  ·  contact.html
 *
 * What it does (and ONLY what it does):
 *   1. Browser polyfills (NodeList.forEach, Element.closest, scrollTo,
 *      requestAnimationFrame) — for old/embedded browsers.
 *   2. Throttled scroll bookkeeping + scroll-direction CSS hooks
 *      (so future CSS can react to scroll without spamming the event loop).
 *   3. Reduced-motion respect — if the user prefers reduced motion,
 *      mark <html data-reduced-motion> so the smoke effect can opt out.
 *   4. Gothic toast notification system (window.gothicNotify) +
 *      auto-validation overlay for any form using AboutContactForm
 *      (.ab-contact). Shows a styled toast on submit instead of the
 *      browser's bare native validation popup.
 *   5. Ash-marked body load class so CSS fade-ins can hook a single
 *      DOM-ready signal (prevents FOUC).
 *
 * Things this does NOT do (intentionally — gothic chrome handles them):
 *   - Navbar scroll/active-link    -> <GothicNavbar /> handles it
 *   - Mobile menu toggle           -> <GothicNavbar /> handles it
 *   - Smoke particle system        -> redesign/v-d-smoke.js handles it
 *   - Hover tilt effects            -> CSS :hover handles it
 *   - Red streaks / parallax hero  -> CSS vD-vignette + vD-flicker handle it
 *   - AOS                          -> removed; gothic uses CSS-only entrances
 *   - Visitor counter              -> <GothicVisitorCounter /> in v-d-chrome.jsx
 *
 * Load order on each redesigned page:
 *   <script src="redesign/gothic-init.js" defer></script>
 *   <script src="redesign/v-d-smoke.js?v=3" defer></script>
 *
 * No module / no import — plain script. Works without bundler, in an
 * old Edge that crashed on `import`, in an embedded Discord webview, etc.
 */
(function () {
  'use strict';

  // =========================================================================
  // 1. POLYFILLS — for dinosaur browsers
  // =========================================================================

  // NodeList.forEach for IE11
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }

  // Element.matches / closest
  if (!Element.prototype.matches) {
    Element.prototype.matches =
      Element.prototype.msMatchesSelector ||
      Element.prototype.webkitMatchesSelector;
  }
  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;
      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);
      return null;
    };
  }

  // requestAnimationFrame fallback (very old browsers)
  (function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame =
        window[vendors[x] + 'RequestAnimationFrame'];
      window.cancelAnimationFrame =
        window[vendors[x] + 'CancelAnimationFrame'] ||
        window[vendors[x] + 'CancelRequestAnimationFrame'];
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function (id) { clearTimeout(id); };
    }
  })();

  // =========================================================================
  // 2. THROTTLED SCROLL — direction + position CSS hooks
  // =========================================================================
  function initThrottledScroll() {
    var ticking = false;
    var lastY = window.pageYOffset || 0;
    var html = document.documentElement;

    function update() {
      var y = window.pageYOffset || 0;
      var dir = y > lastY ? 'down' : (y < lastY ? 'up' : html.dataset.scrollDir || 'down');
      if (Math.abs(y - lastY) > 4) {
        html.dataset.scrollDir = dir;
        lastY = y;
      }
      // crossed a 200px threshold -> mark page as "scrolled" (CSS can react)
      if (y > 200) html.setAttribute('data-scrolled', '');
      else html.removeAttribute('data-scrolled');
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // =========================================================================
  // 3. REDUCED-MOTION + headless detection
  // =========================================================================
  function initMotionPrefs() {
    try {
      var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && mq.matches) {
        document.documentElement.setAttribute('data-reduced-motion', '');
      }
      // headless test browsers: kill the smoke layer outright
      if (/HeadlessChrome|PhantomJS/i.test(navigator.userAgent)) {
        document.documentElement.setAttribute('data-headless', '');
      }
    } catch (e) { /* ignore */ }
  }

  // =========================================================================
  // 4. GOTHIC TOAST SYSTEM + auto-validation
  // =========================================================================
  function injectToastStyles() {
    if (document.getElementById('gothic-toast-styles')) return;
    var style = document.createElement('style');
    style.id = 'gothic-toast-styles';
    style.textContent =
      '@keyframes gothicToastIn{from{transform:translateX(420px);opacity:0}to{transform:translateX(0);opacity:1}}' +
      '@keyframes gothicToastOut{from{transform:translateX(0);opacity:1}to{transform:translateX(420px);opacity:0}}' +
      '.gothic-toast-stack{position:fixed;top:88px;right:20px;display:flex;flex-direction:column;gap:10px;z-index:10000;pointer-events:none;max-width:min(380px,calc(100vw - 40px))}' +
      '.gothic-toast{pointer-events:auto;padding:14px 18px;background:#0a0000;color:#f4ecd8;font-family:"Cormorant Garamond",Georgia,serif;font-size:15px;line-height:1.4;border:1px solid rgba(220,20,60,.5);border-left:3px solid #dc143c;box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 0 1px rgba(0,0,0,.4);animation:gothicToastIn .35s cubic-bezier(.2,.7,.3,1) forwards;letter-spacing:.01em;display:flex;align-items:flex-start;gap:10px}' +
      '.gothic-toast.is-leaving{animation:gothicToastOut .3s ease forwards}' +
      '.gothic-toast--success{border-left-color:#7a9a47}' +
      '.gothic-toast--error{border-left-color:#dc143c}' +
      '.gothic-toast--info{border-left-color:#9b8866}' +
      '.gothic-toast-mark{font-family:"Cormorant Garamond",serif;font-size:18px;line-height:1;margin-top:1px;color:rgba(220,20,60,.85)}' +
      '.gothic-toast--success .gothic-toast-mark{color:#a5c170}' +
      '.gothic-toast-msg{flex:1;min-width:0}' +
      '@media (prefers-reduced-motion: reduce){.gothic-toast,.gothic-toast.is-leaving{animation:none}}';
    document.head.appendChild(style);
  }

  function ensureToastStack() {
    var stack = document.getElementById('gothic-toast-stack');
    if (stack) return stack;
    stack = document.createElement('div');
    stack.id = 'gothic-toast-stack';
    stack.className = 'gothic-toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
    return stack;
  }

  function gothicNotify(message, kind) {
    injectToastStyles();
    var stack = ensureToastStack();
    var t = document.createElement('div');
    var k = kind || 'info';
    t.className = 'gothic-toast gothic-toast--' + k;
    var glyph = k === 'success' ? '⛧' : (k === 'error' ? '✗' : '⛧');
    t.innerHTML =
      '<span class="gothic-toast-mark" aria-hidden="true">' + glyph + '</span>' +
      '<span class="gothic-toast-msg"></span>';
    t.querySelector('.gothic-toast-msg').textContent = String(message);
    stack.appendChild(t);

    var ttl = k === 'error' ? 4500 : 3200;
    setTimeout(function () {
      t.classList.add('is-leaving');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, ttl);
  }
  window.gothicNotify = gothicNotify;

  // Auto-attach to gothic forms (.ab-contact). Validates required fields,
  // shows a toast on success/failure. Runs in CAPTURE phase so it fires
  // before the React onSubmit handler that opens mailto:.
  function initFormValidation() {
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!(form && form.matches && form.matches('form.ab-contact'))) return;

      var fields = form.querySelectorAll('input[required], select[required], textarea[required]');
      var firstBad = null;
      var bad = [];
      fields.forEach(function (f) {
        var v = (f.value || '').toString().trim();
        var ok = v.length > 0;
        if (ok && f.type === 'email') {
          ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        }
        if (!ok) {
          bad.push(f);
          if (!firstBad) firstBad = f;
          f.setAttribute('data-invalid', '');
        } else {
          f.removeAttribute('data-invalid');
        }
      });

      if (bad.length) {
        e.preventDefault();
        e.stopPropagation();
        gothicNotify(
          bad.length === 1
            ? 'One field still wants attention.'
            : bad.length + ' fields still want attention.',
          'error'
        );
        try { firstBad.focus({ preventScroll: false }); } catch (err) { firstBad.focus(); }
        // clear data-invalid on first edit per field
        bad.forEach(function (f) {
          var clear = function () {
            f.removeAttribute('data-invalid');
            f.removeEventListener('input', clear);
            f.removeEventListener('change', clear);
          };
          f.addEventListener('input', clear);
          f.addEventListener('change', clear);
        });
        return;
      }

      // Valid: let React's onSubmit fire (it opens mailto:). Show a toast
      // so the user knows we tried to hand off to their mail client —
      // some browsers silently block mailto: with no popup.
      setTimeout(function () {
        gothicNotify('Message ready. Your mail client should open momentarily.', 'success');
      }, 50);
    }, true); // capture phase

    // inject [data-invalid] styling once
    if (!document.getElementById('gothic-form-styles')) {
      var s = document.createElement('style');
      s.id = 'gothic-form-styles';
      s.textContent =
        '.ab-contact [data-invalid]{border-color:#dc143c !important;box-shadow:0 0 0 2px rgba(220,20,60,.18) !important;animation:gothicShake .35s cubic-bezier(.36,.07,.19,.97)}' +
        '@keyframes gothicShake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-3px)}40%,60%{transform:translateX(3px)}}' +
        '@media (prefers-reduced-motion: reduce){.ab-contact [data-invalid]{animation:none}}';
      document.head.appendChild(s);
    }
  }

  // =========================================================================
  // 5. BODY LOAD CLASS — CSS hook for gating fade-ins
  // =========================================================================
  function markLoaded() {
    document.body.classList.add('loaded');
  }

  // =========================================================================
  // BOOT
  // =========================================================================
  function boot() {
    try {
      initMotionPrefs();
      initThrottledScroll();
      initFormValidation();
      // small delay so React has a chance to mount before fade-in flips on
      setTimeout(markLoaded, 80);
    } catch (err) {
      // never let init kill the page
      console.error('[gothic-init] boot error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // =========================================================================
  // CONSOLE BRAND
  // =========================================================================
  try {
    console.log('%c⛧ UnityAILab', 'color:#dc143c;font:700 22px "Cormorant Garamond",serif');
    console.log('%cgothic-init v2.1.5 — pushing AI to its limits.', 'color:#9b8866;font:14px Inter,sans-serif');
  } catch (e) { /* ignore */ }
})();
