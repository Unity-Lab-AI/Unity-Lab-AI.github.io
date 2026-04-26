// Runtime config — overridable by setting window.__ADMIN_CONFIG__ before this loads.
// Default: same-origin (works for localhost dev AND VPS prod where everything is one origin).
// For GitHub Pages static deploy: override API_BASE_URL to point at the hosted backend.

const defaults = {
  API_BASE_URL: window.location.origin,
  WS_URL: (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
          window.location.host + '/ws',
  VERSION: 'v0.0.1-dev',
};

export const config = Object.assign({}, defaults, window.__ADMIN_CONFIG__ ?? {});
