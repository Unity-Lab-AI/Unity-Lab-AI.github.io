# assets/

Every asset in SEX SLAVE DUNGEON (locations, items, dungeons, rooms, facilities) has its own folder here.

## Folder structure

```
assets/
├── locations/<id>/      ← outside-world hunt locations (street, club, library, …)
├── items/<id>/          ← tools, drugs, food, outfits, upgrade kits (rohypnol, duct-tape, …)
├── dungeons/<id>/       ← base dungeon templates (hole-in-the-wall, cinderblock, estate, …)
├── rooms/<id>/          ← individual cell/room variants (room-basic, room-deluxe, …)
└── facilities/<id>/     ← shared dungeon facilities (kitchen, security-office, …)
```

Each asset folder contains:

- **`prompt.txt`** — the **PG-beat-around-the-bush image prompt** committed with the game. This is the prompt you feed to an image generator to produce the asset's cover image. Already written for every asset in the catalog.
- **`cover.png`** (or `.jpg` / `.jpeg` / `.webp`) — the actual image, **added by you** after you run the prompt. The loader auto-discovers it.

You can also name the file `<id>.png` / `<id>.jpg` (e.g., `rohypnol.png`) — the loader accepts both conventions.

## How the loader finds your images

`js/assets/loader.js` tries these filenames in order for each asset folder:

1. `cover.png`
2. `cover.jpg`
3. `cover.jpeg`
4. `cover.webp`
5. `image.png`
6. `image.jpg`
7. `<id>.png`
8. `<id>.jpg`

First one that resolves wins. If nothing is there, the game renders an emoji fallback instead — the game is fully playable without any images at all.

## Beat around the bush (important)

All the shipped `prompt.txt` files use **euphemistic, artistic, documentary, and product-catalog** framings. This is deliberate — image generators filter on specific language. The prompts describe atmospheres, props, lighting, camera style — and let the context imply the rest. Adjust to your target model's quirks if needed.

Example — instead of describing something directly, a rohypnol prompt says:

> "studio product shot of a single small glass medical vial of clear liquid, rubber-stopper top, pharmacy-grade labeling slightly blurred, professional commerce photography"

The game logic itself uses the asset's `id` + `emoji` + `displayName` from the catalog — zero hardcoded filenames.

## Authoring your own new asset

1. Pick a unique `id` (e.g., `strip-club`).
2. Add an entry to the appropriate category array in `js/assets/catalog.js` (id, displayName, emoji, category, prompt, cost, unlock, any category-specific fields like `gridPlacement` for locations).
3. Create the folder: `assets/<category-plural>/<id>/` (e.g., `assets/locations/strip-club/`).
4. Drop in a `prompt.txt` with the PG-beat-around-the-bush image prompt.
5. Run the prompt through your image generator.
6. Save the output as `cover.png` (or any of the accepted filenames) in the folder.
7. Done — the game picks it up automatically next load.

## Bulk prompt export

Call `window.SSDAssetLoader.allAssetsWithPaths()` in the browser console to dump every asset's folder path and prompt — useful for batch-generating images.
