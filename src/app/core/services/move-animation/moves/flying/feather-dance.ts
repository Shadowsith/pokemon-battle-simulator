import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** How many feathers swirl down round the target. */
const FEATHERS = 10;
/** The feathers are gone at `SWIRL` (ms), then the Attack drop plays. */
const SWIRL = 1000;

/**
 * Feather Dance, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/c/c6/Daunenreigen_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/7/71/Daunenreigen_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/a/ab/Daunenreigen_Gen5.png
 *
 * White-grey feathers drift down round the target, swaying as they swirl
 * past it (0-1.0 s); then its Attack drops - it turns blue under stat-down
 * bubbles (1.0-1.9 s).
 */
export class FeatherDance {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const rx = Math.max(r.width, 50) * 0.6;
    const h = Math.max(r.height, 50);
    const feathers: Promise<void>[] = [];
    for (let i = 0; i < FEATHERS; i++) {
      const a0 = (Math.PI * 2 * i) / FEATHERS;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const a = a0 + u * Math.PI * 1.5;
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${-h * 0.75 + u * h * 1.2}px) rotate(${Math.sin(a * 2) * 50}deg)`,
          opacity: k === 0 || k === steps ? 0 : 1
        });
      }
      feathers.push(Fx.spawn(fxEl, FxGlyphs.featherGlyph(16 + (i % 3) * 4), target, frames, { duration: 700, easing: 'linear', delay: (i % 5) * 60 }));
    }
    await Promise.all(feathers);
    await Fx.wait(SWIRL - 940);
    await FxEffects.blueStatDrop(refs, target);
  }
}
