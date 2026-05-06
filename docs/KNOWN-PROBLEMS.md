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

## Problem #3 — npm install warnings: deprecated `glob@7.2.3` + 8 audit vulnerabilities (1 critical / 5 high / 2 moderate)

### Observed

```
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

added 249 packages, and audited 250 packages in 1m

26 packages are looking for funding
  run `npm fund` for details

8 vulnerabilities (2 moderate, 5 high, 1 critical)
```

### Root cause

#### glob@7.2.3 deprecation

Direct dependency chain:

```
unity-lab-ai-website@2.1.5
└─┬ clean-css-cli@5.6.3
  └── glob@7.2.3
```

`clean-css-cli` (a minifier used in `npm run minify`) hasn't been updated to use glob v9+ yet. This is a transitive dep, not a direct project dep. We can't bump glob without bumping clean-css-cli (or replacing it).

#### 8 audit vulnerabilities

Full breakdown from `npm audit`:

| Severity | Package | Issue | Fix path |
|---|---|---|---|
| Critical | `basic-ftp` ≤5.2.2 | Path Traversal in `downloadToDir`; CRLF Injection allowing arbitrary FTP commands; DoS via unbounded memory in `Client.list()` | `npm audit fix` |
| High | `lodash-es` ≤4.17.23 | Prototype Pollution in `_.unset` / `_.omit`; Code Injection via `_.template` import key names | `npm audit fix` |
| High | `minimatch` ≤3.1.3 \|\| 9.0.0–9.0.6 | ReDoS via repeated wildcards + nested extglob backtracking | `npm audit fix` |
| High | `picomatch` ≤2.3.1 \|\| 4.0.0–4.0.3 | Method Injection in POSIX char classes; ReDoS via extglob quantifiers | `npm audit fix` |
| High | `rollup` 4.0.0–4.58.0 | Arbitrary File Write via Path Traversal | `npm audit fix` |
| High | `vite` 7.0.0–7.3.1 | Path Traversal in optimized-deps `.map` handling; `server.fs.deny` bypass; Arbitrary File Read via Vite dev server WebSocket | `npm audit fix` |
| Moderate | `brace-expansion` <1.1.13 \|\| >=2.0.0 <2.0.3 | Zero-step sequence causes process hang + memory exhaustion | `npm audit fix` |
| Moderate | `postcss` <8.5.10 | XSS via unescaped `</style>` in CSS stringify output | `npm audit fix` |

Most of these chain into our toolchain through `lighthouse@^13.0.1` (basic-ftp, lodash-es, picomatch transitives), `vite@^7.2.4` (vite, rollup, postcss, picomatch directly), and `clean-css-cli@5.6.3` (glob, minimatch, brace-expansion).

### Scope

**Dev-toolchain only — zero production runtime exposure.**

The deployed site (`https://www.unityailab.com/`) is a **static HTML site** hosted on GitHub Pages. The redesign loads:

- React 18 from `unpkg.com` CDN
- Babel-standalone from `unpkg.com` CDN
- Custom JSX/CSS from `/redesign/`

Nothing in `node_modules/` is bundled into anything that ships to a browser. `node_modules/` is consumed by:

- `npm run dev` (Vite local dev server)
- `npm run build` (sitemap gen + Vite build + asset copy + cache-bust — but the site doesn't actually use the build output for deployment; GitHub Pages serves the raw HTML directly)
- `npm run minify` (terser + clean-css-cli — local minification only)
- `npm run preview` (Vite preview)

So the attack surface is: a malicious dependency could compromise a developer's local machine during `npm install` / `npm run *`. It cannot reach end users via the deployed site.

### Severity

- **For users of the site:** None. Static HTML, CDN runtime deps, no `node_modules/` in production path.
- **For developers:** Real but low. Dev tools running locally on trusted networks. The critical FTP path-traversal in `basic-ftp` and the high-severity `vite` issues are the most concerning for a dev box.

### Why deferred

1. `npm audit fix` MAY force-upgrade vite@7→latest, lighthouse, terser, clean-css-cli, etc. — that has cascade risk during the active redesign migration. Bumping the toolchain mid-migration could introduce build-breakage Person 1 and Person 2 then have to debug.
2. The **same vulnerabilities are already flagged on the GitHub default branch** by Dependabot (per push messages from the redesign-P1 commits — "GitHub found 13 vulnerabilities on Unity-Lab-AI/Unity-Lab-AI.github.io's default branch (1 critical, 7 high, 5 moderate)"). The slight count mismatch (13 vs local 8) is because Dependabot counts each advisory separately while `npm audit` collapses by package — same underlying issues. Dependabot will open auto-PRs for each as fixes land upstream.
3. Post-merge of both redesign PRs is the natural moment to do a clean toolchain pass — `npm audit fix`, verify build, tag a version.

### Action plan (when ready to fix)

In order of safety:

1. **Run `npm audit fix` on a throwaway branch** off `develop` (NOT off any in-flight redesign branch):
   ```bash
   git checkout develop && git pull
   git checkout -b chore/npm-audit-fix-2026-05
   npm audit fix
   npm install
   npm run dev    # verify dev server boots
   npm run build  # verify build pipeline works
   ```
2. **Cross-reference Dependabot PRs** at `https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io/security/dependabot` — accept the ones whose proposed bumps match what `npm audit fix` produced.
3. **Manually upgrade `clean-css-cli`** if `npm audit fix` doesn't ship a glob v9+ resolution — check `https://github.com/clean-css/clean-css-cli/releases` for a fresh release, OR replace with `lightningcss` / `cssnano-cli` if the project has been abandoned.
4. **Bump direct dev deps in `package.json`** if needed:
   - `vite` `^7.2.4` → latest 7.x (or 8.x if breaking changes acceptable)
   - `lighthouse` `^13.0.1` → latest
   - `terser` `^5.44.1` → latest
5. Commit on the chore branch. Open a PR back to `develop`. Merge after `develop` integrates the redesign work.

### Why not now

The toolchain is **not in our P1 scope** per `docs/REDESIGN-MIGRATION.md`. `package.json`, `package-lock.json`, `vite.config.js` are all on the OUT-of-scope list for both P1 and P2. Touching them mid-migration risks merge conflicts and break-the-other-person's-PR scenarios.

---

## How to add a new known problem

1. Append a new `## Problem #N — <short title>` section at the bottom (or in the appropriate spot if there's an obvious grouping)
2. Required subsections: **Observed**, **Root cause**, **Scope**, **Severity**, **Why deferred**, **Action plan**
3. If the issue stops being deferred (someone fixes it), MOVE the section to a `## Resolved` section at the bottom of the file with a note about the commit/PR that resolved it. Don't delete — historical record.
4. If the issue turns out to be unrelated or false-positive, MOVE to a `## Tombstones` section with a note explaining why it's no longer valid.
