/**
 * home-init.js - Home page initialization and visitor tracking
 */

(function() {
    // Load total visitor count
    var countElement = document.getElementById('totalVisitorCount');
    if (!countElement || typeof VisitorTracking === 'undefined') {
        return;
    }

    // Fetch total count across all tracked pages
    VisitorTracking.getTotalVisitorCount(['demo', 'apps']).then(function(data) {
        if (data && typeof data.total_unique === 'number') {
            countElement.textContent = data.total_unique;
            console.log('Total unique visitors:', data.total_unique);
            console.log('Breakdown:', data.breakdown);
        } else {
            countElement.textContent = '0';
        }
    }).catch(function(error) {
        console.error('Failed to load total visitor count:', error);
        countElement.textContent = '0';
    });
})();
