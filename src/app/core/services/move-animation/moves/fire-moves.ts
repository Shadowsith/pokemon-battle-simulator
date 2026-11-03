import { MoveAnimRegistry } from '../animation.types';
import { FireRangedMoveAnimations } from './fire/fire-ranged-moves';
import { FireStatusMoveAnimations } from './fire/fire-status-moves';
import { FireStrikeMoveAnimations } from './fire/fire-strike-moves';

/**
 * Hand-made animations for Fire-type moves, split by kind into `fire/`
 * (shared flame effects in `fire/fire-flames.ts`); this class merges their registries.
 */
export class FireMoveAnimations {
  /** Hand-made Fire move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    ...FireStrikeMoveAnimations.anims,
    ...FireRangedMoveAnimations.anims,
    ...FireStatusMoveAnimations.anims
  };
}
