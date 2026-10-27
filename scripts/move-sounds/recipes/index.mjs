import { BUG } from './bug.mjs';
import { DARK } from './dark.mjs';
import { DRAGON } from './dragon.mjs';
import { ELECTRIC } from './electric.mjs';
import { FAIRY } from './fairy.mjs';
import { FIGHTING } from './fighting.mjs';
import { FIRE } from './fire.mjs';
import { FLYING } from './flying.mjs';
import { GHOST } from './ghost.mjs';
import { GRASS } from './grass.mjs';
import { GROUND } from './ground.mjs';
import { ICE } from './ice.mjs';
import { NORMAL } from './normal.mjs';
import { POISON } from './poison.mjs';
import { PSYCHIC } from './psychic.mjs';
import { ROCK } from './rock.mjs';
import { STEEL } from './steel.mjs';
import { WATER } from './water.mjs';

/**
 * Sound recipes keyed by @pkmn/sim move id, one file per move type (like the
 * move animations). Each recipe returns a filled MoveSfx; timings follow the
 * move's battle animation.
 */
export const RECIPES = {
  ...BUG,
  ...DARK,
  ...DRAGON,
  ...ELECTRIC,
  ...FAIRY,
  ...FIGHTING,
  ...FIRE,
  ...FLYING,
  ...GHOST,
  ...GRASS,
  ...GROUND,
  ...ICE,
  ...NORMAL,
  ...POISON,
  ...PSYCHIC,
  ...ROCK,
  ...STEEL,
  ...WATER,
};
