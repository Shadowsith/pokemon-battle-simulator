# Concept: default battle backgrounds

**Goal:** replace the plain white battle field (`.field { background: #fff; }` in [battle.page.scss](../src/app/pages/battle/battle.page.scss)) with themed scenes. Every fight gets one background; outdoor scenes come in a day and a night version. **Status: implemented** with generated SVG art.

## Backgrounds

| Id | Scene | Variants | Platform look |
|---|---|---|---|
| `grass` | Overworld grassy plain: blue sky, distant hills, short grass | day + night | grass ovals, light green ring |
| `forest` | Dense forest edge: tree trunks and canopy behind, leaf litter on the ground | day + night | moss / dirt ovals |
| `water` | "On the water": open sea or lake, horizon line, gentle waves | day + night | foam rings on the water (as if standing on a float or a rock) |
| `beach` | Beach: sand in front, sea strip at the horizon, palms on the edges | day + night (moonlight on the sea) | light sand ovals |
| `city` | City / town: house rows or skyline behind, paved square in front | day + night (lit windows, street lamps) | grey stone tiles |
| `cave` | Cave: rock walls, stalactites, dim light from above | one | rough rock ovals |
| `arena` | Outdoor arena: grandstand with crowd and pennants, clay pitch with court lines | day + night (floodlights) | clay with a white ring |
| `indoor` | Indoor arena / hall: wall, floor boards or tiles, ceiling lights | one | painted floor circles |
| `elite-four` | Top-Vier hall: formal championship room — violet walls, marble pillars, gold trim, banners, emblem, spotlights, polished floor | one | dark marble with a gold ring |

That gives **15 images** in total (6 × 2 + 3).

### Night versions
- Darker, blue-tinted sky; moon and stars; for `city` lit windows and lamps.
- Keep the **ground and platforms bright enough** that sprites stay readable. Sprites themselves are not darkened.
- Night is a separate image, not a CSS filter over the day image — a filter would also darken the lit windows and moon.

## Asset rules
- **Current art:** original flat SVG scenes drawn by `node scripts/build-backgrounds.mjs [sceneId ...]` (engine `scripts/backgrounds/svg.mjs`, recipes `outdoor.mjs` / `enclosed.mjs`) into `public/assets/backgrounds/`. Re-run the script after changing a recipe; output is deterministic (seeded).
- **Hand-painted replacements** (optional, later): self-made or free (CC0 / CC-BY) art only, no rips from the games. Note source and licence in a `CREDITS.md` next to the files. Changing the file extension means updating `backgroundUrl()` in `battle-background.ts`.
- **File names:** `<id>-day.svg`, `<id>-night.svg`; one-variant scenes as `cave.svg`, `indoor.svg`.
- **Size:** the landscape field is a fixed 640 × 300 stage; on portrait screens (< 640 px, [battle-portrait.scss](../src/app/pages/battle/battle-portrait.scss)) it is up to 639 × 340. Images are 1280 × 680 and use `background-size: cover; background-position: center bottom;`, so the ground stays visible in both layouts and only sky gets cropped.
- **Composition:** horizon at ~42 % from the top (y = 290 of 680). The opponent stands top right, the player bottom left; the HUDs sit top left and bottom right — keep those areas calm so HP bars stay readable.
- Platforms stay separate CSS elements (`.platform`), styled per scene in [battle-backgrounds.scss](../src/app/pages/battle/battle-backgrounds.scss). They are not painted into the image, because their positions differ between singles, doubles and portrait.

## Which background a fight uses

| Mode | Background |
|---|---|
| Random battle | random outdoor scene (`grass`, `forest`, `water`, `beach`, `city`, `arena`) |
| Custom battle (`custom-battle`) | setting "Hintergrund" in the config: "Zufällig (draußen)" (default) or a fixed scene; saved with the preset |
| Arenaleiter-Herausforderung | from the leader's speciality type (`GymLeader.type`), see below |
| Top-Vier | `elite-four` (champion included) |
| Debug battle | "Hintergrund" picker + "Nacht" checkbox in the debug panel swap the scene live for testing |

**Gym type → scene** (`sceneForGymType`):
- `water`: Water, Ice
- `forest`: Grass, Bug, Poison
- `cave`: Rock, Ground, Steel, Dragon, Ghost
- `city`: Electric, Normal, Dark
- `arena`: Fighting
- `indoor`: Psychic, Fairy, Fire
- `grass`: Flying (and any unknown type)

### Day or night
- **Device clock:** night from 20:00 to 6:00, in every mode except the debug battle (set by hand there).
- Picked once when the fight starts; it does not switch mid-fight.
- `cave`, `indoor` and `elite-four` have no night version.

## Code
- [battle-background.ts](../src/app/core/battle/battle-background.ts) — pure logic: scene list, gym-type mapping, `timeOfDay`, `backgroundUrl` (tests in `battle-background.spec.ts`).
- `BattleSetupService.pickBackground()` picks the scene per mode; `BattleStateService.background` holds it; the battle page binds it on `.field` (`data-scene`, `.night`, inline `background-image`).
- Move backdrops from `Fx.backdrop()` ([fx.ts](../src/app/core/services/move-animation/fx.ts)) are inserted as the field's first child, so they cover the scene during a move and it comes back when they are removed.
- `#fff` stays the fallback colour if an image is missing.

## Checklist
- [x] Generated SVG scenes (all 15 variants)
- [x] Platform styles per scene
- [x] Picking logic + tests (mode, gym type, day/night)
- [x] Scene setting in custom battle, live swap in the debug panel
- [ ] Moves that tint the screen (`DARK_BACKDROP`, flashes) checked on each scene, especially at night
- [ ] All scenes checked in singles, doubles and portrait layout on a device
- [ ] Optional: hand-painted replacements + `CREDITS.md`
