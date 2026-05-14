// scripts/scrape-policies.mjs -- one-off scraper for unityailab.com /terms + /privacy.
//
// The site is a JS-rendered SPA so plain HTTP fetch returns an empty shell.
// This opens a real Chromium via Playwright, waits for content to render,
// extracts the main article body, and dumps both raw HTML and plain-text
// versions into docs/policies/.
//
// Usage:
//   node scripts/scrape-policies.mjs
//
// Requires playwright (same dep as screenshots.mjs):
//   npm install playwright
//   npx playwright install chromium

import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PROJECT_DIR = resolve(import.meta.dirname, '..');
const OUT_DIR = join(PROJECT_DIR, 'docs', 'policies');

mkdirSync(OUT_DIR, { recursive: true });

const PAGES = [
  { slug: 'terms', url: 'https://www.unityailab.com/terms' },
  { slug: 'privacy', url: 'https://www.unityailab.com/privacy' }
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
const page = await ctx.newPage();

for (const { slug, url } of PAGES) {
  console.log(`[scrape] ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait an extra beat for late hydration.
  await page.waitForTimeout(2000);

  // Try to find the main content. Site uses Next.js or similar -- look for <main>, <article>,
  // or fall back to <body>.
  const result = await page.evaluate(() => {
    const candidates = ['main', 'article', '[role="main"]', '.policy-content', '.content', 'body'];
    let el = null;
    for (const sel of candidates) {
      el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 200) break;
    }
    if (!el) el = document.body;
    return {
      title: document.title,
      url: location.href,
      html: el.innerHTML,
      text: el.innerText,
      bodyText: document.body ? document.body.innerText : ''
    };
  });

  const sourceHtml = `<!-- Scraped from ${result.url} on ${new Date().toISOString()} -->\n` +
    `<!-- Page title: ${result.title} -->\n\n` +
    result.html;

  const sourceText = `URL: ${result.url}\nTitle: ${result.title}\nScraped: ${new Date().toISOString()}\n\n` +
    '='.repeat(70) + '\n\n' + result.text;

  writeFileSync(join(OUT_DIR, `${slug}-source.html`), sourceHtml, 'utf8');
  writeFileSync(join(OUT_DIR, `${slug}-source.txt`), sourceText, 'utf8');
  console.log(`[scrape] -> docs/policies/${slug}-source.{html,txt}  (text length: ${result.text.length})`);
}

await browser.close();
console.log('[scrape] done.');
