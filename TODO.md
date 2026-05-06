# TODO.md - Unity AI Lab Active Tasks

---

## P0 - CRITICAL (Fixed)

### [x] Image Loading Failure in Demo Page
**Status:** FIXED - 2025-12-19
**Location:** `ai/demo/js/chat.js`
**Root Cause:** Event handler timing - handlers were attached AFTER the img element entered the DOM, inside a 500ms setTimeout. The browser was firing onerror before handlers existed.

**Fix Applied:**
1. Moved `img.onload` and `img.onerror` handlers to IMMEDIATELY after img element creation
2. Set `img.src` IMMEDIATELY after handlers (before DOM insertion)
3. Removed broken setTimeout/fetch blob approach
4. Now matches the working pattern from `test-image.html`

**Files Modified:**
- `ai/demo/js/chat.js` - Complete rewrite of image handling logic

---

## P1 - HIGH PRIORITY

### [x] Redesign-merge integration pass (PR #44 + PR #45 → dev-re-design)
**Status:** DONE — 2026-05-06 (commits 6e1cb04 P1 + 8891366 P2; verification + INT docs in 9-something integration commit)

### [x] Fix Alfredo→Alfreddo spelling everywhere on live site
**Status:** DONE — 2026-05-06
**User direction (verbatim, LAW #0):**
> "Alfredo - is spelt Alfreddo. Please correct the about and anywhere else necisary."

**Scope fixed:**
- 7 root HTMLs (index, about, contact, services, projects, ai, apps) — 19 occurrences total
- 3 redesign/* live runtime files via `git update-index --cacheinfo` (Windows case-fold workaround):
  - redesign/v-d-sections.jsx — footer credit (line 585)
  - redesign/about-data.jsx — about page bio (lines 347, 353)
  - redesign/gothic-init.js — header comment (line 3)

**NOT modified (out of scope):**
- _archive/exploration-shells/Gothic Landing.html — historical preservation
- REDESIGN/* canonical source — slated for INT-04 deletion
- project/* — explicitly out-of-scope diverged fork
**Branch:** `dev-re-design` (current)
**User direction (verbatim, LAW #0):**
> "There are 2 PRs on this repo, #44 & #45, these are for P1 & P2 - These need merging together on the current repo branch. There is also additional iformation on the PRs pull requests; as well as known problems markdown files. I need you to go throught and complete the pull requests going into the branch please maks eure the redisign is upto specifications. I need you to make sure everything is wired up and properly follows the redisign specifications, thank you."

**Scope:**
- Merge `feature/redesign-P1` (#44) into `dev-re-design`
- Merge `feature/redesign-P2` (#45) into `dev-re-design`
- Verify redesign is up to specifications per `docs/REDESIGN-MIGRATION.md`
- Verify everything is wired up and properly follows the redesign specifications
- Read PR bodies + `docs/KNOWN-PROBLEMS.md` + all `/docs/redesign/notes-p[12]-*.md`
- Smoke test before declaring complete

### [x] Redesign demo page + update apps to follow redesign specifications
**Status:** DONE — 2026-05-06 (commits b41afef P3-00 + 4dfba5a P3-01 + d957b69 P3-02 + a5e6f45 P3-03 + this docs commit P3-04 on branch `feature/redesign-P3-demo-and-apps`; FINALIZED entry written verbatim per LAW #0 + FINALIZED-before-DELETE rule; PR pending)
**Branch:** `feature/redesign-P3-demo-and-apps` (off `dev-re-design`)
**User direction (verbatim, LAW #0):**
> "Create a new feature branch, based on the current branch that is focusing directly on redesigning the actual demo page and updating the apps. Based on the files that were recently redesigned (check latest git commit history) the demo and app pages need updating accordingly- following the redesign specifications."

**Scope:**
- Create `feature/redesign-P3-demo-and-apps` off `dev-re-design`
- Redesign `/ai/demo/` (the 8000-line interactive demo) to follow the redesign chrome spec — gothic palette, Trajan Pro / Cormorant Garamond / JetBrains Mono / Inter typography, crimson + bone tokens from `redesign/shared-tokens.css`, drop Bootstrap dep, drop dep on legacy `../../styles.css`
- Update the 8 app demos (`apps/unityDemo`, `apps/textDemo`, `apps/personaDemo`, `apps/talkingWithUnity`, `apps/helperInterfaceDemo`, `apps/slideshowDemo`, `apps/screensaverDemo`, `apps/oldSiteProject`) to follow redesign specifications via the shared-theme/shared-nav bridge layer
- Match the GothicNavbar HTML + class names from `redesign/v-d-chrome.jsx` so apps feel like volumes of the same codex
- Per-app CSS polish where Bootstrap leaks or palette drifts
- Smoke-test via `py -m http.server`, write notes under `/docs/redesign/notes-p3-*.md`, update `docs/REDESIGN-MIGRATION.md` with P3 status, open PR back into `dev-re-design`

**Reference state (latest commits per `git log --oneline`):**
- 40b4d53 Fix stale Docs/ path refs after Docs→docs rename
- 7f212c3 Cross-platform compat: rename Docs→docs and REDESIGN→_archive/redesign-source
- a4e34c4 Fix: Alfredo→Alfreddo spelling correction
- 1a9a581 INT-final: redesign-merge integration pass
- 8891366 Merge PR #45 (P2 — codex pages + design system docs)
- 6e1cb04 Merge PR #44 (P1 — anchor pages + global chrome)

**OUT of scope on this branch:**
- Old-stack files unrelated to demo/apps (`/js/`, `/vendor/` core, `/styles.css`, `/styles.min.css`, `/script.min.js`)
- `/project/` diverged fork
- `/downloads/` static assets
- `INT-05`/`INT-06` (PR up to develop/main) — handled separately

---

### [x] Eliminate Docs/docs and REDESIGN/redesign Windows case collisions
**Status:** DONE — 2026-05-06
**User direction (verbatim, LAW #0):**
> "Due to some noticed issues with the cross-platform work being done (P1 was done initially on linux, while P2 was done on windows), and the fact we are currently working in windows, there are some case sensitive issues with the current branch and PRs that where made, and we need to go through and take what was having conflicts with the case sensitivity / insensitivity in windows, and ensure that we can re-work some things to ensure proper cross-platform (windows + linux) compatability, so we dont get these conflicts with files / folders we where initially getting."

**Done:**
- Moved 8 `Docs/*` (capital D) → `docs/*` (lowercase) — pre-redesign project docs (API_COVERAGE.md, CACHE-BUSTING.md, ImHandicapped.txt, N8N_WEBHOOK_INTEGRATION.md, PollinationsDocsRefferences.txt, ROADMAP.md, SEO_IMPLEMENTATION.md, evil.txt) — zero relative-path overlap with redesign-migrated docs already in `docs/`
- Moved 70 `REDESIGN/*` (canonical source) → `_archive/redesign-source/*` — preserves all 70 files including the 13 unique exploration files (about-a-dossier, about-b-reliquary, about-c-cathedral, about-d-manifest, about-data.v1, design-canvas, shared-sections, stubs/*, v-d-smoke-v1.js.bak); satisfies INT-04 spirit without destroying historical content
- Used `git update-index --add --cacheinfo` + `--force-remove` for index manipulation (bypasses Windows case-fold)
- `rm -rf REDESIGN/ Docs/` to clear case-folded on-disk folders, then `git checkout-index -a -f` to restore working tree at proper lowercase paths
- Verified zero case collisions remain via `awk '{print tolower($1)}' | sort | uniq -d` — empty output
- Live site smoke test still green: lowercase `redesign/*` paths serve unchanged

---

## P2 - MEDIUM PRIORITY

*No active P2 tasks*

---

## P3 - LOW PRIORITY

*No active P3 tasks*

---

*Unity AI Lab - Task Tracking*
