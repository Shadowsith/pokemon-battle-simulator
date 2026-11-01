import type { BattlePokemon } from '../models/pokemon.model';

/**
 * Pain Split (Gen 6): user and target add up their current HP and each keeps
 * half (rounded down), capped at their own max HP. Status moves' usual gates
 * apply - Protect and a Substitute block it.
 */
export function painSplitHp(
  user: Pick<BattlePokemon, 'currentHp' | 'maxHp'>,
  target: Pick<BattlePokemon, 'currentHp' | 'maxHp'>
): { user: number; target: number } {
  const avg = Math.floor((user.currentHp + target.currentHp) / 2);
  return { user: Math.min(avg, user.maxHp), target: Math.min(avg, target.maxHp) };
}
