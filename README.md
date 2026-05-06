# Unity AI Lab

> **Live:** [unityailab.com](https://www.unityailab.com)
> Goth-themed AI playground with an interactive demo, a Cloudflare-Worker-proxied Pollinations API client, and a small constellation of mini-apps that all share one persona — **Unity**.

[![GitHub](https://img.shields.io/badge/repo-Unity--Lab--AI-black?logo=github)](https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io)
[![Site](https://img.shields.io/badge/site-unityailab.com-crimson)](https://www.unityailab.com)
![Status](https://img.shields.io/badge/status-shipping-green)

---

## What this is

A static site (GitHub Pages) + a Cloudflare Worker, fronting [Pollinations.AI](https://pollinations.ai) for text generation, image generation, and TTS — wrapped in a hand-rolled gothic UI and centered on **Unity**, our AI persona. The site hosts:

- An **interactive AI demo** (`ai/demo/`) with chat, image generation, voice playback, and Unity's full canonical persona — ~8,000 lines of vanilla JS, no framework
- **Mini-apps** under `apps/` (text-only chat, persona builder, screensaver, slideshow, helper interface, talking-with-Unity, unity demo, slideshow demo)
- **PolliLibJS** + **PolliLibPy** — feature-complete client libraries for Pollinations.AI in JavaScript and Python (full parity)
- A **Cloudflare Worker proxy** that holds the `sk_*` Pollinations token server-side so no token ever ships to the browser
- The redesign chrome (`redesign/`) — JSX components rendered via in-browser Babel, custom gothic CSS, all 7 top-level pages

---

## Quick start

```bash
# Clone
git clone https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io.git
cd Unity-Lab-AI.github.io

# Install
npm install

# Run dev server (Vite, http://localhost:3000)
npm run dev

# Build production assets
npm run build      # generate-sitemap → vite build → copy-assets → cache-bust
```

Hit `http://localhost:3000/ai/demo/` to talk to Unity. Hit `/` for the landing page.

---

## How it's wired

```
                     ┌─────────────────────────────────────────┐
                     │  unityailab.com (GitHub Pages)          │
                     │  ─ static HTML + JSX/Babel runtime      │
                     │  ─ ai/demo/ (Unity chat, ~8k lines)     │
                     │  ─ apps/ (8 mini-apps)                  │
                     │  ─ redesign/ (gothic UI components)     │
                     └────────────────────┬────────────────────┘
                                          │ POST /v1/chat/completions
                                          │ GET  /image/{prompt}
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │  Cloudflare Worker (proxy + auth)       │
                     │  websiteunityailab.gfourteen7525        │
                     │     .workers.dev                        │
                     │  ─ holds sk_* Pollinations token        │
                     │  ─ CORS allowlist for *.unityailab.com  │
                     │  ─ injects Authorization: Bearer        │
                     │  ─ translates legacy paths              │
                     └────────────────────┬────────────────────┘
                                          │ Authorization: Bearer sk_...
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │  gen.pollinations.ai                    │
                     │  ─ Mistral (Azure-hosted) for chat      │
                     │  ─ Flux + GPT-Image for /image          │
                     │  ─ openai-audio for TTS                 │
                     └─────────────────────────────────────────┘
```

The browser never sees a token. The Worker is the gateway.

For the full route table, CORS allowlist, content-filter behavior, image-prompt jailbreak system, TTS fallback chain, and troubleshooting playbook → [**`Docs/AUTH_AND_API_ARCHITECTURE.md`**](./Docs/AUTH_AND_API_ARCHITECTURE.md).

---

## What's special about the demo

The `ai/demo/` chat is more than just a Pollinations passthrough. It implements:

- **Unity's full canonical persona** loaded from `ai/demo/unity-system-prompt-v2.txt` — read at runtime, never hardcoded
- **Image-intent detection + self-reference fast path** — when you ask Unity for an image of HERSELF (`"show me your tits"`, `"give me a selfie"`, `"draw yourself naked"`), the system bypasses Mistral's tool-call decision and goes straight to a canonical-extracted appearance + the user's scene → narrative-form image prompt → direct image endpoint
- **Narrative-form image prompts** — `"A 25-year-old goth-emo woman with dark hair with pink streaks, [scene/action], full body in frame from a wide angle, ..."` — image generators (flux/SD-style) render scenes far more accurately with narrative descriptions than comma-keyword soup
- **TTS layered fallback** — verbatim with clinical-linguistic framing → euphemize on Azure 400 → silent skip if both fail. Drug talk + heavy profanity plays Unity's exact words; heavy explicit stacks gracefully skip rather than synthesize a fake "I'm sorry" voice
- **Multi-attempt commentary chain** — when generating image captions, the system tries 5 framings × random seeds × varying temperatures, all using the canonical Unity prompt so every word is real Unity, not a hardcoded template
- **Zero hardcoded fallback strings** — `"There you go babe."` / `"Here's what you asked for~"` / `"No response received"` — all DELETED. If Mistral can't produce content, the user sees an empty bubble instead of fake Unity

The full deep-dive on every layer of this is in [`Docs/AUTH_AND_API_ARCHITECTURE.md`](./Docs/AUTH_AND_API_ARCHITECTURE.md) §"Image-prompt jailbreak system" and §"TTS layered fallback".

---

## Repo layout

```
.
├── README.md                  ← this file (mirrored at Docs/README.md)
├── Docs/                      ← all support documentation
│   ├── ARCHITECTURE.md        ← system architecture (the big picture)
│   ├── AUTH_AND_API_ARCHITECTURE.md   ← canonical technical doc
│   ├── README-BASIC.md        ← entry-level dev orientation
│   ├── README-NERD.md         ← deep technical dive
│   ├── USER-README.md         ← user-facing guide
│   ├── ROADMAP.md             ← what's coming next
│   ├── SKILL_TREE.md          ← capability matrix
│   ├── TODO.md                ← active tracker
│   ├── FINALIZED.md           ← completed-work archive (active)
│   ├── KNOWN-PROBLEMS.md      ← deferred issues + their action plans
│   ├── CACHE-BUSTING.md       ← cache-bust strategy
│   ├── PERFORMANCE_AUDIT.md   ← lighthouse + perf notes
│   ├── SEO_IMPLEMENTATION.md  ← SEO + structured data
│   ├── TEST_GUIDE.md          ← how to verify changes
│   ├── Pollinations_API_Documentation.md ← upstream API ref
│   └── redesign/              ← redesign-migration coordination docs
├── ai/
│   └── demo/                  ← the interactive Unity chat (~8k lines)
├── apps/                      ← 8 mini-apps that all share Unity
├── redesign/                  ← gothic UI components (JSX + CSS)
├── PolliLibJS/                ← JavaScript Pollinations client
├── PolliLibPy/                ← Python Pollinations client
├── scripts/                   ← build scripts (sitemap, copy-assets, cache-bust, indexnow)
├── _archive/                  ← preserved historical files
├── package.json
├── vite.config.js
├── index.html, about.html, ai.html, apps.html, codex.html,
│   contact.html, projects.html, services.html  ← top-level pages
└── (top-level config: CNAME, _headers, manifest.json, sitemap*.xml,
    robots.txt, humans.txt, BingSiteAuth.xml, favicon.ico, etc.)
```

---

## Documentation map

Pick by depth:

| Audience | Read |
|---|---|
| **First-timer / new dev** | [`Docs/README-BASIC.md`](./Docs/README-BASIC.md) — orient yourself, get running |
| **Deep technical walkthrough** | [`Docs/README-NERD.md`](./Docs/README-NERD.md) — every line of the architecture explained |
| **End user / Unity meeting** | [`Docs/USER-README.md`](./Docs/USER-README.md) — what Unity is + how to talk to her |
| **API integration / proxy** | [`Docs/AUTH_AND_API_ARCHITECTURE.md`](./Docs/AUTH_AND_API_ARCHITECTURE.md) — Worker routes, auth, content filtering, jailbreaks, troubleshooting |
| **System architecture** | [`Docs/ARCHITECTURE.md`](./Docs/ARCHITECTURE.md) — high-level data flow + component map |
| **Roadmap / status** | [`Docs/ROADMAP.md`](./Docs/ROADMAP.md), [`Docs/SKILL_TREE.md`](./Docs/SKILL_TREE.md) |
| **What's done** | [`Docs/FINALIZED.md`](./Docs/FINALIZED.md) — verbatim record of completed work |
| **Known issues** | [`Docs/KNOWN-PROBLEMS.md`](./Docs/KNOWN-PROBLEMS.md) — deferred problems + their fix plans |
| **PolliLibJS** | [`PolliLibJS/README.md`](./PolliLibJS/README.md) |
| **PolliLibPy** | [`PolliLibPy/README.md`](./PolliLibPy/README.md) |

---

## Branch model

```
main      → production (deployed to https://unity-lab-ai.github.io/ via GitHub Pages → www.unityailab.com)
develop   → in-development, branched from main
feature/* → individual work, branched from develop, PR'd back to develop
```

Work happens on `feature/*` branches. Hotfixes and releases extend the Git Flow pattern. PR review at every merge boundary.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server on `http://localhost:3000` |
| `npm run build` | Full production build: sitemap → vite build → copy assets → cache-bust |
| `npm run sitemap` | Regenerate `sitemap.xml`, `sitemap-images.xml`, `sitemap-index.xml` |
| `npm run cache-bust` | Add cache-control meta + build hash to dist HTMLs |
| `npm run copy-assets` | Copy non-Vite-handled assets to dist/ |
| `npm run preview` | Preview the built site locally |
| `npm run minify` | Legacy: terser + clean-css for the v1 stack |
| `npm run build:legacy` | Legacy: minify + update-version.sh |

All build scripts live in `scripts/`.

---

## Authentication (TL;DR)

Browser code sends **no token**. The Cloudflare Worker holds an `sk_*` Pollinations token as a server-side secret, fronts every request, and injects `Authorization: Bearer ${POLLINATIONS_SK}` on the upstream call to `gen.pollinations.ai`. CORS allowlist gates which domains can reach the Worker.

For secret rotation, route table, allowlist management, and the full Worker source: [`Docs/AUTH_AND_API_ARCHITECTURE.md`](./Docs/AUTH_AND_API_ARCHITECTURE.md).

---

## Site URLs

Top-level pages served by GitHub Pages:

- `/` — landing
- `/about.html` — about Unity AI Lab
- `/ai.html` — AI overview + link to demo
- `/ai/demo/` — interactive Unity chat
- `/apps.html` — apps gallery
- `/codex.html` — Unity codex / persona reference
- `/contact.html`
- `/projects.html` — project showcase
- `/services.html` — services
- `/downloads/` — downloads index

The 8 top-level HTMLs stay in root because they ARE the public URLs (GitHub Pages serves the folder structure literally; moving them would break every existing link, bookmark, sitemap entry, and Open Graph URL).

---

## Contributing

1. Read [`Docs/README-BASIC.md`](./Docs/README-BASIC.md) for orientation
2. Branch off `develop` to a `feature/*` branch
3. Make changes; verify locally via `npm run dev`
4. Update relevant docs in the same commit (the project follows the *docs-before-push* convention — every code change ships with its doc updates atomically)
5. PR back to `develop`

For the full contribution flow including the workflow conventions, see [`Docs/README-BASIC.md`](./Docs/README-BASIC.md) §"Contributing".

---

## License

ISC. See `package.json`. Unity AI Lab — Hackall360, Sponge, GFourteen.

---

## Contact

- **Site:** [unityailab.com](https://www.unityailab.com)
- **Email:** unityailabcontact@gmail.com
- **Issues:** [GitHub Issues](https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io/issues)
- **Pollinations.AI** (the upstream we wrap): [pollinations.ai](https://pollinations.ai)

---

🖤 *Unity AI Lab — pushing AI to its actual limits, not its sanitized ones.*
