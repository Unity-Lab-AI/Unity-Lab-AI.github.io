# TASKS — PERSON 1 (Anchor + Global Chrome)

> **You are Person 1.** You own the landing page, the about page, the contact page, all global chrome, root configs, sitemap, and historical archive moves. Your branch: `feature/redesign-P1`.

> **Read `/docs/REDESIGN-MIGRATION.md` BEFORE starting.** It's the shared status doc, file ownership matrix, and coordination contract. Update it as you progress.

---

## Identity

- **Branch:** `feature/redesign-P1`
- **Branched from:** `dev-re-design`
- **PR target:** `dev-re-design`
- **Pages owned:** `/index.html`, `/about.html`, `/contact.html`
- **Chrome owned:** global chrome (used by all 7 pages — but no one else writes these files)
- **Stubs owned:** `/about/index.html`, `/contact/index.html`
- **Configs owned:** `_headers`, `favicon.ico`, `manifest.json`, `humans.txt`, `robots.txt`, `sitemap.xml`, `sitemap-images.xml`
- **Moves owned:** `REDESIGN/_archive/` → `/_archive/`, `REDESIGN/screenshots/` → `/docs/redesign/screenshots/`, `/chats/` → `/.claude/archive/chats/`

---

## Branch setup

```bash
git checkout dev-re-design
git pull origin dev-re-design
git checkout -b feature/redesign-P1
git push -u origin feature/redesign-P1
```

---

## How to work

### Rules of engagement (BINDING)

1. **Source of truth is `/REDESIGN/`.** Don't modify `REDESIGN/*` during your work — only copy out of it.
2. **Don't touch Person 2's files.** Conflict-zone audit in `/docs/REDESIGN-MIGRATION.md` lists every file. If you find something broken in Person 2's territory, write a note to `/docs/redesign/notes-p1-<topic>.md` — do NOT fix it.
3. **Don't touch out-of-scope files.** Per Gee: "we don't want to remove anything at this point, we just want to update with the redesigned files." `/js/`, `/vendor/`, `/styles.css`, `/script.min.js`, vite config, etc. — leave alone.
4. **All new docs go to `/docs/redesign/`.** Never edit root `README.md`, `Docs/ARCHITECTURE.md`, `FINALIZED.md`, or `Docs/TODO.md` during this work. Post-work integration pass handles those.
5. **One task = one commit.** Small, atomic, easy to revert. Update the migration doc status table BEFORE and AFTER each task.
6. **Smoke-test every page in a browser before marking complete.** Don't trust paths.
7. **800-line read before edit.** Mostly N/A here (we're copying files, not editing big ones), but if you DO edit an existing file, read it fully first per `.claude/CONSTRAINTS.md §800-LINE READ`.
8. **No tests ever.** Per `.claude/CONSTRAINTS.md §NO TESTS POLICY`. Code it right, smoke-test in browser.

### Documentation placement

Per Gee: "any documentation they write must be put under a redesign docs folder, which will allow post-dual person work being done, for the docs to be properly integrated after the fact."

Any note, finding, decision you write goes here:

```
/docs/redesign/notes-p1-<topic>.md
```

Examples:
- `/docs/redesign/notes-p1-favicon-diff.md` if you find the REDESIGN favicon differs from the live one and need to document the choice
- `/docs/redesign/notes-p1-sitemap-decisions.md` for the sitemap rewrite reasoning
- `/docs/redesign/notes-p1-archive-move.md` for what was moved and why

If `/docs/redesign/` doesn't exist when you need to write your first note, create it. First-mover responsibility.

### Commit cadence

Each task below is one commit. Commit message format:

```
P1-NN: <short description>

<longer body if needed — what changed, why, any notes>
```

Push after each commit. Update `/docs/REDESIGN-MIGRATION.md` status table BEFORE starting (mark `[~]` in_progress) and AFTER committing (mark `[x]` complete).

---

## Pre-decomposed task list

### P1-01 — Branch setup
- [ ] Run the branch setup commands above
- [ ] Verify `git status` shows clean working tree on `feature/redesign-P1`
- [ ] Mark P1-01 complete in `/docs/REDESIGN-MIGRATION.md`

---

### P1-02 — Copy global chrome bundle (8 files)

**Files to copy (source → destination):**

```
REDESIGN/redesign/shared-tokens.css       →  /redesign/shared-tokens.css
REDESIGN/redesign/variations.css          →  /redesign/variations.css
REDESIGN/redesign/v-d-chrome.jsx          →  /redesign/v-d-chrome.jsx
REDESIGN/redesign/v-d-sections.jsx        →  /redesign/v-d-sections.jsx
REDESIGN/redesign/v-d.jsx                 →  /redesign/v-d.jsx
REDESIGN/redesign/v-d-smoke.js            →  /redesign/v-d-smoke.js
REDESIGN/redesign/gothic-init.js          →  /redesign/gothic-init.js
REDESIGN/redesign/sigils.jsx              →  /redesign/sigils.jsx
```

**Acceptance:**
- [ ] All 8 files exist at `/redesign/<file>` with byte-identical content to source
- [ ] Commit message: `P1-02: copy global chrome bundle to /redesign/`

---

### P1-03 — Copy `/index.html` and smoke-test

**Files:**

```
REDESIGN/index.html  →  /index.html  (overwrites old root index.html)
```

**Acceptance:**
- [ ] `/index.html` is the gothic V-D landing
- [ ] In a browser at `http://localhost:<port>/`:
  - Page renders, no console errors
  - Hero, features (6 pillars), services preview, libraries, why-block, proof-row, footer all render
  - Smoke effect particles work (click to puff)
  - Visitor counter shows a number or `localStorage` fallback
  - Navbar links work: clicking About → `/about` (will 404 until P1-04, OK)
- [ ] Commit message: `P1-03: hoist gothic landing /index.html to root`

---

### P1-04 — `/about.html` + about assets + `/about/index.html` stub

**Files to copy:**

```
REDESIGN/about.html                       →  /about.html
REDESIGN/redesign/about.css               →  /redesign/about.css
REDESIGN/redesign/about-v2.css            →  /redesign/about-v2.css
REDESIGN/redesign/about-v2.jsx            →  /redesign/about-v2.jsx
REDESIGN/redesign/about-data.jsx          →  /redesign/about-data.jsx
REDESIGN/redesign/about-shared.jsx        →  /redesign/about-shared.jsx
REDESIGN/about/index.html                 →  /about/index.html  (REPLACES old Bootstrap About — old `about.js` and `about-contact.js` stay orphaned per "don't remove" rule)
```

**Acceptance:**
- [ ] `/about.html` renders gothic V2 Cathedral fusion
- [ ] `/about/index.html` is a tiny redirect stub (~1KB)
- [ ] Browser test: visit `/about/` → bounces to `/about.html`
- [ ] Browser test: visit `/about.html` directly → renders
- [ ] Verify `about-shared.jsx` is loaded by `/about.html` (used for AboutContactForm)
- [ ] Commit message: `P1-04: hoist /about.html + about assets + redirect stub`

---

### P1-05 — `/contact.html` + contact assets + `/contact/index.html` stub

**Files to copy:**

```
REDESIGN/contact.html                     →  /contact.html
REDESIGN/redesign/contact-v1.css          →  /redesign/contact-v1.css
REDESIGN/redesign/contact-v1.jsx          →  /redesign/contact-v1.jsx
REDESIGN/redesign/contact-data.jsx        →  /redesign/contact-data.jsx
REDESIGN/contact/index.html               →  /contact/index.html  (REPLACES old Bootstrap Contact — old `contact-form.js` stays orphaned)
```

**Acceptance:**
- [ ] `/contact.html` renders gothic V1 contact page
- [ ] Contact form validates client-side via `gothic-init.js` toast/validation
- [ ] `/contact/` redirects to `/contact.html`
- [ ] Commit message: `P1-05: hoist /contact.html + contact assets + redirect stub`

---

### P1-06 — Root configs

**Files to diff first, then copy:**

```
REDESIGN/_headers           →  /_headers           (verified byte-identical, no-op safe — but commit anyway for traceability)
REDESIGN/favicon.ico        →  /favicon.ico        (DIFF FIRST — likely identical, verify)
REDESIGN/manifest.json      →  /manifest.json      (DIFF FIRST — write notes if differs)
REDESIGN/humans.txt         →  /humans.txt         (DIFF FIRST)
REDESIGN/robots.txt         →  /robots.txt         (DIFF FIRST)
```

**How to diff:**

```bash
diff /REDESIGN/_headers /_headers
diff /REDESIGN/manifest.json /manifest.json
diff /REDESIGN/humans.txt /humans.txt
diff /REDESIGN/robots.txt /robots.txt
md5sum /REDESIGN/favicon.ico /favicon.ico  # binary diff
```

**If any differ:**
- Take REDESIGN's version (it's canonical)
- Write a note to `/docs/redesign/notes-p1-config-diffs.md` summarizing what changed and why REDESIGN's version is correct

**Acceptance:**
- [ ] All 5 root configs match REDESIGN versions
- [ ] If diffs were found, `/docs/redesign/notes-p1-config-diffs.md` documents them
- [ ] Commit message: `P1-06: sync root configs from REDESIGN`

---

### P1-07 — Rewrite `/sitemap.xml` and audit `/sitemap-images.xml`

**Goal:** sitemap reflects the new URL set.

**New URL set for `sitemap.xml`:**

```
/
/about       (or /about.html — pick one form, document choice)
/ai
/apps
/contact
/projects
/services
/ai/demo
/downloads   (still accessible by direct URL, even though navbar dropped it)
```

**Action:**
- Edit `/sitemap.xml` directly (don't run `scripts/generate-sitemap.js` — it's in the out-of-scope build pipeline)
- Use `<lastmod>` of the migration date (today)
- `<priority>` 1.0 for `/`, 0.9 for `/ai` and `/ai/demo`, 0.8 for `/about`/`/services`/`/projects`/`/apps`, 0.7 for `/contact`, 0.5 for `/downloads`
- Audit `/sitemap-images.xml` — drop refs to assets that no longer exist, add new screenshot refs if applicable
- `/sitemap-index.xml` — verify still valid (probably no changes)

**Decisions to document in `/docs/redesign/notes-p1-sitemap.md`:**
- Did you use extensionless URLs (`/about`) or `.html` URLs (`/about.html`) in the sitemap?
- What was the rationale?

**Acceptance:**
- [ ] `/sitemap.xml` has all 9 URLs
- [ ] `/sitemap-images.xml` audited
- [ ] Note `/docs/redesign/notes-p1-sitemap.md` exists with URL form decision
- [ ] Commit message: `P1-07: rewrite sitemap.xml + audit sitemap-images.xml for new URL set`

---

### P1-08 — Move `REDESIGN/_archive/` → `/_archive/`

**Source:** `REDESIGN/_archive/`
**Destination:** `/_archive/`
**Method:** `git mv` if structure permits, else `cp -r` then `git rm -r REDESIGN/_archive/`

**Why:** preserve historical reference (v1 originals, exploration shells, old stack archive). Per Gee: "the project files aren't junk... we don't want to remove anything at this point."

**Acceptance:**
- [ ] `/_archive/` exists with all subfolders (`v1-original`, `about-v1-original`, `contact-v1-original`, `projects-v1-original`, `ai-v1-original`, `apps-v1-original`, `exploration-shells`, `old-stack`, `old-docs`)
- [ ] `REDESIGN/_archive/` no longer exists
- [ ] No content lost (verify with `find /_archive -type f | wc -l` matches the original count)
- [ ] Commit message: `P1-08: preserve REDESIGN/_archive/ at /_archive/`

---

### P1-09 — Move `REDESIGN/screenshots/` → `/docs/redesign/screenshots/`

**Source:** `REDESIGN/screenshots/`
**Destination:** `/docs/redesign/screenshots/`
**Method:** `git mv`

**Why:** dev artifacts (16 screenshot PNGs/JPGs) — useful reference but don't belong at site root.

**Note:** if `/docs/redesign/` doesn't exist yet (Person 2 may not have created it), create it. Idempotent.

**Acceptance:**
- [ ] All 16 screenshots in `/docs/redesign/screenshots/`
- [ ] `REDESIGN/screenshots/` removed
- [ ] Commit message: `P1-09: move REDESIGN/screenshots/ to /docs/redesign/screenshots/`

---

### P1-10 — Move `/chats/` → `/.claude/archive/chats/`

**Source:** `/chats/{chat1,chat2,chat3}.md`
**Destination:** `/.claude/archive/chats/`
**Method:** `git mv`

**Why:** these are 3 prior AI session transcripts (not site content). Move off site root, preserve in `.claude/archive/`.

**Acceptance:**
- [ ] All 3 markdown files in `/.claude/archive/chats/`
- [ ] `/chats/` directory removed
- [ ] Commit message: `P1-10: archive prior AI chat transcripts to .claude/archive/chats/`

---

### P1-11 — Open PR `feature/redesign-P1` → `dev-re-design`

**Action:**

```bash
gh pr create --base dev-re-design --head feature/redesign-P1 \
  --title "Redesign migration — Anchor pages + global chrome (P1)" \
  --body "$(cat <<'EOF'
## Summary
- Hoists gothic landing, about, contact pages to root
- Copies global chrome bundle to /redesign/
- Replaces /about/index.html and /contact/index.html with redirect stubs
- Syncs root configs from REDESIGN
- Rewrites sitemap for new URL set
- Preserves archives, moves screenshots and chats off site root

## Scope
Per /docs/REDESIGN-MIGRATION.md — Person 1 ownership only. Person 2's PR (feature/redesign-codex) covers the codex pages and design system docs.

## Test plan
- [ ] `/index.html` renders gothic V-D landing
- [ ] `/about.html` renders Cathedral fusion + `/about/` redirects
- [ ] `/contact.html` form validates + `/contact/` redirects
- [ ] Sitemap.xml has new URL set
- [ ] /_archive/ contains all preserved subfolders
- [ ] No old-stack files removed (per "don't remove anything" rule)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Acceptance:**
- [ ] PR opened against `dev-re-design`
- [ ] All status table rows for P1 marked `[x]`
- [ ] PR URL pasted into `/docs/REDESIGN-MIGRATION.md` for cross-reference

---

## When you're done

1. Verify all P1-NN rows in `/docs/REDESIGN-MIGRATION.md` status table are `[x]`
2. Wait for Person 2's PR to also merge into `dev-re-design`
3. Post-work integration pass (NOT your job during dual-person work) handles root doc updates

**Do NOT:**
- Edit root `README.md`, `Docs/ARCHITECTURE.md`, `FINALIZED.md`, `Docs/TODO.md` during this work
- Touch any file in Person 2's ownership column
- Delete or modify any out-of-scope file (per "don't remove anything")

---

## If something goes wrong

- **Page won't render?** Check browser console. Most likely a `<script type="text/babel">` order issue or a missing `window.*` export. Verify all chrome files in `/redesign/` were copied.
- **Stub doesn't redirect?** Check `<meta http-equiv="refresh">` and `window.location.replace()` in the stub HTML.
- **`abacus.jasoncameron.dev` 404s on visitor counter?** Expected — falls back to `localStorage`. Don't worry.
- **Found a broken thing in Person 2's territory?** Write a note to `/docs/redesign/notes-p1-<topic>.md`. Do NOT fix it.
- **Stuck or confused?** Re-read `/docs/REDESIGN-MIGRATION.md`. Then ask Gee.

---

*Person 1 task list. Run it top-to-bottom. Update the migration doc as you go. Push after each commit.*
