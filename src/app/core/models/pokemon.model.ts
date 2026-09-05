export interface BattlePokemon {
  /** National Pokédex number, used to resolve local sprite/sound assets */
  dexId: number;
  name: string;
  maxHp: number;
  currentHp: number;
  types: string[];
}

/** Builds the local asset path for a Showdown-style front sprite (used for the opponent). */
export function frontSpritePath(dexId: number): string {
  return `assets/sprites/showdown/${dexId}.gif`;
}

/** Builds the local asset path for a Showdown-style back sprite (used for the player's own Pokémon). */
export function backSpritePath(dexId: number): string {
  return `assets/sprites/showdown/back/${dexId}.gif`;
}
