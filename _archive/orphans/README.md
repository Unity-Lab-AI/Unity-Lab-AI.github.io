# Orphan files — archived 2026-05-06

These files were in root but had ZERO production references — no HTML loads them, no script imports them, no build step uses them. They were archived (NOT deleted) as part of the root-directory cleanup so they're preserved for historical reference but no longer clutter the project root.

| File | Why archived | Replaced by |
|---|---|---|
| `UnityPrompt.txt` | Old Unity persona file. No code path fetches it. | `ai/demo/unity-system-prompt-v2.txt` (the actual canonical loaded at runtime by `ai/demo/demo.js` and several apps) |
| `Unity Web Design.html` | Old design mockup. Only referenced in `.claude/archive/chats/` and `Docs/redesign/diff-from-original.md` as a historical artifact. | The current `redesign/` JSX-based pages (`v-d.jsx`, etc.) |
| `test-image.html` | Old image-pollination test page. Only mentioned in `Docs/REDESIGN-MIGRATION.md` and `TODO.md` as a historical reference. Not loaded by any production page. | Direct image generation via `ai/demo/` and `apps/screensaverDemo/` |
| `test-module-image.html` | Companion test for ES-module image loading. Same status as `test-image.html`. | Same as above |
| `test-apps.js` | Playwright test runner from a previous debugging session. Only self-references its own header comment. | E2E testing now done via the deployed site directly when needed |
| `REFACTOR_BUGS_ANALYSIS.md` | One-off bug analysis from the redesign-era refactor. Zero references anywhere in the repo. | Historical content folded into `Docs/FINALIZED.md` and the redesign-era `FINALIZED.md` (root) |
| `server.py` | Old Python dev-server convenience script. Never referenced in `package.json`, build scripts, or docs. | `npm run dev` (Vite dev server on port 3000) |
| `home-init.js` | Init script for the original v1 homepage. Only referenced by `_archive/v1-original/index.html` and `project/_archive/v1-original/index.html` (both archived). | Current homepage uses `redesign/gothic-init.js` |

## Restoration

If a future change needs one of these back, `git mv _archive/orphans/<file> .` and update any references. The git history preserves the move so blame/log still works on the moved file.

## How files end up here

A root-level file qualifies for archival when ALL of the following hold:
1. No production HTML page loads it (`<script src=...>`, `<link href=...>`, `<img src=...>`)
2. No build script in `package.json` uses it
3. No service worker, manifest, or sitemap references it
4. The only references are inside `_archive/`, `.claude/archive/`, or historical doc paragraphs

Verified by `grep -rln <filename> --include="*.html" --include="*.js" --include="*.json" --include="*.md"` across the active codebase.
