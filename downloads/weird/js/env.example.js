// SEX SLAVE DUNGEON — dev-time env injection (TEMPLATE — committed)
//
// Copy this file to `js/env.local.js` (gitignored) and fill in real values for LOCAL DEV ONLY.
// On GitHub Pages / any static deploy, `js/env.local.js` will not exist, and the visitor
// supplies their own values via the Settings panel in the landing page.
//
// This is a non-module script. It attaches values to `window.__DEV_ENV` so config.js can
// pick them up at runtime. If `env.local.js` is missing, config.js falls back to
// localStorage / settings panel / defaults.

window.__DEV_ENV = {
  POLLINATIONS_API_KEY: '',                                    // paste your token for local dev
  OLLAMA_ENDPOINT: 'http://localhost:11434',
  OLLAMA_MODEL: 'dolphin-mistral:7b',
  KOKORO_MODEL: 'onnx-community/Kokoro-82M-v1.0-ONNX',
  DEV_MODE: true
};
