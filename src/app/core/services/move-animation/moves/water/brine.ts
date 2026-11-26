import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** A spurt shoots up every `GAP` ms from `START` (ms); each lasts `SPURT` ms. */
const START = 100;
const GAP = 85;
const SPURT = 380;
const COUNT = 8;

/**
 * Brine, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/ad/Lake_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/b7/Lake_Gen5.png
 *
 * Spurts of white-blue salt water shoot up out of the ground round the
 * target, alternating left and right and leaning outward (0.1-1.1 s); the
 * target shakes twice (0.3 s, 0.65 s). A white mist settles round its feet
 * and drifts off (0.75-1.3 s).
 */
export class Brine {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const foot = target.y + r.height * 0.42;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < COUNT; i++) {
      const side = i % 2 ? 1 : -1;
      const off = (0.15 + ((i >> 1) % 3) * 0.17) * Math.max(r.width, 50);
      const w = 14 + (i % 3) * 4;
      const h = Math.max(r.height * (0.7 + (i % 3) * 0.15), 50);
      const spurt = Fx.box(w, h, 'border-radius:50% 50% 30% 30%;transform-origin:50% 100%;background:linear-gradient(0deg,#ffffff,#CFEFFFdd 40%,#8FD0FF66 75%,#8FD0FF00);filter:drop-shadow(0 0 4px #9ADCFF)');
      const lean = side * (10 + (i % 3) * 6);
      effects.push(Fx.spawn(fxEl, spurt, { x: target.x + side * off, y: foot - h / 2 }, [
        { transform: `rotate(${lean}deg) scaleY(0)`, opacity: 1 },
        { transform: `rotate(${lean}deg) scaleY(1)`, opacity: 1, offset: 0.4 },
        { transform: `rotate(${lean * 1.3}deg) scaleY(1.1) scaleX(1.6)`, opacity: 0 }
      ], { duration: SPURT, delay: START + i * GAP, easing: 'ease-out' }));
    }
    for (const at of [300, 650]) effects.push(Fx.wait(at).then(() => Fx.shake(targetEl, 4)));
    effects.push(Fx.wait(750).then(() => Promise.all([-1, 0, 1].map((k) =>
      FxEffects.smokePuff(fxEl, { x: target.x + k * r.width * 0.3, y: foot - 6 }, Math.max(r.width * 0.45, 30))
    )).then(() => void 0)));
    await Promise.all(effects);
  }
}
