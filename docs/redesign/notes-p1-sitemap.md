# P1-07 — Sitemap rewrite decision log

Sitemap.xml + sitemap-images.xml + sitemap-index.xml all rewritten during P1-07 on `feature/redesign-P1`.

## URL form decision: `.html` extension

Three candidate forms were on the table for the 6 redesign HTMLs (about, ai, apps, contact, projects, services):

| Form | Behavior | Crawl footprint |
|---|---|---|
| `/about` (extensionless) | GH Pages serves `/about.html` natively when no `/about/` directory exists. **But `/about/` DOES exist** (redirect stub) — so this form likely 404s. | Risky |
| `/about/` (trailing slash) | Serves the redirect stub at `/about/index.html` → `<meta refresh>` + `window.location.replace()` to `/about.html` | 200 stub → 302/JS → 200 (chain) |
| `/about.html` (extension) | Serves the actual gothic V-D page directly | Single 200 ✔ |

**Picked: `.html` form.** Reason: canonical resource, no redirect chain in indexing, fastest crawl, zero dependence on routing magic. Crawlers (Google/Bing) follow chains fine but each hop costs budget; pointing at the canonical resource is cleaner.

The redirect stubs at `/about/` etc. remain useful for old inbound links (anchor tags from external sites pointing at the old `/about/` form still resolve via the stub redirect). They're backward-compat, not the canonical surface.

`/ai/demo/` and `/downloads/` keep trailing-slash form because they ARE genuine directory roots (no `.html` sibling), not redirect stubs.

`/` for homepage — special case, GH Pages serves `/index.html` natively at root.

## URL set committed (9 URLs)

```
/                             priority 1.0   daily
/ai.html                      priority 0.9   daily
/ai/demo/                     priority 0.9   daily
/about.html                   priority 0.8   weekly
/services.html                priority 0.8   weekly
/projects.html                priority 0.8   weekly
/apps.html                    priority 0.8   weekly
/contact.html                 priority 0.7   monthly
/downloads/                   priority 0.5   weekly
```

Priorities follow the per-URL spec from `Docs/redesign/TASKS-P1.md`. The previous sitemap (236 lines) listed every individual app subpage (unityDemo, textDemo, personaDemo, etc.) and split keyword comments per URL — that was retired since:

- App subpages are out-of-scope per the migration doc and remain accessible by direct URL — a search engine that finds them via internal links will still index them, no need to spam the sitemap
- The redesign URL set is the new canonical site surface
- Keyword-stuffed comments don't help SEO and add maintenance noise

## sitemap-images.xml audit

Previous file had 9 `<url>` blocks, 7 of which were entirely commented-out placeholders pointing at `/assets/*.png` paths that **never existed on disk**. Audited during P1-07:

```bash
ls assets/  # nonexistent
```

Kept only verified-on-disk image refs:

- `/favicon.ico` — homepage branding (`md5: 3fee751c695f1d5089dc39fe01658138`)
- `/downloads/moana/image.png` — moana miner thumbnail (verified `ls downloads/moana/image.png` → exists)

Net result: 9 entries → 2 entries. When real visual assets ship (e.g. hero imagery, screenshot gallery), add fresh entries pointing at actually-shipped files.

## Lastmod date

All three sitemap files use `<lastmod>2026-05-05</lastmod>` (today, the migration date per session context). The previous sitemaps used `2025-12-17` — stale.

## sitemap-index.xml

Bumped its two child `<lastmod>` entries to `2026-05-05` to match. Otherwise unchanged.

## Build pipeline note

The repo has `/generate-sitemap.js` in the out-of-scope build pipeline (per migration doc OUT-of-scope list). I did NOT run it — wrote sitemap.xml directly. If the build pipeline is later wired up, that script may overwrite this file unless its template is updated to match.

### Update — 2026-05-06 — generator patched on `feature/fix-sitemap-generator`

The build pipeline IS wired up (deploy.yml runs `npm run build` which fires `generate-sitemap.js` before `vite build` and `copy-assets.js`). The pre-patch generator regressed the canonical sitemap on every deploy by:

- Reverting `.html` extension URLs to trailing-slash directory paths (defeating the SEO decision above)
- Dropping `/apps/` URL entirely
- Dropping `/downloads/` URL with the Moana `<image:image>` block
- Dropping the `<?xml-stylesheet>` declaration, the multi-namespace `<urlset>` tag, the rationale comment, and per-URL inline comments

`generate-sitemap.js` is now patched to emit the canonical 9-URL post-redesign structure. Verification: `node generate-sitemap.js && git diff sitemap.xml` shows ONLY `<lastmod>` date deltas — every other byte preserved. URL set, priorities, changefreqs, and the `/downloads/` image block live in the script's `PAGE_CONFIG` array as single source of truth.

## How to revert

```bash
git checkout HEAD~1 -- sitemap.xml sitemap-images.xml sitemap-index.xml
```

Then re-author from the previous form if the `.html`-extension decision needs reversing.
