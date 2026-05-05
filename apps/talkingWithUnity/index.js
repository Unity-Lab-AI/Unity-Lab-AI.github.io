/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// Trailing slash normalization and visibility management for Unity Voice Lab
(function() {
    // Normalize trailing slash for assets
    try {
        var path = window.location.pathname || '';
        if (!path.endsWith('/')) {
            var lastSegment = path.substring(path.lastIndexOf('/') + 1);
            if (lastSegment && lastSegment.indexOf('.') === -1) {
                var search = window.location.search || '';
                var hash = window.location.hash || '';
                var destination = path + '/' + search + hash;
                window.location.replace(destination);
            }
        }
    } catch (error) {
        console.warn('Failed to normalize trailing slash for assets:', error);
    }
})();

// Make body visible when fully loaded
window.addEventListener('load', function() {
    document.body.style.visibility = 'visible';
});
