/**
 * PolliLibJS - JavaScript Library for Pollinations.AI API
 * Base library with common utilities and authentication handling.
 */

/**
 * Base class for Pollinations.AI API interactions
 */
class PollinationsAPI {
    // API endpoints
    static IMAGE_API = "https://image.pollinations.ai";
    static TEXT_API = "https://text.pollinations.ai";

    // Default referrer for this application (seed tier)
    static DEFAULT_REFERRER = "s-test-sk37AGI";

    /**
     * Initialize the Pollinations API client.
     *
     * @param {Object} options - Configuration options
     * @param {string} options.referrer - Referrer string for web-based authentication
     * @param {string} options.bearerToken - Bearer token for backend authentication
     */
    constructor(options = {}) {
        this.referrer = options.referrer || PollinationsAPI.DEFAULT_REFERRER;
        this.bearerToken = options.bearerToken || null;
    }

    /**
     * Build request headers with authentication.
     *
     * @param {Object} additionalHeaders - Additional headers to include
     * @returns {Object} Dictionary of headers
     */
    _getHeaders(additionalHeaders = {}) {
        const headers = {
            "User-Agent": "PolliLibJS/1.0 JavaScript Client",
            "Referer": this.referrer
        };

        if (this.bearerToken) {
            headers["Authorization"] = `Bearer ${this.bearerToken}`;
        }

        return { ...headers, ...additionalHeaders };
    }

    /**
     * Calculate exponential backoff delay with jitter.
     *
     * @param {number} attempt - Current attempt number (0-indexed)
     * @param {number} maxDelay - Maximum delay in seconds
     * @returns {number} Delay in milliseconds
     */
    exponentialBackoff(attempt, maxDelay = 32) {
        const delay = Math.min(Math.pow(2, attempt), maxDelay);
        // Add jitter (random variation)
        const jitter = Math.random() * delay * 0.1;
        return (delay + jitter) * 1000; // Convert to milliseconds
    }

    /**
     * Make a request with exponential backoff retry logic.
     *
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {number} maxRetries - Maximum number of retry attempts
     * @param {number} timeout - Request timeout in milliseconds
     * @returns {Promise<Response>} Response object
     */
    async retryRequest(url, options = {}, maxRetries = 4, timeout = 60000) {
        // Ensure headers are included
        if (!options.headers) {
            options.headers = this._getHeaders();
        } else {
            options.headers = this._getHeaders(options.headers);
        }

        // Add referrer as URL parameter for GET requests (in addition to header)
        // This ensures proper authentication in Node.js environments
        let requestUrl = url;
        if (this.referrer && !this.bearerToken) {
            // Only add referrer param if not using bearer token auth
            const separator = url.includes('?') ? '&' : '?';
            requestUrl = `${url}${separator}referrer=${encodeURIComponent(this.referrer)}`;
        }

        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Create abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(requestUrl, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                // Check for rate limiting
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const waitTime = retryAfter
                        ? parseInt(retryAfter) * 1000
                        : this.exponentialBackoff(attempt);

                    if (attempt < maxRetries) {
                        console.log(`Rate limited. Retrying after ${waitTime / 1000}s...`);
                        await this._sleep(waitTime);
                        continue;
                    }
                }

                // Raise for other HTTP errors
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response;

            } catch (error) {
                lastError = error;

                if (attempt < maxRetries) {
                    const waitTime = this.exponentialBackoff(attempt);
                    console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}). ` +
                              `Retrying after ${waitTime / 1000}s...`);
                    await this._sleep(waitTime);
                } else {
                    break;
                }
            }
        }

        // All retries failed
        throw lastError;
    }

    /**
     * URL-encode a prompt string.
     *
     * @param {string} prompt - Text prompt to encode
     * @returns {string} URL-encoded string
     */
    encodePrompt(prompt) {
        return encodeURIComponent(prompt);
    }

    /**
     * Sleep for a specified duration.
     *
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Test basic connection to Pollinations.AI
 */
function testConnection() {
    const api = new PollinationsAPI();
    console.log("PolliLibJS initialized successfully!");
    console.log(`Using referrer: ${api.referrer}`);
    console.log(`Image API endpoint: ${PollinationsAPI.IMAGE_API}`);
    console.log(`Text API endpoint: ${PollinationsAPI.TEXT_API}`);
    return api;
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PollinationsAPI, testConnection };
}

// For ES6 modules
if (typeof exports !== 'undefined') {
    exports.PollinationsAPI = PollinationsAPI;
    exports.testConnection = testConnection;
}

// Test if run directly
if (typeof require !== 'undefined' && require.main === module) {
    console.log("=".repeat(50));
    console.log("PolliLibJS - Pollinations.AI JavaScript Library");
    console.log("=".repeat(50));
    testConnection();
    console.log("\nLibrary ready to use!");
}
