/**
 * Visitor Tracking Utility
 * Handles unique visitor tracking via n8n webhook integration
 *
 * Features:
 * - Cryptographically secure UID generation
 * - Cookie-based UID persistence
 * - Visitor registration (POST)
 * - Visitor count retrieval (GET)
 */

const VisitorTracking = (() => {
    const WEBHOOK_URL = 'https://n8n.srv484091.hstgr.cloud/webhook/unitydemo-UID';
    const COOKIE_NAME = 'unityUID';
    const REGISTERED_COOKIE_NAME = 'unityRegistered';
    const COOKIE_MAX_AGE = 31536000; // 1 year in seconds
    const MAX_REGISTRATION_ATTEMPTS = 3; // Max attempts to generate unique UID

    /**
     * Generate cryptographically secure UID
     * Format: ud-XX-XXXXXXXXX-XXXXXXXXX-XXXXXXXXXX (36 chars total)
     * Uses crypto.getRandomValues() for secure random generation
     *
     * @returns {string} Secure UID
     */
    function generateSecureUID() {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

        /**
         * Generate cryptographically secure random string
         * @param {number} length - Length of random string
         * @returns {string} Random string
         */
        function secureRandom(length) {
            const array = new Uint8Array(length);
            crypto.getRandomValues(array);
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars[array[i] % chars.length];
            }
            return result;
        }

        // Format: ud-XX-XXXXXXXXX-XXXXXXXXX-XXXXXXXXXX
        return `ud-${secureRandom(2)}-${secureRandom(9)}-${secureRandom(9)}-${secureRandom(10)}`;
    }

    /**
     * Get UID from cookie
     * @returns {string|null} UID or null if not found
     */
    function getUID() {
        const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
        return match ? match[1] : null;
    }

    /**
     * Set UID in cookie
     * @param {string} uid - UID to store
     */
    function setUID(uid) {
        document.cookie = `${COOKIE_NAME}=${uid}; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    }

    /**
     * Check if user has been registered with the webhook
     * @returns {boolean} True if registered
     */
    function isRegistered() {
        const match = document.cookie.match(new RegExp(`${REGISTERED_COOKIE_NAME}=([^;]+)`));
        return match && match[1] === 'true';
    }

    /**
     * Mark user as registered
     */
    function setRegistered() {
        document.cookie = `${REGISTERED_COOKIE_NAME}=true; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
    }

    /**
     * Clear registration status
     */
    function clearRegistered() {
        document.cookie = `${REGISTERED_COOKIE_NAME}=; max-age=0; path=/`;
    }

    /**
     * Register a new UID with the webhook
     * Handles collision detection - if UID exists, generates a new one and retries
     *
     * @param {string} page - Page identifier (e.g., 'demo')
     * @param {number} attempt - Current attempt number (internal use)
     * @returns {Promise<object|null>} Registration result or null on error
     */
    async function registerUID(page, attempt = 1) {
        const uid = getUID();
        if (!uid) {
            console.error('VisitorTracking: No UID to register');
            return null;
        }

        // Check if already registered (shouldn't happen, but safety check)
        if (isRegistered()) {
            console.log('VisitorTracking: User already registered');
            return { alreadyRegistered: true };
        }

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page: page,
                    uid: uid
                }),
                signal: AbortSignal.timeout(5000)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check if this is a collision (UID exists but we haven't registered)
            if (data.server === 'User Exists') {
                console.warn(`VisitorTracking: UID collision detected (attempt ${attempt}/${MAX_REGISTRATION_ATTEMPTS})`);

                // If we've hit max attempts, give up
                if (attempt >= MAX_REGISTRATION_ATTEMPTS) {
                    console.error('VisitorTracking: Max registration attempts reached, possible system issue');
                    return null;
                }

                // Generate new UID and retry
                console.log('VisitorTracking: Generating new UID to resolve collision');
                clearRegistered();
                const newUID = generateSecureUID();
                setUID(newUID);

                // Retry registration with new UID
                return await registerUID(page, attempt + 1);
            }

            // Registration successful - UID is unique and registered
            if (data.uids) {
                setRegistered();
                console.log(`VisitorTracking: Successfully registered UID for page '${page}', count: ${data.uids}`);
                return {
                    success: true,
                    count: data.uids,
                    uid: uid
                };
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('VisitorTracking: Registration timeout');
            } else {
                console.error('VisitorTracking: Registration failed:', error.message);
            }
            return null;
        }
    }

    /**
     * Create and register a new UID
     * Should only be called after successful age verification
     * Automatically registers with webhook and handles collisions
     *
     * @param {string} page - Page identifier (e.g., 'demo')
     * @returns {Promise<object|null>} Registration result
     */
    async function createAndRegisterUID(page) {
        // Generate new UID
        const uid = generateSecureUID();
        setUID(uid);
        console.log('VisitorTracking: Created new UID:', uid);

        // Register it immediately
        return await registerUID(page);
    }

    /**
     * Track visitor for a specific page
     * Sends POST request to n8n webhook
     *
     * @param {string} page - Page identifier (e.g., 'demo', 'landing', 'ai')
     * @returns {Promise<object|null>} Response data or null on error
     */
    async function trackVisitor(page) {
        const uid = getUID();
        if (!uid) {
            console.warn('VisitorTracking: No UID found, visitor not tracked');
            return null;
        }

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    page: page,
                    uid: uid
                }),
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Log different responses
            if (data.server === 'User Exists') {
                console.log(`VisitorTracking: User already counted for page '${page}'`);
            } else if (data.uids) {
                console.log(`VisitorTracking: Visitor tracked for page '${page}', count: ${data.uids}`);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('VisitorTracking: Request timeout');
            } else {
                console.error('VisitorTracking: Tracking failed:', error.message);
            }
            return null;
        }
    }

    /**
     * Get visitor count for a specific page
     * Uses 'anonymous' UID to retrieve count without tracking
     *
     * @param {string} page - Page identifier (e.g., 'demo', 'landing', 'ai')
     * @param {string} [uid='anonymous'] - UID to use (defaults to 'anonymous')
     * @returns {Promise<string|null>} Visitor count as string or null on error
     */
    async function getVisitorCount(page, uid = 'anonymous') {
        try {
            const params = new URLSearchParams({
                page: page,
                uid: uid
            });

            const response = await fetch(`${WEBHOOK_URL}?${params.toString()}`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            if (!response.ok) {
                if (response.status === 403) {
                    console.error('VisitorTracking: Unauthorized UID');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return null;
            }

            const data = await response.json();
            return data.uids || null;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('VisitorTracking: Request timeout');
            } else {
                console.error('VisitorTracking: Count retrieval failed:', error.message);
            }
            return null;
        }
    }

    /**
     * Check if UID exists in cookie
     * @returns {boolean} True if UID exists
     */
    function hasUID() {
        return getUID() !== null;
    }

    /**
     * Clear UID and registration status from cookies
     * For testing/debugging purposes only
     */
    function clearUID() {
        document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
        clearRegistered();
    }

    // Public API
    return {
        generateSecureUID,
        getUID,
        setUID,
        isRegistered,
        createAndRegisterUID,
        registerUID,
        trackVisitor,
        getVisitorCount,
        hasUID,
        clearUID
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisitorTracking;
}
