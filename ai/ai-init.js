/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * ai-init.js - AI page initialization and visitor tracking
 */

(function() {
    // grab the visitor counter and make it actually do something useful
    var countElement = document.getElementById('visitorCount');
    if (!countElement || typeof VisitorTracking === 'undefined') {
        return;
    }

    var currentCount = null;

    // fetch visitor count and don't be a little bitch about it
    function updateVisitorCount() {
        VisitorTracking.getVisitorCount('demo').then(function(count) {
            if (count !== null) {
                // only update when the damn number actually changes
                if (currentCount !== count) {
                    countElement.textContent = count;
                    currentCount = count;
                    console.log('Visitor count updated:', count);
                }
            } else {
                if (currentCount === null) {
                    countElement.textContent = '0';
                    currentCount = '0';
                }
            }
        }).catch(function(error) {
            console.error('Failed to load visitor count:', error);
            if (currentCount === null) {
                countElement.textContent = '0';
                currentCount = '0';
            }
        });
    }

    // load this shit immediately
    updateVisitorCount();

    // refresh every 5 minutes because people can't stop staring at numbers
    setInterval(updateVisitorCount, 300000);
    console.log('Visitor count auto-refresh enabled (every 5 minutes)');
})();
