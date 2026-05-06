# P1-06 — Root config diff notes

Diff run during P1-06 sync (`feature/redesign-P1` branch). Source-of-truth = `REDESIGN/`. All 5 root configs synced to REDESIGN versions.

## Identical (no-op, committed for traceability)

- `_headers` — byte-identical
- `manifest.json` — byte-identical
- `favicon.ico` — md5 match (`3fee751c695f1d5089dc39fe01658138`)

## Differed — REDESIGN canonical version taken

### `humans.txt`

Contact email updated.

```diff
- Contact: unityailabcontact@gmail.com
+ Contact: contact@unityailab.com
```

Two lines (the file lists contact in both the team block and the contact block). Both updated. Taking REDESIGN's `contact@unityailab.com` since the redesign represents current Unity AI Lab branding/infra.

### `robots.txt`

REDESIGN adds two `Disallow` lines:

```diff
+ Disallow: /_archive/
+ Disallow: /docs/
```

Forward-compatible with P1-08 (`/_archive/` move) and P1-09 (`/docs/redesign/screenshots/` move) — keeps historical archives + redesign-internal docs out of search indexes. Aligns with site posture that the public surface is the 7 redesign HTMLs + `/ai/demo/` + `/downloads/`. No user-facing impact.

## How to revert if either decision is wrong

```bash
git checkout HEAD~1 -- humans.txt robots.txt
```

Then take whichever direction Gee/team prefers and re-commit.
