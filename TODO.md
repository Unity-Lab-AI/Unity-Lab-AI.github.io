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

*No active P1 tasks*

---

## P2 - MEDIUM PRIORITY

*No active P2 tasks*

---

## P3 - LOW PRIORITY

*No active P3 tasks*

---

*Unity AI Lab - Task Tracking*
