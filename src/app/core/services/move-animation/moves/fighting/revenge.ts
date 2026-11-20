import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Steam of rage billows off the user until `FUME` (ms); the blow lands at `HIT` (ms). */
const FUME = 900;
const HIT = 1100;

/**
 * Revenge, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/cc/Vergeltung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/5e/Vergeltung_Gen5.png
 *
 * The scene darkens (0-0.25 s) and the user fumes: clouds of grey-white
 * steam billow up round it while it trembles and flushes red (0.1-0.9 s).
 * It darts forward (0.98-1.24 s) and strikes (1.1 s): a bright blue
 * streak slashes down through the target with violet-white sparks flying
 * off (1.1-1.45 s). The scene clears (1.45-1.65 s).
 */
export class Revenge {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' }),
      Fx.glow(launchEl, 'sepia(1) saturate(3) hue-rotate(-30deg) brightness(1.1)', FUME, 100)
    ];
    for (let k = 0; k < 4; k++) {
      const x = launch.x + ((k % 2) ? 1 : -1) * lr.width * (0.15 + k * 0.08);
      effects.push(Fx.wait(100 + k * 170).then(() => {
        Fx.shake(launchEl, 3);
        return FxEffects.smokeCloud(fxEl, { x, y: launch.y - lr.height * 0.2 - k * 6 }, lr.width * 0.8, lr.height * 0.6, ['#E8E4E8', '#B8B0B8'], 6, 450, 150);
      }));
    }
    // The dart is furthest forward 0.12 s in, right on the blow.
    effects.push(Fx.wait(HIT - 120).then(() => FxEffects.dart(launchEl, v.dir)));
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 6);
      Fx.flash(targetEl, '#9AD8FF', 0.6);
      const h = tr.height * 1.1;
      const streak = Fx.box(16, h, 'border-radius:8px;background:linear-gradient(180deg,#FFFFFF00,#BFF0FF 25%,#3AA8FF 55%,#1A6AE0 85%,#1A6AE000);box-shadow:0 0 10px #5AC0FF');
      const hits: Promise<void>[] = [
        Fx.spawn(fxEl, streak, target, [
          { transform: `translateY(${-h * 0.5}px) scaleY(.2)`, opacity: 0 },
          { transform: 'translateY(0) scaleY(1)', opacity: 1, offset: 0.35 },
          { transform: `translateY(${h * 0.15}px) scaleY(.9) scaleX(.4)`, opacity: 0 }
        ], { duration: 350, easing: 'ease-out' })
      ];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 + 0.3;
        const d = tr.width * 0.45;
        const spark = Fx.box(9, 9, `border-radius:50%;border:2px solid ${i % 2 ? '#C8A8FF' : '#FFFFFF'};box-shadow:0 0 4px #A88AFF`);
        hits.push(Fx.spawn(fxEl, spark, target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1)`, opacity: 0 }
        ], { duration: 350, easing: 'ease-out' }));
      }
      return Promise.all(hits).then(() => void 0);
    }));
    await Promise.all(effects.slice(1));
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }
}
