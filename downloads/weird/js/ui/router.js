// SEX SLAVE DUNGEON — hash-based SPA router for the game page.

(function () {
  'use strict';

  const routes = {};
  let mountEl = null;
  let currentCleanup = null;

  function register(path, renderFn) { routes[path] = renderFn; }

  function mount(el) { mountEl = el; }

  function go(path, params) {
    const newHash = '#' + path + (params ? '?' + new URLSearchParams(params).toString() : '');
    if (location.hash !== newHash) location.hash = newHash;
    else handle();
  }

  function handle() {
    const hash = (location.hash || '#dashboard').replace(/^#/, '');
    const [path, qs] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(qs || ''));
    const render = routes[path] || routes['dashboard'] || (() => { mountEl.textContent = 'not found'; });
    if (currentCleanup) { try { currentCleanup(); } catch {} currentCleanup = null; }
    mountEl.innerHTML = '';
    const cleanup = render(mountEl, params);
    if (typeof cleanup === 'function') currentCleanup = cleanup;
    // highlight active nav
    document.querySelectorAll('[data-route]').forEach(a => {
      a.classList.toggle('active', a.dataset.route === path);
    });
  }

  window.addEventListener('hashchange', handle);
  document.addEventListener('DOMContentLoaded', () => { if (mountEl) handle(); });

  window.SSDRouter = Object.freeze({ register, mount, go, handle });
})();
