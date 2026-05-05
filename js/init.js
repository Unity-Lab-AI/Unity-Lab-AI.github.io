/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// ===================================
// main init - boot this shit up
// ===================================

import { initPolyfills } from './polyfills.js';
import { safeInit, getViewportSize } from './utils.js';
import { initNavbar, initSmoothScroll } from './navigation.js';
import { initScrollIndicator, initParallax, initThrottledScroll } from './scroll-effects.js';
import { initFormValidation, initNotificationStyles } from './forms.js';
import { initHoverEffects } from './hover-effects.js';
import { initSmokeEffect } from './smoke-effect.js';
import { initMobileMenu } from './mobile-menu.js';
import { enhanceRedStreaks } from './red-streaks.js';

// ===================================
// catch errors before they murder the page
// ===================================
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    event.preventDefault();
    return true;
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// ===================================
// resize handler - throttled so it doesn't choke
// ===================================
(function() {
    var resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            // reinit viewport-dependent shit
            var viewport = getViewportSize();

            // refresh AOS if it exists
            if (typeof AOS !== 'undefined' && viewport.width >= 768) {
                AOS.refresh();
            }
        }, 250);
    });
})();

// ===================================
// boot everything when DOM is ready
// ===================================
function initializeAllFeatures() {
    try {
        // boot AOS if it's loaded
        if (typeof AOS !== 'undefined') {
            try {
                AOS.init({
                    duration: 1000,
                    easing: 'ease-in-out',
                    once: true,
                    mirror: false,
                    disable: function() {
                        // mobile gets no animations - too damn slow
                        return window.innerWidth < 768;
                    }
                });
            } catch (error) {
                console.warn('AOS initialization failed:', error);
            }
        }

        // notification styles first - forms need this
        initNotificationStyles();

        // fire up all the interactive shit
        safeInit('Navbar', initNavbar);
        safeInit('Smooth Scroll', initSmoothScroll);
        safeInit('Scroll Indicator', initScrollIndicator);
        safeInit('Parallax', initParallax);
        safeInit('Form Validation', initFormValidation);
        safeInit('Hover Effects', initHoverEffects);

        // skip smoke in headless - it crashes those dumb test browsers
        var isHeadless = /HeadlessChrome/.test(navigator.userAgent);
        if (!isHeadless) {
            safeInit('Smoke Effect', initSmokeEffect);
        }

        safeInit('Mobile Menu', initMobileMenu);
        safeInit('Throttled Scroll', initThrottledScroll);

        // red streaks setup
        enhanceRedStreaks();
    } catch (error) {
        console.error('Error initializing features:', error);
    }
}

// ===================================
// wait for DOM
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    // delay makes page visible - prevents that ugly flash
    setTimeout(function() {
        document.body.classList.add('loaded');
    }, 100);

    // boot everything - yeah even in test environments
    initializeAllFeatures();
});

// ===================================
// console branding
// ===================================
console.log('%cUnityAILab', 'color: #dc143c; font-size: 24px; font-weight: bold;');
console.log('%cPushing AI to its limits...', 'color: #cccccc; font-size: 14px;');
