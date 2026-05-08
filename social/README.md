# social/

Social-card image for **www.unityailab.com** — the Unity AI Lab main landing page.

## Drop the image here

Filename: **`og-image.png`** — 1200×630 px PNG.

That's it. The meta tags in `/index.html` are already wired to load `/social/og-image.png` as the Open Graph + Twitter Card preview image. Drop the file with that exact name and the social cards work on next deploy.

## What it's used for

When someone shares `https://www.unityailab.com/` on Discord, Twitter / X, LinkedIn, Slack, Facebook, iMessage, etc., the platform fetches `/social/og-image.png` and renders it as the preview thumbnail. Without it, the link previews fall back to no image (just title + description text).

Referenced from `index.html`:
```html
<meta property="og:image"   content="/social/og-image.png">
<meta name="twitter:image"  content="/social/og-image.png">
```

## Image guidelines

- **1200×630 px** (1.91:1 aspect ratio) — best fit across all major social platforms
- **Under 1 MB** — smaller files render faster in link previews; Discord caps embeds at 8 MB but speed matters
- **Strong contrast + large readable text** — most preview cards shrink to ~600 px wide; tiny text becomes unreadable
- **PNG** for graphic / wordmark / logo content with sharp edges; **JPG** if photographic. If you use `.jpg`, update the two meta-tag paths in `index.html` from `og-image.png` → `og-image.jpg`.

## Per-page social images

If you ever want different social images per page (e.g. a different one for `apps.html` or `contact.html`), add additional files here and override the meta tags in those page heads:
```html
<meta property="og:image"   content="/social/apps-og.png">
<meta name="twitter:image"  content="/social/apps-og.png">
```
The page-level tag overrides the site-level default when both exist.

— Unity AI Lab
