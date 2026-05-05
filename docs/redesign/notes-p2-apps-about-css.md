# Notes — P2 — apps.html about.css investigation

## Question

Why does `/apps.html` load `redesign/about.css` and `redesign/about-v2.css`? Are those stylesheets actually needed by the apps page, or are they copy-paste leftovers from cloning the about template?

## Investigation

### 1. Grep `apps-v1.jsx` for about-page class names

Searched for any class reference matching `.aA-`, `.aB-`, `.aC-`, `.aD-`, or `.ab-` (the namespaces about.css owns):

```
grep -oE '\.(aA|aB|aC|aD|ab)-[a-zA-Z-]+' REDESIGN/redesign/apps-v1.jsx
```

**Result: ZERO matches.** apps-v1.jsx renders nothing in the about-page namespaces.

### 2. Grep `apps-v1.css` for about.css imports

```
grep -E "@import|about" REDESIGN/redesign/apps-v1.css
```

**Result: ZERO matches.** apps-v1.css does not `@import` about.css and contains no references to about-page primitives.

### 3. Read about.css scope comment

The header comment of `REDESIGN/redesign/about.css` is explicit:

```
/* About-page redesign — 4 directions on one canvas.
   Direction prefixes:
     .aA-  Dossier         classified file aesthetic
     .aB-  Reliquary       sigil-led, glass-case cards
     .aC-  Cathedral       full-bleed, ceremonial
     .aD-  Manifest        ship/voyage manifest
   Shared primitives use .ab-  (about-shared.jsx)
*/
```

All five namespaces (`aA-`, `aB-`, `aC-`, `aD-`, `ab-`) are explicitly scoped to about-page rendering.

### Conclusion

**The two `<link>` tags are copy-paste leftovers from cloning the about template.** apps-v1.jsx does not consume any about-page classes; apps-v1.css does not import any about styles; the about.css header doc confirms its primitives are about-only.

## Decision

**Comment out the two `<link>` tags** in `/apps.html` (preserving them for easy fallback) and add a comment explaining why. Did NOT delete outright because:

1. Static analysis is high-confidence but not 100% — a runtime browser smoke-test could still reveal an unforeseen style dependency (cascading variable inheritance, an `.ab-page` body wrapper, etc.).
2. Easy revert path if smoke-test fails — uncomment four lines.
3. The shared variables (`--bone`, `--crimson-red`, `--font-body`, etc.) all live in `shared-tokens.css`, not `about.css` — so the apps page should still have its design tokens after this removal.

## Edit applied

`/apps.html` lines 63-64 wrapped in an HTML comment with a pointer to this doc:

```html
<!-- P2-10: about.css + about-v2.css commented out — apps-v1.jsx references no .aA-/.aB-/.aC-/.aD-/.ab- classes. See /docs/redesign/notes-p2-apps-about-css.md. Re-enable if browser smoke-test reveals missing styles.
<link rel="stylesheet" href="redesign/about.css" />
<link rel="stylesheet" href="redesign/about-v2.css" />
-->
```

## Browser smoke-test (cannot run from CI)

Required before P2 PR merges into `dev-re-design`:

- [ ] Open `/apps.html` in a browser
- [ ] Verify the page renders identically to a baseline screenshot of the REDESIGN/apps.html state (with about.css enabled)
- [ ] Specifically check: card layout, header chrome, footer, hover states, responsive grid, codex band/cover/eof
- [ ] If anything looks off — uncomment the two link tags, retry, file a follow-up note here saying which about-css selector turned out to be load-bearing

## Cross-reference for post-work integration

If the smoke-test passes, this branch can be considered safe to merge.

If the smoke-test reveals shared primitives that ARE actually being used by apps despite not appearing in apps-v1.jsx (e.g. inherited via React component composition from a shared module), the cleaner long-term fix is to **extract the shared primitives from about.css into a new `redesign/codex-base.css`** and have BOTH about and the codex pages load that. That's a P1+P2 cross-territory move and belongs in post-work integration, not this branch.
