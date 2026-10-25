# Project overview

A local Pokémon battle simulator app with animated battles against NPCs. Stack: Ionic 8 / Angular 20 (standalone components, lazy routes in `src/app/app.routes.ts`) / Capacitor 8 for Android/iOS. Tests: Karma + Jasmine (`ng test`; locally needs `CHROME_BIN=/usr/bin/chromium --browsers=ChromeHeadless`).

- **UI language is German** (German Pokémon, move and item names, battle log lines, e.g. "Arenaleiter", "Top-Vier", "Glurak"). Code, comments and docs are English.
- **Game data:** Gen 6 rules/dex (Fairy type exists, Gen 6+ item values), species scope roughly Gen 1–6. Every Pokémon fights at **level 100**; authored teams only keep species, moves and items. Abilities are not modelled.
- **`@pkmn/sim`** is used as the data source (Dex: moves, species, stats, targets, items), **not** as the battle engine. The battle engine is custom.

## Game modes (pages in `src/app/pages/`)

- `team-select` – start screen / mode selection (default route).
- `teams` – team builder; teams persisted in localStorage, import/export via file (`team-file.service`, `team-transfer.model`).
- `battle` – the battle screen, also used as `debug-battle` (with `debug-panel`). Supports singles and doubles.
- `custom-battle` – configure and save custom fights (opponent team, format).
- `elite-four` – run-based challenge page, used for both **Top-Vier** (`/elite-four`) and **Arenaleiter-Herausforderung** (`/gym-challenge`), selected by route `data.challenge`. A run is a sequence of authored trainers per region; HP/status carry over between fights (`RunCarry`).
- `settings` – app settings (`settings.service`).

## Code layout (`src/app/`)

- `core/models/` – data shapes and static data: `pokemon`, `move`, `item`, `team`, `trainer`, `battle-pokemon` (`toBattlePokemon` turns a team slot into a battle-ready mon), `trainer-run.model` (shared shapes for run modes: `RunRegion`, `RunMember`, `RunMon`), authored rosters `elite-four.model` and `gym-leader.model` (split per region under `gym-leader/`), generated tables (`item-table`, `species-names.de`).
- `core/battle/` – pure, Angular-free battle logic: `battle-format` (singles/doubles slots, move targeting, turn order), `item-effects` (held item effects), `npc-ai` (NPC move choice), `npc-items` (item picks for random NPCs).
- `core/services/` – `damage-calc` (damage, HP stats, drain/recoil), `status`, `stat-change`, `move-animation` (animation engine composing per-move effects from @pkmn/sim move data), `audio` (SFX/cries/music, no-op if file missing), `dex-data` (loads static team-builder JSON from `public/assets/data`), `npc-team` (random NPC teams), `trainer-roster` (trainer sprites), `trainer-run` + `gym-run` / `elite-four-run` (run state), `team`, `custom-battle`, `settings`.
- `core/services/move-animation/` – the animation engine behind the `move-animation.service` facade: static classes `Fx` (DOM primitives), `FxGlyphs` (particle/prop elements), `FxEffects` (effects shared across types), `DeliveryAnimations` (generic animation per delivery: melee, beam, lob, …), `MoveVisualBuilder` (move data → `MoveVisual`). Hand-made per-move animations live in `moves/<type>-moves.ts` (one static class per type with an `anims` registry, merged in `moves/index.ts`) — **a new custom animation goes into the file of its move's type**.
- `shared/` – reusable components: `item-icon`, `item-picker`, `search-select`.
- `pages/battle/battle.page.ts` currently holds the battle loop itself (state, turn execution, damage application, items, AI calls, animations) — the main candidate for refactoring into engine classes.

## Assets & scripts

- `public/assets/` – `sprites`, `sounds`, `trainers`, `data` (generated). Generated/fetched by `scripts/*.mjs` (`fetch-sprites`, `fetch-cries`, `fetch-trainers`, `fetch-item-icons`, `build-team-data`, `build-item-table`, `generate-move-library`, `categorize-moves`, …).
- `docs/` – concepts and checklists (Kalos team concepts, move animation/sound review checklists, music themes, local multiplayer concept — not implemented).

## Known oversized files (split before extending)

`battle.page.ts` (~1900), `item-table.ts` (~1000, generated).

# Code structure

- Structure code as object-oriented as possible. Use classes with encapsulation (private/protected members, clear public APIs) and inheritance where it makes sense — e.g. shared base classes for related concepts instead of duplicated logic. Don't force it where plain data or a simple function is clearer.
- Avoid files with more than 1000 lines. Before adding more implementation to a large file, rethink its structure first and split it into smaller, focused files (e.g. a subfolder per topic with one file per part, re-exported from the original entry file).
