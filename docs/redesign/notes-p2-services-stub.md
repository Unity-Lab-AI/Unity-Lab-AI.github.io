# Notes — P2 — Services redirect stub written fresh

## Why this exists

`REDESIGN/` ships redirect stubs at `about/index.html`, `ai/index.html`, `apps/index.html`, `contact/index.html`, and `projects/index.html` — but **not** at `services/index.html`. P2-05 covers writing this one fresh from the `about/index.html` template.

## What was there before

The legacy `/services/index.html` was a ~32KB Bootstrap-era Services page (v2.1.5, "Unity AI Lab Services - AI Integration Services...", canonical to `/services/`). It was the OLD services landing.

## What's there now

A ~1KB redirect stub (`<meta http-equiv="refresh">` + `window.location.replace('/services.html')`) that bounces anyone hitting `/services/` to the new redesigned `/services.html`.

The legacy 32KB file is **gone from `services/index.html`** but **preserved** under `REDESIGN/_archive/` once P1 moves it (P1-08), per Gee's directive: *"we don't want to remove anything at this point"*.

## Stub structure

Matches the other folder stubs verbatim — `meta charset`, `<title>`, `noindex` robots tag, canonical pointing at the flat `.html`, both `<meta http-equiv="refresh">` AND `window.location.replace()` (belt-and-suspenders), inline minimal styles in case the redirect somehow stalls, and a fallback `<a>` link.

Identical pattern to:
- `/about/index.html` (P1)
- `/contact/index.html` (P1)
- `/projects/index.html` (P2-06)
- `/ai/index.html` (P2-07)
- `/apps/index.html` (P2-08)

## For post-work integration

Nothing structural to flag — this stub matches the family. Just note that `services/index.html` was **rewritten fresh** during P2-05 (not copied from REDESIGN), so anyone diff'ing `REDESIGN/` against the live site won't find a source for it.
