# Unity AI Lab — Handoff to Claude Code

**Status as of this commit**: All seven user-facing pages have been redesigned
to the gothic codex system. The site is shipped as static HTML with no build
step — drop it on any static host (Cloudflare Pages, Netlify, GitHub Pages, S3+CF).

---

## What's live (root-level `.html` files)

| URL | File | Codex |
|---|---|---|
| `/` | `index.html` | V-D landing (hero + sections) |
| `/about` | `about.html` | V2 — Cathedral fusion |
| `/services` | `services.html` | Codex 01 |
| `/projects` | `projects.html` | Codex 02 |
| `/ai` | `ai.html` | Codex 03 |
| `/apps` | `apps.html` | Codex 04 |
| `/contact` | `contact.html` | V1 |

Plus design-system reference: `Unity Web Design.html` (internal docs, `noindex`).

### Routing

Every page is reachable at four equivalent URLs:

| Pattern | Resolves to |
|---|---|
| `/projects` (extensionless) | `projects.html` directly (host clean-URL feature) |
| `/projects.html` | new file directly |
| `/projects/` | redirect stub at `projects/index.html` → `/projects.html` |
| `/projects/index.html` | same redirect stub |

Same pattern for `/about`, `/contact`, `/ai`, `/apps`. Stubs use 4 redirect
methods (meta-refresh, `location.replace`, canonical, robots-noindex) so
legacy bookmarks keep working AND search engines consolidate to the new URL.

---

## Architecture (no build step)

Every page follows the same shape:

```html
<head>
  <!-- SEO + Open Graph + Twitter + favicons + manifest -->
  <link rel="stylesheet" href="redesign/shared-tokens.css">
  <link rel="stylesheet" href="redesign/variations.css?v=16">
  <!-- per-codex CSS modules -->

  <!-- React 18.3.1 + Babel standalone, pinned with integrity hashes -->
  <script src="https://unpkg.com/react@18.3.1/.../react.development.js" integrity="..."></script>
  <script src="https://unpkg.com/react-dom@18.3.1/.../react-dom.development.js" integrity="..."></script>
  <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="..."></script>

  <!-- Site chrome (shared) -->
  <script type="text/babel" src="redesign/sigils.jsx"></script>
  <script type="text/babel" src="redesign/v-d-chrome.jsx"></script>
  <script type="text/babel" src="redesign/v-d.jsx"></script>
  <script type="text/babel" src="redesign/v-d-sections.jsx"></script>

  <!-- Per-page content -->
  <script type="text/babel" src="redesign/<page>-data.jsx"></script>
  <script type="text/babel" src="redesign/<page>-v1.jsx"></script>
</head>
<body>
  <a class="vD-skip" href="#main-content">Skip to main content</a>
  <div id="root"></div>
  <script type="text/babel">
    const { GothicNavbar, GothicFooter, /* page component */ } = window;
    const App = () => (
      <div className="vD-page" data-screen-label="...">
        <GothicNavbar />
        <main id="main-content" role="main">
          {/* page component */}
        </main>
        <GothicFooter />
      </div>
    );
    ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
  <script src="redesign/gothic-init.js?v=1" defer></script>
  <script src="redesign/v-d-smoke.js?v=3" defer></script>
</body>
```

**Components export to `window.*`** at the bottom of each JSX file
(`window.GothicNavbar = ...`, `window.ProjectsV1 = ...`, etc.) because each
`<script type="text/babel">` gets its own transpilation scope.

---

## Critical files

```
redesign/
  shared-tokens.css       — CSS variables: colors, fonts, spacing scale
  variations.css          — global gothic component styles (?v=16 cache buster)
  codex-shared.css        — codex chrome: mast / meta strip / cover / band / eof
  about.css, about-v2.css — About page styles
  services-v1.css         — Codex 01 styles
  projects-v1.css         — Codex 02 styles (now ?v=1)
  ai-v1.css               — Codex 03 styles
  apps-v1.css             — Codex 04 styles

  sigils.jsx              — SVG icon set (window.Sigils)
  v-d-chrome.jsx          — GothicNavbar, GothicFooter, GothicVisitorCounter
  v-d.jsx                 — landing-page sections
  v-d-sections.jsx        — additional landing sections

  about-data.jsx          — content JSON for About
  about-v2.jsx            — About V2 component (Cathedral fusion)
  services-data.jsx       — Codex 01 content
  services-v1.jsx         — Codex 01 component
  projects-data.jsx       — Codex 02 content (6 projects)
  projects-v1.jsx         — Codex 02 component
  ai-data.jsx             — Codex 03 content
  ai-v1.jsx               — Codex 03 component (Coming Soon dropped)
  apps-data.jsx           — Codex 04 content (8 apps)
  apps-v1.jsx             — Codex 04 component

  gothic-init.js          — replaces old js/init.js. Handles:
                            FOUC prevention, smooth scroll, contact-form
                            validation + toast, mobile menu, scroll-to-top
  v-d-smoke.js            — particle smoke effect on landing
  uwd-*.jsx, unity-web-design.css — internal design-system docs page
```

---

## Design tokens (cheat sheet)

```css
/* From redesign/shared-tokens.css */
--crimson-red: #dc143c;
--bone:        #e8e4d8;
--white:       #ffffff;
--light-grey:  #c0c0c0;
--muted-grey:  #888;
--font-display: 'Cormorant Garamond', serif;
--font-body:    'Inter', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

The codex chrome (mast / meta / cover / band / eof) is in `codex-shared.css`
and is shared across services, projects, ai, apps. To add a new codex page,
mirror the existing pattern: write `<page>-data.jsx`, `<page>-v1.jsx`,
`<page>-v1.css`, and a host `<page>.html`.

---

## Bullet rendering caveat (read this)

`html-to-image` (used by screenshot/PDF/PPTX export tools) **silently drops
`::before`/`::after` pseudo-element content**. All bullet markers in cards
must be **real DOM `<span>` elements**, not pseudo-elements. See:

- `redesign/projects-v1.jsx` — `<span className="pV1-bullet-mark">›</span>`
- `redesign/ai-v1.jsx`       — `<span className="aiV1-bullet-mark">→</span>`

If you add a new card type with a list, **do not use `::before` for the
marker glyph** — render a real DOM node with `aria-hidden="true"`.

---

## What's been archived (`_archive/`)

```
_archive/
  v1-original/            — original Bootstrap 5 + AOS site (snapshot)
  about-v1-original/      — original About + about.js + about-contact.js
  contact-v1-original/    — original Contact + contact-form.js
  projects-v1-original/   — original Projects
  ai-v1-original/         — original AI ("Coming Soon" + ai-init.js)
  apps-v1-original/       — original Apps + apps.css + apps-init.js

  exploration-shells/     — design-canvas explorations (early prototypes)
    Gothic Landing.html, Landing Redesign.html,
    About Redesign.html, About Redesign V2.html, design-canvas.jsx

  old-stack/              — old script/css/vendor stack, no longer loaded
    styles.css            — 1500+ line monolithic CSS (replaced by token system)
    js/                   — 10 ES6 modules (init, navigation, smoke, forms…)
    vendor/               — Bootstrap 5 + Font Awesome (removed; gothic uses neither)
    apps-shared-nav/      — apps subpage shared chrome (orphaned now)

  old-docs/
    ARCHITECTURE.md       — outdated architecture doc; this HANDOFF.md supersedes
```

**Nothing in `_archive/` is loaded by any live page.** Safe to delete in
bulk if disk space matters; kept for historical reference and to recover
content if any of the gothic rewrites are missing copy.

---

## Routing config

`_headers` (Cloudflare Pages syntax) is at the project root for header
control. If migrating to Netlify, the same syntax works. For other hosts,
extensionless URLs require either:
- A clean-URLs feature flag (Cloudflare Pages does this natively), OR
- An `_redirects` / `.htaccess` rule mapping `/about` → `/about.html`

The folder-based redirect stubs (`about/index.html` etc.) cover the case
where the host serves `<dir>/index.html` for `/<dir>/`.

---

## Things Claude Code might want to do next

1. **Wire actual Pollinations chat iframe** into `/ai`. Currently the page
   is the gothic frame + content; the iframe embed is a styled placeholder.
2. **Verify `apps/personaDemo/` referenced from projects-data IV** —
   may not exist; needs a real link or a `disabled` state.
3. **Add a sitemap.xml** generator or rewrite the existing one with the
   new URL set.
4. **Visitor counter**: currently uses `abacus.jasoncameron.dev` (free,
   namespace `unityailab`). If that ever 404s, swap providers in
   `<GothicVisitorCounter />` (`redesign/v-d-chrome.jsx`).
5. **Convert from React+Babel-in-browser to a real build**: the current
   setup works but each page reparses ~5 JSX files in the browser. A
   simple esbuild or Vite step would 10× the load. Worth doing if traffic
   warrants it.
6. **Delete `_archive/`** when you're confident nothing's missing from
   the rewrites.
