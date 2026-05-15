# 🛠 SETUP-README — DUNGEON MASTER: THE HUNT

> Technical setup, deployment, troubleshooting, and architecture diagrams.

> **Cross-references:** [`README.md`](./README.md) (gameplay wiki — every game system) · [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) (system design) · [`docs/ROADMAP.md`](./docs/ROADMAP.md) (phase plan) · [`docs/SKILL_TREE.md`](./docs/SKILL_TREE.md) (capability matrix) · [`docs/TODO.md`](./docs/TODO.md) (active backlog) · [`docs/FINALIZED.md`](./docs/FINALIZED.md) (completion archive)

---

## What is this

`SETUP-README.md` covers everything **operational** — how to get the game running, how it's wired internally, how to deploy, and how to debug when something breaks. The other half (gameplay loop, archetypes, tools, mechanics, image gallery) lives in [README.md](./README.md).

---

## Prerequisites

| Component | Minimum | Notes |
|---|---|---|
| **Modern browser** | Chrome 110+ / Firefox 110+ / Safari 16+ | WebGL2 + IndexedDB + ES2020 required |
| **Ollama** | 0.1.30+ | Runs the dialogue brain at `localhost:11434` |
| **Uncensored model** | Dolphin Mistral 7B (recommended) | Or any abliterated variant that won't refuse persona content |
| **8GB RAM minimum** | 16GB recommended | Model weights live in RAM while Ollama serves |
| **2GB free disk** | 8GB+ for model | Model weights + Kokoro voice weights + IDB save |
| **Internet (first run only)** | — | For Ollama model pull + Kokoro CDN weights download |

**Optional:**

| Component | Notes |
|---|---|
| **Pollinations `pk_` key** | Unlocks per-girl portrait images + on-demand selfies. Free at <https://pollinations.ai>. The `sk_` secret keys are rejected by the browser — must be `pk_` publishable. |
| **Embedding model** (`nomic-embed-text`) | Enables memory retrieval — not required, last-N chronological memory works without it. |

---

## Install Ollama

### Windows

```powershell
# Download installer from https://ollama.com/download
# After install, open PowerShell as Administrator:
[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
# Restart Ollama
```

### macOS

```bash
brew install ollama
launchctl setenv OLLAMA_ORIGINS "*"
ollama serve
```

### Linux

```bash
curl -fsSL https://ollama.com/install.sh | sh
export OLLAMA_ORIGINS="*"   # add to ~/.bashrc / ~/.zshrc for persistence
ollama serve
```

**Why `OLLAMA_ORIGINS=*`?** The browser-side game makes CORS-protected `fetch` calls to `http://localhost:11434`. Without the wildcard origin Ollama rejects them with a CORS error.

---

## Pull the model

```bash
ollama pull dolphin-mistral
# Or any other uncensored model:
ollama pull dolphin-mixtral
ollama pull dolphin-llama3
```

The setup wizard (`index.html#setup`) detects available models and lets you pull one with a live progress bar inside the browser. No CLI required for normal use.

---

## Install Kokoro voice (in-browser)

Kokoro TTS runs in your browser via ONNX runtime. Model weights (~80MB) download once from a public CDN and cache forever in IndexedDB.

**Nothing to install manually.** Open `index.html#setup`, the Kokoro card auto-loads on first visit. After that it's instant.

If the CDN load fails:
1. Check browser console for the failed URL
2. Confirm your network can reach `https://huggingface.co/onnx-community/Kokoro-82M-ONNX`
3. Open in-game Settings → "Kokoro" → Force reload weights

---

## Get a Pollinations key (optional)

1. Go to <https://pollinations.ai> and sign up
2. Visit <https://enter.pollinations.ai> for your API key
3. **Use the `pk_` publishable key** — the `sk_` secret key will be rejected by the browser
4. Paste the `pk_` key into Settings → Pollinations on the landing page

If no key is provided, image features gracefully degrade — text+emoji gameplay continues to work.

---

## Run the game

### One-click launcher (Windows)

Double-click **`start.bat`** in the repo root. It:

1. Checks for Ollama on PATH, launches it in a new window with `OLLAMA_ORIGINS=*`
2. Finds a local web server (Python / Node / PHP — whichever is installed)
3. Starts serving on `http://localhost:9535`
4. Opens your default browser to the landing page

Close the server window to stop.

### One-click launcher (macOS / Linux)

```bash
./start.sh
```

Same behavior as `start.bat`.

### Manual

```bash
npx http-server . -p 8000
# or: python3 -m http.server 8000
# or any static file server
```

Then open `http://localhost:8000` in your browser.

---

## Deploy to GitHub Pages

```bash
git init
git add .
git commit -m "DUNGEON MASTER: THE HUNT initial"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Enable GitHub Pages: **Settings → Pages → Source: main → Save.** Site goes live at `https://<you>.github.io/<repo>/`.

No build step. No bundler. Plain HTML + JS + CSS.

### What's NOT deployed

- `.env` — local dev only, gitignored
- `js/env.local.js` — local dev Pollinations key injection, gitignored
- `cache/` — user-specific Pollinations image cache
- `save.json` / `server/save*.json` — save data
- `node_modules/` — Playwright (only used for screenshot tooling)

See `.gitignore`.

---

## Save / load / export / import

Everything lives in your browser's IndexedDB:

| Slot | Purpose |
|---|---|
| `main` | Active save — autosaved on every state mutation |
| `slot1` .. `slot5` | Manual save slots, named from in-game Settings |

### Export your save

Settings → Save Slots → **Export current save**. Downloads a `.json` blob.

### Import a save

Settings → Save Slots → **Import** → pick the `.json` blob → confirm overwrite.

### Factory reset

Settings → **Factory reset** → confirm. Wipes:

- All IDB save slots
- Cached Kokoro weights (you'll re-download on next visit)
- Cached Pollinations images
- All localStorage UI preferences (voice toggle, last-used model, etc.)

---

## Module dependency graph

```
                          ┌──────────────────┐
                          │  storage.js      │   ← IDB primitives
                          └──────────────────┘
                                  ▲
                                  │
                          ┌──────────────────┐
                          │  state.js        │   ← reactive store + onChange
                          └──────────────────┘
                                  ▲
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌────────────────┐    ┌────────────────┐         ┌────────────────────┐
│  girl-gen.js   │    │  templates/    │         │  shop.js / hunt.js │
│  (procedural)  │    │  ollama-       │         │  capture.js        │
└────────────────┘    │  templates +   │         │  market.js etc.    │
                      │  john-arche-   │         └────────────────────┘
                      │  types.js      │                  │
                      └────────────────┘                  │
                                  │                       │
                                  ▼                       ▼
                          ┌────────────────────────────────────┐
                          │  ollama.js (streaming)             │
                          │     │                              │
                          │     └─→  delta.js (parser + apply) │
                          │              │                     │
                          │              └─→ pregnancy hook    │
                          └────────────────────────────────────┘
                                          │
                                          ▼
                          ┌──────────────────────────────────┐
                          │  imaging.js (Pollinations)       │
                          │  pregnancy.js (gestation)        │
                          │  action-effects.js (stat spec)   │
                          │  whore-out.js (johns)            │
                          │  drug-scheduler.js (curves)      │
                          │  lifespan.js (aging)             │
                          └──────────────────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │  tick.js (1/30s)     │
                              └──────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │  router.js + ui/*    │   ← 20+ views
                              └──────────────────────┘
```

---

## State-model ER

```
Player
  ├─ wallet { money, notoriety, suspicionByLocation{} }
  ├─ inventory { itemId → qty }
  ├─ dungeons[]
  │    └─ holds[] { holdType, captiveGirlId, upgrades{} }
  ├─ properties[]
  ├─ roster[]
  │    └─ Girl
  │         ├─ visualIdentity { seed, facialDescription, defaultOutfitDescription }
  │         ├─ body { arousal, wetness, cumLoad, bruises, high, stamina, health, activeDrugs[] }
  │         ├─ mood { mood, moodEmoji, history[] }
  │         ├─ stats { intelligence, defiance, curiosity, trust, obedience, stamina,
  │         │         painTolerance, lust }
  │         ├─ bond { bondLevel 0-9, bondXP, bondDebt, milestones[] }
  │         ├─ escape { currentRisk, factors, lastAttempt }
  │         ├─ pregnancy { status, gestationDays, trimester, conceptionSource,
  │         │              johnEncounterId, outcomeHistory[], lastAbortMethod }
  │         ├─ whoreOut { enabled, rate, condomRequired, permittedActs[],
  │         │             blockedJohnTypes[], johnLedger[], sessionTotals,
  │         │             unclaimedEarnings }
  │         ├─ wardrobe[] { id, displayName, description, source, multiplier, nude? }
  │         ├─ consumables { food, water, light }
  │         ├─ captiveAffect ('mute' | 'cusser' | 'fighter' | 'submissive' |
  │         │                'agreeable' | 'bargainer' | 'catatonic')
  │         └─ archetypeTemplate
  ├─ films[]
  ├─ disposals[]
  ├─ propositioners { inbox, active, completed, repeatClients }
  ├─ slaveMarket { listed, available, recentSales }
  ├─ turns { girlId → [{role, text, ts}] }
  └─ settings { mode, activeGirlId, activeDungeonId }
```

---

## Bootstrap flow

```
index.html load
   │
   ├──► env.local.js (optional)
   ├──► config.js / storage.js / templates / catalogs
   ├──► setup/ (detector, models, ollama-repair, kokoro)
   ├──► hero + landing nav rendered
   │
   ├──► (route #home → CTA grid + IDB save detection)
   ├──► (route #setup → Ollama detection → model status → Kokoro load → Pollinations key)
   │
   └──► launch click → location.href = game.html
              │
              ▼
         game.html load
              │
              ├──► state.js .load() → IDB pull → migrate if needed
              │
              ├──► If no save: route #newgame → setup wizard
              │
              ├──► All engine modules + UI views registered
              │
              ├──► router mount + first handle (route from hash)
              ├──► tick.js .start() — 30sec interval
              ├──► Kokoro auto-load (cached after first visit)
              │
              └──► Game live.
```

---

## Tick engine timeline

Every 30 seconds `tick.js#runTick()` fires the following steps in order:

```
runTick():
   1.  bumpTick()
   2.  decayConsumables() — per captive, food/water decay gated by automation tiers
   3.  runEscapeRoll()    — per captive, escape attempt probability
   4.  market.runSaleTick() — films generate passive income per tick
   5.  propositioner.shouldArriveThisTick() → enqueue new offer
   6.  slaveMarket.runBuyerTick() — NPC buyers tick in
   7.  drugs.tickAll()    — pharmacokinetic curves update high + activeDrugs list
   8.  balancing.decayTick() — notoriety slow decay
   9.  achievements.check() — unlock checks
  10.  escapeRecovery.expireTick() — on-the-run timer expiration
  11.  lifespan.tickAll() — aging + neglect evaluation + terminal state transitions
  12.  pregnancy.tickPregnancies() — gestation +7 days per tick, auto-resolve at 280
  13.  actionEffects.tickStaminaHealth() — rest regen or starvation/dehydration drain
  14.  whoreOut.runJohnTick() — per-rate arrival rolls per whored-out captive
```

---

## Imaging pipeline

```
composePrompt(girl, opts)
  │
  ├─► prefix: editorial photograph, 35mm film, full body, age N+, ...
  ├─► [if nude] nudeTokens('full' | 'accessories' | 'stripped')
  ├─► [if pregnant] pregnancyTokens(pregnancy) ← per-trimester markers
  ├─► envTokens(holdIdx) ← per-hold-specific backdrop from dungeon template's holdPrompt
  ├─► [if clothed] faceBlock + outfit description
  ├─► [if nude] faceBlock
  ├─► poseLibrary[situation] ← profile / selfie-* / capture-memorial / etc.
  ├─► drugStateTokens(body) ← per-drug visible markers (coke / weed / mdma / acid /
  │                          whiskey / ketamine / tranquilizer)
  ├─► bodyStateTokens(body) ← arousal / wetness / cumLoad / bruises
  ├─► additionalTokens
  └─► suffix: shallow DOF, cinematic, no watermark
        │
        ▼
   enforceFullBody() / sanitizePrompt()
        │
        ▼
   clampSeed(seed, girl.id) ← deterministic seed fallback via djb2 hash
        │
        ▼
   buildUrl() ← Pollinations endpoint composition
        │
        ▼
   queuedFetch() ← single-slot serializer + 429 backoff
        │
        ▼
   IDB cache.put(prompt-hash → blob)
        │
        ▼
   return { url, cached, directUrl }
```

**Why slot 2.5 for pregnancy?** Image models attenuate tokens at the tail; pregnancy bump is a high-priority visual that must NOT be buried. Same logic for nudity (position 2) and per-hold environment (position 3).

---

## Voice pipeline

```
Mic input
  │
  ├─► MediaRecorder API (browser)
  │     │
  │     ▼
  │  Pollinations transcribe endpoint
  │     │
  │     ▼
  │  user-in textarea autofilled → Send
  │
Ollama streaming response
  │
  ├─► streamed chunks → log
  │     │
  │     ▼
  │  on stream-end:
  │     │
  │     ├─► extractDelta() → applyDelta()
  │     │
  │     └─► clean text → strip asterisk actions
  │              │
  │              ▼
  │       DMTHVoiceQueue.enqueue(text, voiceId, speed)
  │              │
  │              ├─► splitSentences() on `. ! ? …`
  │              │
  │              └─► sequential play with pipelined-generation:
  │                  while sentence N plays, sentence N+1 generates
  │                  Kokoro speaks via in-browser ONNX inference
```

---

## Ollama prompt-assembly stack

`buildSystemPrompt()` composes the system prompt for each Ollama turn as a 4-overlay stack:

```
┌────────────────────────────────────────────────────────────────┐
│ 1.  BASE_SLUT — global slut scaffolding                       │
│     • Speech-first rule (spoken line ≥ 8 words, *action* trails)│
│     • Sexualized body-part references tier-shaped by Stockholm │
│     • Chemical state effects per active drug                  │
│     • DELTA BLOCK schema + TAGS — IMPORTANT SEXUAL-ACT MARKERS │
│       (vaginal-cum tags drive pregnancy conception roll)       │
└────────────────────────────────────────────────────────────────┘
                                ▲
                                │
┌────────────────────────────────────────────────────────────────┐
│ 2.  ARCHETYPE overlay — pre-capture identity                  │
│     unity / library / club / street / sorority / gym / barista│
│     / office / waitress / model / nurse                       │
│     • Speech patterns, kinks, drug preferences, outfit prefs  │
└────────────────────────────────────────────────────────────────┘
                                ▲
                                │
┌────────────────────────────────────────────────────────────────┐
│ 3.  CAPTIVE_AFFECT overlay — response to captivity            │
│     mute / cusser / fighter / submissive / agreeable /        │
│     bargainer / catatonic                                     │
│     • HOW she resists / submits / negotiates                  │
│     • Orthogonal to archetype — they compose                  │
└────────────────────────────────────────────────────────────────┘
                                ▲
                                │
┌────────────────────────────────────────────────────────────────┐
│ 4.  MODE overlay                                              │
│     sexy / hurtme / sexy_with_damage                          │
└────────────────────────────────────────────────────────────────┘
                                ▲
                                │
┌────────────────────────────────────────────────────────────────┐
│ 5.  SCENE prompt — per-situation scaffolding                  │
│     room_regular / first_encounter / capture_attempt /        │
│     bond_milestone / disposal / propositioner / etc.          │
└────────────────────────────────────────────────────────────────┘

+ Per-turn CONTEXT block:
  • Body state (arousal / wetness / cum / bruises / high / stamina / health)
  • Stockholm rating L0..L9
  • Active drugs
  • Pregnancy status + gestation day
  • Recent johns (last 5 — she may reference them)
  • Last 5 turns
  • Memory (last-N chronological or embedding-based retrieval)
```

---

## Local development

```bash
# Serve the static files (any local server works)
npx http-server . -p 8000
# or
python3 -m http.server 8000
```

For dev-time auto-injection of a Pollinations token (so you don't have to paste it into Settings every time you wipe storage):

1. Copy `.env.example` → `.env` at the project root (gitignored)
2. Paste your `sk_` or `pk_` key into `POLLINATIONS_API_KEY=`
3. Launch via `start.bat` (Windows) or `start.sh` (Mac/Linux) — the launcher runs the env sync as Step 0 and regenerates `js/env.local.js` from `.env`. The browser's `window.__DEV_ENV` reflects the latest values on every launch.

Both `.env` and `js/env.local.js` are gitignored. `.env` is the single source of truth — never edit `js/env.local.js` by hand; the launcher will overwrite it.

If you launch the static server manually (without `start.bat` / `start.sh`), run the sync first:

```powershell
# Windows
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/sync-env.ps1
```

```bash
# Mac/Linux — extract the sync_env function from start.sh, or just call start.sh once
bash start.sh
```

### Regenerating README screenshots

```bash
npm install playwright
npx playwright install chromium
node scripts/screenshots.mjs
```

The script walks the entire game, sends a real Ollama turn, requests a real Pollinations selfie, and waits for each to actually complete before screenshotting. Non-headless so you can watch it play.

---

## Troubleshooting

### "Ollama HTTP 400 — model does not support chat"

Your model's blob files got deleted (Windows Storage Sense / Defender / CCleaner are common culprits). The manifest is still on disk so detection reports green, but the actual weights are gone.

**Fix:** In-game → catch the error → click 🔧 Repair → hard-repair path deletes the stale manifest then re-pulls fresh. No CLI needed.

If the in-game repair fails:

```bash
ollama rm dolphin-mistral
ollama pull dolphin-mistral
```

### "Pollinations 403"

You're using an `sk_` secret key in the browser. Pollinations rejects `sk_` from browser origins. Generate a `pk_` publishable key at <https://enter.pollinations.ai> and paste that instead.

If you have no key the game silently falls back to the legacy free endpoint — rate-limited but functional.

### "Kokoro autoplay blocked"

Browsers block audio playback until the page receives at least one user gesture. Click anywhere on the page once, then voice will play normally.

### "Game won't load — empty screen"

1. Open DevTools console
2. Look for the first red error
3. Common: cached `js/env.local.js` from old version — `localStorage.clear()` + hard refresh
4. Common: stale IDB save migration failure — Settings → Factory reset

### "CORS error on Ollama fetch"

`OLLAMA_ORIGINS=*` isn't set. See [Install Ollama](#install-ollama) above.

### "No images appearing"

1. Check Settings → Pollinations key — should start with `pk_`
2. Check rate limits — Pollinations free tier is ~1 image/hour/IP. Authed `pk_` keys have higher limits.
3. Game also writes detailed logs to console — open DevTools.

### "Save got corrupted"

```js
// In DevTools console:
indexedDB.deleteDatabase('dungeon_master_the_hunt')
location.reload()
```

This wipes the save entirely — only do it if there's no other recovery path. Export your save first if possible.

---

## CI / hooks

The repo's `.gitignore` excludes local-dev tooling folders, `.env`, `js/env.local.js`, `cache/`, `node_modules/`, `save.json`, screenshots cache, and the Pollinations user state. The shipping branch contains only the static-client code.

No CI configured (this is a static-client browser game with no build step). All verification is manual: open the page, play the loop, watch the dev console.

---

## Where to go next

- **Gameplay wiki + every system** — [README.md](./README.md)
- **Architecture deep-dive** — `docs/ARCHITECTURE.md`
- **Active backlog** — `docs/TODO.md`
- **Phase plan** — `docs/ROADMAP.md`
- **Capability matrix** — `docs/SKILL_TREE.md`

---

*Local-first. Your machine, your rules. No telemetry. No accounts. No cloud.*
