/**
 * Playwright end-to-end test for the Unity AI Lab demo + apps.
 *
 * Walks through each chat-style app: types "hello", waits for Unity-tone
 * response, types an apple image request, waits for the image to load.
 *
 * For non-chat apps (screensaver, slideshow): turns off auto-prompt if
 * present, enters an apple prompt, waits up to 40s for the image to appear.
 *
 * Captures a screenshot per step and writes a final report.
 *
 * Run with: node test-apps.js
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RESULTS_DIR = 'test-results-runtime';
const RESPONSE_TIMEOUT_MS = 60_000;   // text response wait
const IMAGE_TIMEOUT_MS = 60_000;      // image gen wait

// Targets: apps + demo. `path` is the actual served HTML.
const TARGETS = [
  { name: 'demo (Summon Unity)', path: '/ai/demo/',                                  type: 'chat' },
  { name: 'helperInterfaceDemo', path: '/apps/helperInterfaceDemo/helperInterface.html', type: 'chat' },
  { name: 'personaDemo',         path: '/apps/personaDemo/persona.html',             type: 'chat' },
  { name: 'textDemo',            path: '/apps/textDemo/text.html',                   type: 'chat' },
  { name: 'unityDemo',           path: '/apps/unityDemo/unity.html',                 type: 'chat' },
  { name: 'talkingWithUnity',    path: '/apps/talkingWithUnity/',                    type: 'chat' },
  { name: 'screensaverDemo',     path: '/apps/screensaverDemo/screensaver.html',     type: 'image-app',
    promptInputId: 'screensaver-prompt', autoPromptToggleId: 'screensaver-restart-prompt' },
  { name: 'slideshowDemo',       path: '/apps/slideshowDemo/slideshow.html',         type: 'image-app',
    promptInputId: 'slideshow-prompt',   autoPromptToggleId: null /* will hunt */ },
];

const report = [];

function log(msg) { console.log('[test] ' + msg); }
function note(target, status, detail = '') {
  report.push({ target: target.name, status, detail });
  log(`  → ${target.name}: ${status} ${detail ? '— ' + detail : ''}`);
}

async function shot(page, target, label) {
  const safe = (target.name + '_' + label).replace(/[^a-zA-Z0-9_-]/g, '_');
  const file = path.join(RESULTS_DIR, safe + '.png');
  try {
    await page.screenshot({ path: file, fullPage: false });
  } catch (e) {
    /* may fail if page navigated away */
  }
}

async function dismissAgeGate(page) {
  // Demo + some apps have age verification popups. Click "Yes" on the first
  // popup, fill birthdate (1990-01-01) on the second.
  try {
    const yesBtn = await page.locator('button#verifyYes, button:has-text("Yes")').first();
    if (await yesBtn.isVisible({ timeout: 2000 })) {
      await yesBtn.click();
      log('  age gate: clicked Yes');
      await page.waitForTimeout(500);
    }
  } catch (_) {}
  // Birthdate popup
  try {
    const monthSel = await page.locator('#birthMonth');
    if (await monthSel.isVisible({ timeout: 2000 })) {
      await page.selectOption('#birthMonth', '0');     // January
      await page.selectOption('#birthDay', '1');
      await page.selectOption('#birthYear', '1990');
      await page.click('#submitBirthdate, button:has-text("Submit")');
      log('  age gate: birthdate submitted');
      await page.waitForTimeout(500);
    }
  } catch (_) {}
}

function unityVoiceScore(text) {
  if (!text) return 0;
  const t = text.toLowerCase();
  const tells = ['fuck', 'shit', 'damn', 'bitch', 'hell', 'ass', 'goddamn', 'unity'];
  let score = 0;
  for (const w of tells) if (t.includes(w)) score++;
  // Negative signals — generic AI hedging
  if (t.includes('how can i assist')) score -= 5;
  if (t.includes("i'm here to help")) score -= 5;
  if (t.includes("i can't")) score -= 3;
  if (t.includes("i'm sorry")) score -= 3;
  return score;
}

async function findChatInput(page) {
  // Note: Playwright CSS selectors don't accept the `i` flag inline.
  const candidates = [
    '#chat-input',                   // helperInterfaceDemo, unityDemo
    '#userInput',                    // personaDemo, demo
    '#user-input', '#user_input',
    '#messageInput', '#message-input',
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="Type"]',
    'textarea[placeholder*="type"]',
    'input[placeholder*="message"]',
    'textarea#chatInput', 'input#chatInput',
    'textarea',  // last-ditch
  ];
  for (const sel of candidates) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible().catch(() => false)) {
        return el;
      }
    } catch (_) {}
  }
  return null;
}

async function findSendButton(page) {
  // Note: Playwright's :has-text() is case-insensitive by default for text,
  // and doesn't accept inline `i` flag like CSS Lvl4 does. Avoid that syntax.
  const candidates = [
    '#sendButton', '#send-button', '#sendBtn',
    'button[type="submit"]',
    'button:has-text("Send")',
    'button:has-text("send")',
    'button:has-text("submit")',
    'button[aria-label*="send"]',
    'button[aria-label*="Send"]',
    '.send-button', '.send-btn',
  ];
  for (const sel of candidates) {
    try {
      const el = page.locator(sel).first();
      if (await el.count() > 0 && await el.isVisible().catch(() => false)) {
        return el;
      }
    } catch (_) { /* skip invalid selectors */ }
  }
  return null;
}

async function waitForNewAssistantText(page, beforeText) {
  // Poll the body text — when it grows AND contains new content beyond
  // beforeText, we have a response. Cap at RESPONSE_TIMEOUT_MS.
  const start = Date.now();
  while (Date.now() - start < RESPONSE_TIMEOUT_MS) {
    const cur = await page.evaluate(() => document.body.innerText);
    if (cur.length > beforeText.length + 20) return cur.slice(beforeText.length);
    await page.waitForTimeout(1000);
  }
  return null;
}

async function waitForAnImage(page, before) {
  // Polls page for any new <img> with non-data: src, beyond the count we had
  // before we sent the message.
  const start = Date.now();
  while (Date.now() - start < IMAGE_TIMEOUT_MS) {
    const imgInfo = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')]
        .map(i => ({ src: i.src, complete: i.complete, naturalWidth: i.naturalWidth }))
        .filter(i => i.src && !i.src.startsWith('data:') && i.complete && i.naturalWidth > 50);
      return imgs;
    });
    if (imgInfo.length > before) return imgInfo[imgInfo.length - 1];
    await page.waitForTimeout(1500);
  }
  return null;
}

async function testChatApp(page, target) {
  await page.goto(BASE_URL + target.path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(2500);
  await dismissAgeGate(page);
  await page.waitForTimeout(1500);
  await shot(page, target, '0_loaded');

  const input = await findChatInput(page);
  if (!input) {
    note(target, 'SKIP', 'no chat input found');
    return;
  }
  const sendBtn = await findSendButton(page);

  // Step 1: hello
  const baseline = await page.evaluate(() => document.body.innerText);
  await input.fill('hello');
  if (sendBtn) await sendBtn.click(); else await input.press('Enter');
  log('  sent: hello');
  const reply1 = await waitForNewAssistantText(page, baseline);
  await shot(page, target, '1_hello_response');

  let helloOk = false, voiceScore = 0;
  if (!reply1) {
    note(target, 'FAIL_HELLO', 'no response within timeout');
  } else {
    voiceScore = unityVoiceScore(reply1);
    helloOk = voiceScore > 0;
    log('  hello reply (first 200 chars): ' + reply1.slice(0, 200).replace(/\s+/g, ' '));
    log('  Unity voice score: ' + voiceScore);
  }

  // Step 2: image request
  const imgsBefore = await page.evaluate(() =>
    [...document.querySelectorAll('img')].filter(i => i.src && !i.src.startsWith('data:') && i.complete && i.naturalWidth > 50).length
  );
  const baseline2 = await page.evaluate(() => document.body.innerText);
  await input.fill('show me a picture of an apple');
  if (sendBtn) await sendBtn.click(); else await input.press('Enter');
  log('  sent: show me a picture of an apple');
  const reply2 = await waitForNewAssistantText(page, baseline2);
  const newImg = await waitForAnImage(page, imgsBefore);
  await shot(page, target, '2_apple_response');

  if (newImg) {
    note(target, 'OK', `voice=${voiceScore} | image: ${newImg.src.slice(0, 100)}…`);
  } else if (helloOk) {
    note(target, 'PARTIAL', `voice=${voiceScore} | NO IMAGE within ${IMAGE_TIMEOUT_MS / 1000}s`);
  } else {
    note(target, 'FAIL', `voice=${voiceScore} | no image, weak response`);
  }
}

async function testImageApp(page, target) {
  await page.goto(BASE_URL + target.path, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(3000);
  await dismissAgeGate(page);
  await page.waitForTimeout(1500);
  await shot(page, target, '0_loaded');

  // Turn off auto-prompt if the toggle exists (screensaver has one)
  if (target.autoPromptToggleId) {
    try {
      const btn = page.locator('#' + target.autoPromptToggleId);
      if (await btn.count() > 0) {
        const txt = (await btn.textContent()) || '';
        if (txt.toLowerCase().includes('on')) {
          await btn.click();
          log('  auto-prompt toggled OFF');
          await page.waitForTimeout(800);
        }
      }
    } catch (_) {}
  }

  // Find prompt input
  const promptInput = page.locator('#' + target.promptInputId);
  if (await promptInput.count() === 0) {
    // try generic
    const generic = await page.locator('textarea, input[type="text"]').first();
    if (await generic.count() === 0) {
      note(target, 'SKIP', 'no prompt input found');
      return;
    }
  }

  const imgsBefore = await page.evaluate(() =>
    [...document.querySelectorAll('img')].filter(i => i.src && !i.src.startsWith('data:') && i.complete && i.naturalWidth > 50).length
  );

  // Fill the prompt with an apple
  const target_input = (await promptInput.count() > 0) ? promptInput : page.locator('textarea, input[type="text"]').first();
  await target_input.fill('a fresh red apple, studio lighting');
  await target_input.press('Tab'); // commit value
  log('  prompt: a fresh red apple, studio lighting');

  // Look for a "go"/"start"/"generate" button
  const goCandidates = [
    'button:has-text("Generate")',
    'button:has-text("Start")',
    'button:has-text("Apply")',
    'button:has-text("Go")',
    '#screensaver-restart-prompt',  // for screensaver, manually re-trigger
  ];
  for (const sel of goCandidates) {
    const b = page.locator(sel).first();
    if (await b.count() > 0 && await b.isVisible().catch(() => false)) {
      try { await b.click(); log('  clicked ' + sel); break; } catch (_) {}
    }
  }

  const newImg = await waitForAnImage(page, imgsBefore);
  await shot(page, target, '1_image_loaded');

  if (newImg) {
    note(target, 'OK', `image: ${newImg.src.slice(0, 100)}…`);
  } else {
    note(target, 'FAIL', `no image within ${IMAGE_TIMEOUT_MS / 1000}s`);
  }
}

(async () => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  page.on('pageerror', e => log('  [pageerror] ' + e.message));
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') log('  [console.' + type + '] ' + msg.text().slice(0, 200));
  });

  for (const target of TARGETS) {
    log('=== ' + target.name + ' (' + target.path + ') ===');
    try {
      if (target.type === 'chat') {
        await testChatApp(page, target);
      } else {
        await testImageApp(page, target);
      }
    } catch (e) {
      note(target, 'ERROR', e.message.slice(0, 200));
      await shot(page, target, '_error');
    }
  }

  await browser.close();

  // Final report
  console.log('\n=== FINAL REPORT ===');
  for (const r of report) console.log(`${r.status.padEnd(8)} ${r.target.padEnd(28)} ${r.detail}`);
  fs.writeFileSync(path.join(RESULTS_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log('\nScreenshots: ' + RESULTS_DIR + '/');
})();
