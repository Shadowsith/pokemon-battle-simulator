import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The metal balls close in on the target until `HIT` (ms). */
const HIT = 700;
const BALLS = 12;

/**
 * Magnet Bomb, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/32/Magnetbombe_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/c2/Magnetbombe_Gen5.png
 *
 * Little grey and white steel balls appear all round the target and are
 * pulled in onto it as if by a magnet (0-0.7 s). They go off together in a
 * cloud of cyan-blue blasts while the target flashes and shakes
 * (0.7-1.35 s).
 */
export class MagnetBomb {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const reach = Math.max(r.width, r.height, 60) * 0.85;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < BALLS; i++) {
      const a = (i / BALLS) * Math.PI * 2 + 0.3;
      const s = 8 + (i % 3) * 3;
      const tone = i % 3 ? '#5A5E6A' : '#E8ECF4';
      const ball = Fx.box(s, s, `border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,${tone} 55%,#2A2C34);box-shadow:0 0 2px #00000066`);
      const dist = reach * (0.75 + (i % 4) * 0.1);
      effects.push(Fx.spawn(fxEl, ball, target, [
        { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist * 0.75}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${Math.cos(a + 0.4) * dist * 0.85}px,${Math.sin(a + 0.4) * dist * 0.65}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(a + 0.8) * dist * 0.15}px,${Math.sin(a + 0.8) * dist * 0.12}px) scale(.8)`, opacity: 1 }
      ], { duration: HIT - (i * 23) % 120, delay: (i * 23) % 120, easing: 'ease-in' }));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#9AE4FF', 0.6);
      Fx.shake(targetEl, 6);
      const blasts: Promise<void>[] = [];
      for (let i = 0; i < 7; i++) {
        const at: Point = { x: target.x + (((i * 5) % 7) / 6 - 0.5) * r.width * 0.7, y: target.y + (((i * 3) % 5) / 4 - 0.5) * r.height * 0.6 };
        blasts.push(Fx.wait(i * 50).then(() => FxEffects.smokePuff(fxEl, at, Math.max(r.width * 0.4, 26), ['#BFF0FF', '#4AA8E8'])));
      }
      return Promise.all(blasts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
