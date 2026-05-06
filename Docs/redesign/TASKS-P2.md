# TASKS — PERSON 2 (Codex Pages + Design System Docs)

> **You are Person 2.** You own the four codex pages (services, projects, ai, apps), the codex shared chrome, the internal design system docs page, and the `apps-data.jsx` path fix. Your branch: `feature/redesign-P2`.

> **Read `/docs/REDESIGN-MIGRATION.md` BEFORE starting.** It's the shared status doc, file ownership matrix, and coordination contract. Update it as you progress.

---

## Identity

- **Branch:** `feature/redesign-P2`
- **Branched from:** `dev-re-design`
- **PR target:** `dev-re-design`
- **Pages owned:** `/services.html`, `/projects.html`, `/ai.html`, `/apps.html`, `/Unity Web Design.html`
- **Chrome owned:** `codex-shared.css` + per-page CSS modules + `uwd-*` design system assets
- **Stubs owned:** `/services/index.html` (WRITE FRESH — missing from REDESIGN), `/projects/index.html`, `/ai/index.html`, `/apps/index.html`
- **Fixes owned:** `apps-data.jsx` URL paths + `apps.html` about.css investigation
- **Moves owned:** `REDESIGN/docs/` + redesign source docs → `/docs/redesign/`

---

## Branch setup

```bash
git checkout dev-re-design
git pull origin dev-re-design
git checkout -b feature/redesign-P2
git push -u origin feature/redesign-P2
```

---

## How to work

### Rules of engagement (BINDING)

1. **Source of truth is `/REDESIGN/`.** Don't modify `REDESIGN/*` during your work — only copy out of it.
2. **Don't touch Person 1's files.** Conflict-zone audit in `/docs/REDESIGN-MIGRATION.md` lists every file. If you find something broken in Person 1's territory, write a note to `/docs/redesign/notes-p2-<topic>.md` — do NOT fix it.
3. **Don't touch out-of-scope files.** Per Gee: "we don't want to remove anything at this point, we just want to update with the redesigned files." `/js/`, `/vendor/`, `/styles.css`, `/script.min.js`, vite config, etc. — leave alone.
4. **All new docs go to `/docs/redesign/`.** Never edit root `README.md`, `ARCHITECTURE.md`, `FINALIZED.md`, or `TODO.md` during this work. Post-work integration pass handles those.
5. **One task = one commit.** Small, atomic, easy to revert. Update the migration doc status table BEFORE and AFTER each task.
6. **Smoke-test every page in a browser before marking complete.** Don't trust paths.
7. **800-line read before edit.** Mostly N/A here (we're copying files), but when editing `apps-data.jsx` for the path fix, read the entire file first per `.claude/CONSTRAINTS.md §800-LINE READ`.
8. **No tests ever.** Per `.claude/CONSTRAINTS.md §NO TESTS POLICY`. Code it right, smoke-test in browser.

### Documentation placement

Per Gee: "any documentation they write must be put under a redesign docs folder, which will allow post-dual person work being done, for the docs to be properly integrated after the fact."

Any note, finding, decision you write goes here:

```
/docs/redesign/notes-p2-<topic>.md
```

Examples:
- `/docs/redesign/notes-p2-apps-about-css.md` for the `/apps.html` about.css investigation result
- `/docs/redesign/notes-p2-services-stub.md` documenting the fresh services stub you wrote
- `/docs/redesign/notes-p2-apps-data-paths.md` for the apps-data.jsx URL fix rationale

If `/docs/redesign/` doesn't exist when you need to write your first note, create it. (P2-03 below creates it as part of moving REDESIGN/docs/.)

### Commit cadence

Each task below is one commit. Commit message format:

```
P2-NN: <short description>

<longer body if needed — what changed, why, any notes>
```

Push after each commit. Update `/docs/REDESIGN-MIGRATION.md` status table BEFORE starting (mark `[~]` in_progress) and AFTER committing (mark `[x]` complete).

---

## Pre-decomposed task list

### P2-01 — Branch setup
- [ ] Run the branch setup commands above
- [ ] Verify `git status` shows clean working tree on `feature/redesign-P2`
- [ ] Mark P2-01 complete in `/docs/REDESIGN-MIGRATION.md`

---

### P2-02 — Copy `/redesign/codex-shared.css`

**Files to copy:**

```
REDESIGN/redesign/codex-shared.css  →  /redesign/codex-shared.css
```

**Why:** Codex chrome (mast / meta strip / cover / band / eof) shared by services/projects/ai/apps. Person 1's global chrome bundle does NOT include this file — it's yours.

**Acceptance:**
- [ ] `/redesign/codex-shared.css` exists with byte-identical content
- [ ] Commit message: `P2-02: copy codex-shared.css to /redesign/`

---

### P2-03 — Move REDESIGN docs → `/docs/redesign/`

**Files to move:**

```
REDESIGN/docs/                              →  /docs/redesign/
REDESIGN/redesign/HANDOFF.md                →  /docs/redesign/HANDOFF.md
REDESIGN/redesign/diff-from-original.md     →  /docs/redesign/diff-from-original.md
REDESIGN/README.md                          →  /docs/redesign/REDESIGN-README.md  (rename to disambiguate from root README)
```

**Why:** Centralize all redesign source docs in one place for post-work integration. This task ALSO creates `/docs/redesign/` so subsequent notes can land there.

**Method:** `git mv` for each file. The directory `REDESIGN/docs/` already contains `README.md` and `Unity Web Design.html` — only move `README.md`. The `Unity Web Design.html` in REDESIGN/docs/ is a different copy from the root one — verify which is canonical, prefer the REDESIGN root version (gets copied in P2-04).

**Acceptance:**
- [ ] `/docs/redesign/HANDOFF.md` exists
- [ ] `/docs/redesign/diff-from-original.md` exists
- [ ] `/docs/redesign/REDESIGN-README.md` exists
- [ ] `/docs/redesign/` is the catchall folder for all subsequent P1+P2 notes
- [ ] Commit message: `P2-03: move redesign source docs to /docs/redesign/`

---

### P2-04 — Copy `/Unity Web Design.html` + UWD assets

**Files to copy:**

```
REDESIGN/Unity Web Design.html              →  /Unity Web Design.html
REDESIGN/redesign/uwd-helpers.jsx           →  /redesign/uwd-helpers.jsx
REDESIGN/redesign/uwd-page.jsx              →  /redesign/uwd-page.jsx
REDESIGN/redesign/uwd-page-2.jsx            →  /redesign/uwd-page-2.jsx
REDESIGN/redesign/unity-web-design.css      →  /redesign/unity-web-design.css
REDESIGN/redesign/v-a.jsx                   →  /redesign/v-a.jsx
REDESIGN/redesign/v-b.jsx                   →  /redesign/v-b.jsx
REDESIGN/redesign/v-c.jsx                   →  /redesign/v-c.jsx
```

**Why:** Internal design system docs page (`noindex`). Reference for future redesign work.

**Note:** `v-d.jsx`, `v-d-chrome.jsx`, `v-d-sections.jsx` — these are Person 1's responsibility (already in P1-02 global chrome bundle). Don't copy them.

**Acceptance:**
- [ ] `/Unity Web Design.html` renders the design system docs page
- [ ] All UWD JSX files load without console errors
- [ ] V-A / V-B / V-C variations render in the design canvas
- [ ] Commit message: `P2-04: hoist Unity Web Design design system page + UWD assets`

---

### P2-05 — `/services.html` + assets + WRITE FRESH `/services/index.html` stub

**Files to copy:**

```
REDESIGN/services.html                       →  /services.html
REDESIGN/redesign/services-v1.css            →  /redesign/services-v1.css
REDESIGN/redesign/services-v1.jsx            →  /redesign/services-v1.jsx
REDESIGN/redesign/services-data.jsx          →  /redesign/services-data.jsx
```

**Files to WRITE FRESH** (REDESIGN missing this stub):

```
/services/index.html  ← write from REDESIGN/about/index.html template, swap "About" → "Services"
```

**Stub template** (write to `/services/index.html`, replacing the old 32KB Bootstrap services page):

```html
<!doctype html>
<!--
  Unity AI Lab — Services (redirect stub)
  This used to be the v1 (Bootstrap) Services page. The redesigned Services lives
  at /services.html now. This stub exists only so that anyone hitting the legacy
  /services/ URL (with trailing slash) gets bounced to the new gothic page.
  v1 source archived under _archive/ (preserved per "don't remove anything" rule).
-->
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting — Services · Unity AI Lab</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="https://www.unityailab.com/services.html">
  <meta http-equiv="refresh" content="0; url=/services.html">
  <script>window.location.replace('/services.html');</script>
  <style>body{background:#030001;color:#9b8866;font:14px/1.5 system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}a{color:#dc143c}</style>
</head>
<body>
  <p>Redirecting to <a href="/services.html">/services.html</a>…</p>
</body>
</html>
```

Document the fact that you wrote this stub fresh in `/docs/redesign/notes-p2-services-stub.md` so the post-work integration pass knows.

**Acceptance:**
- [ ] `/services.html` renders Codex 01 with 7 service cards + dossier modals + interactive terminal
- [ ] `/services/index.html` is a tiny redirect stub (~1KB)
- [ ] Browser test: `/services/` → bounces to `/services.html`
- [ ] Browser test: clicking "Compose a brief" on a service card prefills the contact form
- [ ] Note `/docs/redesign/notes-p2-services-stub.md` exists
- [ ] Commit message: `P2-05: hoist /services.html + write fresh /services/index.html stub`

---

### P2-06 — `/projects.html` + assets + `/projects/index.html` stub

**Files to copy:**

```
REDESIGN/projects.html                       →  /projects.html
REDESIGN/redesign/projects-v1.css            →  /redesign/projects-v1.css
REDESIGN/redesign/projects-v1.jsx            →  /redesign/projects-v1.jsx
REDESIGN/redesign/projects-data.jsx          →  /redesign/projects-data.jsx
REDESIGN/projects/index.html                 →  /projects/index.html  (REPLACES old Bootstrap Projects)
```

**Acceptance:**
- [ ] `/projects.html` renders Codex 02 with 6 project cards
- [ ] `/projects/` redirects to `/projects.html`
- [ ] Per HANDOFF outstanding item 8: CodeWringer + Unity-Lab-AI org GitHub URLs in projects-data.jsx cards II/III — verify they point at the intended repos. If targets are wrong/missing, log to `/docs/redesign/notes-p2-projects-outbound-links.md`. Do NOT silently fix; flag for post-work integration.
- [ ] Commit message: `P2-06: hoist /projects.html + projects assets + redirect stub`

---

### P2-07 — `/ai.html` + assets + `/ai/index.html` stub (preserve `/ai/demo/`)

**Files to copy:**

```
REDESIGN/ai.html                             →  /ai.html
REDESIGN/redesign/ai-v1.css                  →  /redesign/ai-v1.css
REDESIGN/redesign/ai-v1.jsx                  →  /redesign/ai-v1.jsx
REDESIGN/redesign/ai-data.jsx                →  /redesign/ai-data.jsx
REDESIGN/ai/index.html                       →  /ai/index.html  (REPLACES old Bootstrap AI landing — old `ai-init.js` stays orphaned)
```

**CRITICAL:** Do NOT touch `/ai/demo/`. That's the 8000-line interactive demo on the old stack. The `/ai/index.html` stub redirects `/ai/` to `/ai.html`. Deeper paths like `/ai/demo/index.html` keep serving because GitHub Pages resolves the deeper path first.

**Acceptance:**
- [ ] `/ai.html` renders Codex 03 (Coming Soon panel dropped per HANDOFF)
- [ ] `/ai/` redirects to `/ai.html`
- [ ] **`/ai/demo/index.html` STILL LOADS** — verify in browser. The 8000-line demo must not be shadowed.
- [ ] AI page has a styled placeholder for the future Pollinations chat iframe (per HANDOFF item 11 — wiring deferred to a later task)
- [ ] Commit message: `P2-07: hoist /ai.html + ai assets + redirect stub (preserve /ai/demo/)`

---

### P2-08 — `/apps.html` + assets + `/apps/index.html` stub (preserve `/apps/<8 demos>/`)

**Files to copy:**

```
REDESIGN/apps.html                           →  /apps.html
REDESIGN/redesign/apps-v1.css                →  /redesign/apps-v1.css
REDESIGN/redesign/apps-v1.jsx                →  /redesign/apps-v1.jsx
REDESIGN/redesign/apps-data.jsx              →  /redesign/apps-data.jsx  (will be edited in P2-09)
REDESIGN/apps/index.html                     →  /apps/index.html  (REPLACES old Bootstrap Apps — preserves all 8 demo subfolders)
```

**CRITICAL:** Do NOT touch the 8 demo subfolders under `/apps/`:
- `/apps/helperInterfaceDemo/`
- `/apps/oldSiteProject/`
- `/apps/personaDemo/`
- `/apps/screensaverDemo/`
- `/apps/slideshowDemo/`
- `/apps/talkingWithUnity/`
- `/apps/textDemo/`
- `/apps/unityDemo/`

The `/apps/index.html` stub redirects `/apps/` only. Deeper paths like `/apps/unityDemo/unity.html` keep serving.

**Note:** apps page links will currently point at WRONG paths (e.g. `./unityDemo/unity.html` resolves to `/unityDemo/unity.html` from `/apps.html`). P2-09 fixes this. Don't try to fix in this task.

**Acceptance:**
- [ ] `/apps.html` renders Codex 04 with 8-app grid
- [ ] `/apps/` redirects to `/apps.html`
- [ ] **All 8 demo subfolders STILL serve** — verify at least 2 in browser (e.g. `/apps/unityDemo/unity.html` and `/apps/textDemo/text.html`)
- [ ] App-launch links from `/apps.html` will currently 404 (P2-09 fixes)
- [ ] Commit message: `P2-08: hoist /apps.html + apps assets + redirect stub (preserve 8 demo subfolders)`

---

### P2-09 — Fix `/redesign/apps-data.jsx` URL paths

**Problem:** `apps-data.jsx` was authored assuming the apps page lives at `/apps/index.html` (one folder deep), so paths like `./unityDemo/unity.html` would resolve correctly. But the page is at `/apps.html` (root level), so those paths now resolve to `/unityDemo/unity.html` (404).

**800-line read first:** open `/redesign/apps-data.jsx` and read the entire file before editing. Per `.claude/CONSTRAINTS.md §800-LINE READ`.

**Edits:**

```js
// 8 app launch URLs — prepend ./apps/
href: './unityDemo/unity.html'              →  './apps/unityDemo/unity.html'
href: './textDemo/text.html'                →  './apps/textDemo/text.html'
href: './personaDemo/persona.html'          →  './apps/personaDemo/persona.html'
href: './talkingWithUnity/index.html'       →  './apps/talkingWithUnity/index.html'
href: './helperInterfaceDemo/helperInterface.html'  →  './apps/helperInterfaceDemo/helperInterface.html'
href: './slideshowDemo/slideshow.html'      →  './apps/slideshowDemo/slideshow.html'
href: './screensaverDemo/screensaver.html'  →  './apps/screensaverDemo/screensaver.html'
href: './oldSiteProject/index.html'         →  './apps/oldSiteProject/index.html'

// 2 cross-page CTAs — drop the parent traversal
primary:   { href: '../services' }          →  { href: './services' }
secondary: { href: '../contact' }           →  { href: './contact' }
```

**Document in `/docs/redesign/notes-p2-apps-data-paths.md`:**
- Why the paths needed changing (relative path resolution from `/apps.html` vs `/apps/index.html`)
- Confirm all 8 demo URLs lead to working pages

**Acceptance:**
- [ ] All 10 path edits applied to `/redesign/apps-data.jsx`
- [ ] Browser smoke-test: click each of the 8 "Launch app" buttons from `/apps.html` — each opens the correct demo (or at least a non-404 page)
- [ ] Browser smoke-test: "See services" → `/services.html`, "Get in touch" → `/contact.html`
- [ ] Note `/docs/redesign/notes-p2-apps-data-paths.md` exists
- [ ] Commit message: `P2-09: fix apps-data.jsx URL paths for /apps.html root location`

---

### P2-10 — Investigate `/apps.html` loading `redesign/about.css` + `redesign/about-v2.css`

**Problem:** `/apps.html` (lines 63-64) loads `redesign/about.css` and `redesign/about-v2.css` — but these are about-page-specific stylesheets (`.aA-`, `.aB-`, `.aC-`, `.aD-` selectors). Probably a copy-paste leftover from cloning the about template, OR the apps page depends on shared `.ab-` primitives defined in those files.

**Investigation steps:**
1. Grep `/redesign/apps-v1.jsx` for any class names starting with `.aA-`, `.aB-`, `.aC-`, `.aD-`, or `.ab-`
2. Grep `/redesign/apps-v1.css` for any `@import` of `about.css` content
3. Read the head of `/redesign/about.css` to see if it defines shared primitives outside the `.aA-`/`.aB-`/`.aC-`/`.aD-` namespaces
4. Manually disable both `<link>` tags in `/apps.html` (comment out) and reload the apps page in a browser. Observe.

**Decision tree:**
- If the apps page renders identically without the about CSS → leave the link tags commented or delete them. Apps doesn't need about CSS.
- If the apps page breaks (layout shift, broken cards, missing styles) → leave the link tags in place. Apps depends on shared primitives from about CSS.
- Document the result either way.

**Document in `/docs/redesign/notes-p2-apps-about-css.md`:**
- What you found in the grep
- What you saw when you disabled the link tags
- Final decision: keep, delete, or move shared primitives to a new shared file
- If "move shared primitives": flag for post-work integration (Person 1's about.css is involved, so don't fix during dual-person work)

**Acceptance:**
- [ ] Investigation complete
- [ ] Decision documented in `/docs/redesign/notes-p2-apps-about-css.md`
- [ ] If link tags removed/commented: `/apps.html` updated. If left in: no change to `/apps.html`.
- [ ] Commit message: `P2-10: investigate apps.html about.css loading + document decision`

---

### P2-11 — Open PR `feature/redesign-P2` → `dev-re-design`

**Action:**

```bash
gh pr create --base dev-re-design --head feature/redesign-P2 \
  --title "Redesign migration — Codex pages + design system docs (P2)" \
  --body "$(cat <<'EOF'
## Summary
- Hoists 4 codex pages (services, projects, ai, apps) to root
- Hoists Unity Web Design internal docs page + UWD assets
- Copies codex-shared.css to /redesign/
- Replaces folder /index.html with redirect stubs (writes /services/index.html stub fresh)
- Fixes apps-data.jsx URL paths for new root location
- Investigates apps.html about.css loading
- Migrates REDESIGN docs to /docs/redesign/

## Scope
Per /docs/REDESIGN-MIGRATION.md — Person 2 ownership only. Person 1's PR (feature/redesign-anchor) covers landing/about/contact + global chrome.

## Test plan
- [ ] `/services.html`, `/projects.html`, `/ai.html`, `/apps.html` all render
- [ ] All 4 folder URLs (`/services/`, `/projects/`, `/ai/`, `/apps/`) redirect to flat .html files
- [ ] `/ai/demo/` still serves (NOT shadowed by stub)
- [ ] All 8 `/apps/<demo>/` subfolders still serve
- [ ] `/apps.html` "Launch app" buttons all work (P2-09 path fix)
- [ ] `/Unity Web Design.html` renders design system docs

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Acceptance:**
- [ ] PR opened against `dev-re-design`
- [ ] All status table rows for P2 marked `[x]` in `/docs/REDESIGN-MIGRATION.md`
- [ ] PR URL pasted into `/docs/REDESIGN-MIGRATION.md` for cross-reference

---

## When you're done

1. Verify all P2-NN rows in `/docs/REDESIGN-MIGRATION.md` status table are `[x]`
2. Wait for Person 1's PR to also merge into `dev-re-design`
3. Post-work integration pass (NOT your job during dual-person work) handles root doc updates by reading `/docs/redesign/notes-p2-*.md`

**Do NOT:**
- Edit root `README.md`, `ARCHITECTURE.md`, `FINALIZED.md`, `TODO.md` during this work
- Touch any file in Person 1's ownership column (global chrome, /index.html, /about.html, /contact.html, root configs, sitemap, /_archive/, /chats/)
- Delete or modify any out-of-scope file (per "don't remove anything")

---

## If something goes wrong

- **Codex page won't render?** Check `/redesign/codex-shared.css` was copied. Codex pages REQUIRE it. Check `/redesign/<page>-v1.{css,jsx}` and `/redesign/<page>-data.jsx` were all copied.
- **Stub doesn't redirect?** Check `<meta http-equiv="refresh">` and `window.location.replace()` in the stub HTML. The fresh `/services/index.html` stub you wrote needs the same structure as the others.
- **`/ai/demo/` 404'd after migration?** Your `/ai/index.html` stub may be wrong or there's a server-config issue. The stub should ONLY handle `/ai/`, not deeper paths. Revert the stub and ask Gee.
- **Apps demo links 404 after P2-09?** Check the relative paths. From `/apps.html`, `./apps/unityDemo/unity.html` resolves to `/apps/unityDemo/unity.html`. Verify the demo subfolder structure with `ls /apps/unityDemo/`.
- **Found a broken thing in Person 1's territory?** Write a note to `/docs/redesign/notes-p2-<topic>.md`. Do NOT fix it.
- **Stuck or confused?** Re-read `/docs/REDESIGN-MIGRATION.md`. Then ask Gee.

---

*Person 2 task list. Run it top-to-bottom. Update the migration doc as you go. Push after each commit.*
