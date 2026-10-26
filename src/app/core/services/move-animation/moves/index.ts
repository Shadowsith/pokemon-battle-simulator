import { MoveAnimRegistry } from '../animation.types';
import { BugMoveAnimations } from './bug-moves';
import { DarkMoveAnimations } from './dark-moves';
import { ElectricMoveAnimations } from './electric-moves';
import { FightingMoveAnimations } from './fighting-moves';
import { FireMoveAnimations } from './fire-moves';
import { FlyingMoveAnimations } from './flying-moves';
import { GhostMoveAnimations } from './ghost-moves';
import { GrassMoveAnimations } from './grass-moves';
import { GroundMoveAnimations } from './ground-moves';
import { IceMoveAnimations } from './ice-moves';
import { NormalMoveAnimations } from './normal-moves';
import { PoisonMoveAnimations } from './poison-moves';
import { PsychicMoveAnimations } from './psychic-moves';
import { WaterMoveAnimations } from './water-moves';

/**
 * Every per-type group of hand-made move animations. A new custom animation
 * goes into the group of its move's type (one file per type in this folder).
 */
export const MOVE_ANIMATION_GROUPS: readonly {
  readonly anims: MoveAnimRegistry;
  /** Turn-1 animations of two-turn moves (Dig, Fly, Razor Wind …). */
  readonly chargeAnims?: MoveAnimRegistry;
}[] = [
  NormalMoveAnimations,
  FireMoveAnimations,
  WaterMoveAnimations,
  ElectricMoveAnimations,
  GrassMoveAnimations,
  IceMoveAnimations,
  FightingMoveAnimations,
  PoisonMoveAnimations,
  GroundMoveAnimations,
  FlyingMoveAnimations,
  PsychicMoveAnimations,
  BugMoveAnimations,
  GhostMoveAnimations,
  DarkMoveAnimations
];

/** All hand-made animations that replace the derived one, by @pkmn/sim move id. */
export const CUSTOM_MOVE_ANIMATIONS: MoveAnimRegistry = Object.assign({}, ...MOVE_ANIMATION_GROUPS.map((g) => g.anims));

/** Hand-made turn-1 animations of two-turn moves, by @pkmn/sim move id. */
export const CUSTOM_CHARGE_ANIMATIONS: MoveAnimRegistry = Object.assign(
  {},
  ...MOVE_ANIMATION_GROUPS.map((g) => g.chargeAnims ?? {})
);
