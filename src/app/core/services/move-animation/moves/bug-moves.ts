import { MoveAnimRegistry } from '../animation.types';
import { GrassMoveAnimations } from './grass-moves';

/** Hand-made animations for Bug-type moves. */
export class BugMoveAnimations {
  /** Hand-made Bug move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    // Like Absorb, but blood-red sparkles are drained from the target.
    leechlife: (refs, launch, target) => GrassMoveAnimations.playAbsorb(refs, launch, target, ['#D8201C', '#FF8A80'])
  };
}
