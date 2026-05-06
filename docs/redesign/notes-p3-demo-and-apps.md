# P3 — Demo + Apps redesign chrome wiring

**Branch:** `feature/redesign-P3-demo-and-apps` (off `dev-re-design`)
**Created by Unity for Gee — Unity AI Lab.**

---

## Verbatim user direction (LAW #0)

> "Create a new feature branch, based on the current branch that is focusing
> directly on redesigning the actual demo page and updating the apps. Based
> on the files that were recently redesigned (check latest git commit history)
> the demo and app pages need updating accordingly- following the redesign
> specifications."

---

## What this PR ships

P1 + P2 hoisted the redesigned anchor pages onto `/` (`/index.html`,
`/about.html`, `/ai.html`, `/apps.html`, `/services.html`, `/projects.html`,
`/contact.html`, `/Unity Web Design.html`). The two surfaces explicitly held
**out of scope** by P1+P2 — the 8000-line interactive demo at `/ai/demo/`
and the 8 app demos at `/apps/<demo>/` — were left wearing old-stack
Bootstrap chrome. P3 is the follow-up that brings both surfaces onto the
gothic V-D / codex chrome system.

### Three commits, one branch

1. **P3-01** — reskin `apps/shared-theme.css` + `shared-nav.html` + rewrite
   `shared-nav.js` to inject a vanilla-DOM `.vD-nav-*` navbar (mirror of
   `<GothicNavbar />` from `redesign/v-d-chrome.jsx`).
2. **P3-02** — reskin `/ai/demo/index.html` + `demo.css` so the 8000-line
   demo loads `redesign/shared-tokens.css` + `gothic-init.js`, replaces
   `<i class="fas fa-brain">` with the inline ouroboros sigil (`Sigils.Unity`),
   and replaces the Bootstrap `.container-fluid > .row > .col-12` footer
   with a slim gothic codex-eof strip.
3. **P3-03** — wire `redesign/shared-tokens.css` as the FIRST stylesheet
   link in each of the 10 app HTMLs to prevent FOUC during initial paint
   (the auto-loader in shared-nav.js doesn't fire until DOMContentLoaded).

---

## File ownership matrix

Pure additive on top of P1+P2 — zero overlap with their files, zero
conflict zone.

| File | Touched | Owner |
|---|---|---|
| `apps/shared-nav.js` | rewrite | P3 |
| `apps/shared-theme.css` | rewrite (slim) | P3 |
| `apps/shared-nav.html` | rewrite (mirror) | P3 |
| `ai/demo/index.html` | reskin | P3 |
| `ai/demo/demo.css` | reskin (logo + footer + header note) | P3 |
| `apps/<8 demos>/*.html` (10 files) | add 1 link, no logic touched | P3 |
| `redesign/*` (P1+P2 chrome) | NOT TOUCHED | n/a |
| `apps/apps-init.js` | preserved orphan (not loaded by any live page) | n/a |
| `apps/apps.css` | preserved orphan | n/a |
| Bootstrap + FontAwesome under `vendor/` | preserved | n/a |
| Per-app JS (chat-init.js, chat-core.js, etc.) | NOT TOUCHED | n/a |

---

## Design decisions

### Vanilla-DOM navbar in apps (no React)

`<GothicNavbar />` in `redesign/v-d-chrome.jsx` is a React component. The
8 app demos are framework-free vanilla HTML/JS apps — pulling React +
ReactDOM + Babel just to render a navbar would add ~200KB and a bunch of
runtime cost the apps don't otherwise need. Instead, `shared-nav.js`
ports `GothicNavbar` to imperative DOM:

- Same markup tree (`.vD-nav > .vD-nav-inner > .vD-nav-brand + .vD-nav-toggle + .vD-nav-list`)
- Same class names → same styles cascade from `redesign/variations.css`
- Same scroll-state threshold (>30px adds `.vD-nav-scrolled`)
- Same active-link detection (sets `aria-current="page"` + `.is-active`)
- Same mobile menu toggle + close-on-link-click

Visual parity with the React version is byte-for-byte at the styles layer.

### Inlined ouroboros SVG (no Sigils dependency)

`redesign/sigils.jsx` is a React component module. Apps don't have React.
The single sigil they need (the ouroboros brand mark) gets inlined as
literal SVG markup in `apps/shared-nav.js` and `apps/shared-nav.html`,
copied verbatim from `Sigils.Unity` in `redesign/sigils.jsx`. If the
canonical sigil shape is updated, both files must be kept in sync. The
trade-off is acceptable — the alternative is dragging React + Babel
into every app demo.

### Bootstrap kept (FA kept), Bootstrap navbar dropped

Apps still use Bootstrap layout primitives (`.row`, `.col-md-*`, `.btn`,
`.container-fluid`) inside their UIs. Pulling Bootstrap CSS+JS out across
10 files would risk visual regressions in chat/voice/slideshow/etc. So
Bootstrap stays — but its `.navbar` / `.navbar-toggler` / `.nav-link`
chrome is replaced wholesale by `.vD-nav-*` from `redesign/variations.css`.
Same call for FontAwesome — it's used across app UIs (chat send button,
settings gear, voice mic, etc.), so it stays, even though the brand mark
no longer depends on `<i class="fas fa-brain">`.

### `/ai/demo/` Bootstrap drop

The demo has its own complete CSS (2593-line `demo.css`) and doesn't
actually use Bootstrap layout primitives anywhere meaningful — the only
Bootstrap-classed element was the footer (`.container-fluid > .row > .col-12`),
which P3-02 replaces with a slim gothic codex-eof strip. So Bootstrap
CSS+JS got dropped from `/ai/demo/index.html` entirely. FontAwesome
stays — used heavily inside the demo for chat/settings/panel icons.

### Demo footer reinterpretation

The original demo footer was a classic centered copyright line. The codex
treatment (consistent with `/about.html`, `/ai.html`, `/apps.html`)
brackets the credit with `⛧` glyphs in Cormorant Garamond and uses a
mono font with 3px letterspacing for the meta line. Visual hierarchy
mirrors `redesign/codex-shared.css .codex-eof` but the implementation
is local to `demo.css` because the demo is fixed-position-bottom whereas
the codex pages flow naturally.

---

## Wiring verification (smoke test)

`py -m http.server 8765 --bind 127.0.0.1`:

| Surface | Status | Notes |
|---|---|---|
| `/ai/demo/index.html` | 200 | gothic logo + codex-eof footer wired |
| `/ai/demo/demo.css` | 200 | header note documents upstream deps |
| `/redesign/shared-tokens.css` | 200 | canonical token source |
| `/redesign/variations.css` | 200 | `.vD-nav-*` styles |
| `/redesign/gothic-init.js` | 200 | toast + reduced-motion + scroll polyfills |
| `/apps/shared-nav.js` | 200 | vanilla-DOM gothic navbar |
| `/apps/shared-theme.css` | 200 | slim utility layer |
| `/apps/shared-nav.html` | 200 | static-include mirror |
| `/apps/unityDemo/unity.html` | 200 | Unity Chat |
| `/apps/textDemo/text.html` | 200 | Text Chat |
| `/apps/personaDemo/persona.html` | 200 | Persona Chat |
| `/apps/helperInterfaceDemo/helperInterface.html` | 200 | Helper Interface |
| `/apps/screensaverDemo/screensaver.html` | 200 | AI Screensaver |
| `/apps/slideshowDemo/slideshow.html` | 200 | AI Slideshow |
| `/apps/oldSiteProject/index.html` | 200 | Classic Unity |
| `/apps/oldSiteProject/screensaver.html` | 200 | Classic Unity screensaver |
| `/apps/talkingWithUnity/index.html` | 200 | Talking With Unity |
| `/apps/talkingWithUnity/indexAI.html` | 200 | Talking With Unity (AI variant) |

---

## What this PR does NOT do (deferred)

- **Real-browser visual smoke test** — the static smoke test confirms
  endpoints serve and the wiring is in place, but click-through testing
  of chat send / voice record / slideshow play / settings panel / mobile
  menu / etc. requires a real browser session and human eyes.
- **Per-app inline `<style>` polish** — each of the 10 apps still has
  ~50–500 lines of inline page-specific CSS using hardcoded `'Trajan Pro'`
  and rgba literals. These now resolve correctly through the canonical
  tokens, but rewriting every `'Trajan Pro', serif` to `var(--font-display)`
  is cosmetic and out of scope for this branch — it's polish work that
  needs visual diffing in a real browser.
- **Drop redundant per-app Bootstrap CSS imports** — each app HTML still
  has its own `<link href="../../vendor/bootstrap/bootstrap.min.css">`
  at the top, even though `shared-nav.js` auto-loads it. The duplicate
  load is no-op'd by the browser cache, but the cleanup pass is deferred
  — too many apps using `.row`/`.col-*`/`.btn` to risk an audit-and-strip
  pass in this PR.
- **`/ai/demo/` chat-bubble + panel reskin** — the 3-panel app shell
  uses the new tokens correctly out of the box (it was already
  half-gothic — just legacy-wired), but each chat-bubble / settings-panel
  / mobile-modal interior could be tightened further to fully echo the
  codex aesthetic. Cosmetic, defer.
- **Footer link to `/ai.html`** — could enrich the demo footer with a
  "Back to lab" link to feel more codex-volume-like. Cosmetic, defer.
- **`apps-init.js` cleanup** — orphaned (no live page loads it after
  P2-08 + P3 changes). Preserved per "we don't want to remove anything
  at this point" rule from `REDESIGN-MIGRATION.md`.

---

## Coordination

P3 is solo (just one branch, one author). No file ownership matrix
conflicts because P3 only touches:

- `apps/shared-*.{js,css,html}` — shared layer, P1+P2 didn't author these.
- `ai/demo/*` — explicitly OUT of scope on P1+P2 per `REDESIGN-MIGRATION.md`.
- `apps/<8 demo>/*` — explicitly OUT of scope on P1+P2.
- `docs/REDESIGN-MIGRATION.md` — status row update only.
- `docs/redesign/notes-p3-*.md` — new file, no overlap.
- `TODO.md` + `FINALIZED.md` — workflow docs, sequential additions only.

---

*Unity AI Lab — pushing AI to its limits, one codex volume at a time.*
