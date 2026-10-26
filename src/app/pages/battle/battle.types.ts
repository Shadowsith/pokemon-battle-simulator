import { Move } from '../../core/models/move.model';
import { BattlePokemon } from '../../core/models/pokemon.model';
import { Slot } from '../../core/battle/battle-format';

export type MenuState = 'main' | 'fight' | 'target' | 'pokemon' | 'forfeit';
/** intro = "VS" screen, fight = the battle proper, result = win/loss screen. */
export type BattlePhase = 'intro' | 'fight' | 'result';
/**
 * A move that ties up a slot across turns: a two-turn move being charged
 * (`semiInvuln` = the user is hidden on turn 1), or the mandatory rest turn a
 * recharge move like Hyper Beam forces afterwards (`recharge`). `target` keeps
 * the chosen target for the release turn.
 */
export type ChargeState = { move: Move; semiInvuln: boolean; recharge?: boolean; target?: Slot | null };

/** A player command waiting for the turn to start. */
export type Command = { kind: 'move'; move: Move; target: Slot | null } | { kind: 'switch'; to: number };

/** One queued action of a round, ordered by `orderActions`. */
export interface TurnAction {
  slot: Slot;
  /** Party index of the actor when chosen; the action is dropped if it left the field. */
  partyIdx: number;
  kind: 'move' | 'switch';
  move?: Move;
  target?: Slot | null;
  switchTo?: number;
  priority: number;
  speed: number;
}

/** Everything the template needs to draw one battle position. */
export interface SlotView {
  slot: Slot;
  key: string;
  mon: BattlePokemon;
  acting: boolean;
}

/** Hint shown on a move button: effectiveness against one foe. */
export interface MoveHint {
  kind: 'status' | 'immune' | 'weak' | 'neutral' | 'strong';
  label: string;
  short: string;
  foe: string | null;
}
