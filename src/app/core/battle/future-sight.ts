import { Dex } from '@pkmn/sim';
import type { Move } from '../models/move.model';
import type { Side, Slot } from './battle-format';

/**
 * Future Sight / Doom Desire (Gen 6): the move deals nothing on the turn it's
 * used. At the end of the turn two turns later it strikes whoever then stands
 * in the targeted position; damage is worked out at that moment from the
 * user's stats. It fails while that position already has an attack coming.
 */

/** End-of-round countdown: used on turn N, the attack lands at the end of turn N + 2. */
export const FUTURE_ATTACK_TURNS = 3;

/** An attack on its way to one battle position. */
export interface FutureAttack {
  move: Move;
  /** The position it strikes, whoever stands there by then. */
  target: Slot;
  /** The user, by side and party index - it may have left the field by the time it hits. */
  side: Side;
  partyIdx: number;
  /** End-of-round ticks left; it hits when this reaches 0. */
  turns: number;
}

/** Whether `move` is a delayed attack (Future Sight, Doom Desire). */
export function isFutureMove(move: Move): boolean {
  return !!Dex.moves.get(move.showdownId).flags?.['futuremove'];
}
