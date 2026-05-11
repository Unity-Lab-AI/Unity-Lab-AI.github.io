# FINALIZED — Completed Tasks

> Archive of completed work. Verbatim user words preserved per LAW #0.
> Never delete entries from this file — historical record.

---

## 2026-05-10 — `feature/10-05-26-projects-page`

### PROJ-01 — change up the projects listed there

**User request:** "im wanting to change up the projects listed there" — Gee, 2026-05-10. Specified six repos with explicit titles: Unity AI Chat (keep), Unity AI Lab Home, A* Pathfinding for file systems, Medieval Trading Game, "If only I had a brain", Starship Made of Lies. Direction: "You should be able to gauge some information from those to put on the site, by looking at the README on each of those repos."

**Resolution:** Rewrote `redesign/projects-data.jsx` with six entries matching the user's lineup. Position I (Unity AI Chat) preserved verbatim from prior data; positions II–VI replaced. Per-project copy gleaned via `gh api` README fetches:

| # | Repo | Status | Icon | README source |
|---|---|---|---|---|
| I | (kept — Unity AI Chat) | LIVE | Unity | (existing) |
| II | Unity-Lab-AI/Unity-Lab-AI.github.io | LIVE | Stack | README.md |
| III | Unity-Lab-AI/ATree | OPEN SOURCE | Node | README.md |
| IV | Unity-Lab-AI/Medieval-Trading-Game | IN DEV | Seal | `ARCHITECTURE.md` (README missing) |
| V | Unity-Lab-AI/unity | RESEARCH | Robot | README.md |
| VI | Unity-Lab-AI/Starship-Made-of-Lies | IN DEV | Shield | README.md |

Also swept `projects.html` SEO meta — description, OG description, OG image alt, Twitter image alt — old projects (CodeWringer, Personas, Control Systems, etc.) replaced with the new lineup. Header `STATUS` meta strip updated from "in production" → "mixed: shipping + in flight". Lede expanded to include "games" alongside chatbots / websites / tools / research.

### PROJ-02 — I need the modals when you click the projects, that has more info on the project at a glace

**User request:** "I need the modals when you click the projects, that has more info on the project at a glace" — Gee, 2026-05-10.

**Resolution:** Three-piece implementation:

- **Data** — added a `details` block to each project in `redesign/projects-data.jsx` with: `meta` (4 key/value pairs — status, version, license, lang, etc.), `overview` (richer 2-3 sentence description), `features` (6-8 bullets beyond the card-level 3), `stack` (tech chips), `links` (GitHub + live demo where applicable).
- **Component** — `redesign/projects-v1.jsx` rebuilt with `React.useState` for `activeSlug` + `useEffect` for Esc-handler + body-scroll-lock. Cards became clickable (`role="button"`, `tabIndex={0}`, Enter/Space opens). Inner CTA button uses `e.stopPropagation()` so "View on GitHub" / "Try it live" still navigates directly without triggering the modal. New `<ProjectModal>` component embeds the codex aesthetic — mast strip, icon column with roman numeral, title block, meta dl, Overview / What's inside / Stack sections, Foot link row, EOF closer.
- **Styles** — `redesign/projects-v1.css` extended with modal overlay (blur + crimson scrim), `.pV1-modal` panel matching `.pV1-card` chrome (gradient + inner border + crimson glow), close button, mast, head, meta dl, section h3 styling, features list, stack chips, link buttons, EOF row. Animations: 0.2s fade overlay, 0.3s slide+fade panel. Mobile-responsive at 700px breakpoint.

Accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at title h2, focusable close button with `aria-label`, Esc closes, backdrop click closes, body scroll locked while open.

### PROJ-03 — plaster a semi-transparent WIP accross the in dev ones

**User request:** "I would however like it if we could plaster a semi-transparent WIP accross the in dev ones though, just as like an extra, hey, this is not finished, its just something we want to show people, sort of visual que" — Gee, 2026-05-10.

**Resolution:** CSS-only addition — no markup changes. Pseudo-element `::after` on `.pV1-card.pV1-status-in-dev` and `.pV1-modal.pV1-status-in-dev` renders rotated "WIP" text using transparent fill + `-webkit-text-stroke` (outlined letters, low alpha — reads like an inked rubber stamp impression rather than a flat overlay).

Treatment:
- Cards: 180px / 18px letter-spacing / `-webkit-text-stroke: 3px rgba(220,20,60,0.22)` / `-14deg` rotation
- Modal: 320px / 28px letter-spacing / `-webkit-text-stroke: 4px rgba(220,20,60,0.13)` (lower alpha since modal covers more screen) / same `-14deg`
- `pointer-events: none` + `user-select: none` so it doesn't interfere with clicks or get selected by mouse drag
- `z-index: 0` on the stamp; `> * { position: relative; z-index: 1; }` lifts content above it
- `overflow: hidden` on the card so the stamp clips cleanly within the border
- Mobile breakpoint at 700px scales down to 140px / 180px font sizes

Shows on: Medieval Trading Game, Starship Made of Lies. Hidden on: Unity AI Chat (LIVE), Unity AI Lab Home (LIVE), ATree (OPEN SOURCE), If only I had a brain (RESEARCH).

**Verification:**
- `npm run dev` (vite 7.3.3 on :3001) — HMR confirmed across all four touched files
- Manual: clicked each card → modal opens → Esc + backdrop + × close → CTA still navigates external without triggering modal → WIP stamp visible on the two in-dev cards + their modals → not visible on the other four
- No type errors, no console errors, multi-page app routing intact

---

## 2026-05-10 — `feature/10-05-26-dependabot`

### DEP-01 — lets go on dependabot

**User request:** "lets go on dependabot" (Gee, 2026-05-10)

**Context:** GitHub Dependabot flagged 15 vulnerabilities on the default branch (1 critical, 7 high, 7 medium) — surfaced in push messages during the redesign-P1 work and previously logged as `docs/KNOWN-PROBLEMS.md` Problem #3 (deferred pending post-redesign-merge toolchain pass).

**Resolution:** `npm audit fix` (safe, non-`--force`) on `feature/10-05-26-dependabot` (branched off freshly-synced `develop` @ `17e7c11`) cleaned all 9 vulnerable packages (15 advisories) in one pass. No `--force` needed — every package had a clean upgrade path.

**Packages resolved:**

| Sev | Package | Resolution |
|---|---|---|
| Critical | `basic-ftp` | bumped past `<=5.3.0` (path traversal + CRLF injection + DoS chain) |
| High | `vite` | `^7.2.4` → `7.3.3` (WebSocket arbitrary read, `fs.deny` bypass, `.map` traversal) |
| High | `lodash-es` | code injection via `_.template` + prototype pollution |
| High | `minimatch` | ReDoS via GLOBSTAR backtracking |
| High | `rollup` | arbitrary file write via path traversal |
| High | `picomatch` | method injection in POSIX char classes |
| Medium | `postcss` | XSS via unescaped `</style>` |
| Medium | `ip-address` | XSS in Address6 HTML-emitting methods |
| Medium | `brace-expansion` | DoS via zero-step sequence |

**Verification:**
- `npm audit` → `found 0 vulnerabilities`
- `npm run build` → clean (sitemap gen + vite build + asset copy + cache-bust all pass)
- Only direct dep affected: `vite` `^7.2.4` → resolves to `7.3.3` (transitively bumped via lockfile)
- `package.json` unchanged; only `package-lock.json` rewritten (591 lines changed)

**Why this worked when KNOWN-PROBLEMS #3 said it was risky:** The redesign-P1 + redesign-P2 PRs have already been merged into develop, so the "cascade risk during active redesign migration" concern from that entry is moot. Toolchain pass on a fresh branch off post-merge develop is exactly the "natural moment" Problem #3's deferral plan called for.

**Cross-reference:** Problem #3 in `docs/KNOWN-PROBLEMS.md` moved to its Resolved section in this same commit.
