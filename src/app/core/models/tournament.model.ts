import type { TournamentMatch } from '../battle/tournament-bracket';
import { RandomOpponentRules, clampRules, defaultOpponentRules } from './custom-battle.model';

/** Number of entrants (player included). */
export const TOURNAMENT_SIZES = [4, 8, 16] as const;
export type TournamentSize = (typeof TOURNAMENT_SIZES)[number];

/** Tournament settings: the shared random-opponent rules plus the bracket size. */
export interface TournamentConfig extends RandomOpponentRules {
  size: TournamentSize;
}

export function defaultTournamentConfig(): TournamentConfig {
  return { ...defaultOpponentRules(), size: 8 };
}

export function isTournamentSize(v: unknown): v is TournamentSize {
  return (TOURNAMENT_SIZES as readonly unknown[]).includes(v);
}

export function clampTournamentConfig(c: TournamentConfig): TournamentConfig {
  return { ...clampRules(c), size: isTournamentSize(c.size) ? c.size : 8 };
}

/** One rolled NPC Pokémon, stored by move id so the tournament survives a reload. */
export interface TournamentMon {
  speciesNum: number;
  name: string;
  /** Capitalised type names ("Water"). */
  types: string[];
  /** @pkmn/sim move ids; resolved against MOVE_LIBRARY. */
  moves: string[];
  item: string | null;
}

export interface TournamentEntrant {
  id: string;
  name: string;
  /** Trainer sprite id (assets/trainers/<id>.png). */
  trainerId: string;
  isPlayer: boolean;
  /** Fixed NPC party; empty for the player (who fights with the active team). */
  team: TournamentMon[];
  /** Team strength used for instant NPC-vs-NPC results. */
  strength: number;
}

export interface Tournament {
  config: TournamentConfig;
  entrants: TournamentEntrant[];
  /** Bracket rounds (TournamentBracket JSON). */
  rounds: TournamentMatch[][];
  status: 'active' | 'won' | 'lost';
  /** Name of the entrant who knocked the player out. */
  lostTo: string | null;
}

/** Id of the player's entrant. */
export const PLAYER_ENTRANT_ID = 'player';

/** German name of a round, counted back from the final. */
export function roundLabel(round: number, roundCount: number): string {
  switch (roundCount - round) {
    case 1:
      return 'Finale';
    case 2:
      return 'Halbfinale';
    case 3:
      return 'Viertelfinale';
    case 4:
      return 'Achtelfinale';
    default:
      return `Runde ${round + 1}`;
  }
}
