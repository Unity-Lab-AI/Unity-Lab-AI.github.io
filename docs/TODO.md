# TODO — Active Tasks

> Task tracker for minor/in-flight work. Verbatim user words preserved per LAW #0.
> Status markers: `[ ]` pending, `[~]` in_progress, `[x]` done (moved to FINALIZED.md).

---

## Active

_(none)_

---

## Done (entries preserved per LAW "never delete TODO info"; full closure detail in `FINALIZED.md`)

- [x] **PROJ-01 — change up the projects listed there** (Gee, 2026-05-10)
  - Verbatim: "im wanting to change up the projects listed there" + six specific repos with user-given titles
  - Sub-1: keep position #1 as Unity AI Chat (links to demo)
  - Sub-2: "Unity AI Lab Home" → https://github.com/Unity-Lab-AI/Unity-Lab-AI.github.io
  - Sub-3: "A* Pathfinding for file systems" → https://github.com/Unity-Lab-AI/ATree
  - Sub-4: "Medieval Trading Game" → https://github.com/Unity-Lab-AI/Medieval-Trading-Game
  - Sub-5: "If only I had a brain" → https://github.com/Unity-Lab-AI/unity
  - Sub-6: "Starship Made of Lies" → https://github.com/Unity-Lab-AI/Starship-Made-of-Lies
  - User direction: "You should be able to gauge some information from those to put on the site, by looking at the README on each of those repos"
  - **Closed:** new lineup written into `redesign/projects-data.jsx`; copy gleaned from each repo's README (Medieval used `ARCHITECTURE.md` since README missing); SEO meta in `projects.html` swept too. See `FINALIZED.md` 2026-05-10.

- [x] **PROJ-02 — I need the modals when you click the projects, that has more info on the project at a glace** (Gee, 2026-05-10)
  - Verbatim user phrasing preserved per LAW #0
  - Click-to-expand modal showing richer per-project detail (overview, features, stack, meta, links)
  - **Closed:** added `details` block to each project entry; built `<ProjectModal>` component with useState/useEffect; Esc + backdrop close + body scroll lock + keyboard accessible (role=button on cards, Enter/Space opens). CTA button stops propagation so external links still work directly. See `FINALIZED.md` 2026-05-10.

- [x] **PROJ-03 — plaster a semi-transparent WIP accross the in dev ones** (Gee, 2026-05-10)
  - Verbatim user phrasing preserved per LAW #0
  - User intent: "just as like an extra, hey, this is not finished, its just something we want to show people, sort of visual que"
  - **Closed:** CSS-only pseudo-element (`.pV1-status-in-dev::after`) with rotated outlined "WIP" stroke text on cards + modal. pointer-events: none, user-select: none, behind content via z-index. Only Medieval Trading Game + Starship Made of Lies show it. See `FINALIZED.md` 2026-05-10.

- [x] **DEP-01 — lets go on dependabot** (Gee, 2026-05-10)
  - Resolve 15 open Dependabot alerts on default branch (1 critical, 7 high, 7 medium)
  - Branch: `feature/10-05-26-dependabot` (off develop)
  - Affected packages: basic-ftp, brace-expansion, ip-address, lodash-es, minimatch, picomatch, postcss, rollup, vite
  - Only `vite` is direct dep; rest are transitive
  - All show `fixAvailable: true` in `npm audit`
  - **Closed:** `npm audit fix` (no `--force`) resolved all 9 packages / 15 advisories in one pass; `npm run build` clean post-fix. See `FINALIZED.md` 2026-05-10.
