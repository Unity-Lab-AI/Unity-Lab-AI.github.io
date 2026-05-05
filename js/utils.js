/**
 * Unity AI Lab
 * Creators: Hackall360, Sponge, GFourteen
 * https://www.unityailab.com
 * unityailabcontact@gmail.com
 * Version: v2.1.5
 */

// ===================================
// utility functions - the boring but necessary shit
// ===================================

// detect if device has touch
export function isTouchDevice() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}

// get viewport dimensions
export function getViewportSize() {
    return {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
    };
}

// check if user wants reduced motion
export function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// safely init features without crashing everything
export function safeInit(featureName, initFunction) {
    try {
        initFunction();
    } catch (error) {
        console.warn(`Failed to initialize ${featureName}:`, error);
    }
}

// ===================================
// HTML sanitization - XSS prevention
// ===================================

/**
 * Sanitize HTML string to prevent XSS attacks
 * Escapes dangerous characters in user-provided content
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string safe for innerHTML
 */
export function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Sanitize HTML while preserving safe tags (b, i, em, strong, br, p)
 * Use for trusted content that needs basic formatting
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML with safe tags preserved
 */
export function sanitizeHTMLAllowBasic(html) {
    if (typeof html !== 'string') return '';
    // Allow only safe tags, strip everything else
    const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'a'];
    const allowedAttrs = ['href', 'class', 'id'];

    const div = document.createElement('div');
    div.innerHTML = html;

    // Walk DOM and remove dangerous elements/attributes
    const walk = (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();

            // Remove script, style, iframe, object, embed, form, input, etc
            if (!allowedTags.includes(tagName)) {
                // Replace with text content
                const text = document.createTextNode(node.textContent);
                node.parentNode.replaceChild(text, node);
                return;
            }

            // Remove dangerous attributes
            const attrs = Array.from(node.attributes);
            for (const attr of attrs) {
                if (!allowedAttrs.includes(attr.name.toLowerCase())) {
                    node.removeAttribute(attr.name);
                }
                // Check for javascript: URLs
                if (attr.name.toLowerCase() === 'href' &&
                    attr.value.toLowerCase().includes('javascript:')) {
                    node.removeAttribute(attr.name);
                }
            }

            // Process children
            Array.from(node.childNodes).forEach(walk);
        }
    };

    Array.from(div.childNodes).forEach(walk);
    return div.innerHTML;
}

/**
 * Set innerHTML safely with sanitization
 * Drop-in replacement for direct innerHTML assignment
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML to set (will be sanitized)
 * @param {boolean} allowBasicTags - Whether to allow basic formatting tags
 */
export function setInnerHTMLSafe(element, html, allowBasicTags = false) {
    if (!element) return;
    element.innerHTML = allowBasicTags ? sanitizeHTMLAllowBasic(html) : sanitizeHTML(html);
}

// ===================================
// Debug logging utility - toggle-able console output
// ===================================

/**
 * Debug configuration
 * Set DEBUG_ENABLED to false in production to silence all debug logs
 */
const DEBUG_CONFIG = {
    enabled: true,  // Master switch - set to false to disable all debug output
    levels: {
        log: true,
        warn: true,
        error: true,  // Always show errors by default
        info: true
    },
    // Prefix for all debug messages
    prefix: '[Unity]'
};

/**
 * Debug logger - wraps console methods with toggle capability
 * Usage: debug.log('message'), debug.warn('warning'), debug.error('error')
 */
export const debug = {
    /**
     * Check if debug is enabled
     */
    isEnabled() {
        return DEBUG_CONFIG.enabled;
    },

    /**
     * Enable/disable debug output at runtime
     * @param {boolean} enabled - Whether to enable debug output
     */
    setEnabled(enabled) {
        DEBUG_CONFIG.enabled = enabled;
    },

    /**
     * Log a debug message (equivalent to console.log)
     */
    log(...args) {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.log) {
            console.log(DEBUG_CONFIG.prefix, ...args);
        }
    },

    /**
     * Log a warning (equivalent to console.warn)
     */
    warn(...args) {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.warn) {
            console.warn(DEBUG_CONFIG.prefix, ...args);
        }
    },

    /**
     * Log an error (equivalent to console.error)
     * Note: Errors are always logged unless master switch is off
     */
    error(...args) {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.error) {
            console.error(DEBUG_CONFIG.prefix, ...args);
        }
    },

    /**
     * Log info (equivalent to console.info)
     */
    info(...args) {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.info) {
            console.info(DEBUG_CONFIG.prefix, ...args);
        }
    },

    /**
     * Log with custom prefix (for module-specific logging)
     * @param {string} module - Module name for prefix
     * @param {...any} args - Arguments to log
     */
    module(module, ...args) {
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.levels.log) {
            console.log(`[${module}]`, ...args);
        }
    },

    /**
     * Group console output
     */
    group(label) {
        if (DEBUG_CONFIG.enabled) {
            console.group(DEBUG_CONFIG.prefix, label);
        }
    },

    /**
     * End group
     */
    groupEnd() {
        if (DEBUG_CONFIG.enabled) {
            console.groupEnd();
        }
    }
};

// Make debug available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.UnityDebug = debug;
}
