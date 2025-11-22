// ===================================
// Scroll Effects Module
// ===================================

import { isTouchDevice } from './utils.js';

// ===================================
// Scroll Indicator
// ===================================
export function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', function() {
            const aboutSection = document.querySelector('#about');
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Hide scroll indicator when scrolling down
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.pointerEvents = 'none';
            } else {
                scrollIndicator.style.opacity = '1';
                scrollIndicator.style.pointerEvents = 'auto';
            }
        });
    }
}

// ===================================
// Parallax Effect (with feature detection)
// ===================================
export function initParallax() {
    // Only enable parallax on desktop devices
    if (window.innerWidth > 992 && !isTouchDevice()) {
        var ticking = false;

        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(function() {
                    var scrolled = window.pageYOffset || document.documentElement.scrollTop;
                    var heroContent = document.querySelector('.hero-content');

                    if (heroContent && scrolled < 800) {
                        var translateY = scrolled * 0.5;
                        var opacity = 1 - (scrolled / 600);

                        // Use vendor prefixes
                        heroContent.style.webkitTransform = 'translateY(' + translateY + 'px)';
                        heroContent.style.mozTransform = 'translateY(' + translateY + 'px)';
                        heroContent.style.msTransform = 'translateY(' + translateY + 'px)';
                        heroContent.style.oTransform = 'translateY(' + translateY + 'px)';
                        heroContent.style.transform = 'translateY(' + translateY + 'px)';
                        heroContent.style.opacity = Math.max(0, opacity);
                    }

                    ticking = false;
                });

                ticking = true;
            }
        });
    }
}

// ===================================
// Performance: Throttled scroll handler
// ===================================
export function initThrottledScroll() {
    var lastScrollTop = 0;
    var ticking = false;

    window.addEventListener('scroll', function() {
        var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (!ticking) {
            window.requestAnimationFrame(function() {
                // Only update if scroll position changed significantly
                if (Math.abs(scrollTop - lastScrollTop) > 5) {
                    lastScrollTop = scrollTop;
                }
                ticking = false;
            });

            ticking = true;
        }
    }, { passive: true });
}
