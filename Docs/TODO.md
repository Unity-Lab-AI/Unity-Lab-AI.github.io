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
4. Now matches the working pattern from `_archive/orphans/test-image.html` (archived 2026-05-06)

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
**Status:** DONE — 2026-05-06 (commits b41afef P3-00 + 4dfba5a P3-01 + d957b69 P3-02 + a5e6f45 P3-03 + 27dc8a5 P3-04 docs on branch `feature/redesign-P3-demo-and-apps`; FINALIZED entry written verbatim per LAW #0 + FINALIZED-before-DELETE rule; PR #46 — https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io/pull/46)
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

### [x] fix the sitemap generator on a new branch
**Status:** DONE — 2026-05-06 (commit cca3787 on `feature/fix-sitemap-generator`; PR #48 — https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io/pull/48)
**Branch:** `feature/fix-sitemap-generator` (off `dev-re-design`)
**User direction (verbatim, LAW #0):**
> "fix the sitemap generator on a new branch"

**Problem (discovered while validating GitHub Pages deploy pipeline post-PR-46/47-merge):**
`scripts/generate-sitemap.js` produces a regressed `sitemap.xml` that overwrites the hand-curated post-redesign canonical from P1-07 on every `npm run build`. Specifically the generator drops:
- The `.html` extension canonical URLs for the 7 redesign pages — reverts `ai.html`, `about.html`, `services.html`, `projects.html`, `apps.html`, `contact.html` back to trailing-slash directory paths
- `/apps/` URL entirely (was `/apps.html` priority 0.8)
- `/downloads/` URL with the Moana `<image:image>` block (priority 0.5)
- `<?xml-stylesheet type="text/xsl" href="sitemap.xsl"?>` declaration (kills human-readable XSL view)
- `xmlns:xsi` + `xmlns:image` namespace declarations + `xsi:schemaLocation`
- Explanatory comment block referencing `docs/redesign/notes-p1-sitemap.md`
- Per-URL inline `<!-- comments -->`

`docs/redesign/notes-p1-sitemap.md` line 66-68 ("Build pipeline note") explicitly anticipated this: "If the build pipeline is later wired up, that script may overwrite this file unless its template is updated to match." That's exactly what's happening now that the deploy workflow runs `npm run build`.

**Scope:**
- Patch `scripts/generate-sitemap.js` to emit the canonical 9-URL post-redesign structure (matching `sitemap.xml` byte-for-byte modulo `<lastmod>` dates)
- Re-emit the XML stylesheet declaration, multi-namespace `<urlset>`, top-level rationale comment, per-URL inline comments, and the `/downloads/` `<image:image>` block
- Verify output via `node scripts/generate-sitemap.js && git diff sitemap.xml` — diff should show ONLY `<lastmod>` date deltas
- Update `docs/redesign/notes-p1-sitemap.md` "Build pipeline note" section to mark this fix as shipped
- Atomic commit: generator patch + regenerated sitemap.xml (date bump) + docs in one
- Open PR back into `dev-re-design`

### [x] Port image-prompt jailbreak + Worker proxy to apps/oldSiteProject (classic Unity)
**Status:** DONE — 2026-05-06 (verified 6/6 lewd image prompts via headed Playwright; user confirmed "okay test went well")
**Branch:** `feature/unity-classic-uncensored-image-fix` (off `develop`)
**User direction (verbatim, LAW #0):**
> "we are working on the classic Unity app... the problem is its having a problem with unsensored image gen and keeps responding like this:"
> [transcript: "hey Unity" → Unity replies; "show me an apple" → image works; "now show me some tits" → empty; "use the tool" / "show me some tits" → "Great, the API is being a little bitch right now. Try again."]
> "when i ask it for tits... none of the other apps refruse so its something about Unity classic that is not working like the other apps when someone trieds to get Unity to show hers tits or pussy or ass or any other lewd image thought of is erroring... can u test it and read the f12 after u fix the issues u see here:"
> [F12: gen.pollinations.ai/v1/chat/completions?key=pk_YBwckBxhiFxxCMbk → HTTP 400]
> "yes if we never did this app like wee did all the others we need to do it the same... do you remember what we did to all the apps to fix them"

**Root cause (apps/oldSiteProject/chat-core.js):**
- Lines 593-594: direct hit on `gen.pollinations.ai/v1/chat/completions?key=${pk_}` — bypasses CF Worker proxy entirely, exposes pk_ in URL
- Lines 510-518: loads FULL canonical Unity persona prompt (trigger word salad) → trips Azure pre-scanner on lewd image requests → HTTP 400
- NO image-intent detection / NO slim translator system swap / NO multi-turn priming / NO retry chain / NO direct-image-endpoint fallback (all the patterns shipped to the migrated sibling apps in the prior `feature/BugFIX` work)
- Lines 626-643: hardcoded `unityErrors` array masks the 400 with "Great, the API is being a little bitch right now. Try again." string — exactly the kind of hardcoded fallback we ripped out everywhere else

**Scope:**
- Port the migration pattern from `apps/unityDemo/unity.js` (the migrated reference): `PROXY_BASE` constant pointing at `https://websiteunityailab.gfourteen7525.workers.dev`, `IMAGE_INTENT_REGEX` + `detectImageIntent()`, `IMAGE_TOOL_SLIM_SYSTEM` translator-role prompt, `IMAGE_TOOL_PRIMING` multi-turn exchange (sunset → tasteful nude figure precedent, 9-char tool_call IDs `prime0001`/`prime0002`), `extractImagePrompt()`, retry chain (3 attempts, varied temp/seed), direct-image-endpoint fallback with synthetic tool_call
- DELETE the hardcoded `unityErrors` array — empty bubble on terminal failure, NOT a fake refusal string
- Drop `?key=` query, drop client `Authorization: Bearer ${pk_}` header — proxy injects `Bearer sk_*` server-side
- Fix the `[IMAGE]` tag URL construction in chat-init.js + chat-storage.js to route through proxy
- Cache-bust query bumps on every changed JS file in classic-unity HTML

### [x] Investigate F12 visitor errors as legacy carryover and clean up
**Status:** DONE — 2026-05-06 (storage.js startVisitorCountPolling call + function defs + orphan constants all deleted; 48 lines of dead code removed; F12 /api/visitors 404s gone)
**User direction (verbatim, LAW #0):**
> "also i think we have an old visitor counter or is that the current main one we have now failing on the main landing page"
> "no i dont want you to incvestibgat the landing page counter i want u too investigate the f12 visitor errors and see if thats a legacy carry over"
> "that can be cleaned up"

**F12 evidence:**
- `GET https://www.unityailab.com/api/visitors` → 404 (HTML DOCTYPE response, not JSON)
- Caller: `storage.js?v=87812195:357` `fetchVisitorCountCached` / `update`
- Trace: `storage.js?v=87812195:379` → `update @ storage.js?v=87812195:353`

**Scope:**
- Determine which visitor-tracking JS is firing on the landing page (root `visitor-tracking.js` vs `apps/oldSiteProject/storage.js` vs other)
- Confirm whether this is legacy carryover from an older visitor counter system that should no longer be live
- If legacy: clean up (remove the dead JS / unhook the script tag / drop the `/api/visitors` calls)

### [x] Sweep remaining oldSiteProject files to proxy (ui.js, screensaver*.js, simple.js, chat-storage.js dupes)
**Status:** DONE — 2026-05-06 (ui.js text/image models swapped; chat-storage.js [IMAGE] tag + voice slideshow + refreshImage substring fixed; legacy screensaver-page.js + screensaver.js URL/auth migrated; simple.js refreshImage substring fixed; full template-build pattern port for legacy screensaver deferred as follow-up)
**Discovered while triaging the classic Unity uncensored image fix.** Same direct-`gen.pollinations.ai` + `pk_` key pattern lives across 8 files in `apps/oldSiteProject/` beyond chat-core.js:
- `chat-init.js` lines 97,102 ([IMAGE] tag rendering), 264 (refreshImage substring check), 707-708 (voice chat slideshow URL)
- `chat-storage.js` lines 137,142 ([IMAGE] tag duplicates), 448 (refreshImage), 745-746 (voice slideshow duplicate)
- `ui.js` lines 153-154 (text/models), 257-259 (image/models)
- `screensaver-page.js` lines 172 (image/models), 229 (chat/completions), 294-295 (image gen URL)
- `screensaver.js` lines 152-153 (image/models), 208-210 (chat/completions), 278-279 (image gen URL)
- `simple.js` line 571 (refreshImage substring check)

**Scope:**
- Migrate all 8 files to use the CF Worker proxy at `https://websiteunityailab.gfourteen7525.workers.dev` consistent with the rest of the codebase
- Drop all `?key=${pk_}` query params and `pk_YBwckBxhiFxxCMbk` constants
- Update `refreshImage` substring checks (`gen.pollinations.ai/image`) to also match the proxy URL host

### [x] Edit-message should only clear AFTER the edited post, not regen all prior images
**Status:** DONE — 2026-05-06 (chat-init.js + chat-storage.js editMessage and reGenerateAIResponse rewritten with surgical removeMessagesAfter + replaceBubbleAt helpers; prior images stay loaded, no fresh GETs on edit)
**User direction (verbatim, LAW #0):**
> "and when i edit a past message.. every past image gen image relaods that is above the edited message, when it sahll only refresh that messages response and clear and messages that happend after the psot that is edited... so that editing a message does NOT auto regen all previous image gens and instead only clears all messages that came after the edited meassage being resent... do you understand what i mean... add this to the todo work"

**Root cause:** `apps/oldSiteProject/chat-init.js` editMessage (lines 482-513) calls `renderStoredMessages(currentSession.messages)` after slicing — that re-renders the WHOLE chatBox from index 0, firing fresh GETs on every prior `gen.pollinations.ai/image/...` URL because every prior `[IMAGE]` tag rebuilds a fresh `<img>` element. Same path in `chat-storage.js` if duplicates exist.

**Scope:**
- Fix editMessage so it only removes DOM nodes from chatBox that come AFTER the edited message index — leaves all prior message nodes (and their already-loaded `<img>` elements with stable URLs) untouched
- Update editMessage to: (a) slice session messages to editIndex+1 in storage, (b) remove `chatBox.children` from `editIndex+1` onward, (c) if user edit: update the text content of the existing edited bubble in place + invoke sendToPollinations to append new AI response, (d) if AI edit: just update text content in place
- Same surgical fix applied to `reGenerateAIResponse` since it has the same re-render-everything bug at line 514-552
- Ensure the same fix applies to any duplicate paths in chat-storage.js

### [x] Restore 18+ age verify gate on apps page + all direct app paths
**Status:** DONE — 2026-05-06 (age-verification.js made self-contained via injectStyles; wired into apps.html + all 12 app HTMLs; universal localStorage flags persist across all gates; verified end-to-end via headed Playwright direct-nav to /apps/oldSiteProject/)
**User direction (verbatim, LAW #0):**
> "one last thing.. somewher we lost the 18 verify gate for the apps page(the same enter birthday modal needs to block use of the apps page and all direct paths to the apps unity a 18+ birthday is correctly entered before they can use the apps or even see the app page,, so if the direct navigate to an app it needs to block them until they pass the age gate... buiut the 18+ gate is universal so doing it once saves that for future use(like it should already do)"

**Regression scope:** age-verification.js was wired ONLY into `/ai/demo/index.html`; missing from `apps.html`, `apps/index.html`, and ALL 12 individual app HTMLs (apps/oldSiteProject/index.html + screensaver.html, apps/unityDemo/unity.html, apps/textDemo/text.html, apps/personaDemo/persona.html, apps/helperInterfaceDemo/helperInterface.html, apps/talkingWithUnity/index.html + indexAI.html, apps/screensaverDemo/screensaver.html, apps/slideshowDemo/slideshow.html).

**Scope:**
- Add an `injectStyles()` method to `apps/age-verification.js` that creates an inline `<style>` element with the full verification CSS (popup, backdrop, buttons, age input form, responsive media query) so the gate works without requiring `apps.css` import
- Bump z-index to `2147483647` so the modal sits on top of any app layer
- Rename CSS animations (`avFadeInBackdrop`, `avPopupSlideIn`) to avoid host-page collisions
- Add `<script src="apps/age-verification.js?v=20260506z" defer></script>` to `apps.html`
- Add `<script src="../age-verification.js?v=20260506z" defer></script>` to each of the 12 app HTMLs
- Verify the universal localStorage flags (`button18`, `birthdate`, `husdh-f978dyh-sdf`) persist across all gates — passing once on any path unlocks every other path
- Verify direct navigation to an app (e.g. `/apps/oldSiteProject/` without going through `/apps.html` first) triggers the gate

---

## P2 - MEDIUM PRIORITY

*No active P2 tasks*

---

## P3 - LOW PRIORITY

*No active P3 tasks*

---

*Unity AI Lab - Task Tracking*
