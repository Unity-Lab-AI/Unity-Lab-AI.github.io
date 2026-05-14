// scripts/screenshots.mjs — generate README screenshots via Playwright.
//
// Walks the game from landing → setup → in-game pages, fires a real Ollama
// turn and a real Pollinations image gen, and waits for each to actually
// finish before screenshotting.  Non-headless so the operator can watch it
// play through.
//
// Usage:
//   1. Make sure http://localhost:9535/index.html is serving (python -m http.server 9535)
//   2. Make sure Ollama is running with dolphin-mistral:7b pulled and OLLAMA_ORIGINS=*
//   3. node scripts/screenshots.mjs

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PROJECT_DIR = resolve(import.meta.dirname, '..');
const OUT_DIR = join(PROJECT_DIR, 'docs', 'screenshots');
const BASE = 'http://localhost:9535';

const SHOTS = [];

mkdirSync(OUT_DIR, { recursive: true });

// Try to read the Pollinations key from env.local.js so image-gen actually
// runs during this script.  Gracefully degrade to anonymous if missing.
function readPollyKey() {
  const envFile = join(PROJECT_DIR, 'js', 'env.local.js');
  if (!existsSync(envFile)) return '';
  const txt = readFileSync(envFile, 'utf8');
  const m = txt.match(/POLLINATIONS_API_KEY:\s*['"]([^'"]+)['"]/);
  return m ? m[1] : '';
}

async function shot(page, name, desc) {
  const file = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  SHOTS.push({ name, file, desc });
  console.log(`📸 ${name}.png — ${desc}`);
}

async function waitForResponse(page, timeoutMs = 90_000) {
  // The streaming bubble has class 'streaming' while in-flight. We poll until
  // there is at least one .assistant entry AND no .streaming class on it.
  await page.waitForFunction(
    () => {
      const entries = document.querySelectorAll('.log-entry.assistant');
      if (entries.length === 0) return false;
      const last = entries[entries.length - 1];
      return !last.classList.contains('streaming');
    },
    null,
    { timeout: timeoutMs }
  );
}

async function safeClick(page, sel, optMs = 1000) {
  try { await page.click(sel, { timeout: optMs }); return true; } catch { return false; }
}

async function safeWait(page, sel, ms = 3000) {
  try { await page.waitForSelector(sel, { timeout: ms }); return true; } catch { return false; }
}

(async () => {
  const pollyKey = readPollyKey();
  console.log(`Pollinations key: ${pollyKey ? pollyKey.slice(0,5) + '…' + pollyKey.slice(-4) : '(none, image gen may skip)'}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200,                 // slow enough to watch, fast enough to finish
    args: ['--window-size=1440,900']
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: [],
    // localStorage seed via initScript so the page sees these values before
    // any module reads them.
    storageState: {
      cookies: [],
      origins: [{
        origin: BASE,
        localStorage: [
          ...(pollyKey ? [{ name: 'ssd_pollinations_key', value: pollyKey }] : []),
          { name: 'ssd_voice_on', value: 'off' },           // don't blast audio
          { name: 'ssd_ollama_model', value: 'dolphin-mistral:7b' },
          { name: 'ssd_ollama_endpoint', value: 'http://localhost:11434' }
        ]
      }]
    }
  });
  const page = await ctx.newPage();

  // -------------- 1. LANDING PAGE --------------
  console.log('\n=== Landing page ===');
  await page.goto(`${BASE}/index.html`);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await shot(page, '01-landing-setup', 'Setup wizard — Ollama install, model pull, Kokoro TTS, Pollinations key');

  // Try clicking "Load Kokoro" if visible (it's a one-shot in-browser model load)
  await safeClick(page, '#load-kokoro-btn', 1500);

  // Wait for the launch button to enable or just continue
  await page.waitForTimeout(3000);
  // If still disabled, force-navigate (some flows require explicit launch button click,
  // but the screenshot use case is fine with direct nav).

  // -------------- 2. GAME — NEW GAME SETUP --------------
  console.log('\n=== Game boot ===');
  await page.goto(`${BASE}/game.html`);
  await page.waitForTimeout(2500);
  await shot(page, '02-newgame', 'New-game setup — pick mode + dungeon template, Unity as starter captive');

  // Click any "Start" / "Begin" / "Start new game" button
  let started = false;
  for (const sel of ['button[id*="start"]', 'button:has-text("Start")', 'button:has-text("Begin")', 'button.btn-primary']) {
    if (await safeClick(page, sel, 800)) { started = true; break; }
  }
  await page.waitForTimeout(3000);

  // -------------- 3. DASHBOARD --------------
  await page.goto(`${BASE}/game.html#dashboard`);
  await page.waitForTimeout(2500);
  await shot(page, '03-dashboard', 'Player dashboard — treasury, captives grid, propositioner inbox, recent films');

  // -------------- 4. ROSTER --------------
  await page.goto(`${BASE}/game.html#roster`);
  await page.waitForTimeout(2000);
  await shot(page, '04-roster', 'Captive roster — tabs for captives / listed / escaped + disposal log');

  // -------------- 5. DUNGEON --------------
  await page.goto(`${BASE}/game.html#dungeon`);
  await page.waitForTimeout(2000);
  await shot(page, '05-dungeon', 'Dungeon portfolio — multiple hideouts with hold grids and capacity upgrades');

  // -------------- 6. TOWN --------------
  await page.goto(`${BASE}/game.html#town`);
  await page.waitForTimeout(2500);
  await shot(page, '06-town', 'Town plot-grid — purchasable locations, hunting grounds, owned-property cover income');

  // -------------- 7. HUNT --------------
  await page.goto(`${BASE}/game.html#hunt`);
  await page.waitForTimeout(2000);
  await shot(page, '07-hunt', 'Hunt locations — 12 spawn pools, archetype-specific girls, tool-based capture odds');

  // -------------- 8. SHOP --------------
  await page.goto(`${BASE}/game.html#shop`);
  await page.waitForTimeout(2000);
  await shot(page, '08-shop', 'Item shop — sedation, restraints, containment, toys, dungeon upgrades, consumables');

  // -------------- 9. FILM MARKET --------------
  await page.goto(`${BASE}/game.html#market`);
  await page.waitForTimeout(2000);
  await shot(page, '09-market', 'Film market — recorded episodes auto-priced by quality markers and listed for sale');

  // -------------- 10. UNITY'S ROOM (centerpiece) --------------
  console.log('\n=== Unity room — real Ollama call ===');
  await page.goto(`${BASE}/game.html#room`);
  await page.waitForTimeout(4000);
  await shot(page, '10-room-initial', 'Unity room — body state bars, mood, bond meter, quick-action buttons, drug HUD');

  // Type a message and send it. Wait for streaming to complete.
  const sent = await safeClick(page, '#user-in', 1500);
  if (sent) {
    await page.fill('#user-in', 'tell me what you want, slut');
    await page.click('#send');
    console.log('  Sent message, waiting for Ollama response...');
    try {
      await waitForResponse(page, 90_000);
      console.log('  Response complete.');
      await page.waitForTimeout(2000);
      await shot(page, '11-room-ollama-reply', 'Unity replied via real Ollama inference — streamed response + delta-parsed body state');
    } catch (e) {
      console.warn('  Ollama did not respond in 90s:', e.message);
      await shot(page, '11-room-ollama-reply', 'Unity room after attempted Ollama call');
    }
  }

  // -------------- 11. POLLINATIONS SELFIE --------------
  console.log('\n=== Pollinations selfie ===');
  const selfieClicked = await safeClick(page, '#selfie-btn', 1500);
  if (selfieClicked) {
    console.log('  Selfie button clicked, waiting for Pollinations image...');
    try {
      await page.waitForSelector('#selfie-slot img', { timeout: 120_000 });
      await page.waitForTimeout(3000);
      await shot(page, '12-room-pollinations-selfie', 'Pollinations selfie generated — full-body image with persistent facial + outfit seed');
    } catch (e) {
      console.warn('  Pollinations image did not arrive in 120s:', e.message);
      await shot(page, '12-room-pollinations-selfie', 'Selfie generation attempted (may have rate-limited)');
    }
  }

  // -------------- 12. SETTINGS --------------
  await page.goto(`${BASE}/game.html#settings`);
  await page.waitForTimeout(2500);
  await shot(page, '13-settings', 'In-game settings — Ollama health check + repair, Kokoro voice, save slots, danger zone');

  // -------------- Summary --------------
  console.log('\n=== Screenshots written ===');
  for (const s of SHOTS) {
    console.log(`  docs/screenshots/${s.name}.png — ${s.desc}`);
  }
  console.log(`\nTotal: ${SHOTS.length} screenshots`);

  await page.waitForTimeout(2000);
  await browser.close();
})();
