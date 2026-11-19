import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Smog, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a9/Smog_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/6a/Smog_Gen5.png
 *
 * A thick dark slate-blue smog cloud billows up over the target and swirls
 * there (0-1.1 s; the target shudders at 0.4 s), then clears to show the
 * target darkened, which fades back (0.9-1.45 s).
 */
export class Smog {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.1, 70);
    const h = Math.max(r.height * 0.9, 56);
    const effects: Promise<unknown>[] = [
      FxEffects.smokeCloud(fxEl, target, w, h, ['#6E8296', '#3E4E60'], 16, 800, 300),
      Fx.glow(targetEl, 'brightness(.35) saturate(.6)', 550, 900)
    ];
    await Fx.wait(400);
    Fx.shake(targetEl, 3);
    await Promise.all(effects);
  }
}
