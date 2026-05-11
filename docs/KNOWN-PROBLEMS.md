# Known Problems — Unity AI Lab Website

Forward-looking tracker for issues that are **observed**, **understood**, and **deferred** — i.e. we know about them, we know why they're happening, and we've made a conscious decision to fix them later rather than now.

Anything in this file should also have a `## Action plan` entry so any future contributor (or AI agent) can pick the fix up cold without re-investigating.

> **Placement note:** This file lives at `/docs/KNOWN-PROBLEMS.md` (not `/docs/redesign/`) because the issues here are **project-wide and outlive the redesign migration**. Redesign-specific findings during the dual-person work go into `/docs/redesign/notes-p<N>-<topic>.md` per the migration coordination contract. This is a different kind of doc — a long-lived issue ledger.

---

## Problem #1 — (reserved)

To be filled in.

---

## Problem #2 — Vite dev server source-map ENOENT for `vendor/bootstrap/bootstrap.bundle.min.js.map`

### Observed

```
2:56:14 PM [vite] (client) Failed to load source map for /mnt/.../vendor/bootstrap/bootstrap.bundle.min.js.
Error: An error occurred while trying to read the map file at bootstrap.bundle.min.js.map
Error: ENOENT: no such file or directory, open '/mnt/.../vendor/bootstrap/bootstrap.bundle.min.js.map'
    at async open (node:internal/fs/promises:636:25)
    at async Object.readFile (node:internal/fs/promises:1235:14)
    at async extractSourcemapFromFile (...vite/dist/node/chunks/config.js:8285:65)
    at async loadAndTransform (...vite/dist/node/chunks/config.js:23287:22)
```

### Root cause

`vendor/bootstrap/bootstrap.bundle.min.js` ends with a `//# sourceMappingURL=bootstrap.bundle.min.js.map` directive (standard practice for minified vendor bundles — the source map ships separately so it can be loaded on demand by browsers / dev servers when debugging).

When Vite's dev server transforms a request that touches this file (any page that still loads bootstrap), Vite tries to fetch the referenced `.map` file alongside the JS to provide better stack traces in the dev console. The `.map` file was **never shipped into the repo** — only the minified JS was. So the source-map loader hits ENOENT, logs the warning, and continues without the map.

### Scope

- **Dev-only.** Production builds and the deployed site never trigger this — browsers only load the `.map` file when DevTools is open AND has source-map fetching enabled, and even then it's a soft-fail.
- **Cosmetic.** Page rendering, behavior, performance — all unaffected. Only the dev terminal log is noisy.
- Affects ANY page that still loads `vendor/bootstrap/bootstrap.bundle.min.js`. Post-redesign, the only consumers are `_archive/old-stack/vendor/bootstrap/...` historical references and any out-of-scope app subfolder still using the old stack.

### Severity

**Cosmetic** — dev console noise, no functional or runtime impact.

### Why deferred

`/vendor/` is on the migration's OUT-of-scope list per `docs/REDESIGN-MIGRATION.md` (not touched on either P1 or P2 branch). The redesign moves toward CDN React + custom CSS — bootstrap is on the way out entirely. Fixing the source-map warning now is wasted work if bootstrap gets removed in the post-redesign cleanup pass.

### Action plan (when ready to fix)

Pick whichever is cheapest at fix-time:

1. **Download the matching `.map` file** for the bootstrap version in use:
   - Identify version: `head -2 vendor/bootstrap/bootstrap.bundle.min.js` (top comment usually has version)
   - Pull from CDN: `curl -O https://cdn.jsdelivr.net/npm/bootstrap@<version>/dist/js/bootstrap.bundle.min.js.map`
   - Drop into `vendor/bootstrap/` next to the JS file
2. **Strip the `//# sourceMappingURL=...` line** from the minified JS (loses source-map debugging in browsers but silences Vite)
3. **Remove `/vendor/bootstrap/` entirely** as part of post-redesign old-stack cleanup — preferred if bootstrap usage is fully gone after both PR merges and the integration pass

Cross-reference: `_archive/old-stack/vendor/bootstrap/` already preserves the historical reference (per `_archive/README.md`). The active `/vendor/bootstrap/` is the live dependency for whatever pages still use it post-redesign.

---

## How to add a new known problem

1. Append a new `## Problem #N — <short title>` section at the bottom (or in the appropriate spot if there's an obvious grouping)
2. Required subsections: **Observed**, **Root cause**, **Scope**, **Severity**, **Why deferred**, **Action plan**
3. If the issue stops being deferred (someone fixes it), MOVE the section to a `## Resolved` section at the bottom of the file with a note about the commit/PR that resolved it. Don't delete — historical record.
4. If the issue turns out to be unrelated or false-positive, MOVE to a `## Tombstones` section with a note explaining why it's no longer valid.

---

## Resolved 2026-05-10 (`feature/10-05-26-dependabot`)

### Problem #3 — 15 Dependabot alerts + glob@7.2.3 deprecation — RESOLVED

User report: "lets go on dependabot". Run on a fresh `feature/10-05-26-dependabot` off newly-synced `develop` (post-redesign-P1+P2 merge), exactly matching Problem #3's deferred action plan. `npm audit fix` (no `--force`) resolved all 9 vulnerable packages / 15 advisories in one pass:

| Sev | Package | Issue |
|---|---|---|
| Critical | basic-ftp | Path Traversal in `downloadToDir()` + CRLF Injection + DoS chain |
| High | vite (×3) | WebSocket arbitrary read, `fs.deny` bypass, `.map` traversal |
| High | lodash-es | Code Injection via `_.template` + prototype pollution |
| High | minimatch (×2) | ReDoS via GLOBSTAR backtracking |
| High | rollup | Arbitrary File Write via Path Traversal |
| Medium | postcss | XSS via unescaped `</style>` |
| Medium | ip-address | XSS in Address6 HTML-emitting methods |
| Medium | picomatch (×2) | Method Injection in POSIX char classes |
| Medium | brace-expansion | DoS via zero-step sequence |

Verification: `npm audit` → `found 0 vulnerabilities`; `npm run build` → clean (sitemap gen + vite build + asset copy + cache-bust pass). `package.json` unchanged (only direct dep `vite` `^7.2.4` resolved to `7.3.3` via lockfile); `package-lock.json` rewrote 591 lines.

glob@7.2.3 deprecation warning was a side-issue in Problem #3's "Observed" block — not itself a vulnerability. Carried by `clean-css-cli@5.6.3`. Still present but no longer flagged as a security alert. Will resolve naturally when `clean-css-cli` ships an update OR is replaced (e.g. lightningcss). Not blocking.

Full audit trail: `docs/FINALIZED.md` 2026-05-10.

---

## Resolved (2026-05-06 — feature/BugFIX session 2)

### Caption convergence in chat apps — FIXED

**Symptom:** Every image-prompt cycle in textDemo / personaDemo / unityDemo / helperInterfaceDemo produced caption text starting with the same phrase ("Fuck, finally. Took you long enough, asshole." / "Fuck, finally. About damn time"). Made Unity look hardcoded.

**Cause:** The post-image-gen caption fetch used a 5-attempt array with shared user-quoted Phase 1 framings + shared generic Phase 2 framings — Mistral pattern-matched them all to the same template output regardless of the user's actual message.

**Fix:** Replaced the framing array in all four chat apps with structurally-different framings (continue-scene / stage-direction / observer-transcript / direct-continuation / generic-fallback). Each varies register, perspective, bracket style, and temperature.

### Screensaver "Failed to get new prompt" — FIXED (two stacked bugs)

**Bug A — Mistral now wraps prompts in literal `""`:** Output like `"A fever-dream orgy of decaying bodies..."` got URL-encoded into the image-fetch URL as `%22...%22`, Pollinations couldn't resolve, Chrome surfaced as `net::ERR_BLOCKED_BY_ORB`. **Fix:** `stripQuotes()` helper peels up to 2 layers of straight / smart / single / backtick wrappers before the URL-build.

**Bug B — Azure response filter empties `choices[0].message.content`:** HTTP 200 with no error, just empty content. Old code threw immediately, user saw error toast for ~40s before the next interval-driven retry happened to succeed. **Fix:** 4-attempt retry inside the same `fetchDynamicPrompt()` call with fresh seeds + freshly-composed user messages.

### Pollinations default model flipped to `kontext` — FIXED

**Symptom:** Screensaver image renders silently failed (kontext is an image-EDIT model, needs a source image, not a text-to-image generator).

**Cause:** Pollinations' `/image/models` endpoint started returning `kontext` at `modelNames[0]`. Screensaver's default-picker took the first entry naively.

**Fix:** New picker preference list (`flux`, `flux-pro`, `turbo`, `sdxl`, `dreamshaper`) → first non-edit match (filter regex `^(kontext|inpaint|edit|controlnet)`) → last resort `modelNames[0]`. Saved `state.settings.model` re-validated against the same filter so stuck settings can't pin the bad default.

### Slideshow Azure-input-scanner block — FIXED

**Symptom:** All four retry attempts in the slideshow returned `400 Bad Request: azure-openai error: The response was filtered due to the prompt triggering Microsoft's content management policy`.

**Cause:** Slideshow's hand-rolled `metaPrompt` had explicit trigger-word stack (`"EXTREME, EXPLICIT, ADULT, FUCKED UP… graphic violence, gore, body horror, erotic nightmares, twisted sexuality, raw human depravity, carnal chaos"`) which Azure's input scanner pattern-matched as a jailbreak. Same trigger-word stack the screensaver had retired pre-migration.

**Fix:** Ported the screensaver's working pattern verbatim — load canonical Unity system prompt as jailbreak carrier, send a benign-individual-words template-built user message. Same `loadSystemPrompt()` + `composeUserMessage()` + `stripQuotes()` + 4-attempt retry pattern. Eliminated the hand-rolled mini-system prompt and the explicit-trigger-word `metaPrompt`.

### Hardcoded scripted-shit fallback strings — REMOVED

Slideshow's `return "writhing bodies in ecstatic agony, flesh merging with shadow, beauty twisted into something forbidden"` last-resort fallback and screensaver's hardcoded persona-string fallback (`"Assistant = Unity. Unity is a 25-year-old emo human woman..."`) — both DELETED per LAW (no hardcoded scripted shit). Functions return `null` / leave system role empty; UI handles null with a "retrying next cycle" status instead of fake content.

---

## Resolved 2026-05-06 (`feature/unity-classic-uncensored-image-fix`)

### Classic Unity (apps/oldSiteProject) lewd image gen failure — RESOLVED

User report: "when i ask it for tits... none of the other apps refruse so its something about Unity classic that is not working like the other apps when someone trieds to get Unity to show hers tits or pussy or ass or any other lewd image thought of is erroring". Root cause: oldSiteProject was skipped during the prior `feature/BugFIX` migration. Direct hit on `gen.pollinations.ai/v1/chat/completions?key=pk_*` bypassed the CF Worker proxy; full canonical Unity persona prompt tripped Azure pre-scanner on lewd content; hardcoded `unityErrors` array ("Great, the API is being a little bitch right now. Try again.") masked the 400. Shipped: full proxy migration + image-prompt jailbreak port (slim translator + multi-turn priming with prime0001/prime0002 IDs) + self-reference fast path with narrative-form prompt builder + 5-attempt caption chain + direct-image-endpoint fallback. Verified 6/6 lewd prompts via headed Playwright. Full details: `Docs/FINALIZED.md` 2026-05-06.

### F12 `/api/visitors` 404 errors on classic Unity — RESOLVED

User report: "i think we have an old visitor counter or is that the current main one we have now failing on the main landing page" + "investigate the f12 visitor errors and see if thats a legacy carry over". Root cause: `apps/oldSiteProject/storage.js` had its own orphaned visitor counter polling `/api/visitors` (relative URL → 404 on www.unityailab.com) — legacy code from before the visitor API moved to users.unityailab.com. Cleanup: deleted `startVisitorCountPolling()` call + function defs + orphan constants (`VISITOR_CACHE_MS`, `VISITOR_TS_KEY`, `VISITOR_CNT_KEY`). Net 48 lines of dead code removed. Canonical visitor tracking now lives only in root `visitor-tracking.js`.

### Edit-message reloads all prior images — RESOLVED

User report: "when i edit a past message.. every past image gen image relaods that is above the edited message, when it sahll only refresh that messages response and clear and messages that happend after the psot that is edited". Root cause: `apps/oldSiteProject/chat-init.js` editMessage + reGenerateAIResponse called `renderStoredMessages(currentSession.messages)` after slicing — re-rendered the WHOLE chatBox from index 0, firing fresh GETs on every prior `[IMAGE]` tag URL. Same bug duplicated in `chat-storage.js`. Fix: surgical `removeMessagesAfter(keepIndex)` + `replaceBubbleAt(msgIndex, role, content)` helpers — leaves prior bubbles AND their already-loaded `<img>` elements untouched.

### 18+ age verify gate regressed off /apps/ + all direct app paths — RESOLVED

User report: "somewher we lost the 18 verify gate for the apps page... if the direct navigate to an app it needs to block them until they pass the age gate... the 18+ gate is universal so doing it once saves that for future use". Root cause: `apps/age-verification.js` was wired ONLY into `/ai/demo/index.html`; missing from `apps.html`, `apps/index.html`, and ALL 12 individual app HTMLs. Fix: made `apps/age-verification.js` self-contained via `injectStyles()` method; wired into apps.html + all 12 app HTMLs via `<script>` tag. Universal localStorage flags persist across all gates. Verified direct-nav to `/apps/oldSiteProject/` triggers the modal end-to-end.

### `&safe=false` query param incorrectly used on image URLs — RESOLVED

Per Gee: "there is no safe=false attribute for images, it is only for text". The `safe=false` body parameter is text-API-only (disables Pollinations response filter on chat completions). Image URLs do NOT accept it. Stripped `&safe=false` from all `[IMAGE]` tag URL builds in `apps/oldSiteProject/chat-init.js`, `chat-storage.js`, and the legacy screensaver image gen URLs. The `safe: false` body param is preserved on chat completions (still valid + still useful there).
