/**
 * page-init.js - Common page initialization scripts
 * Handles FOUC prevention and common page load events
 */

// Remove FOUC class when page loads
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});
