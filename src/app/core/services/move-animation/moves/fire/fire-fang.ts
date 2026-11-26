import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { ChompFx } from '../../chomp-fx';

/** The jaw snaps shut at `SNAP` (ms) (see `ChompFx.chomp`). */
const SNAP = 450;

/**
 * Fire Fang, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/14/Feuerzahn_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/34/Feuerzahn_Gen5.png
 *
 * A white jaw opens over the target and snaps shut (0-0.45 s). The bite
 * bursts into a fiery ball of flame round the target, which glows red-hot
 * (0.45-1.1 s), and dark smoke drifts off as it fades (0.8-1.4 s).
 */
export class FireFang {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width, 56);
    const effects: Promise<void>[] = [
      ChompFx.chomp(refs, target, { w: Math.max(r.width * 1.1, 72), tilt: 0, grinds: 0, rays: false }),
      Fx.wait(SNAP).then(() => Promise.all([
        FxEffects.fireBlastCloud(fxEl, target, size * 0.7, 10, '#FFD04A'),
        Fx.glow(targetEl, 'brightness(1.3) sepia(1) saturate(5) hue-rotate(-20deg)', 600)
      ]).then(() => void 0)),
      Fx.wait(SNAP + 350).then(() => FxEffects.smokeCloud(fxEl, target, size * 0.9, r.height * 0.7, ['#5A4A48', '#3A302E'], 8, 500, 200))
    ];
    await Promise.all(effects);
  }
}
