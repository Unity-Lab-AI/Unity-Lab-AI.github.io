# Notes — P2 — apps-data.jsx URL path fix

## Problem

`/redesign/apps-data.jsx` was authored assuming the apps page lives at `/apps/index.html` (one folder deep). All 8 app-launch hrefs were relative paths like `./unityDemo/unity.html`, which from `/apps/index.html` resolve to `/apps/unityDemo/unity.html` ✓.

But the new redesigned page lives at `/apps.html` (root-level, flat). From there, `./unityDemo/unity.html` resolves to `/unityDemo/unity.html` ✗ — that path doesn't exist, the demos live under `/apps/unityDemo/...`.

Same issue with the two cross-page CTAs: `'../services'` and `'../contact'` were authored to climb out of `/apps/` to the parent. From `/apps.html` (root), `../` goes ABOVE the repo root, so those CTAs would 404 too.

## Fix

10 string replacements applied in-place to `/redesign/apps-data.jsx` via `sed` piped into `git hash-object --stdin -w`, then `git update-index --add --cacheinfo` to land the new blob at the lowercase `redesign/apps-data.jsx` index entry. (Direct `git add` would have re-routed the file to `REDESIGN/apps-data.jsx` because `core.ignorecase=true` collides on Windows.)

### 8 app-launch hrefs (prepend `./apps/`)

| Slug | Old href | New href |
|------|----------|----------|
| unity-chat | `./unityDemo/unity.html` | `./apps/unityDemo/unity.html` |
| text-chat | `./textDemo/text.html` | `./apps/textDemo/text.html` |
| persona-chat | `./personaDemo/persona.html` | `./apps/personaDemo/persona.html` |
| talking-with-unity | `./talkingWithUnity/index.html` | `./apps/talkingWithUnity/index.html` |
| helper-interface | `./helperInterfaceDemo/helperInterface.html` | `./apps/helperInterfaceDemo/helperInterface.html` |
| ai-slideshow | `./slideshowDemo/slideshow.html` | `./apps/slideshowDemo/slideshow.html` |
| ai-screensaver | `./screensaverDemo/screensaver.html` | `./apps/screensaverDemo/screensaver.html` |
| classic-unity | `./oldSiteProject/index.html` | `./apps/oldSiteProject/index.html` |

### 2 cross-page CTAs (drop the `../` parent traversal)

| CTA | Old href | New href |
|-----|----------|----------|
| primary "See services" | `'../services'` | `'./services'` |
| secondary "Get in touch" | `'../contact'` | `'./contact'` |

## Why I didn't update the source

`REDESIGN/redesign/apps-data.jsx` is canonical / read-only per the migration contract: *"Don't modify REDESIGN/* during your work — only copy out of it."* Only the destination `/redesign/apps-data.jsx` got the patch. Source stays as authored.

If the post-work integration deletes `REDESIGN/` (per INT-04), the canonical-source-vs-destination question becomes moot.

## Browser smoke-test plan (cannot run from CI)

When this lands and the live preview is up:

- [ ] Open `/apps.html`
- [ ] Click each of the 8 "Launch app" buttons. Each should land on the correct demo (or at minimum, a non-404 page):
  - I — `/apps/unityDemo/unity.html`
  - II — `/apps/textDemo/text.html`
  - III — `/apps/personaDemo/persona.html`
  - IV — `/apps/talkingWithUnity/index.html`
  - V — `/apps/helperInterfaceDemo/helperInterface.html`
  - VI — `/apps/slideshowDemo/slideshow.html`
  - VII — `/apps/screensaverDemo/screensaver.html`
  - VIII — `/apps/oldSiteProject/index.html`
- [ ] Click "See services" CTA → `/services.html` should load (Codex 01)
- [ ] Click "Get in touch" CTA → `/contact.html` should load (Person 1's territory)

If any 404, the path resolution differs from what GitHub Pages does at runtime — file a follow-up and re-check.
