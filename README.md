# Pokémon Battle Simulator

Local Ionic 8 / Angular 20 / Capacitor 8 app for testing animated
Pokémon battles against NPCs (Gen 1-6 scope).

## Setup

```bash
npm install
npm run fetch:sprites   # downloads Showdown sprites (Gen 1-6) into public/assets/sprites
npm start                # ng serve, http://localhost:4200
```

Put your own sound files under `public/assets/sounds/`, see
`public/assets/sounds/README.md` for the naming convention.

## Native build (Capacitor)

```bash
npm run cap:add:ios       # or cap:add:android, once
npm run cap:sync          # builds Angular + syncs to ios/ and android/
npx cap open ios          # opens Xcode
npx cap open android       # opens Android Studio
```

## Project structure

- `src/app/core/models/` - Pokémon and move data models, including the
  move library with the move archetypes prototyped so far
- `src/app/core/services/move-animation.service.ts` - the actual
  animation engine (port of the chat prototypes), one archetype per
  basic visual pattern (melee, projectile, beam, multi-pulse,
  target levitation, direct discharge, ground effect)
- `src/app/core/services/audio.service.ts` - sound hook points, no-op if the
  file is still missing
- `src/app/pages/battle/` - the actual battle screen
- `src/app/pages/team-select/` - placeholder for the later team builder
- `scripts/fetch-sprites.mjs` - downloads all Showdown sprites for Dex #1-721
  (Gen 1-6) from https://github.com/PokeAPI/sprites

## Next steps

- Team builder UI (local PokeAPI data cache, e.g. SQLite/IndexedDB)
- Connect a battle engine (recommended: `@pkmn/sim`) instead of the current
  placeholder damage values in `move.model.ts`
- NPC decision logic
- Extend the move library to the full Gen 1-6 movepool and assign each move
  one of the existing archetypes

## Special thanks

Special thanks go to the [Pokémon Showdown](https://pokemonshowdown.com/) project
([GitHub](https://github.com/smogon/pokemon-showdown)) and its sprite artists.
The animated Pokémon sprites (front and back), the trainer sprites and the
Substitute sprite come from there. The Pokémon sprites are downloaded via the
mirror in the [PokeAPI/sprites](https://github.com/PokeAPI/sprites) repository,
the trainer sprites directly from Showdown.

Legal notes on the material used are in [LEGAL.md](LEGAL.md).
