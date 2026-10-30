import type { BattlePokemon } from '../models/pokemon.model';

/**
 * Curse (Gen 6) works two ways. A Ghost-type user pays half its max HP to
 * curse the target, which then loses a quarter of its max HP at the end of
 * every turn until it leaves the field. Any other user trades Speed for
 * Attack and Defense.
 */

/** A Ghost-type user casts the real curse. */
export function castsGhostCurse(user: Pick<BattlePokemon, 'types'>): boolean {
  return user.types.includes('ghost');
}

/** HP a Ghost-type pays to curse: half its max HP. */
export function curseCost(user: Pick<BattlePokemon, 'maxHp'>): number {
  return Math.floor(user.maxHp / 2);
}

/** HP a cursed Pokémon loses each turn: a quarter of its max HP (at least 1). */
export function curseDamage(mon: Pick<BattlePokemon, 'maxHp'>): number {
  return Math.max(1, Math.floor(mon.maxHp / 4));
}

/** The non-Ghost version's stat changes. */
export const NON_GHOST_CURSE = { atk: 1, def: 1, spe: -1 } as const;
