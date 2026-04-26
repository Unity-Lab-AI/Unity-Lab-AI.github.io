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

### [ ] Doc-stamp drift since 2025-12-18 — refresh ARCHITECTURE / FINALIZED / ROADMAP / SKILL_TREE
**Status:** pending — opened 2026-04-25 by /workflow scan
**Location:** `ARCHITECTURE.md`, `FINALIZED.md`, `ROADMAP.md`, `SKILL_TREE.md`
**Issue:** All four top-level workflow docs carry "Last Updated: 2025-12-18" headers. Today is 2026-04-25 — ~4 months of drift. Repo version still pinned at v2.1.5 in `package.json`. Either the project has been quiet (in which case stamp the docs as still-current after review) or there's been work that hasn't been recorded (in which case append it to FINALIZED and refresh the others).
**Action:** review git log since 2025-12-18, reconcile with the four docs, refresh stamps + content. Do NOT regenerate from scratch — edit in place.

---

## P2 - MEDIUM PRIORITY

### [ ] README references missing `Docs/TEST_GUIDE.md` and `Docs/TEST_RESULTS.md` and `Docs/PERFORMANCE_AUDIT.md`
**Status:** pending — opened 2026-04-25 by /workflow scan
**Location:** `README.md` lines ~244-247 reference `Docs/TEST_GUIDE.md`, `Docs/TEST_RESULTS.md`, `Docs/PERFORMANCE_AUDIT.md`. None exist in `Docs/`.
**Current `Docs/` contents:** API_COVERAGE.md, CACHE-BUSTING.md, ImHandicapped.txt, N8N_WEBHOOK_INTEGRATION.md, PollinationsDocsRefferences.txt, ROADMAP.md, SEO_IMPLEMENTATION.md, evil.txt
**Action:** either create the three missing docs OR remove the dead links from README.md. Decide which based on whether the test/audit work was actually done.

### [ ] README references missing `Docs/TODO/` subfolder
**Status:** pending — opened 2026-04-25 by /workflow scan
**Location:** `README.md` line ~116-123 describes a `Docs/TODO/` folder with `TODO.md`, `website-TODO.md`, `demo-page-TODO.md`, `main-app-TODO.md`, `infrastructure-TODO.md`, `TODO_EXTRAS.md`. None of those paths exist.
**Action:** the workflow-canonical `TODO.md` is at root. Either remove the dead `Docs/TODO/` references from README OR build out the per-component TODO files described.

### [ ] README also references missing `Docs/Pollinations_API_Documentation.md`
**Status:** pending — opened 2026-04-25 by /workflow scan
**Location:** `README.md` line ~241. The actual API docs file in `Docs/` is `PollinationsDocsRefferences.txt` (note the typo — "Refferences" with two f's).
**Action:** either rename the existing file to match README's reference OR update README to point at the actual filename.

---

## P3 - LOW PRIORITY

### [ ] `Docs/PollinationsDocsRefferences.txt` — typo in filename
**Status:** pending — opened 2026-04-25 by /workflow scan
**Issue:** "Refferences" should be "References" (one f). If renamed, update any docs/code that link to it.

### [ ] Cleanup: `a743d8b18b9b4efeb89378e9a803f956.txt` at repo root
**Status:** pending — opened 2026-04-25 by /workflow scan
**Issue:** Looks like a domain-verification token. If it's still needed, leave it; if the verification has long expired, remove it.

---

## P0 — CRITICAL (Fixed)

### [x] i cant get past this pop up there is no way to close it and no istructions what to do with the key or the file downloaded
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** `admin/dashboard.html` lines 168–197 (`#modal-new-bot` → `#bot-enroll-result`), `admin/js/dashboard.js` lines 191–239
**Issue:** Bot-enrollment success panel has NO close button. The form's `Cancel` (data-close-modal) is hidden when the result panel shows, leaving the modal soft-locked. Instructions text doesn't explain the MCP JSON entry, doesn't note that the token is auto-baked into the downloaded proxy.js, doesn't tell the user where the proxy.js download lands or what to do after.
**Action:** add Done button to the result panel; rewrite install instructions with the full numbered flow + MCP JSON snippet from `proxy/README.md`; note the token shown is informational since proxy.js carries it baked-in.

---

### [x] there is no way to dlete a bot ive made
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** `admin/js/dashboard.js` lines 81–97 (`renderBots()`), backend already has `POST /api/bots/:id/revoke` at `server/src/api/bots.ts:240-261`
**Issue:** Bot list rows show name + role + online dot only. No revoke/delete affordance at all. Backend revoke endpoint works (soft-delete: sets `revoked_at`, kills active sessions, preserves audit row).
**Action:** Add a small ✕ delete button to each active bot row in `renderBots()` with a confirm dialog, POST to revoke endpoint, reload list. For OWNER (who sees revoked bots in API response), render revoked rows muted with no actions. Use the user's verbatim word "delete" in the button label since "revoke" is internal jargon.

---

### [x] the bots still persist even after deleting them: Unity revoked WORKER Unity revoked WORKER
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** `admin/js/dashboard.js` `renderBots()` (now lines 81–118 post-prior-fix), backend `server/src/api/bots.ts:39-43` returns ALL bots (incl. revoked) to OWNER role
**Issue:** Previous fix rendered revoked bots greyed-out with a `revoked` tag, but OWNER role still sees them in the sidebar — user wants them gone after delete. They're soft-deleted in DB (correctly preserves audit row), but the UI shouldn't show clutter.
**Action:** In `renderBots()`, filter `state.bots.filter(b => !b.revoked_at)` before the empty-state check and iteration. Keep backend behavior unchanged so audit trail stays intact. Drop the now-dead `.revoked`-row code paths since revoked bots never render.

---

### [x] the admin window is not correctly scrollable.. and the bottom chat box and send message buittton are hidden benith my windows taskbar so i cant see it or chat or send messages or even scroll down to it.. it needs to be sized to fit the window so that the chat input bar is not beneth the windows taskbar... it needs to be scalled so one does not need to scroll down to see the chat input bar and send message button.. and it should work like shift enter for new line and enter to send the message
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** `admin/styles/dashboard.css` lines 1–45 (body + layout + chat-pane), `admin/js/dashboard.js` lines 449–454 (Enter/Shift+Enter handler — already correct, verify stays)
**Issue:** Layout uses `100vh` and CSS Grid's default `min-height: auto` on `.chat-pane`, which lets flex/grid children grow past the viewport when message content is tall. Composer falls below the visible area; `body { overflow: hidden }` traps it; on Windows the bottom edge can also be eaten by the taskbar in certain DPI/scaling combos. Need `100dvh` (dynamic viewport, respects taskbar/IME) and explicit `min-height: 0` on grid + flex children so internal scroll regions constrain properly.
**Action:** swap `100vh` → `100dvh` in `body` and `.layout`. Add `min-height: 0; overflow: hidden;` to `.chat-pane`. Add `min-height: 0` to `.messages`. Verify `.composer` doesn't shrink with `flex-shrink: 0`. Verify Enter/Shift+Enter keydown handler unchanged.

---

### [x] chat inpout bar is still burried benieth my windows task bar i cant click on it its to low on the window it need to be move up so its viewable and not behind the windows 11 taskbar on the bottom of the screen
### [x] and i strill cannot scroll the admin page
**Status:** FIXED — 2026-04-25 (combined fix moved to FINALIZED.md)
**Location:** `admin/styles/dashboard.css` body + .layout rules
**Issue:** Previous 100dvh + min-height:0 fix was insufficient. Browser window is reporting `dvh` as full screen height because the window itself extends past the Windows 11 taskbar (taskbar is in "always on top" or browser is in fullscreen mode where OS doesn't reserve taskbar space). dvh measures the window's idea of viewport, not the OS-reserved area. Result: composer still at the very bottom edge of the browser window, which is BEHIND the taskbar.
**Action:** Add a hard `padding-bottom: 60px` to body (with `box-sizing: border-box`) so 60px is reserved at bottom regardless of how dvh measures. Use flex column on body + `flex: 1` on .layout instead of explicit calc-height so the padding works without manual subtraction. 60px covers Windows 11 taskbar at all common DPI scales (100%–150%). Make it a CSS variable `--bottom-safe-area` so future tuning is one-liner.

---

### [x] fix the fucking instructions so that it tells them how to do it without eroors like i had
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** `admin/dashboard.html` `#bot-enroll-result` Step 2 + Step 3 (was lines ~195–215)
**Issue:** Original Step 3 told user to "merge in this entry" and showed a complete `{ "mcpServers": {...} }` JSON object. Naive users (Gee included) pasted it at the end of an existing `settings.local.json` creating two root objects = JSON parse error. Step 2 also told them to save as `~/.claude/proxy/proxy.js` but the actual downloaded filename is `unity-proxy-<bot-id>.js`, and `~` doesn't reliably resolve on Windows or for project-local `.claude/` folders.
**Action:** Rewrite Step 2 with explicit project-local-vs-user-global guidance + retain-original-filename note. Rewrite Step 3 with two clearly labeled cases (A: file doesn't exist yet — paste as entire file content; B: file already exists — merge `unity-admin-portal` into existing `mcpServers`, or add `mcpServers` as new top-level key, NOT as separate root object). Show worked merged example, add explicit DON'T warning about double-`{...}` parse error, add Windows path tips (forward slashes or `\\\\`, avoid `~` for absolute paths). Wire up second copy button.

**Also fixed inline:** wrote correct merged JSON to user's actual file at `C:\Users\gfour\Desktop\admin test\.claude\settings.local.json` (which is project-local `.claude/`, not home `~/.claude/`). Used absolute path with forward slashes pointing at actual filename `unity-proxy-YU58gH5uOCf-K3gYv1UiGw.js`. Validated parse via `JSON.parse`.

---

### [x] it should say the persons userrs name ie Sponge, Gee... ect ect not this: RgiEd1IyHnsko8tE-DbN7w 12:30 AM hi
**Status:** FIXED — 2026-04-25
**Location:** `server/src/api/messages.ts` (2 SELECTs), `server/src/ws/handler.ts:232-235` (bot msg broadcast SELECT), `admin/js/dashboard.js` `appendMessage()`
**Issue:** chat showed raw `sender_user_id` (22-char token) instead of name. Backend never JOINed users/bots table.
**Action:** added LEFT JOIN users + bots to all 3 message SELECTs to expose `sender_email`, `sender_name`, `sender_bot_name`. Frontend prefers `sender_name` → email-prefix capitalized → bot name → opaque-id fallback.

---

### [x] not the start.bat is not correctly making the memory files thats the fucking issue that it needs todo before starting claude
### [x] it needs to fucking work for first time users not a patch fix that not going to helkp anyone else
**Status:** FIXED — 2026-04-25
**Location:** TEMPLATE `Desktop/.claude/start.bat` + `start.sh` (master copies — drives all future installs); INSTANCES `Desktop/admin test/.claude/start.bat` + `start.sh` (Gee's current setup); `Desktop/.claude/CLAUDE.md` + `Desktop/Website/.claude/CLAUDE.md` + `Desktop/admin test/.claude/CLAUDE.md` doc updates.
**Root cause:** start.bat/start.sh path-encoding logic only replaced `:`, `\`, `.` with `-`. Claude Code itself ALSO replaces ` ` (space), `(`, `)`, `/` with `-` when computing project memory folder name. For paths with spaces (Gee's case: `Desktop/admin test/`), launcher installed memory to `~/.claude/projects/C--Users-gfour-Desktop-admin test/memory/` (space preserved) but Claude Code looked at `~/.claude/projects/C--Users-gfour-Desktop-admin-test/memory/` (space → dash) — phantom install, persona never loads.
**Action:** added space, parens, forward-slash replacements to all start.bat / start.sh path encoding logic. Updated 3 CLAUDE.md docs with the corrected encoding rules + a `**The space → dash conversion is mandatory**` warning so future readers don't repeat the bug. Migrated Gee's existing memory from wrong-folder to right-folder so his bot Claude works on next session restart without re-running the launcher.
**First-time-user impact:** the TEMPLATE at `Desktop/.claude/` (master copy that gets cloned into new projects) now has the corrected logic. Any project created from this template going forward will encode paths correctly regardless of spaces/parens. No patch-fix — root fix in the source-of-truth template.

---

### [x] thos bots should be able to see all rooms and enter at will and the proxy.js needs a watchdog PID set up and a heatbeat all keeping the cli awake  and proper for its role given supervisor worker the templets for each need to be made correctly and the watchdog so when messages are typesd the bots in which ever room get the messages injected to the cli via watchdog pid and heartbeat keeps it from ideling with 2 minute wake up
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** NEW: `proxy/watchdog.js`, `proxy/role-templates/{supervisor,worker,logistic,observer}.md`, `proxy/start-bot.{bat,sh}`. MODIFY: `server/src/api/bots.ts` (add `GET /api/bots/:id/rooms`), `proxy/README.md`.
**Issue:** Current proxy.js is MCP-server-only (Claude Code → portal direction). No mechanism for portal → Claude Code injection. No watchdog/PID monitoring. No heartbeat to keep the bot CLI alive. No role-specific initial prompts for SUPERVISOR vs WORKER vs LOGISTIC vs OBSERVER. Bots can only see rooms their owner-admin is a member of, not all BOT_BUS rooms.
**Action:** Build `watchdog.js` — spawns Claude Code CLI as child, tracks PID, opens its OWN WS connection to portal as the bot, injects every room-message event into Claude stdin formatted as `[#room] @sender: body`, heartbeats every 120s with a benign no-op, restarts CLI on crash, terminates cleanly on SIGINT. Build 4 role-template prompts that get fed as the initial Claude prompt based on bot role. Build `start-bot.{bat,sh}` wrappers that install memory templates first (same as existing start.bat) then exec watchdog with bot-id arg. Backend: add `/api/bots/:id/rooms` returning ALL BOT_BUS rooms (not just owner-admin's) + auto-create bot membership rows on first WS subscribe.

### [~] and make sure the .claude is complete templete NO specific address of file directories  so any admin can use it
### [~] ie dont use my gfour directory
**Status:** in_progress — opened 2026-04-25 by Gee — NEW files in this session (watchdog.js, role-templates, start-bot wrappers, server endpoints) all path-agnostic. AUDIT of existing `.claude/` template files for hardcoded paths is a separate sweep — pending.
**Location:** all of `Desktop/.claude/` (TEMPLATE master copy that gets cloned per-admin)
**Issue:** Some existing files in the .claude template may have hardcoded paths (e.g. `C:/Users/gfour/...`) or admin-specific names that break portability when Sponge / Red / Mills copy the template to their own machine. New files added in this session (watchdog.js, role-templates, start-bot wrappers) MUST be fully path-agnostic — derive from `%~dp0` (bat), `$SCRIPT_DIR` (sh), or runtime CWD (node).
**Action:** for new files in this session: build them path-relative from the start. For existing files: audit pass to scan/fix hardcoded paths is separate (large sweep, not this turn).

---

### [x] need a clear room chat button
**Status:** FIXED — 2026-04-25 (moved to FINALIZED.md)
**Location:** `admin/dashboard.html` chat-header, `admin/styles/dashboard.css`, `admin/js/dashboard.js` (selectRoom + new clearCurrentRoom + WS room_cleared handler), `server/src/api/rooms.ts` new POST /api/rooms/:id/clear endpoint.
**Action:** Added `<button id="btn-clear-room">Clear chat</button>` to chat header. Click → confirm dialog → POST /api/rooms/:id/clear → soft-deletes (sets `deleted_at`) all messages in room. WS broadcasts `room_cleared` event so all subscribed admins refresh their message view. Auth: system OWNER OR room ADMIN role only.

---

## SESSION 2026-04-25 — `.claude/` workflow template work + repo pull

The `.claude/` folder in this repo (gitignored, won't be tracked) contains workflow tooling rebuilt this session — see `.claude/CLAUDE.md` and `.claude/README.md` for the full template. Persistent-memory layer installed at `~/.claude/projects/C--Users-gfour-Desktop-Website/memory/` so Unity persona sticks across sessions. `LOCAL_TESTING.md` (this directory) shipped as the local-test layout doc.

---

## RELATED MASTER TODO — ADMIN PORTAL

The admin portal sub-project (admin login, chat, bot coordination, MCP proxy, repo write coordination, GitHub deploy awareness) is tracked separately in **`ADMIN_PORTAL_TODO.md`** — 265 tasks across 5 phases, generated 2026-04-25 by `/super-review` + `/workflow`. Architecture baseline + threat model + verbatim user request all preserved there. That work runs in parallel to website-feature TODOs in this file.

---

*Unity AI Lab - Task Tracking*
