# SEX SLAVE DUNGEON

> *persistent city-builder — dungeon harem evil taboo — hunt your prey with the purchased tools and items.*

A massive multi-page text+emoji adult game. Runs entirely on your machine — no servers, no accounts, no telemetry.

- **Ollama** (local LLM) drives every girl's persona — real inference, no canned strings.
- **Kokoro TTS** runs in your browser for sentence-queued voice.
- **Pollinations** (optional, bring-your-own-key) generates per-girl portraits + on-demand selfies.
- **IndexedDB** stores your save in your browser.

Static site. Deploys to GitHub Pages unchanged. Zero build step required.

---

## In-game footage

### Unity replying via real Ollama inference, with her Pollinations portrait

![Unity room with Ollama reply](docs/screenshots/11-room-ollama-reply.png)

Streamed response from the local dolphin-mistral model, delta-parsed into body-state changes (arousal +12 / wetness +8 / cum +0.2 / bruises +1), Unity's persistent visual identity rendered via Pollinations on the left.

### Body state, stats, drug HUD, quick-action panel

![Room mid-session](docs/screenshots/12-room-pollinations-selfie.png)

Six body bars (arousal / wetness / cum-load / bruises / high), eight stats (intelligence / defiance / curiosity / trust / obedience / stamina / pain-tolerance / lust), one-handed mouse drug buttons (coke / weed / molly / acid / whiskey / K), action row (record / selfie / heal / mode-switch / dispose / list-on-market / timeline).

### Player dashboard
![Dashboard](docs/screenshots/03-dashboard.png)

### Captive roster
![Roster](docs/screenshots/04-roster.png)

### Dungeon portfolio (9 hideout templates with capacity-upgrade chains)
![Dungeon](docs/screenshots/05-dungeon.png)

### Town plot-grid (purchasable locations + cover income)
![Town](docs/screenshots/06-town.png)

### Hunt locations
![Hunt](docs/screenshots/07-hunt.png)

### Item shop (41 items: sedation, restraints, containment, toys, dungeon upgrades, consumables)
![Shop](docs/screenshots/08-shop.png)

### Film market (recorded interactions auto-priced + listed)
![Film market](docs/screenshots/09-market.png)

### In-game settings (Ollama health check + repair, voice picker, save slots)
![Settings](docs/screenshots/13-settings.png)

### Setup wizard (landing page, auto-installs everything)
![Landing setup wizard](docs/screenshots/01-landing-setup.png)

---

## Local test run (no hosting required)

Double-click **`start.bat`** on Windows (or run `./start.sh` on Mac/Linux). It:

1. Checks for Ollama on your PATH, launches it in a new window with `OLLAMA_ORIGINS=*`
2. Finds a local web server (Python / Node / PHP — whichever is installed)
3. Starts serving on `http://localhost:8080`
4. Opens your browser to the landing page

Close the server window to stop.

---

## First-time visitor setup

Open the landing page (`index.html`). It walks you through:

1. **Install Ollama** — one command per OS. The site detects when Ollama comes online.
2. **Pull a model** — pick from the preset uncensored / abliterated catalog (Dolphin Mistral 7B recommended). Progress shown live.
3. **Load Kokoro** — ~80MB model weights downloaded once to your browser, then cached forever.
4. **(Optional) Pollinations key** — paste your free API key from <https://pollinations.ai> for images.

Once the four status pills are green, LAUNCH.

### CORS note

Ollama needs to allow this site's origin. Set the env var before starting Ollama:

- **Windows (PowerShell):**  `[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS","*","User")`
- **Mac:** `launchctl setenv OLLAMA_ORIGINS "*"`
- **Linux:** `export OLLAMA_ORIGINS=*` (or add to your Ollama systemd override)

Then `ollama serve` (or launch the Ollama app). The setup wizard explains this per your OS.

---

## Deployment (GitHub Pages)

```bash
git init
git add .
git commit -m "SEX SLAVE DUNGEON initial"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Enable GitHub Pages: **Settings → Pages → Source: main → Save.** Site goes live at `https://<you>.github.io/<repo>/`.

No build step. No bundler. Plain HTML + JS + CSS.

### What's NOT deployed

- `.env` — local dev only, gitignored
- `js/env.local.js` — local dev only, gitignored
- `cache/` — user-specific Pollinations image cache
- `save.json` / `server/save*.json` — save data
- `node_modules/` — playwright (only used for screenshot tooling)

See `.gitignore`.

---

## What's under the hood

### Core systems shipped

- **Real Ollama inference per girl** — base slut scaffolding + 11 archetype overlays (unity / library / club / street / sorority / gym / barista / office / waitress / nurse / model) + 3 mode overlays (sexy / hurtme / sexy-with-damage) + 13 scene prompts (first encounter, capture attempt, room arrival, room regular, recording, bond milestone, escape caught, 4-beat capture transition, disposal scenes, propositioner scenes, escape recovery).
- **Structured delta parsing** — every model response ends with a `<delta>{...}</delta>` JSON block that updates body / mood / bond / stats / tags. Tolerant parser handles `L`-suffix, single quotes, unquoted keys, missing closing braces.
- **Sentence-aware Kokoro TTS playback queue** — splits responses on `. ! ? …`, generates each clip via in-browser Kokoro, plays sequentially with the next sentence pipelined-generating behind it. Cancels cleanly on new turn / voice-off toggle.
- **Self-healing Ollama corruption flow** — detects when Windows Storage Sense / cleanup tools wipe the multi-GB model blob (leaving manifest behind). On detection, opens an in-game repair overlay that DELETES the stale manifest entry first then re-pulls fresh — no PowerShell needed.
- **Persistent visual identity per girl** — Pollinations seed + locked facial description + locked outfit description per generated girl. Every subsequent image of her (profile, hunt thumbnail, room scene, selfie, milestone memorial) reuses those locked blocks so her face and baseline outfit stay consistent across every render.
- **Drug scheduler with pharmacokinetic curves** — 7 substances (coke / weed / mdma / acid / whiskey / ketamine / alcohol) with onset / peak / wear-off curves driving `body.high` over real time.
- **9 predator hideout templates** — hole-in-the-desert, woods-container, basement-hidden-room, subway-service-room, sewer-tunnel-locked, coldwar-bunker, abandoned-mine-shaft, remote-compound, underground-complex. Each with isolation / concealment / hold-type / capacity-upgrade-chain.
- **Episode recording + content market** — every interaction is recordable as a film, priced by bond level × content intensity × girl rarity × dungeon aesthetic × uniqueness × wardrobe multiplier, listed in a procedural-buyer market that auto-sells per tick.
- **Propositioner business sim** — NPC clients arrive with archetype quirks + budget + duration + acts wanted. Player picks which girl, negotiates price, accepts. Engagement resolves with body/mood/bond/money/notoriety deltas and Ollama-narrated scene from the girl's POV.
- **Slave market** — buy + sell girls. Price formula scales on bond, stats, wardrobe, rarity. NPC listings refreshed per tick.
- **Disposal mechanics** — bury / incinerate / release / trade / finalization-film. Each with notoriety / suspicion / income consequences and an Ollama-narrated final scene.
- **40+ preset click actions** — bond-tiered quick-action banks (low-bond / mid-bond / high-bond / hurtme / drugs / commands) so the entire game is one-handed mouse control.

### Stack

| Layer | Tech | Where it runs |
|---|---|---|
| Frontend | Vanilla HTML + JS + CSS | GitHub Pages (or any static host) |
| LLM | Ollama with Dolphin Mistral 7B (or alternative uncensored model) | Visitor's local machine, `localhost:11434` |
| TTS | Kokoro-js v1.2 (ONNX) | In-browser, model weights cached in IndexedDB |
| Image gen | Pollinations.ai | Direct browser fetch with visitor's `pk_` key |
| State | IndexedDB | Visitor's browser |
| Memory | Optional `nomic-embed-text` via Ollama | Visitor's local machine |

---

## Local development

```bash
# serve the static files (any local server works)
npx http-server . -p 8000
# or: python3 -m http.server 8000
```

For dev-time auto-injection of a Pollinations token (so you don't have to paste it into Settings every time you wipe storage), copy `js/env.example.js` to `js/env.local.js` and fill in your token. `env.local.js` is gitignored.

### Regenerating the README screenshots

```bash
npm install playwright
npx playwright install chromium
node scripts/screenshots.mjs
```

The script walks the entire game, sends a real Ollama turn, requests a real Pollinations selfie, and waits for each to actually complete before screenshotting. Non-headless so you can watch it play.

---

## Privacy & Data

Nothing leaves your machine except:
- **Ollama calls** → your own local Ollama instance at `localhost:11434`. 100% local.
- **Pollinations calls (optional)** → `pollinations.ai` with *your* API key. Only if you opt in.
- **Kokoro model download** → from a public CDN on first visit. Cached forever after.

The static site itself (served from GitHub Pages) loads once. All game state, saves, and generated content live in your browser (IndexedDB) and on your disk (if you export saves).

---

## Architecture

See `docs/ARCHITECTURE.md` for the full system design.

See `docs/TODO.md` for active work + `docs/ROADMAP.md` for the 20-phase build plan + `docs/SKILL_TREE.md` for the capability matrix.

---

## License / Disclaimer

Adult fiction. All characters in the game are adult (18+) — hard-locked at generator level, every archetype's `ageRange` lower-bound is 19+. Content is taboo and extreme by design. If that's not for you, close the tab.

This is a personal project. Not for commercial use or redistribution without permission.
