# Technical concept: tournament mode ("Turnier")

**Status:** implemented · **Scope:** single-player knockout bracket against NPCs

## Context
The app has single fights (random / Custom Battle) and linear runs (Arenaleiter, Top-Vier). A knockout tournament adds a new mode: the player and 3/7/15 NPC trainers are placed in a bracket shown as a diagram. The player fights their matches. NPC-vs-NPC matches get an instant result. The tournament is configured with the same random-opponent settings as Custom Battles.

Decisions (confirmed):
- Bracket sizes: **4, 8 or 16** entrants.
- NPC vs NPC: **instant result**, a weighted random pick by team strength (base stat total). No fight is shown.
- Between rounds: **full heal**. Nothing carries over, so `RunCarry` is not used.
- Opponents: **one shared set of random settings**. Every NPC rolls its own team and trainer sprite when the tournament is created. Teams are fixed for the whole tournament and shown in the bracket.

## Design

### 1. Share the random-opponent settings (refactor, `core/models/custom-battle.model.ts`)
`CustomBattleConfig` mixes opponent-roll rules with Custom-only fields. Pull the shared part out so both modes use one owner:
- New `RandomOpponentRules` = `format`, `opponentCount`, `forceDistinctTypes`, `distinctTypes`, `forceSingleType`, `singleType`, `background`.
- `CustomBattleConfig extends RandomOpponentRules` and adds `mode`, `team`, `avatarId`.
- Split `clampConfig` into `clampRules(r)` (the format/count/type rules) plus the Custom-only trimming of `team`. `configToNpcOptions` becomes `rulesToNpcOptions(r: RandomOpponentRules)`. Existing callers keep working; `custom-battle.model.spec.ts` must stay green.

### 2. Shared settings UI (`shared/opponent-rules/opponent-rules.component.ts`)
Move these sections from `pages/custom-battle/custom-battle.page.html` into a standalone component: format (singles/doubles + `canDouble` hint), team size stepper, distinct-types / single-type toggles and type chips, and background select. The component takes `rules` as input and emits `rulesChange`, and runs `clampRules` internally. The matching methods (`setFormat`, `stepCount`, `toggleForceDistinct`, `toggleDistinctType`, `setSingleType`, `setBackground`, …) move out of `custom-battle.page.ts`. The Custom Battle page then uses `<app-opponent-rules>` and keeps its mode, team editor, avatar and presets. Styles move with the component.

### 3. Pure bracket logic (`core/battle/tournament-bracket.ts`, Angular-free class)
- `TournamentBracket.create(entrantIds: string[])`: shuffle, then build `rounds: TournamentMatch[][]` with `{ a, b, winner }`. Round 0 is filled; later rounds start empty.
- `playerMatch(playerId)`: the player's open match, or null.
- `record(round, index, winnerId)`: sets the winner and moves them into the next round's slot.
- `resolveRound(round, strength, rng)`: decides every open NPC-only match in a round. P(A) = sAᵏ / (sAᵏ + sBᵏ) with a fixed exponent (about 3), so stronger teams usually win but upsets happen.
- `champion()`, `isFinished()`, plus `toJSON` / `from(json)` for persistence.
- The tests pass in their own `rng` so results are repeatable.

### 4. Model + service
- `core/models/tournament.model.ts`:
  - `TournamentConfig = RandomOpponentRules & { size: 4 | 8 | 16 }`, plus a default and a `clampTournamentConfig` helper.
  - `TournamentMon { speciesNum, name, types, moves: string[], item }`: a stored roll. It is the shape that `setOpponentMons` already accepts.
  - `TournamentEntrant { id, name, trainerId, isPlayer, team: TournamentMon[], strength }`.
  - `Tournament { config, entrants, bracket, status: 'active' | 'won' | 'lost', lostTo }`.
- `core/services/tournament.service.ts` (`providedIn: 'root'`, signal state, localStorage key `pbs.tournament` with sanitize/load/persist, same pattern as `TrainerRunService`):
  - `async create(config)`:
    - Roll `size − 1` teams with `NpcTeamService.generate(opponentCount, rulesToNpcOptions(config))`.
    - Pick distinct sprites with `TrainerRosterService.randomId(exclude)` and name them with `trainerLabel()`. If two names are the same, add a suffix.
    - Compute strength as the sum of base stat totals. Look up by dex number with the @pkmn/sim Dex, the same way `DamageCalcService.lookupSpecies` does. Implemented by summing the existing `DamageCalcService.statLine()` (level-100 stats), so no new lookup was needed.
    - The player entrant uses the active team's name and the avatar from settings.
  - `currentOpponent`: a computed signal. `setPending()` / `takePending()` work as a one-time hand-off to the battle screen, like the other modes.
  - `recordOutcome(won)`:
    - Record the player's match and resolve the rest of that round.
    - On a win, advance; after the final, the status is `won`.
    - On a loss, the status is `lost`. The remaining rounds are resolved instantly so the bracket still shows a champion.
  - `reset()`.
  - `route = '/tournament'`.

### 5. Battle screen hookup (`pages/battle/services/battle-setup.service.ts`, `battle.page.ts/html`)
- Add a third source: `readonly tournament = inject(TournamentService).takePending()`, which holds the entrant plus the config.
- `prepare()`: `setOpponentMons(entrant.team)`, `npcAvatarId` = the entrant's sprite, `npcNameOverride` = the entrant's name. Use random music.
- `pickFormat()`: use the tournament format (and keep the existing check for at least 2 player Pokémon).
- `pickScene()`: use the tournament `background` (`'random'` → `randomOutdoorScene()` for each match).
- No `applyRunCarry`, because every round starts with a full heal.
- Result screen: show "Weiter" for tournament fights too. Add a `tournamentContinue()` next to `challengeContinue()`; it calls `recordOutcome(won)` and navigates to `/tournament`. These are small additions; `battle.page.ts` is already oversized, so the logic stays in the service.

### 6. Tournament page (`pages/tournament/`)
- Route `tournament` in `app.routes.ts`.
- The hub button "Turnier" in `team-select.page.html/.ts` is disabled unless `activeReady()`.
- **Config view**: bracket size chips (4 / 8 / 16), `<app-opponent-rules>`, and "Turnier starten". Starting shows a loading state while the teams are rolled.
- **Bracket view**: a `tournament-bracket` child component.
  - The bracket is drawn as columns (Viertelfinale / Halbfinale / Finale, named by distance from the final).
  - Each match is a card with two entrant rows (avatar + name). The winner is shown bold, the loser dimmed, and the player's path is highlighted.
  - CSS grid lays out the columns, with connector lines drawn by borders/pseudo-elements. On phones the bracket scrolls horizontally.
- **Next-match card**: the opponent's avatar, name and team sprites, plus "Kampf starten".
- **End state**: "🏆 Du hast das Turnier gewonnen!" or "Ausgeschieden gegen X – Turniersieger: Y", with "Neues Turnier" and "Zum Menü".
- Tapping an entrant row shows that entrant's team in a small popover/sheet.
- The view is restored from localStorage after a reload.

## Files
- Modify: `core/models/custom-battle.model.ts`, `core/services/custom-battle.service.ts` (sanitize via `clampRules`), `pages/custom-battle/custom-battle.page.{ts,html,scss}`, `pages/battle/services/battle-setup.service.ts`, `pages/battle/battle.page.{ts,html}`, `core/services/damage-calc.service.ts` (`baseStatTotal`), `app.routes.ts`, `pages/team-select/team-select.page.{ts,html}`, `CLAUDE.md` (add mode + files to the overview).
- New: `shared/opponent-rules/*`, `core/battle/tournament-bracket.ts` (+ spec), `core/models/tournament.model.ts`, `core/services/tournament.service.ts` (+ spec), `pages/tournament/tournament.page.*`, `pages/tournament/tournament-bracket/*`.

## Verification
- `CHROME_BIN=/usr/bin/chromium ng test --browsers=ChromeHeadless --watch=false`:
  - The existing specs still pass, `custom-battle.model.spec` included.
  - New `tournament-bracket.spec.ts`: sizes 4/8/16 build 2/3/4 rounds; `record` advances the winner; `resolveRound` never decides a player match; a seeded rng gives repeatable results; a stronger team wins most of 1000 trials; JSON round-trip.
  - New `tournament.service.spec.ts`: sanitize rejects broken storage data; a loss resolves the rest of the bracket to a champion; a win in the final sets `won`.
- `ng build` compiles.
- Manual check via the run skill (`ionic serve`):
  - Custom Battle settings still work and saved presets still load.
  - Start an 8-player tournament: the bracket renders on a phone-width viewport and the next opponent's team is shown.
  - Win a fight: back on the bracket, the other quarter-finals are decided and you advance with a full-HP team.
  - Reload mid-tournament: it resumes.
  - Lose a match: the end screen names the champion.
  - Doubles format and the background setting apply to the tournament fights.
