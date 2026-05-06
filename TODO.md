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

---

## P2 - MEDIUM PRIORITY

*No active P2 tasks*

---

## P3 - LOW PRIORITY

*No active P3 tasks*

---

*Unity AI Lab - Task Tracking*
