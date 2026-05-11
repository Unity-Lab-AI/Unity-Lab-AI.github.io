# TODO — Active Tasks

> Task tracker for minor/in-flight work. Verbatim user words preserved per LAW #0.
> Status markers: `[ ]` pending, `[~]` in_progress, `[x]` done (moved to FINALIZED.md).

---

## Active

_(none)_

---

## Done (entries preserved per LAW "never delete TODO info"; full closure detail in `FINALIZED.md`)

- [x] **DEP-01 — lets go on dependabot** (Gee, 2026-05-10)
  - Resolve 15 open Dependabot alerts on default branch (1 critical, 7 high, 7 medium)
  - Branch: `feature/10-05-26-dependabot` (off develop)
  - Affected packages: basic-ftp, brace-expansion, ip-address, lodash-es, minimatch, picomatch, postcss, rollup, vite
  - Only `vite` is direct dep; rest are transitive
  - All show `fixAvailable: true` in `npm audit`
  - **Closed:** `npm audit fix` (no `--force`) resolved all 9 packages / 15 advisories in one pass; `npm run build` clean post-fix. See `FINALIZED.md` 2026-05-10.
