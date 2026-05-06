# _archive/

**Documentation only. Not served from production.**

This folder is excluded from search-engine crawling via `robots.txt` and is intended
to keep historical snapshots of the site available for reference without exposing
them as live pages.

## Contents

### `v1-original/`

The original Bootstrap-driven landing page (and its supporting JS) as it existed
before the v2 gothic redesign. Useful for:

- comparing the rewrite against the original copy / SEO meta
- rescuing patterns we removed (smoke effect, visitor counter, age-gate)
- auditing which `apps/` modules were referenced from the homepage

Files:

| File | What it was |
|---|---|
| `index.html` | the original landing — Bootstrap 5, fixed-top navbar, 8 sections |
| `home-init.js` | homepage-specific glue (countdown, hover effects, smoke mount) |
| `page-init.js` | shared page bootstrap |
| `visitor-tracking.js` | unique-visitor counter (talked to a VPS endpoint) |
| `visitor-tracking-loader.js` | non-min copy used while debugging mime-type 404s |
| `styles-snapshot.css` | snapshot of the live `styles.css` at archive time |

The active `styles.css` at the project root is still the source of truth for
shared tokens — both the new gothic landing and `Unity Web Design.html` import it.

## Why `_`?

Cloudflare Pages and Netlify both treat leading-underscore folders as private by
default. GitHub Pages does **not** — but we already disallow it in `robots.txt`,
and nothing in the deployed site links here. If we move to a host that does serve
this folder, add a `_redirects` rule sending `/\_archive/*` to a 404.

## Promotion ledger

| Date | Action |
|---|---|
| 2026-04-26 | v1 archived; `Gothic Landing.html` promoted to `/index.html` |
