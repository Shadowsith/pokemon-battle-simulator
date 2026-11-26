import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** The eye opens by `OPEN` (ms); the rays burst off the target from `REVEAL` (ms). */
const OPEN = 450;
const REVEAL = 650;

/**
 * Miracle Eye, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/27/Wunderauge_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/ea/Wunderauge_Gen5.png
 *
 * The scene goes dark (0-0.25 s). A glowing eye of yellow and cyan rings
 * opens over the user and stares (0.2-1.3 s). Rays of coloured light burst
 * out from the target, which flashes white as it is seen through
 * (0.65-1.2 s); the scene clears (1.3-1.55 s).
 */
export class MiracleEye {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const lr = Fx.rect(launchEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' })];
    const es = Math.max(lr.width * 0.5, 34);
    const eye = Fx.box(es, es, 'border-radius:50%;background:radial-gradient(circle,#1A2A10 0 16%,#E8F04A 20% 32%,#2A6A8A 36% 46%,#5AE0FF 50% 62%,#E8F04A 66% 72%,#E8F04A00 76%);filter:drop-shadow(0 0 6px #9AF0FF)');
    effects.push(Fx.spawn(fxEl, eye, { x: launch.x, y: launch.y - lr.height * 0.1 }, [
      { transform: 'scale(1,0)', opacity: 0, offset: 0 },
      { transform: 'scale(1,1)', opacity: 1, offset: (OPEN - 200) / 1100 },
      { transform: 'scale(1.1,1.1)', opacity: 1, offset: 0.6 },
      { transform: 'scale(1,1)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1,0)', opacity: 0, offset: 1 }
    ], { duration: 1100, delay: 200, easing: 'ease-in-out' }));
    const colors = ['#FFE04A', '#FF6A6A', '#7AD8FF', '#ffffff', '#B07AFF', '#7AF07A'];
    const len = Math.max(f.width, f.height);
    for (let i = 0; i < 14; i++) {
      const c = colors[i % colors.length];
      const ray = Fx.box(len, 6 + (i % 3) * 3, `left:${target.x}px;top:${target.y}px;transform-origin:0 50%;background:linear-gradient(90deg,${c},${c}88 40%,${c}00);filter:blur(1px)`);
      fxEl.appendChild(ray);
      const ang = (i / 14) * 360 + (i % 2) * 9;
      effects.push(Fx.anim(ray, [
        { transform: `translateY(-50%) rotate(${ang}deg) scaleX(0)`, opacity: 0 },
        { transform: `translateY(-50%) rotate(${ang}deg) scaleX(1)`, opacity: 0.85, offset: 0.4 },
        { transform: `translateY(-50%) rotate(${ang + 6}deg) scaleX(1)`, opacity: 0 }
      ], { duration: 550, delay: REVEAL + (i % 3) * 30, easing: 'ease-out' }).then(() => ray.remove()));
    }
    effects.push(Fx.wait(REVEAL).then(() => Fx.glow(targetEl, 'brightness(3) saturate(0)', 450)));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }
}
