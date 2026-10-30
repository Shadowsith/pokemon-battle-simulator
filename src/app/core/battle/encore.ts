import { Dex } from '@pkmn/sim';

/**
 * Encore (Gen 6): the target is locked into the move it used last for three
 * turns. It fails if the target hasn't moved yet, is already encored, or last
 * used a move that can't be encored (Encore itself, Transform, Struggle …).
 */
export const ENCORE_TURNS = 3;

/** Whether a Pokémon whose last move was `lastMoveId` can be encored. */
export function canEncore(lastMoveId: string | undefined, alreadyEncored: boolean): boolean {
  if (!lastMoveId || alreadyEncored) return false;
  const move = Dex.moves.get(lastMoveId);
  return move.exists && !move.flags?.['failencore'];
}
