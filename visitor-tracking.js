/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

/**
 * Visitor Tracking Utility
 * Handles unique visitor tracking via UnityAILab API
 *
 * Features:
 * - Simple UID generation with localStorage persistence
 * - Visitor registration (POST)
 * - Visitor count retrieval (GET)
 *
 * API: https://users.unityailab.com/api/visitors
 */

const VisitorTracking = (() => {
    // Use proxy in development (localhost), direct URL in production
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_URL = isLocalhost ? '/api/visitors' : 'https://users.unityailab.com/api/visitors';
    const UID_KEY = 'visitor_uid';

    /**
     * Create timeout signal with browser fallback
     * AbortSignal.timeout not supported in Safari < 15.4 / Firefox < 90
     * @param {number} ms - Timeout in milliseconds
     * @returns {AbortSignal} Signal that aborts after timeout
     */
    function createTimeoutSignal(ms) {
        if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
            return AbortSignal.timeout(ms);
        }
        // Fallback for older browsers - manual AbortController + setTimeout
        const controller = new AbortController();
        setTimeout(() => controller.abort(), ms);
        return controller.signal;
    }

    /**
     * Get or create visitor UID
     * @returns {string} Visitor UID
     */
    function getUID() {
        let uid = localStorage.getItem(UID_KEY);
        if (!uid) {
            uid = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem(UID_KEY, uid);
        }
        return uid;
    }

    /**
     * Set UID in localStorage
     * @param {string} uid - UID to store
     */
    function setUID(uid) {
        localStorage.setItem(UID_KEY, uid);
    }

    /**
     * Check if UID exists in localStorage
     * @returns {boolean} True if UID exists
     */
    function hasUID() {
        return localStorage.getItem(UID_KEY) !== null;
    }

    /**
     * Clear UID from localStorage
     * For testing/debugging purposes only
     */
    function clearUID() {
        localStorage.removeItem(UID_KEY);
    }

    /**
     * Check if user is registered (UID exists)
     * @returns {boolean} True if registered
     */
    function isRegistered() {
        return hasUID();
    }

    /**
     * Track visitor for a specific page
     * Sends POST request to API
     *
     * @param {string} page - Page identifier (e.g., 'demo', 'landing', 'ai')
     * @returns {Promise<object|null>} Response data or null on error
     */
    async function trackVisitor(page) {
        const uid = getUID();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uid: uid,
                    page: page
                }),
                signal: createTimeoutSignal(5000) // 5 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Log response status
            if (data.status === 'new_visitor') {
                console.log(`VisitorTracking: New visitor tracked for page '${page}', count: ${data.uids}`);
            } else if (data.status === 'existing_visitor') {
                console.log(`VisitorTracking: Existing visitor for page '${page}', count: ${data.uids}`);
            }

            return data;
        } catch (error) {
            // Silently handle tracking failures - this is expected when running locally
            // or when the tracking server is unavailable
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                console.debug('VisitorTracking: Request timeout (server unavailable)');
            } else {
                console.debug('VisitorTracking: Tracking unavailable -', error.message);
            }
            return null;
        }
    }

    /**
     * Create and register a new UID for a page
     * Should be called after successful age verification
     *
     * @param {string} page - Page identifier (e.g., 'demo')
     * @returns {Promise<object|null>} Registration result
     */
    async function createAndRegisterUID(page) {
        // Ensure we have a UID (creates one if not)
        const uid = getUID();
        console.log('VisitorTracking: Using UID:', uid);

        // Track the visitor (registers them)
        const result = await trackVisitor(page);

        if (result) {
            return {
                success: true,
                count: result.uids,
                uid: uid,
                status: result.status
            };
        }

        return null;
    }

    /**
     * Register UID for a page (alias for trackVisitor)
     *
     * @param {string} page - Page identifier
     * @returns {Promise<object|null>} Registration result
     */
    async function registerUID(page) {
        return await trackVisitor(page);
    }

    /**
     * Get visitor count for a specific page
     *
     * @param {string} page - Page identifier (e.g., 'demo', 'landing', 'ai')
     * @returns {Promise<number|null>} Visitor count or null on error
     */
    async function getVisitorCount(page) {
        try {
            const response = await fetch(`${API_URL}?page=${encodeURIComponent(page)}`, {
                method: 'GET',
                signal: createTimeoutSignal(5000) // 5 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`VisitorTracking: Count for '${page}': ${data.uids} unique, ${data.total_visits} total`);
            return data.uids !== undefined ? data.uids : null;
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                console.error('VisitorTracking: Request timeout');
            } else {
                console.error('VisitorTracking: Count retrieval failed:', error.message);
            }
            return null;
        }
    }

    /**
     * Generate a secure UID (for compatibility with existing code)
     * @returns {string} Generated UID
     */
    function generateSecureUID() {
        return 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Get total visitor count across all pages
     * Fetches counts for multiple pages and sums unique visitors
     *
     * @param {string[]} pages - Array of page identifiers to sum
     * @returns {Promise<object|null>} Object with total unique visitors and breakdown by page
     */
    async function getTotalVisitorCount(pages = ['demo', 'apps', 'landing']) {
        try {
            const results = {};
            let totalUniqueVisitors = 0;
            let totalVisits = 0;

            // Fetch counts for all pages in parallel
            const promises = pages.map(async (page) => {
                try {
                    const response = await fetch(`${API_URL}?page=${encodeURIComponent(page)}`, {
                        method: 'GET',
                        signal: createTimeoutSignal(5000)
                    });

                    if (response.ok) {
                        const data = await response.json();
                        return { page, uids: data.uids || 0, total_visits: data.total_visits || 0 };
                    }
                } catch (err) {
                    console.warn(`VisitorTracking: Failed to get count for '${page}'`);
                }
                return { page, uids: 0, total_visits: 0 };
            });

            const counts = await Promise.all(promises);

            counts.forEach(({ page, uids, total_visits }) => {
                results[page] = { uids, total_visits };
                totalUniqueVisitors += uids;
                totalVisits += total_visits;
            });

            console.log(`VisitorTracking: Total across ${pages.length} pages: ${totalUniqueVisitors} unique visitors`);

            return {
                total_unique: totalUniqueVisitors,
                total_visits: totalVisits,
                breakdown: results
            };
        } catch (error) {
            console.error('VisitorTracking: Failed to get total count:', error.message);
            return null;
        }
    }

    // Public API
    return {
        getUID,
        setUID,
        hasUID,
        clearUID,
        isRegistered,
        trackVisitor,
        createAndRegisterUID,
        registerUID,
        getVisitorCount,
        getTotalVisitorCount,
        generateSecureUID
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisitorTracking;
}
