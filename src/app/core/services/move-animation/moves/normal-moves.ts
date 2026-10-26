import { MoveAnimRegistry } from '../animation.types';
import { NormalRangedMoveAnimations } from './normal/normal-ranged-moves';
import { NormalStatusMoveAnimations } from './normal/normal-status-moves';
import { NormalStrikeMoveAnimations } from './normal/normal-strike-moves';

/**
 * Hand-made animations for Normal-type moves. There are many, so they are
 * split by kind into `normal/`; this class merges their registries.
 */
export class NormalMoveAnimations {
  /** Hand-made Normal move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    ...NormalStrikeMoveAnimations.anims,
    ...NormalRangedMoveAnimations.anims,
    ...NormalStatusMoveAnimations.anims
  };

  /** Turn-1 animations of two-turn Normal moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    ...NormalStrikeMoveAnimations.chargeAnims,
    ...NormalRangedMoveAnimations.chargeAnims
  };
}
