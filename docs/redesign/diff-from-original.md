# Gothic Redesign — current state vs. original

A ground-truth audit of every section/element on the original homepage and what
made it (or didn't) into the four redesigned root-level pages: `index.html`,
`about.html`, `services.html`, `contact.html`.

This doc supersedes the original "Gothic Landing.html vs index.html" notes; it
reflects the redesign as of the current commit.

Legend:
- ✅ kept (with or without rewording)
- 🔁 replaced by a gothic equivalent
- ❌ dropped — not present in the gothic page
- ➕ new in gothic, no original equivalent

---

## 0. What's actually been redesigned

| Path | Status | Chrome |
|---|---|---|
| `/` (`index.html`) | ✅ Gothic V-D | `<GothicNavbar />` + `<GothicFooter />` |
| `/about` (`about.html`) | ✅ Gothic V2 (Cathedral fusion) | same |
| `/services` (`services.html`) | ✅ Gothic V1 (Codex 01) | same |
| `/contact` (`contact.html`) | ✅ Gothic V1 | same |
| `/projects` (`projects.html`) | ✅ Gothic V1 (Codex 02) | same |
| `/ai` (`ai.html`) | ✅ Gothic V1 (Codex 03) — Coming Soon panel **dropped** | same |
| `/apps` (`apps.html`) | ✅ Gothic V1 (Codex 04) — 8-app grid | same |
| `/about/index.html` | ✅ redirect stub → `/about.html` |
| `/contact/index.html` | ✅ redirect stub → `/contact.html` |
| `/projects/index.html` | ✅ redirect stub → `/projects.html` |
| `/ai/index.html` | ✅ redirect stub → `/ai.html` |
| `/apps/index.html` | ✅ redirect stub → `/apps.html` |

All seven root-level redesigned `.html` pages share identical chrome scripts
(`v-d-chrome.jsx`, `v-d-sections.jsx`, `gothic-init.js`, `v-d-smoke.js`) and
identical SEO/social meta + skip-link + footer structure. Codex pages 01–04
(services / projects / ai / apps) additionally share the `codex-shared.css`
chrome (mast / meta strip / cover / band / eof) and a per-page CSS module.

**Originals archived** under `_archive/`:
- `_archive/about-v1-original/` — Bootstrap About + about.js + about-contact.js
- `_archive/contact-v1-original/` — Bootstrap Contact + contact-form.js
- `_archive/projects-v1-original/` — Bootstrap Projects
- `_archive/ai-v1-original/` — Bootstrap AI ("Coming Soon" + ai-init.js)
- `_archive/apps-v1-original/` — Bootstrap Apps (apps.css + apps-init.js + standalone shared-nav)

**Orphaned JS removed from project root**: `ai/ai-init.js`, `apps/apps.css`,
`apps/apps-init.js` (replaced by per-codex CSS in `redesign/`).

---

## 1. `<head>` / page chrome

| Original | Gothic | Status |
|---|---|---|
| `<title>UnityAILab - The Dark Side of AI</title>` | `<title>The Dark Side of AI — Unity AI Lab · …</title>` | ✅ rebranded |
| Meta description, keywords, OG/Twitter cards, canonical URL, favicon set, `theme-color`, `apple-touch-icon`, manifest | All present on **all 4 redesigned pages** | ✅ done |
| Bootstrap 5 CSS, Font Awesome, AOS CSS, Google Fonts (Cinzel, Crimson Text, UnifrakturCook), custom `styles.css` | `redesign/shared-tokens.css` + `variations.css` + per-page CSS + Cormorant Garamond / Inter / JetBrains Mono | 🔁 own design system |
| Skip-to-content link (`<a href="#main-content" class="skip-link">`) | `<a class="vD-skip" href="#main-content">` on all 4 pages, `<main id="main-content" role="main">` wrapping content | ✅ done |
| `background-overlay`, `red-streaks` decorative divs | Replaced by `vD-vignette`, `vD-flicker`, corner-frame system | 🔁 |

---

## 2. Navbar — `<GothicNavbar />` (`redesign/v-d-chrome.jsx`)

Link inventory:

| Original link | Gothic |
|---|---|
| AI (`./ai`) | ✅ kept |
| About (`./about`) | ✅ kept |
| Apps (`./apps`) | ✅ kept |
| Services (`./services`) | ✅ kept |
| Projects (`./projects`) | ✅ kept |
| Downloads (`./downloads`) | ❌ dropped — page never shipped |
| Contact (`./contact`) | ✅ kept |
| Mobile collapse / hamburger | ✅ `<GothicNavbar />` ships its own toggle |

➕ Visitor counter (`<GothicVisitorCounter />`) lives in the navbar, hits
`abacus.jasoncameron.dev` (free, no-auth, no hosting), namespace
`unityailab` / key `gothic-landing`, with `localStorage` fallback and
`sessionStorage` per-session dedupe. **Replaces the old self-hosted
`visitor-tracking.js` / `visitor-tracking-loader.js` pipeline entirely.**

---

## 3. Hero section

| Original | Gothic |
|---|---|
| `<h1>` "The Dark Side of AI" | ✅ retitled "The Dark Side / — of — / Artificial Intelligence" |
| Subtitle: "Where innovation meets rebellion. We push AI beyond conventional boundaries." | 🔁 longer lede about "independent lab forging AI tools without the apology layer…" |
| Primary CTA: **Try the Unity Demo** → `./ai/demo` | 🔁 "Summon Unity" → confirm target in `v-d.jsx` |
| Secondary CTA: **Explore Our Projects** → `./projects` | 🔁 "Read the codex" → confirm target |
| `total-visitors-container` | ➕ replaced by `<GothicVisitorCounter />` (see §2) |
| Decorative line + scroll indicator (`fa-chevron-down`) | 🔁 corner frame + sigil rule |

---

## 4. Features section (`#about` → "What is UnityAILab?")

Original had **3** cards. Gothic has **6** pillars (`FEATURE_CARDS` I–VI).

| Original card | Gothic equivalent |
|---|---|
| **Unfiltered AI** → `./ai/demo` | ✅ Pillar I "Unfiltered AI" |
| **Code Optimization** → `https://github.com/Unity-Lab-AI/CodeWringer` | ✅ Pillar II — but **CodeWringer link is gone** |
| **Experimental Edge** → `https://github.com/Unity-Lab-AI` | ✅ Pillar IV — **GitHub org link gone** |
| — | ➕ Pillar III Secure Systems |
| — | ➕ Pillar V Agentic Frameworks |
| — | ➕ Pillar VI Full Stacks |

❌ **Lost outbound links** (intentionally deferred per current direction): CodeWringer repo, Unity-Lab-AI org page.

---

## 5. Services section (`#services` → "What We Offer")

Original: **2** cards. Gothic landing keeps an inline preview; `/services` (the new dedicated page) hosts the full **7-card** grid with the dossier modal + per-service contact prefill.

| Original | Gothic |
|---|---|
| **AI Integration & Development** | ✅ one of the seven `SERVICE_CARDS` |
| **Red Team & Blue Team Services** | ✅ ditto |
| Section subtitle "Professional AI solutions with an unconventional approach" | 🔁 "Seven services. All unconventional." |

➕ Five additional service cards + interactive terminal modal (`rm`, `restore`, `help`, `info` commands). Net feature gain.

---

## 6. Coming Soon section — INTENTIONALLY RETIRED

The "Coming Soon / Subscription Tiers / Pay As You Go / AI-Powered Games"
section is **gone by design**. Per current direction: the project that section
referred to is **on hold**, not "coming soon," so we stopped teasing it.

| Original card | Gothic | Decision |
|---|---|---|
| **Subscription Tiers** (`fa-crown`) | ❌ dropped | 🪦 retired |
| **Pay As You Go** (`fa-coins`) | ❌ dropped | 🪦 retired |
| **AI-Powered Games** (`fa-gamepad`) | ❌ dropped | 🪦 retired |
| "Want to be notified when we launch?" + Discord CTA `https://discord.gg/64Rvr5pZas` | ❌ dropped here, Discord link surfaces in `GothicProof` + footer | 🔁 |
| AI page right-panel "Coming Soon" badge | ❌ **still present in `/ai/index.html`** — needs removal during AI redesign | TODO |

---

## 7. Footer — `<GothicFooter />` (`v-d-sections.jsx:626`)

5-column grid: NAVIGATE / DEDICATION / BUILD / CREATORS / CREED.

| Original | Gothic | Status |
|---|---|---|
| Brand block + tagline "Chaos, creativity, and AI without limits." | 🔁 DEDICATION + CREED blocks | ✅ |
| **Quick Links** column: AI, About, Apps, Services, Projects, Downloads, Contact | NAVIGATE column: AI · About · Apps · Services · Projects · Contact | ✅ restored |
| **Connect** column: GitHub, Discord, AI chat icons | Footer mark-line includes Source (GitHub) + Contact + Pollinations.AI; Discord lives in `GothicProof` proof-row | 🔁 |
| Copyright `© 2024 UnityAILab. Pushing boundaries, breaking limits.` | `© 2024–2026 UnityAILab. Pushing boundaries, breaking limits.` + sigil mark `⛧ UNITYAILAB.COM — MMXXVI ⛧` + disclaimer + coffee count | ✅ expanded |

➕ Dynamic coffee counter in `GothicFooter` (days-since-2020 × 8). Pure flavor.

❌ Header/footer ARE present and consistent on all 4 redesigned pages — verified.

---

## 8. Scripts / behavior

The redesigned pages now load:

| Script | Purpose |
|---|---|
| React 18.3.1 + ReactDOM + Babel Standalone (pinned, integrity-hashed) | Render the gothic React tree |
| `redesign/sigils.jsx` | Inline SVG sigil set |
| `redesign/v-d-chrome.jsx` | `<GothicNavbar />` + `<GothicVisitorCounter />` |
| `redesign/v-d.jsx` | `<GothicHero />` |
| `redesign/v-d-sections.jsx` | All page sections + `<GothicFooter />` |
| `redesign/about-shared.jsx` | `<AboutContactForm />` (mailto handoff) — about/services/contact pages |
| Per-page data + page jsx | About-V2 / Services-V1 / Contact-V1 |
| **`redesign/gothic-init.js`** *(NEW)* | Polyfills, throttled scroll, motion prefs, **gothic toast notifications + auto-validation on `.ab-contact` forms** |
| `redesign/v-d-smoke.js?v=3` | DPR-aware smoke/ash particle system (supersedes `js/smoke-effect.js`) |

What the redesigned pages **no longer load** from the original stack:

| Old script | Status under redesign |
|---|---|
| `vendor/bootstrap/bootstrap.bundle.js` | ❌ not needed — no Bootstrap |
| `https://unpkg.com/aos@2.3.1/dist/aos.js` + `data-aos` attrs | ❌ removed — CSS-only entrance treatments instead |
| `visitor-tracking-loader.js` / `visitor-tracking.js` | 🔁 **replaced** by `<GothicVisitorCounter />` → `abacus.jasoncameron.dev` (free, no hosting) |
| `js/init.js` (ES-module orchestrator) | 🔁 **replaced** by `redesign/gothic-init.js` |
| `js/navigation.js` | 🔁 superseded — `<GothicNavbar />` handles scroll/active-link |
| `js/mobile-menu.js` | 🔁 superseded — `<GothicNavbar />` mobile toggle |
| `js/smoke-effect.js` | 🔁 superseded by `redesign/v-d-smoke.js` (DPR-aware, curl-noise, embers) |
| `js/red-streaks.js` | 🔁 superseded by `vD-vignette` + `vD-flicker` CSS |
| `js/hover-effects.js` | 🔁 superseded by CSS `:hover` states |
| `js/parallax` (in `scroll-effects.js`) | ❌ dropped — depended on `.hero-content` which doesn't exist in gothic |
| `js/forms.js` (validation + toast) | 🔁 reimplemented in `gothic-init.js` for the gothic `.ab-contact` form class |
| `home-init.js` / `page-init.js` | ❌ not loaded — their behaviors (FOUC prevention, smooth scroll, etc.) are folded into `gothic-init.js` |
| `about/about.js` / `about/about-contact.js` | ❌ original-page only — not used by `/about.html` |
| `ai/ai-init.js` | still loaded by **original** `/ai/index.html` |
| `apps/apps-init.js` / `apps/shared-nav.js` | still loaded by **original** `/apps/index.html` |
| `contact/contact-form.js` | still loaded by **original** `/contact/index.html` |

---

## 9. Brand new in gothic (no original equivalent)

- ➕ **The Grimoire** (`GothicLibraries`) — PolliLibJS / PolliLibPy tabbed code sample
- ➕ **Why we built this** (`GothicWhy`) — manifesto block + 9,400 / 2 / 4 / 0 stat row
- ➕ **Proof row** (`GothicProof`) — GitHub / models supported / Discord / current build cards
- ➕ Interactive **terminal modal** on every service card (`rm`, `restore`, `help`, `info`)
- ➕ Creator creed across hero + footer
- ➕ Six pillars instead of three features
- ➕ `<GothicVisitorCounter />` on free abacus.jasoncameron.dev backend
- ➕ Per-service contact prefill (services → "Compose a brief" jumps to contact form with reason/subject pre-set)
- ➕ Dossier modal system on services
- ➕ Gothic toast notifications + form validation in `gothic-init.js`

---

## 10. Outstanding work (for the next 2–4 sessions)

### Pages still to redesign
1. **`/ai/` page** — port from Bootstrap+AOS to gothic chrome. Drop the
   "Coming Soon" right-panel; decide what fills it now that the full
   experience is on hold.
2. **`/apps/` page** — port from Bootstrap+AOS + the standalone
   `apps/shared-nav.html/js/css` chrome to `<GothicNavbar />` /
   `<GothicFooter />`.
3. **`/projects/` page** — never redesigned; either port to gothic or
   archive it intentionally.

### Routing / shadow pages
4. ✅ **Resolved.** All five legacy `<dir>/index.html` files now redirect
   to the new root-level `.html` files using meta-refresh + JS redirect +
   canonical link.

### Cleanup
5. ✅ **Done.** `Gothic Landing.html` moved to `_archive/exploration-shells/`.
6. ✅ **Done.** `Landing Redesign.html`, `About Redesign.html`,
   `About Redesign V2.html`, root-level `design-canvas.jsx` all moved to
   `_archive/exploration-shells/`.
7. ✅ **Done.** Old script/css/vendor stack moved to `_archive/old-stack/`:
     - `styles.css` (1500+ line monolith — superseded by token system)
     - `js/` (10 ES6 modules — superseded by `redesign/gothic-init.js`)
     - `vendor/bootstrap`, `vendor/fontawesome` (gothic uses neither)
     - `apps/shared-nav.html`, `apps/shared-nav.js`, `apps/shared-theme.css`
       (orphaned after `/apps/` redesign)
   `ARCHITECTURE.md` (outdated) → `_archive/old-docs/`.
   `redesign/HANDOFF.md` is now the canonical architecture doc.

### Outbound links (deferred — tracked for Claude Code)
8. CodeWringer + Unity-Lab-AI org outbound links — present in
   `projects-data.jsx` cards II and III. Verify the GitHub org URLs are
   the intended targets when ready.

### CTAs to verify (deferred — tracked for Claude Code)
9. Hero "Summon Unity" → `./ai` (now points to `/ai`, a real page)
10. Hero "Read the codex" → `./projects` (now points to `/projects`, a real page)
11. AI page (`/ai`) — currently a styled placeholder for the chat embed.
    Wire actual Pollinations iframe when ready.

---

## Final state — site map

```
/                       → index.html        (V-D landing)
/about                  → about.html        (V2 Cathedral)
/services               → services.html     (Codex 01)
/projects               → projects.html     (Codex 02)
/ai                     → ai.html           (Codex 03)
/apps                   → apps.html         (Codex 04)
/contact                → contact.html      (V1)
/about/, /services/,
/projects/, /ai/,
/apps/, /contact/       → redirect stubs → respective root .html files
Unity Web Design.html   → internal design system docs (noindex)
```

All 7 pages share: `<GothicNavbar />` + `<GothicFooter />` + skip-link +
SEO/OG/Twitter meta + favicon set + manifest + `gothic-init.js` +
`v-d-smoke.js`. Codex pages 01–04 additionally share `codex-shared.css`
chrome (mast / meta / cover / band / eof).

See `redesign/HANDOFF.md` for full architecture, file list, and
next-session work items for Claude Code.
