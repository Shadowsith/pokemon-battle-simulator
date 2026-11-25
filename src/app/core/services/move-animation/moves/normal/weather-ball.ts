import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The ball shoots up at `RISE` (ms), drops onto the target from `FALL` (ms) and lands at `HIT` (ms). */
const RISE = 500;
const FALL = 950;
const HIT = 1200;
const ORBS = 6;

/**
 * Weather Ball, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/6a/Meteorologe_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/df/Meteorologe_Gen5.png
 *
 * Six white light orbs gather round the user in a ring and fuse into a
 * glowing white ball (0-0.5 s). The ball shoots straight up out of view
 * (0.5-0.8 s), then drops down onto the target from above (0.95-1.2 s) and
 * bursts into a ring of white orbs flying apart (1.2-1.6 s); the target
 * flashes and shakes.
 */
export class WeatherBall {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const d = Math.max(lr.width, 50) * 0.6;
    const orb = (s: number) => Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff,#F4F2FF 50%,#E8E0FF00 74%);filter:drop-shadow(0 0 5px #ffffff)');
    const effects: Promise<void>[] = [];
    for (let i = 0; i < ORBS; i++) {
      const a = (Math.PI * 2 * i) / ORBS;
      const ox = Math.cos(a) * d;
      const oy = Math.sin(a) * d * 0.8;
      effects.push(Fx.spawn(fxEl, orb(16), launch, [
        { transform: `translate(${ox * 1.4}px,${oy * 1.4}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${ox}px,${oy}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${ox}px,${oy}px) scale(1)`, opacity: 1, offset: 0.7 },
        { transform: 'translate(0,0) scale(.5)', opacity: 0.4 }
      ], { duration: RISE, easing: 'ease-in-out' }));
    }
    const size = Math.max(lr.width * 0.5, 30);
    const up = launch.y + size;
    effects.push(Fx.spawn(fxEl, orb(size), launch, [
      { transform: 'translateY(0) scale(.3)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.25 },
      { transform: `translateY(${-up}px) scale(.8)`, opacity: 1 }
    ], { duration: 400, delay: RISE - 100, easing: 'ease-in' }));
    const drop = target.y + size;
    effects.push(Fx.spawn(fxEl, orb(size), target, [
      { transform: `translateY(${-drop}px) scale(.8)`, opacity: 1 },
      { transform: 'translateY(0) scale(1.1)', opacity: 1 }
    ], { duration: HIT - FALL, delay: FALL, easing: 'ease-in' }));
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 5);
      Fx.flash(targetEl, '#FFFFFF', 0.7);
      const burst: Promise<void>[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const r = Math.max(tr.width, 50) * 0.6;
        burst.push(Fx.spawn(fxEl, orb(13), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r * 0.8}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(a) * r * 1.2}px,${Math.sin(a) * r}px) scale(.6)`, opacity: 0 }
        ], { duration: 400, easing: 'ease-out' }));
      }
      return Promise.all(burst).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
