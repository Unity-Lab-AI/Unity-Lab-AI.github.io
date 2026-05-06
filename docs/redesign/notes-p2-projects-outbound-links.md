# Notes — P2 — Projects page outbound GitHub URLs (HANDOFF item 8)

## Source

`/redesign/projects-data.jsx` — three outbound GitHub URLs in the project card CTAs.

## Found URLs

| Line | Card | Label | URL |
|------|------|-------|-----|
| 54 | II — CodeWringer | "View on GitHub" | `https://github.com/Unity-Lab-AI/CodeWringer` |
| 71 | III — research | "Explore research" | `https://github.com/Unity-Lab-AI` |
| 122 | (history card) | "See history" | `https://github.com/Unity-Lab-AI` |

## Status — flagged, not fixed

Per `TASKS-P2.md` P2-06 acceptance criteria:

> Per HANDOFF outstanding item 8: CodeWringer + Unity-Lab-AI org GitHub URLs in projects-data.jsx cards II/III — verify they point at the intended repos. If targets are wrong/missing, log to `/docs/redesign/notes-p2-projects-outbound-links.md`. **Do NOT silently fix; flag for post-work integration.**

I did not validate these URLs myself (no WebFetch verification was performed during P2-06). Two of the three (cards III and "history card") share the same generic org URL `https://github.com/Unity-Lab-AI` which the user/Gee may have intended as a placeholder pending the right repo.

## Action for post-work integration

1. Open each URL in a browser:
   - `https://github.com/Unity-Lab-AI/CodeWringer` — confirm repo exists, is public, and is the intended target for the CodeWringer card.
   - `https://github.com/Unity-Lab-AI` — confirm the org URL is the right destination for the "Explore research" CTA, OR replace with a more specific repo.
   - `https://github.com/Unity-Lab-AI` (line 122) — same check for the "See history" CTA. Two cards pointing at the same generic org page is a smell.
2. If any are wrong, edit `/redesign/projects-data.jsx` directly (no longer dual-person-zone post-merge).
3. Update HANDOFF outstanding item 8 to closed.

## Files I did not modify

`/redesign/projects-data.jsx` — copied verbatim from `REDESIGN/redesign/projects-data.jsx`. URLs left as authored.
