# FINALIZED — Completed Tasks

> Archive of completed work. Verbatim user words preserved per LAW #0.
> Never delete entries from this file — historical record.

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
