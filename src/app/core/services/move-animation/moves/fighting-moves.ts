import { MoveAnimRegistry } from '../animation.types';
import { FightingKickThrowMoveAnimations } from './fighting/fighting-kick-throw-moves';
import { FightingPunchMoveAnimations } from './fighting/fighting-punch-moves';
import { FightingStatusMoveAnimations } from './fighting/fighting-status-moves';

/**
 * Hand-made animations for Fighting-type moves, split by kind into `fighting/`;
 * this class merges their registries.
 */
export class FightingMoveAnimations {
  /** Hand-made Fighting move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    ...FightingPunchMoveAnimations.anims,
    ...FightingKickThrowMoveAnimations.anims,
    ...FightingStatusMoveAnimations.anims
  };
}
