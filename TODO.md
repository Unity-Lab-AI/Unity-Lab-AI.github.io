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
- Verify redesign is up to specifications per `Docs/REDESIGN-MIGRATION.md`
- Verify everything is wired up and properly follows the redesign specifications
- Read PR bodies + `docs/KNOWN-PROBLEMS.md` + all `/docs/redesign/notes-p[12]-*.md`
- Smoke test before declaring complete

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
