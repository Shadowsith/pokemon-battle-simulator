import { MoveAnimRegistry } from '../animation.types';
import { PsychicAttackMoveAnimations } from './psychic/psychic-attack-moves';
import { PsychicStatusMoveAnimations } from './psychic/psychic-status-moves';

/**
 * Hand-made animations for Psychic-type moves, split by kind into `psychic/`
 * (shared dim / tremble effects in `psychic/psychic-fx.ts`); this class merges their registries.
 */
export class PsychicMoveAnimations {
  /** Hand-made Psychic move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    ...PsychicAttackMoveAnimations.anims,
    ...PsychicStatusMoveAnimations.anims
  };

  /** Turn-1 animations of Psychic moves that don't hit right away. */
  static readonly chargeAnims: MoveAnimRegistry = {
    ...PsychicAttackMoveAnimations.chargeAnims
  };
}
