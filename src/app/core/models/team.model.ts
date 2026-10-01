import { germanSpeciesName } from './species-names.de';
import { knownItemId } from './item.model';

export const MAX_TEAM_SIZE = 6;
export const MOVES_PER_POKEMON = 4;

/** One Pokémon on the player's built team. `moves` holds @pkmn/sim move ids. */
export interface TeamPokemon {
  speciesNum: number;
  speciesId: string;
  name: string;
  types: string[];
  moves: string[];
  /** Held item id (item.model.ts), or null / missing for none. */
  item?: string | null;
}

/** A named, saved team. The player can keep several and pick one as active. */
export interface SavedTeam {
  id: string;
  name: string;
  pokemon: TeamPokemon[];
}

export interface SpeciesInfo {
  num: number;
  id: string;
  name: string;
  types: string[];
  /** True for final-stage species only (no further evolution). Used by the NPC team roll. */
  fullyEvolved?: boolean;
  /** True for Legendary / Mythical / Sub-Legendary species. The NPC roll can be told to skip these. */
  legendary?: boolean;
}

export interface MoveInfo {
  name: string;
  type: string;
  category: 'phys' | 'spec' | 'status';
  bp: number;
  pp: number;
}

/** A team can be taken into battle once at least one Pokémon knows a move. */
export function isBattleReady(team: TeamPokemon[]): boolean {
  return team.some((p) => p.moves.length > 0);
}

/** Coerce an untrusted stored/imported Pokémon entry into a TeamPokemon, or null if unusable. */
export function sanitizeMon(p: unknown): TeamPokemon | null {
  if (!p || typeof p !== 'object') return null;
  const m = p as Record<string, unknown>;
  if (typeof m['speciesId'] !== 'string' || typeof m['speciesNum'] !== 'number') return null;
  const num = m['speciesNum'] as number;
  return {
    speciesNum: num,
    speciesId: m['speciesId'] as string,
    name: germanSpeciesName(
      num,
      typeof m['name'] === 'string' ? (m['name'] as string) : (m['speciesId'] as string)
    ),
    types: Array.isArray(m['types']) ? (m['types'] as string[]) : [],
    moves: Array.isArray(m['moves'])
      ? (m['moves'] as unknown[])
          .filter((x): x is string => typeof x === 'string')
          .slice(0, MOVES_PER_POKEMON)
      : [],
    item: knownItemId(m['item'])
  };
}

/** A team without its local id: the shape that travels in export files. */
export type ImportedTeam = Omit<SavedTeam, 'id'>;

/** Coerce an untrusted team's name + Pokémon (id is ignored). */
export function sanitizeTeamBody(t: unknown): ImportedTeam | null {
  if (!t || typeof t !== 'object') return null;
  const s = t as Record<string, unknown>;
  return {
    name: typeof s['name'] === 'string' && s['name'].trim() ? (s['name'] as string).trim() : 'Team',
    pokemon: Array.isArray(s['pokemon'])
      ? (s['pokemon'] as unknown[])
          .map(sanitizeMon)
          .filter((p): p is TeamPokemon => !!p)
          .slice(0, MAX_TEAM_SIZE)
      : []
  };
}

/** Coerce an untrusted stored team; requires a string id. */
export function sanitizeTeam(t: unknown): SavedTeam | null {
  if (!t || typeof t !== 'object') return null;
  const id = (t as Record<string, unknown>)['id'];
  if (typeof id !== 'string') return null;
  const body = sanitizeTeamBody(t);
  return body && { id, ...body };
}
