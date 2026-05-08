# social/

Social-card image for **www.unityailab.com** — the Unity AI Lab main landing page.

## Drop the image here

Filename: **`og-image.jpg`** — 1200×630 px JPG (quality ~88).

That's it. The meta tags in `/index.html` are already wired to load `/social/og-image.jpg` as the Open Graph + Twitter Card preview image. Drop the file with that exact name and the social cards work on next deploy.

## What it's used for

When someone shares `https://www.unityailab.com/` on Discord, Twitter / X, LinkedIn, Slack, Facebook, iMessage, etc., the platform fetches `/social/og-image.png` and renders it as the preview thumbnail. Without it, the link previews fall back to no image (just title + description text).

Referenced from `index.html`:
```html
<meta property="og:image"   content="/social/og-image.jpg">
<meta name="twitter:image"  content="/social/og-image.jpg">
```

## Image guidelines

- **1200×630 px** (1.91:1 aspect ratio) — best fit across all major social platforms
- **Under 1 MB** — smaller files render faster in link previews; Discord caps embeds at 8 MB but speed matters. Current `og-image.jpg` ships at ~100 KB.
- **Strong contrast + large readable text** — most preview cards shrink to ~600 px wide; tiny text becomes unreadable
- **JPG** is the industry default for OG cards (Twitter, LinkedIn, Facebook all serve their cards as JPG). Quality 85-90 is visually indistinguishable from lossless at preview scale + ships 10-20× smaller than PNG. If you swap to **PNG** (sharp-edge graphic, logo, wordmark), update the two meta-tag paths in `index.html` from `og-image.jpg` → `og-image.png`.

## Files in this folder

- `og-image.jpg` — the actual social card image referenced by the meta tags
- `UnityAILab.jpg` — branded-name copy of the same image (kept for archive / reference / brand-asset use). Not referenced by any meta tag; safe to delete or replace.

## Per-page social images

If you ever want different social images per page (e.g. a different one for `apps.html` or `contact.html`), add additional files here and override the meta tags in those page heads:
```html
<meta property="og:image"   content="/social/apps-og.png">
<meta name="twitter:image"  content="/social/apps-og.png">
```
The page-level tag overrides the site-level default when both exist.

— Unity AI Lab
