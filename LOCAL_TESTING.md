# LOCAL_TESTING.md — Run the Site Locally on Your PC

> **Project:** Unity AI Lab — `Unity-Lab-AI/Unity-Lab-AI.github.io`
> **Local checkout:** `C:\Users\gfour\Desktop\Website`
> **Project version:** v2.1.5 (per `package.json`)
> **Stack:** Vite multi-page app (MPA) → static HTML/CSS/JS, deployed to GitHub Pages

This doc covers every way to run the site on your machine, what each method is good for, and what to test once it's running.

---

## TL;DR — Fastest Path to "Site Running on Localhost"

```cmd
cd C:\Users\gfour\Desktop\Website
npm install
npm run dev
```

That's it. Vite dev server starts at `http://localhost:3000` and auto-opens your browser.

If `npm install` errors, check Node version (Vite 7 needs Node 20+).

---

## Three Ways to Serve the Site (Pick the One That Matches the Test)

### A. Vite Dev Server — `npm run dev` — **Use for active development**

```cmd
cd C:\Users\gfour\Desktop\Website
npm install            # first time only
npm run dev
```

- **URL:** `http://localhost:3000`
- **Auto-opens browser:** yes (per `vite.config.js` server.open: true)
- **Hot Module Reload:** yes — edit a file, save, see the change instantly
- **API proxy:** `/api/visitors` proxied to `https://users.unityailab.com` (so visitor-tracking works from localhost)
- **Routing:** custom middleware in `vite.config.js` rewrites `/about` → `/about/index.html`, etc. — directory URLs work like they do in production
- **CORS:** enabled
- **Best for:** writing code, testing changes live, debugging with browser devtools

### B. Production Build Preview — `npm run build` + `npm run preview` — **Use to validate the actual deploy artifact**

```cmd
cd C:\Users\gfour\Desktop\Website
npm install            # first time only
npm run build          # generates sitemap, runs vite build, copies assets, busts caches
npm run preview        # serves the dist/ folder
```

- **URL:** `http://localhost:4173`
- **Auto-opens browser:** yes (per `vite.config.js` preview.open: true)
- **What it serves:** the `dist/` folder — the actual build artifact that ships to GitHub Pages
- **Hot reload:** NO (this is the production build, not dev)
- **Cache-busted:** yes (every asset has a content-hash in its filename, e.g. `vendor-[hash].js`)
- **Best for:** verifying the production build works, catching bugs that only happen post-bundling, testing service-worker / cache behavior, performance audits

The `npm run build` chain (per `package.json`):
1. `node generate-sitemap.js` — regenerates `sitemap.xml`, `sitemap-index.xml`, `sitemap-images.xml`
2. `vite build` — bundles everything to `dist/` per `vite.config.js`
3. `node copy-assets.js` — copies static assets the bundler missed (apps/, fonts/, etc.)
4. `node cache-bust.js` — rewrites HTML to point at hashed asset filenames

### C. Python CORS Server — `python server.py` — **Use when you don't have Node**

```cmd
cd C:\Users\gfour\Desktop\Website
python server.py
```

- **URL:** `http://localhost:3000`
- **What it serves:** the repo root as static files (no build step, just raw source)
- **CORS headers:** `Access-Control-Allow-Origin: *` so cross-origin Pollinations images load
- **HMR:** no
- **API proxy:** no (so `/api/visitors` calls will hit the wrong place — visitor tracking will fail unless you don't care)
- **Best for:** quick "does the HTML render at all" check without installing Node, or testing on a machine that only has Python
- **Limitation:** runs the source files, not a built artifact — JS modules might behave differently than they do in the deployed bundle

### D. Plain Python http.server (also works, no CORS)

```cmd
cd C:\Users\gfour\Desktop\Website
python -m http.server 8000
```

- **URL:** `http://localhost:8000`
- **No CORS headers** — cross-origin image loading from Pollinations may fail in some browsers
- **Use only as a last resort** — `server.py` (option C) is strictly better

### E. Node `serve` (mentioned in README) — also works

```cmd
cd C:\Users\gfour\Desktop\Website
npx serve .
```

Spins up a static server. Useful if you want a Node-based static server without the Vite dev-server features.

---

## Recommended Workflow Per Task Type

| What you're doing | Use | Why |
|---|---|---|
| Editing JS / CSS / HTML and want to see changes live | `npm run dev` (option A) | HMR + API proxy + directory routing |
| Validating that the production build still works | `npm run build && npm run preview` (option B) | Tests the actual deploy artifact |
| Quick render check, no Node available | `python server.py` (option C) | One command, CORS handled |
| Testing the AI demo with real Pollinations API | `npm run dev` OR `python server.py` | Both have CORS, both work for the demo |
| Performance audit / Lighthouse | `npm run build && npm run preview` (option B) | Lighthouse must run against the production bundle |

---

## What to Test (Pages + Sections)

Once the server is running, hit these URLs in order — they cover every major surface:

### Static pages (should all render with the gothic theme + AOS animations)

| URL | What it is | What to check |
|---|---|---|
| `/` | Landing page | Hero, animations on scroll, nav works |
| `/about/` | About page | Team info renders, contact section loads |
| `/contact/` | Contact page | Form validation, no JS errors in console |
| `/services/` | Services page | Service cards render |
| `/projects/` | Projects page | Project showcase grid |
| `/downloads/` | Downloads page | Download links work |
| `/downloads/moana/` | Moana miner page | Specific download artifact |

### AI surface (the main feature)

| URL | What it is | What to check |
|---|---|---|
| `/ai/` | AI landing page | Description, link to demo |
| `/ai/demo/` | Interactive AI demo | Age-verification gate fires, persona loads, chat works, image gen works, TTS works |

The demo at `/ai/demo/` is the centerpiece. Test sequence:

1. **Age verification** — should prompt on first visit, persist via localStorage
2. **Model picker** — switch between text models (GPT-5, DeepSeek, Mistral, etc.)
3. **Text chat** — send "hi", get a response
4. **Image generation** — request an image, watch it render inline
5. **TTS** — pick a voice, generate speech, hear it play
6. **Unity persona** — confirm responses are in the persona voice (per `ai/demo/unity-persona.js` + `ai/demo/unity-system-prompt-v1.js`)

### Apps gallery

| URL | What it is |
|---|---|
| `/apps/` | Mini-apps gallery |
| `/apps/helperInterfaceDemo/` | Split-panel AI assistant demo |
| `/apps/personaDemo/` | Persona-switcher demo |
| `/apps/screensaverDemo/` | AI-generated screensaver |
| `/apps/slideshowDemo/` | Interactive slideshow |
| `/apps/talkingWithUnity/` | Voice-chat demo |
| `/apps/textDemo/` | Text generation showcase |
| `/apps/unityDemo/` | Main Unity demo |
| `/apps/oldSiteProject/` | Legacy site reference |

### Test pages (left over in repo root)

| URL | What it is |
|---|---|
| `/test-image.html` | Image-loading test (the working pattern that fixed the demo bug per TODO P0) |
| `/test-module-image.html` | Module-based image-loading test |

---

## Pollinations API Key Setup

The site uses Pollinations.AI for all AI calls. Default behavior uses a publishable key (`pk_*`) hardcoded in the libraries — that works out of the box but has rate limits (3 req/burst, 1/15s refill, IP-rate-limited).

For unrestricted local testing:

1. Get a key at `https://enter.pollinations.ai`
2. Use a **publishable** key (`pk_*`) for client-side testing — safe to expose in browser
3. Use a **secret** key (`sk_*`) ONLY for server-side calls — never paste into client-side JS
4. The libraries (`PolliLibJS/`, `PolliLibPy/`) accept the key as a constructor argument or via env var

Watermarks: free-tier images may have watermarks starting March 31, 2025 (per README).

---

## Library Testing (PolliLibJS + PolliLibPy)

Both libraries are in the repo and can be tested independently of the website.

### JavaScript library

```cmd
cd C:\Users\gfour\Desktop\Website\PolliLibJS
npm install
node pollylib.js          # connection test
```

See `PolliLibJS/README.md` for full API.

### Python library

```cmd
cd C:\Users\gfour\Desktop\Website\PolliLibPy
pip install requests
python pollylib.py        # connection test
```

See `PolliLibPy/README.md` for full API.

---

## Common Issues + Fixes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `npm install` fails with EBADENGINE | Node too old | Upgrade to Node 20+ (Vite 7 requirement) |
| Port 3000 already in use | Another server running | Kill it (`netstat -ano \| findstr :3000` then `taskkill /PID <pid> /F`) or change port in `vite.config.js` |
| Images don't load on demo page | CORS or COEP header issue | Use `npm run dev` or `python server.py` (both handle CORS); avoid `python -m http.server` |
| Visitor-tracking errors in console on localhost | API proxy not active | Use `npm run dev` (has the proxy) instead of `python server.py` |
| Age-verification keeps re-prompting | localStorage cleared | Normal on incognito / cleared-storage; complete it once |
| Build hangs or fails | Stale `dist/` or `node_modules/` | `rmdir /s dist node_modules && npm install && npm run build` |
| `npm run preview` shows blank page | Build didn't complete | Check `npm run build` output for errors; ensure `dist/` has files |

---

## Build Artifact Layout (after `npm run build`)

```
dist/
├── index.html                # main landing
├── about/index.html          # about page
├── ai/index.html             # AI landing
├── ai/demo/index.html        # AI demo (the big one)
├── apps/index.html           # apps gallery
├── contact/index.html
├── projects/index.html
├── services/index.html
└── assets/
    ├── vendor-[hash].js      # third-party deps chunk
    ├── main-shared-[hash].js # /js/ shared modules chunk
    ├── demo-[hash].js        # ai/demo/js/ chunk (kept separate)
    ├── [name]-[hash].js      # entry-point chunks
    ├── [name]-[hash].css
    └── [name]-[hash].[ext]   # other static assets
```

Multi-page entry points are defined in `vite.config.js` `rollupOptions.input` — adding a new top-level page means adding it there too.

---

## Deploy Pipeline Reference (FYI — you don't run this locally)

The repo deploys via GitHub Actions on push:
- **`main` branch** → root: `https://unity-lab-ai.github.io/`
- **`develop` branch** → `/development/` subdir: `https://unity-lab-ai.github.io/development/`

Both deploy independently with separate concurrency groups. **DO NOT push to main without explicit instruction + triple confirmation** (per the user's standing LAW for this repo).

---

## What's NOT in this Repo (Things You Might Look For)

- No backend server-side code — this is a pure static site
- No database — all state is client-side (localStorage) or via the Pollinations API
- No `.env` file checked in — API keys come from Pollinations directly per session
- No automated test suite — per the project's `.claude/` workflow LAWs (see `.claude/CONSTRAINTS.md §NO TESTS POLICY`), validation is manual

---

## Quick Reference Card

```
SETUP ONCE:
  cd C:\Users\gfour\Desktop\Website
  npm install

DEV (changes auto-reload):
  npm run dev               → http://localhost:3000

PRODUCTION BUILD PREVIEW (validates the deploy artifact):
  npm run build
  npm run preview           → http://localhost:4173

NO-NODE FALLBACK:
  python server.py          → http://localhost:3000 (CORS-enabled)

LIBRARY CONNECTION TESTS:
  cd PolliLibJS && node pollylib.js
  cd PolliLibPy && python pollylib.py

KEY URLS TO TEST:
  /                         → landing
  /ai/demo/                 → main AI demo (the big one)
  /apps/                    → mini-apps gallery
  /test-image.html          → image-loading reference (works as canary)
```

---

*LOCAL_TESTING.md — generated 2026-04-25 by /workflow scan. Update when serving methods, test URLs, or the build pipeline change.*
