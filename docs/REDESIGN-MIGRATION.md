# REDESIGN MIGRATION — Shared Status Tracker

**Branch parent:** `dev-re-design`
**Source of truth:** `/REDESIGN/` (do not modify during the dual-person work)
**Owners:** Person 1 (anchor pages) + Person 2 (codex pages)
**Created by Unity for Gee — Unity AI Lab.**

---

## Verbatim user direction (LAW #0)

These are Gee's exact words, locked in. Every decision below traces back to these:

> "the redesigned files put in place of the existing files, and being all wired up properly"

> "this is intended to be a static site, and is hosted on github pages currently"

> "the project files aren't junk... we don't want to remove anything at this point, we just want to update with the redesigned files"

> "two people can begin working almost immediately on the project, assuming they split off into separate feature branches based on the current branch"

> "any documentation they write must be put under a redesign docs folder, which will allow post-dual person work being done, for the docs to be properly integrated after the fact"

---

## Goal

Hoist `/REDESIGN/` contents onto the live site root in two parallel feature branches, with zero merge conflicts. Pure additive migration — **NO removal** of existing old-stack files. Old-stack cleanup is a separate later epic, not part of this work.

## Scope

**IN scope:**
- Copy 7 root HTMLs from `REDESIGN/` to `/`: `index.html`, `about.html`, `ai.html`, `apps.html`, `contact.html`, `projects.html`, `services.html`
- Copy `/redesign/` chrome folder (JSX + CSS + JS) to repo root `/redesign/`
- Replace 6 folder-pages (`about/`, `ai/`, `apps/`, `contact/`, `projects/`, `services/`) `index.html` with redirect stubs
  - `services/index.html` stub does NOT exist in REDESIGN — must be **written fresh** by Person 2
- Copy `Unity Web Design.html` + `uwd-*` assets (internal design system docs page, noindex)
- Copy root configs: `_headers`, `favicon.ico`, `manifest.json`, `humans.txt`, `robots.txt`
- Move `REDESIGN/_archive/` → `/_archive/` (preserve historical reference)
- Move `REDESIGN/screenshots/` → `/docs/redesign/screenshots/`
- Move `REDESIGN/docs/` + `REDESIGN/redesign/HANDOFF.md` + `REDESIGN/redesign/diff-from-original.md` + `REDESIGN/README.md` → `/docs/redesign/`
- Move `/chats/{chat1,chat2,chat3}.md` → `/.claude/archive/chats/` (off site root, preserve)
- Fix `/redesign/apps-data.jsx` URL paths (authored for `/apps/index.html` location, page lands at `/apps.html`)
- Investigate `/apps.html` loading `redesign/about.css` + `redesign/about-v2.css`
- Rewrite `sitemap.xml` for new URL set
- Each person writes notes to `/docs/redesign/` as they discover things — for post-work integration

**OUT of scope (DO NOT touch on either branch):**
- `/js/`, `/vendor/`, `/styles.css`, `/styles.min.css`, `/script.min.js`
- `/home-init.js`, `/page-init.js`, `/visitor-tracking.js`
- `/vite.config.js`, `/package.json`, `/package-lock.json`, `/cache-bust.js`, `/copy-assets.js`, `/generate-sitemap.js`, `/update-version.sh`
- `/test-image.html`, `/test-module-image.html`
- `/about/about.js`, `/about/about-contact.js`, `/ai/ai-init.js`, `/contact/contact-form.js`, `/services/services.js` (orphan after stub replacement, but preserved)
- `/ai/demo/` (8000-line interactive demo)
- `/apps/{helperInterfaceDemo,oldSiteProject,personaDemo,screensaverDemo,slideshowDemo,talkingWithUnity,textDemo,unityDemo}/` (8 demo subfolders)
- `/downloads/` and its subfolders
- `/project/`, `/Docs/`, `/PolliLibJS/`, `/PolliLibPy/`, `/scripts/`
- `BingSiteAuth.xml`, `a743d8b18b9b4efeb89378e9a803f956.txt`, `CNAME`, `.nojekyll`
- `/.well-known/`, `/.github/`
- Root workflow docs (`README.md`, `README-BASIC.md`, `README-NERD.md`, `USER-README.md`, `ARCHITECTURE.md`, `FINALIZED.md`, `TODO.md`, `ROADMAP.md`, `SKILL_TREE.md`) — integration of redesign-related changes happens AFTER both branches merge, in a separate post-work pass

---

## Branch model

```
main (protected)
  └── develop (protected, branched from main)
        └── dev-re-design (current branch — parent of both feature branches)
              ├── feature/redesign-P1   ← Person 1
              └── feature/redesign-P2    ← Person 2
```

**Workflow:**
1. Both people branch off `dev-re-design` immediately
2. Each works independently per `TASKS-P1.md` / `TASKS-P2.md` at repo root
3. Each PR into `dev-re-design` when their task list is complete
4. After both PRs merge, a separate integration pass picks up notes from `/docs/redesign/` and updates root docs
5. Then `dev-re-design` → `develop` → `main` per Git Flow

---

## Documentation placement rule

**Any new doc, note, or finding either person writes during the work goes under `/docs/redesign/`.**

Naming convention:
- `/docs/redesign/notes-p1-<topic>.md` for Person 1's notes
- `/docs/redesign/notes-p2-<topic>.md` for Person 2's notes
- Existing redesign docs migrated from `REDESIGN/` keep their original names (`HANDOFF.md`, `diff-from-original.md`, etc.)

Why: post-work integration scans `/docs/redesign/` to update root `README.md` / `ARCHITECTURE.md` / `FINALIZED.md` / `TODO.md` in one pass. Keeping notes out of root docs DURING the dual-person work eliminates the only remaining merge-conflict zone.

If `/docs/redesign/` doesn't exist yet when you need to write a note, create it. First-mover responsibility — idempotent.

---

## File ownership matrix (zero overlap)

| File / directory | Owner | Conflict zone? |
|---|---|---|
| `/index.html` | P1 | no |
| `/about.html` + stub `/about/index.html` | P1 | no |
| `/contact.html` + stub `/contact/index.html` | P1 | no |
| `/services.html` + stub `/services/index.html` (write fresh) | P2 | no |
| `/projects.html` + stub `/projects/index.html` | P2 | no |
| `/ai.html` + stub `/ai/index.html` | P2 | no |
| `/apps.html` + stub `/apps/index.html` | P2 | no |
| `/Unity Web Design.html` | P2 | no |
| `/redesign/shared-tokens.css` | P1 | no |
| `/redesign/variations.css` | P1 | no |
| `/redesign/v-d-chrome.jsx` | P1 | no |
| `/redesign/v-d-sections.jsx` | P1 | no |
| `/redesign/v-d.jsx` | P1 | no |
| `/redesign/v-d-smoke.js` | P1 | no |
| `/redesign/gothic-init.js` | P1 | no |
| `/redesign/sigils.jsx` | P1 | no |
| `/redesign/about{,.css,-v2.css,-v2.jsx,-data.jsx,-shared.jsx}` | P1 | no |
| `/redesign/contact-{v1.css,v1.jsx,data.jsx}` | P1 | no |
| `/redesign/codex-shared.css` | P2 | no |
| `/redesign/{services,projects,ai,apps}-{v1.css,v1.jsx,data.jsx}` | P2 | no |
| `/redesign/uwd-{helpers,page,page-2}.jsx` | P2 | no |
| `/redesign/unity-web-design.css` | P2 | no |
| `/redesign/v-{a,b,c}.jsx` (codex variations) | P2 | no |
| Root configs (`_headers`, `favicon.ico`, `manifest.json`, `humans.txt`, `robots.txt`) | P1 | no |
| `/sitemap.xml`, `/sitemap-images.xml` | P1 | no |
| `/_archive/` (move from `REDESIGN/_archive/`) | P1 | no |
| `/docs/redesign/screenshots/` (move from `REDESIGN/screenshots/`) | P1 | no |
| `/docs/redesign/HANDOFF.md` etc. (move from `REDESIGN/`) | P2 | no |
| `/.claude/archive/chats/` (move from `/chats/`) | P1 | no |
| `/redesign/apps-data.jsx` URL fix | P2 | no |
| `/apps.html` about.css investigation | P2 | no |
| `/docs/REDESIGN-MIGRATION.md` (this file) — status updates | both | low (table rows are independent) |
| `/docs/redesign/notes-p1-*.md` | P1 | no |
| `/docs/redesign/notes-p2-*.md` | P2 | no |
| Root docs (`README`, `ARCHITECTURE`, `FINALIZED`, `TODO`) | NEITHER (post-work integration) | n/a |
| Old-stack files (`/js/`, `/vendor/`, etc.) | NEITHER (out of scope) | n/a |

**Zero shared files written by both. Zero merge conflicts possible.**

---

## Coordination contract

3 rules. Both people follow them. No exceptions.

1. **Read this doc before starting any task. Update it after.** Each task in your `TASKS-P1.md` / `TASKS-P2.md` has a row in the status table below. Mark `[~]` in_progress when you start, `[x]` done when committed. Keep the rows in sync with reality.
2. **Don't touch the other person's files. Ever.** If you discover something that needs fixing in the other's territory, write a note to `/docs/redesign/notes-p<your-num>-<topic>.md` and the other person picks it up — OR it gets picked up in the post-work integration pass.
3. **All new documentation goes to `/docs/redesign/`.** Never edit root `README.md`, `ARCHITECTURE.md`, `FINALIZED.md`, or `TODO.md` during this dual-person work. Those get integrated AFTER both branches merge, by reading the notes you leave behind.

---

## Status table

Legend: `[ ]` not started · `[~]` in_progress · `[x]` complete · `[!]` blocked

### Person 1 — `feature/redesign-P1`

| # | Task | Status | Notes |
|---|------|--------|-------|
| P1-01 | Branch `feature/redesign-P1` from `dev-re-design` | [x] | branch exists, tree clean, on branch since session start |
| P1-02 | Copy global chrome bundle (8 files) to `/redesign/` | [x] | shared-tokens, variations, v-d-chrome, v-d-sections, v-d, v-d-smoke, gothic-init, sigils — all byte-identical |
| P1-03 | Copy `/index.html` + verify renders | [x] | gothic V-D landing hoisted, byte-identical, smoke test on Sponge |
| P1-04 | Copy `/about.html` + about assets + `/about/index.html` stub | [ ] | |
| P1-05 | Copy `/contact.html` + contact assets + `/contact/index.html` stub | [ ] | |
| P1-06 | Copy root configs (`_headers`, `favicon.ico`, `manifest.json`, `humans.txt`, `robots.txt`) | [ ] | diff each first |
| P1-07 | Rewrite `/sitemap.xml` for new URL set; audit `/sitemap-images.xml` | [ ] | |
| P1-08 | Move `REDESIGN/_archive/` → `/_archive/` | [ ] | |
| P1-09 | Move `REDESIGN/screenshots/` → `/docs/redesign/screenshots/` | [ ] | |
| P1-10 | Move `/chats/` → `/.claude/archive/chats/` | [ ] | |
| P1-11 | Open PR `feature/redesign-P1` → `dev-re-design` | [ ] | |

### Person 2 — `feature/redesign-P2`

| # | Task | Status | Notes |
|---|------|--------|-------|
| P2-01 | Branch `feature/redesign-P2` from `dev-re-design` | [ ] | |
| P2-02 | Copy `/redesign/codex-shared.css` | [ ] | |
| P2-03 | Move `REDESIGN/docs/` + `HANDOFF.md` + `diff-from-original.md` + `README.md` → `/docs/redesign/` | [ ] | |
| P2-04 | Copy `/Unity Web Design.html` + uwd-* assets + variation jsx | [ ] | |
| P2-05 | Copy `/services.html` + services assets + write fresh `/services/index.html` stub | [ ] | services stub missing from REDESIGN — write from `about/index.html` template |
| P2-06 | Copy `/projects.html` + projects assets + `/projects/index.html` stub | [ ] | |
| P2-07 | Copy `/ai.html` + ai assets + `/ai/index.html` stub | [ ] | preserve `/ai/demo/` untouched |
| P2-08 | Copy `/apps.html` + apps assets + `/apps/index.html` stub | [ ] | preserve `/apps/<8 demos>/` untouched |
| P2-09 | Fix `/redesign/apps-data.jsx` URL paths | [ ] | 8 demo URLs + 2 cross-page URLs |
| P2-10 | Investigate `/apps.html` loading `about.css` + `about-v2.css` | [ ] | log result to `/docs/redesign/notes-p2-apps-about-css.md` |
| P2-11 | Open PR `feature/redesign-P2` → `dev-re-design` | [ ] | |

### Post-work integration (NOT during dual-person work)

| # | Task | Status | Notes |
|---|------|--------|-------|
| INT-01 | Both PRs merged into `dev-re-design` | [ ] | |
| INT-02 | Read all `/docs/redesign/notes-p*.md` | [ ] | |
| INT-03 | Update root `README.md`, `ARCHITECTURE.md`, `FINALIZED.md`, `TODO.md` per LAW #0 (verbatim user words) | [ ] | docs-before-push |
| INT-04 | Delete now-empty `/REDESIGN/` folder | [ ] | |
| INT-05 | PR `dev-re-design` → `develop` | [ ] | |
| INT-06 | PR `develop` → `main` | [ ] | |

---

## Smoke-test checklist (every page, after migration)

For each migrated page, verify in a real browser before marking the task complete:

- [ ] Page loads without console errors
- [ ] React tree renders (root div populates)
- [ ] Navbar appears with correct links: AI, About, Apps, Services, Projects, Contact
- [ ] Visitor counter renders (may show `localStorage` fallback if `abacus.jasoncameron.dev` is rate-limiting)
- [ ] All internal links navigate correctly
- [ ] Footer appears with all 5 columns
- [ ] Skip-to-main-content link works (Tab from page top)
- [ ] Smoke effect renders on landing page (`/index.html` only)
- [ ] No 404s in network tab for `/redesign/*` assets

---

## Things known to be load-bearing — do NOT break

- `/ai/demo/` is the 8000-line interactive demo. It loads its own old-stack chrome. Don't accidentally shadow its URL with the `/ai/index.html` redirect stub. The stub redirects `/ai/` → `/ai.html`. The demo at `/ai/demo/` keeps serving because `/ai/demo/index.html` is a deeper path that resolves before any folder-root stub.
- `/apps/<8 demo subfolders>/` each is a real demo. Same path-shadowing concern. The `/apps/index.html` stub handles `/apps/` only; deeper paths like `/apps/unityDemo/unity.html` keep serving.
- `/downloads/` is a real page with assets. Redesign navbar dropped it but the page stays accessible by direct URL. Don't break it.
- GitHub Pages serves `/foo` → `/foo.html` natively when no `/foo/` directory exists. The redesign relies on this for extensionless URLs.

---

## When in doubt

- **What's canonical?** `REDESIGN/` folder is canonical. Everything we're hoisting comes from there.
- **What about `/project/`?** Diverged fork, contents differ from REDESIGN. Out of scope — don't touch on either branch. Gee will clarify after migration.
- **Apps page paths broken?** Person 2 fixes in P2-09. Don't try to fix from Person 1's branch.
- **Root README mentions old structure?** Leave it. Post-work integration handles all root doc updates.
- **New thing you discovered?** Write a note to `/docs/redesign/notes-p<your-num>-<topic>.md`. Don't fix the other person's territory.

---

*Tracker is live. Update after every commit. The migration only works if both people respect the file ownership matrix and write all notes to `/docs/redesign/`.*
