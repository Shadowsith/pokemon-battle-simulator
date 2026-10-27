import { NORMAL_BUFF } from './normal/normal-buff-moves.mjs';
import { NORMAL_RANGED } from './normal/normal-ranged-moves.mjs';
import { NORMAL_STATUS } from './normal/normal-status-moves.mjs';
import { NORMAL_STRIKE } from './normal/normal-strike-moves.mjs';

/** Normal-type move sounds, split by kind under normal/ (like the move animations). */
export const NORMAL = {
  ...NORMAL_STRIKE,
  ...NORMAL_RANGED,
  ...NORMAL_STATUS,
  ...NORMAL_BUFF,
};
