/**
 * Unity AI Lab — Apps Shared Navigation (gothic redesign chrome)
 * Creators: Hackall360, Sponge, GFourteen, Alfreddo, Red
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.6
 *
 * Vanilla-DOM port of <GothicNavbar /> from redesign/v-d-chrome.jsx — no
 * React, no Babel. Apps stay fast + framework-free, but inherit the same
 * crimson/bone palette + Trajan Pro display type + ouroboros sigil mark
 * the rest of the redesigned site uses.
 *
 * Auto-loaded assets (so per-app HTML stays lean):
 *   • redesign/shared-tokens.css   — CSS custom properties (palette, fonts)
 *   • redesign/variations.css      — `.vD-nav-*` styles, layout chrome
 *   • redesign/gothic-init.js      — polyfills, scroll throttle, toast system
 *   • vendor/bootstrap.min.css/.js — apps still use .row/.col-* + .btn
 *   • vendor/fontawesome/all.min.css — used by app UIs (chat icons, etc.)
 */
(function () {
    'use strict';

    function getBaseURL() {
        // Always serve from site root — works on www.unityailab.com,
        // unity-lab-ai.github.io, and local dev servers alike.
        return '/';
    }

    var BASE_URL = getBaseURL();

    var NAV_LINKS = [
        { href: BASE_URL + 'ai',       label: 'AI' },
        { href: BASE_URL + 'about',    label: 'About' },
        { href: BASE_URL + 'apps',     label: 'Apps' },
        { href: BASE_URL + 'services', label: 'Services' },
        { href: BASE_URL + 'projects', label: 'Projects' },
        { href: BASE_URL + 'contact',  label: 'Contact' },
    ];

    // Static SVG mirror of Sigils.Unity (ouroboros) from redesign/sigils.jsx —
    // inlined so apps can render the brand mark without React/Babel.
    var UNITY_SIGIL_SVG =
        '<svg width="26" height="26" viewBox="0 0 64 64" fill="none" ' +
        'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" ' +
        'stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M 36 12 A 22 22 0 1 0 50 22"/>' +
        '<path d="M 16 22 Q 14 32 16 42" stroke-opacity="0.45"/>' +
        '<path d="M 22 14 Q 32 12 42 14" stroke-opacity="0.45"/>' +
        '<path d="M 48 24 Q 52 32 48 42" stroke-opacity="0.45"/>' +
        '<path d="M 22 50 Q 32 52 42 50" stroke-opacity="0.45"/>' +
        '<path d="M 50 22 L 42 18 L 38 24 L 36 12 Z" fill="currentColor" stroke="none"/>' +
        '<circle cx="44" cy="20" r="1" fill="#0a0a0a" stroke="none"/>' +
        '<line x1="13" y1="32" x2="10" y2="32" stroke-opacity="0.4"/>' +
        '<line x1="32" y1="13" x2="32" y2="10" stroke-opacity="0.4"/>' +
        '<line x1="51" y1="32" x2="54" y2="32" stroke-opacity="0.4"/>' +
        '<line x1="32" y1="51" x2="32" y2="54" stroke-opacity="0.4"/>' +
        '</svg>';

    function renderNavbar() {
        var path = (window.location.pathname || '').replace(/\/+$/, '').toLowerCase();
        var links = NAV_LINKS.map(function (l) {
            var slug = l.href.replace(/^\//, '').toLowerCase();
            var matchPath  = '/' + slug;
            var matchHtml  = matchPath + '.html';
            var matchChild = matchPath + '/';
            var isActive = slug && (
                path === matchPath ||
                path === matchHtml ||
                path.indexOf(matchChild) === 0
            );
            var attrs = isActive ? ' aria-current="page" class="is-active"' : '';
            return '<li><a href="' + l.href + '"' + attrs + '>' + l.label + '</a></li>';
        }).join('');

        return '' +
            '<nav class="vD-nav" role="navigation" aria-label="Main navigation">' +
              '<div class="vD-nav-inner">' +
                '<a href="' + BASE_URL + '" class="vD-nav-brand" aria-label="Unity AI Lab home">' +
                  '<span class="vD-nav-mark">' + UNITY_SIGIL_SVG + '</span>' +
                  '<span class="vD-nav-name">UNITYAILAB</span>' +
                '</a>' +
                '<button class="vD-nav-toggle" type="button" aria-label="Toggle menu" aria-expanded="false">' +
                  '<span></span><span></span><span></span>' +
                '</button>' +
                '<ul class="vD-nav-list">' + links + '</ul>' +
              '</div>' +
            '</nav>';
    }

    function injectNavigation() {
        // Skip if a redesigned React-rendered nav is already on the page.
        if (document.querySelector('nav.vD-nav')) return;

        var wrap = document.createElement('div');
        wrap.id = 'unity-nav-wrapper';
        wrap.innerHTML = renderNavbar();
        document.body.insertBefore(wrap, document.body.firstChild);

        // Add background ambience layers if missing — same .unity-* names
        // the legacy shared-theme expected, kept for backwards compat.
        if (!document.querySelector('.unity-background-overlay')) {
            var bg = document.createElement('div');
            bg.className = 'unity-background-overlay';
            document.body.insertBefore(bg, document.body.firstChild);
            var streaks = document.createElement('div');
            streaks.className = 'unity-red-streaks';
            document.body.insertBefore(streaks, document.body.firstChild);
        }

        document.body.classList.add('unity-nav-active');
        hideHomeLinks();
        bindNavBehavior(wrap);
    }

    function bindNavBehavior(wrap) {
        var nav = wrap.querySelector('.vD-nav');
        if (!nav) return;

        // Scroll-state class — mirrors GothicNavbar's React effect at >30px.
        var onScroll = function () {
            if (window.scrollY > 30) nav.classList.add('vD-nav-scrolled');
            else nav.classList.remove('vD-nav-scrolled');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Mobile menu toggle.
        var toggle = wrap.querySelector('.vD-nav-toggle');
        var list = wrap.querySelector('.vD-nav-list');
        if (toggle && list) {
            toggle.addEventListener('click', function () {
                var open = list.classList.toggle('open');
                toggle.classList.toggle('on', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            });
            // Close mobile menu on link click.
            var links = list.querySelectorAll('a');
            for (var i = 0; i < links.length; i++) {
                links[i].addEventListener('click', function () {
                    list.classList.remove('open');
                    toggle.classList.remove('on');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            }
        }
    }

    // Hide each app's pre-existing "↩ HOME" / "Back to home" links so the
    // injected nav is the single source of truth for navigation.
    function hideHomeLinks() {
        var selectors = [
            '.home-link',
            'a[href="../"]',
            'a[href="./"]',
            '[id*="home-btn"]',
            '[class*="home-btn"]'
        ];
        selectors.forEach(function (sel) {
            try {
                var els = document.querySelectorAll(sel);
                for (var i = 0; i < els.length; i++) {
                    var el = els[i];
                    var text = (el.textContent || '').toLowerCase();
                    var html = (el.innerHTML || '');
                    if (text.indexOf('home') !== -1 || html.indexOf('↩') !== -1) {
                        el.classList.add('unity-hidden-home');
                    }
                }
            } catch (e) { /* invalid selector — ignore */ }
        });
    }

    function ensureStylesheet(href) {
        var existing = document.querySelector('link[href*="' + href.split('/').pop() + '"]');
        if (existing) return;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    function ensureScript(src, opts) {
        opts = opts || {};
        var existing = document.querySelector('script[src*="' + src.split('/').pop() + '"]');
        if (existing) return;
        var s = document.createElement('script');
        s.src = src;
        if (opts.defer) s.defer = true;
        document.body.appendChild(s);
    }

    function loadAssets() {
        // Redesign chrome assets — these define `.vD-nav-*` styles + tokens
        // + gothic-init's polyfills & toast system.
        ensureStylesheet(BASE_URL + 'redesign/shared-tokens.css');
        ensureStylesheet(BASE_URL + 'redesign/variations.css');
        ensureScript(BASE_URL + 'redesign/gothic-init.js', { defer: true });

        // Apps shared theme (slim utility classes + scrollbar/selection +
        // background overlay). Re-listed here so apps that hand-load it
        // don't get a duplicate, and apps that didn't still get it.
        ensureStylesheet(BASE_URL + 'apps/shared-theme.css');

        // Bootstrap CSS+JS — apps still use .row/.col-*/.btn for layout.
        // FontAwesome — used by app UIs (chat icons, settings gear, etc.).
        if (!document.querySelector('link[href*="bootstrap"]')) {
            ensureStylesheet(BASE_URL + 'vendor/bootstrap/bootstrap.min.css');
        }
        if (!document.querySelector('link[href*="fontawesome"]') &&
            !document.querySelector('link[href*="font-awesome"]')) {
            ensureStylesheet(BASE_URL + 'vendor/fontawesome/all.min.css');
        }
        if (typeof window.bootstrap === 'undefined') {
            ensureScript(BASE_URL + 'vendor/bootstrap/bootstrap.bundle.min.js', { defer: true });
        }
    }

    function boot() {
        loadAssets();
        injectNavigation();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
