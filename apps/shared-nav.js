/**
 * Unity AI Lab - Shared Navigation Injection
 * This script injects the Unity AI Lab navigation bar into legacy apps
 */

(function() {
    'use strict';

    // Determine base URL based on environment
    function getBaseURL() {
        const hostname = window.location.hostname;
        // Production: www.unityailab.com or unityailab.com
        if (hostname.includes('unityailab.com')) {
            return '/sitetest0/';
        }
        // GitHub Pages: unity-lab-ai.github.io
        if (hostname.includes('github.io')) {
            return '/sitetest0/';
        }
        // Local development: localhost, 127.0.0.1, or file://
        return '/';
    }

    const BASE_URL = getBaseURL();

    // Navigation HTML - using absolute paths from site root
    const navHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark" role="navigation" aria-label="Main navigation">
            <div class="container-fluid px-4">
                <a class="navbar-brand gothic-logo" href="${BASE_URL}">
                    <i class="fas fa-brain" aria-hidden="true"></i>
                    <span>UNITYAILAB</span>
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#unityNavbar" aria-controls="unityNavbar" aria-expanded="false" aria-label="Toggle navigation menu">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="unityNavbar">
                    <ul class="navbar-nav ms-auto">
                        <li class="nav-item">
                            <a class="nav-link" href="${BASE_URL}ai">AI</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${BASE_URL}about">About</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${BASE_URL}apps">Apps</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${BASE_URL}services">Services</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${BASE_URL}projects">Projects</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="${BASE_URL}contact">Contact</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;

    // Inject navigation on DOM ready
    function injectNavigation() {
        // Create navigation wrapper
        const navWrapper = document.createElement('div');
        navWrapper.id = 'unity-nav-wrapper';
        navWrapper.innerHTML = navHTML;

        // Insert at beginning of body
        document.body.insertBefore(navWrapper, document.body.firstChild);

        // Add body class
        document.body.classList.add('unity-nav-active');

        // Add background elements if they don't exist
        if (!document.querySelector('.unity-background-overlay')) {
            const bgOverlay = document.createElement('div');
            bgOverlay.className = 'unity-background-overlay';
            document.body.insertBefore(bgOverlay, document.body.firstChild);

            const redStreaks = document.createElement('div');
            redStreaks.className = 'unity-red-streaks';
            document.body.insertBefore(redStreaks, document.body.firstChild);
        }

        // Hide existing home links
        hideHomeLinks();

        // Initialize scroll effect
        initScrollEffect();

        // Initialize Bootstrap collapse if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
            const collapseElementList = document.querySelectorAll('.navbar-collapse');
            collapseElementList.forEach(el => new bootstrap.Collapse(el, { toggle: false }));
        }
    }

    // Hide existing "home" links/buttons in apps
    function hideHomeLinks() {
        const selectors = [
            '.home-link',
            'a[href="../"]',
            'a[href="./"]',
            'button:contains("HOME")',
            'a:contains("↩ HOME")',
            '[id*="home-btn"]',
            '[class*="home-btn"]'
        ];

        selectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.textContent.toLowerCase().includes('home') ||
                        el.innerHTML.includes('↩')) {
                        el.classList.add('unity-hidden-home');
                    }
                });
            } catch (e) {
                // Ignore invalid selectors
            }
        });
    }

    // Scroll effect for navbar
    function initScrollEffect() {
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('#unity-nav-wrapper .navbar');
            if (navbar) {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
        });
    }

    // Load required CSS if not already loaded
    function loadCSS() {
        // Check if shared theme is already loaded
        const existingLink = document.querySelector('link[href*="shared-theme.css"]');
        if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = BASE_URL + 'apps/shared-theme.css';
            document.head.appendChild(link);
        }

        // Load Bootstrap if not present
        if (!document.querySelector('link[href*="bootstrap"]')) {
            const bootstrapLink = document.createElement('link');
            bootstrapLink.rel = 'stylesheet';
            bootstrapLink.href = BASE_URL + 'vendor/bootstrap/bootstrap.min.css';
            document.head.appendChild(bootstrapLink);
        }

        // Load Font Awesome if not present
        if (!document.querySelector('link[href*="fontawesome"]') &&
            !document.querySelector('link[href*="font-awesome"]')) {
            const faLink = document.createElement('link');
            faLink.rel = 'stylesheet';
            faLink.href = BASE_URL + 'vendor/fontawesome/all.min.css';
            document.head.appendChild(faLink);
        }
    }

    // Load required scripts
    function loadScripts() {
        // Load Bootstrap JS if not present
        if (typeof bootstrap === 'undefined') {
            const script = document.createElement('script');
            script.src = BASE_URL + 'vendor/bootstrap/bootstrap.bundle.min.js';
            document.body.appendChild(script);
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            loadCSS();
            loadScripts();
            injectNavigation();
        });
    } else {
        loadCSS();
        loadScripts();
        injectNavigation();
    }

})();
