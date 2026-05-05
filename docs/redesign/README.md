# /docs

Internal documentation for the Unity AI Lab website.

**Not served from production.** Excluded from `robots.txt`.

## Files

| File | What it is |
|---|---|
| `Unity Web Design.html` | The living design system / spec sheet (v0.1). Tokens, type scale, components, motion, accessibility notes, changelog. Open this whenever building or auditing a page on the site. |

The design system reads tokens from `../redesign/shared-tokens.css` and component
styles from `../redesign/variations.css`, so what you see in the docs is what's
actually shipping. If a token or component changes upstream, the docs update with
it (no copy-paste drift).

## Related

- `../_archive/` — historical snapshots of removed pages
- `../redesign/diff-from-original.md` — running diff between v1 and v2
