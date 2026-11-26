import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The orbs travel each way in `TRAVEL` ms; the stat changes are swapped at `SWAP` (ms). */
const TRAVEL = 450;
const SWAP = 1000;

/**
 * Heart Swap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5b/Statustausch_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/88/Statustausch_Gen5.png
 *
 * A white glow swells over the user and a stream of pink-white light orbs
 * flies to the target (0.1-0.55 s), then back from the target to the user
 * (0.55-1.0 s). Both light up in a bright pink-white glow ringed by
 * spinning orbits of light (1.0-1.5 s).
 */
export class HeartSwap {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const effects: Promise<void>[] = [
      ...HeartSwap.stream(fxEl, launch, target, 100),
      ...HeartSwap.stream(fxEl, target, launch, 100 + TRAVEL)
    ];
    effects.push(Fx.wait(SWAP).then(() => Promise.all([
      HeartSwap.halo(fxEl, launchEl, launch),
      HeartSwap.halo(fxEl, targetEl, target)
    ]).then(() => void 0)));
    await Promise.all(effects);
  }

  /** Five orbs fly `from` → `to`, starting at `delay` ms. */
  private static stream(fxEl: HTMLElement, from: Point, to: Point, delay: number): Promise<void>[] {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return [0, 1, 2, 3, 4].map((i) => {
      const s = 20 - i * 3;
      const orb = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 30%,#FFB0C8 55%,#FF7AA000 72%);filter:drop-shadow(0 0 4px #FF9AB8)');
      return Fx.spawn(fxEl, orb, from, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) scale(1)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px,${dy}px) scale(.7)`, opacity: 0 }
      ], { duration: TRAVEL - 40, delay: delay + i * 40, easing: 'ease-in-out' });
    });
  }

  /** A pink-white glow with two crossed orbit rings spinning round `at`. */
  private static halo(fxEl: HTMLElement, el: HTMLElement, at: Point): Promise<void> {
    const r = Fx.rect(el);
    const s = Math.max(r.width, r.height, 60) * 0.9;
    Fx.flash(el, '#FFD0E0', 0.7);
    const parts: Promise<void>[] = [
      Fx.spawn(fxEl, Fx.box(s * 0.7, s * 0.7, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 20%,#FFC8D8cc 45%,#FF9AB800 70%)'), at, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' })
    ];
    for (const tilt of [-35, 35]) {
      // A flattened ring turning in the picture plane reads as an orbit (only the effect turns).
      parts.push(Fx.spawn(fxEl, Fx.box(s, s * 0.35, 'border-radius:50%;border:2px solid #FFD8E4;box-shadow:0 0 6px #FFB0C8'), at, [
        { transform: `rotate(${tilt}deg) scale(.4)`, opacity: 0 },
        { transform: `rotate(${tilt + 60}deg) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `rotate(${tilt + 180}deg) scale(1.1)`, opacity: 0 }
      ], { duration: 500, easing: 'linear' }));
    }
    return Promise.all(parts).then(() => void 0);
  }
}
