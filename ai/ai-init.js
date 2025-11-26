/**
 * ai-init.js - AI page initialization and visitor tracking
 */

// Load and auto-refresh visitor count for demo page
document.addEventListener('DOMContentLoaded', function() {
    var countElement = document.getElementById('visitorCount');
    if (!countElement || typeof VisitorTracking === 'undefined') {
        return;
    }

    var currentCount = null;

    // Function to fetch and update visitor count
    async function updateVisitorCount() {
        try {
            var count = await VisitorTracking.getVisitorCount('demo');
            if (count !== null) {
                // Only update if count has changed or is first load
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
        } catch (error) {
            console.error('Failed to load visitor count:', error);
            if (currentCount === null) {
                countElement.textContent = '0';
                currentCount = '0';
            }
        }
    }

    // Initial load
    updateVisitorCount();

    // Auto-refresh every 5 minutes (300,000 ms)
    setInterval(updateVisitorCount, 300000);
    console.log('Visitor count auto-refresh enabled (every 5 minutes)');
});
