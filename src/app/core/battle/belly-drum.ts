import type { BattlePokemon } from '../models/pokemon.model';

/** HP Belly Drum costs: half the user's max HP. */
export function bellyDrumCost(mon: Pick<BattlePokemon, 'maxHp'>): number {
  return Math.floor(mon.maxHp / 2);
}

/** Belly Drum needs more HP than it costs and room to raise Attack. */
export function canBellyDrum(mon: Pick<BattlePokemon, 'maxHp' | 'currentHp' | 'boosts'>): boolean {
  return mon.currentHp > bellyDrumCost(mon) && mon.boosts.atk < 6;
}
