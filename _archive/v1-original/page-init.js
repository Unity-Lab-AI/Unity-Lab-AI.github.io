/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * contact@unityailab.com
 * Version: v2.1.5
 */

/**
 * page-init.js - Common page initialization scripts
 * Handles FOUC prevention and common page load events
 */

// Remove FOUC class when page loads
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
