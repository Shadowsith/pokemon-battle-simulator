export const MAX_TEAM_SIZE = 6;
export const MOVES_PER_POKEMON = 4;

/** One Pokémon on the player's built team. `moves` holds @pkmn/sim move ids. */
export interface TeamPokemon {
  speciesNum: number;
  speciesId: string;
  name: string;
  types: string[];
  moves: string[];
}

export interface SpeciesInfo {
  num: number;
  id: string;
  name: string;
  types: string[];
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
