import { Dex } from '@pkmn/sim';
import type { Move } from '../models/move.model';
import type { BattlePokemon } from '../models/pokemon.model';

/**
 * Substitute (Gen 6): the user pays a quarter of its max HP for a doll with
 * that much HP. The doll takes the damage of other Pokémon's attacks and
 * blocks their status moves and side effects until it breaks, or the user
 * leaves the field. Moves flagged `bypasssub` (sound moves …) go through it.
 */

/** HP a substitute costs its user, which is also the doll's HP. */
export function substituteCost(mon: Pick<BattlePokemon, 'maxHp'>): number {
  return Math.floor(mon.maxHp / 4);
}

/** The user must keep more HP than the cost (a doll can't knock its maker out). */
export function canAffordSubstitute(mon: Pick<BattlePokemon, 'maxHp' | 'currentHp'>): boolean {
  const cost = substituteCost(mon);
  return cost > 0 && mon.currentHp > cost;
}

/** Sound moves and a few others reach the Pokémon behind a substitute. */
export function bypassesSubstitute(move: Pick<Move, 'showdownId'>): boolean {
  return !!Dex.moves.get(move.showdownId)?.flags?.['bypasssub'];
}

/** A hit on a doll with `subHp` HP: the damage it soaks up and the HP it keeps (0 = it broke). */
export function hitSubstitute(subHp: number, damage: number): { absorbed: number; left: number } {
  const absorbed = Math.max(0, Math.min(subHp, damage));
  return { absorbed, left: subHp - absorbed };
}
