import { BattlePokemon, freshBoosts, freshStatus } from './pokemon.model';
import { germanSpeciesName } from './species-names.de';

/** The fields any team-source entry (TeamPokemon, StoryMon) shares. */
export interface SpeciesSlot {
  speciesNum: number;
  name: string;
  types: string[];
}

/**
 * Turns a stored team slot into a fresh, full-HP {@link BattlePokemon}. Shared by
 * the battle screen (player's built team) and story mode (story-owned team and
 * authored opponents) so the conversion lives in one place.
 *
 * @param hpStat resolves a species' real level-100 max HP (DamageCalcService.hpStat)
 */
export function toBattlePokemon(slot: SpeciesSlot, hpStat: (dexId: number) => number): BattlePokemon {
  const maxHp = hpStat(slot.speciesNum);
  return {
    dexId: slot.speciesNum,
    name: germanSpeciesName(slot.speciesNum, slot.name),
    maxHp,
    currentHp: maxHp,
    types: slot.types.map((t) => t.toLowerCase()),
    status: freshStatus(),
    boosts: freshBoosts()
  };
}
