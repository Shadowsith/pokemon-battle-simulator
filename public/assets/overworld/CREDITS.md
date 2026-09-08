# Overworld art

Built by `scripts/gen-overworld-art.mjs` (pure Node, no deps):

```
node scripts/gen-overworld-art.mjs
```

- **`tileset.png`** — generated procedurally by the script (original, free to ship).
- **`player.png`** — the script slices a 3×4 grid of 16×20 frames out of
  **`Townspeople.png`** (a character sheet you dropped in this folder). If
  `Townspeople.png` is absent it writes a plain generated placeholder instead.
  Make sure you have the right to use whatever sheet you place here.

If either PNG is deleted the exploration mode still runs on flat-colour debug tiles.

## Formats

- **`tileset.png`** — 16×16 tiles, **8 per row** (`columns: 8` in `route01.json`).
  1-based, row-major ids: `1` grass, `2` path/sand, `3` tall grass, `4` water,
  `5` house wall, `6` tree trunk, `7` flower, `8` ledge,
  `10` tree canopy (overlay), `11` house roof/front (overlay).
- **`player.png`** — 48×64, **3 columns × 4 rows**. Rows: `down, left, right, up`.
  Col 0 = standing; cols 1–2 = walk frames.

## Swapping in your own character

Drop a 48×64 `player.png` (same 3×4 layout) in here — e.g. one character block
cropped from an RPG-style overworld sheet — and it overrides the generated one
with no code change. Use art you have the right to use.
