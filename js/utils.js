// ===================================
// Utility Functions
// ===================================

// Helper function to detect touch devices
export function isTouchDevice() {
    return ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0) ||
           (navigator.msMaxTouchPoints > 0);
}

// Viewport and device detection
export function getViewportSize() {
    return {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
    };
}

// Detect reduced motion preference
export function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Helper function to safely initialize features
export function safeInit(featureName, initFunction) {
    try {
        initFunction();
    } catch (error) {
        console.warn(`Failed to initialize ${featureName}:`, error);
    }
}
