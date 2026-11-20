import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** How many jolts, and how far apart (ms; each field shake lasts ~0.5 s). */
const JOLTS = 2;
const JOLT_GAP = 500;

/**
 * Magnitude, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/89/Intensit%C3%A4t_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0e/Intensit%C3%A4t_Gen5.png
 *
 * The whole field quakes in two rumbling jolts (0-0.5 s and 0.5-1.0 s, the
 * target shudders at 0.1 / 0.3 s of each); brown dust puffs up round the
 * target's feet with each jolt.
 */
export class Magnitude {
  static async play(refs: BattleStageRefs) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const w = Math.max(r.width, 50);
    const effects: Promise<void>[] = [];
    for (let jolt = 0; jolt < JOLTS; jolt++) {
      if (jolt) await Fx.wait(JOLT_GAP);
      Fx.shakeField(fieldEl, 1.2);
      for (let i = 0; i < 4; i++) {
        const at: Point = { x: foot.x + (i / 3 - 0.5) * w * 1.1, y: foot.y - 4 };
        effects.push(FxEffects.smokePuff(fxEl, at, w * 0.45, ['#D8B888', '#A88458']));
      }
      setTimeout(() => Fx.shake(targetEl, 5), 100);
      setTimeout(() => Fx.shake(targetEl, 4), 300);
    }
    effects.push(Fx.wait(JOLT_GAP));
    await Promise.all(effects);
  }
}
