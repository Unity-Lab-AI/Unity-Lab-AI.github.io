// DUNGEON MASTER: THE HUNT — dev-time env injection (TEMPLATE — committed)
//
// You do NOT need to edit this file by hand. The launchers auto-generate
// `js/env.local.js` (gitignored) from the `.env` file at the project root:
//
//   start.bat → scripts/sync-env.ps1  (Windows / PowerShell)
//   start.sh  → inline bash sync      (Mac / Linux)
//
// Workflow: paste your real Pollinations key into `.env`, then launch. The
// browser-side `window.__DEV_ENV` will reflect the latest .env values.
//
// On GitHub Pages / any static deploy, `js/env.local.js` will not exist, and
// the visitor supplies their own values via the Settings panel in the landing page.

window.__DEV_ENV = {
  POLLINATIONS_API_KEY: '',                                    // paste your token in .env, not here
  OLLAMA_ENDPOINT: 'http://localhost:11434',
  OLLAMA_MODEL: 'dolphin-mistral:7b',
  KOKORO_MODEL: 'onnx-community/Kokoro-82M-v1.0-ONNX',
  DEV_MODE: true
};
