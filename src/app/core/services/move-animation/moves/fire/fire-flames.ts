import { Point } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Flame effects shared by several Fire move animations. */
export class FireFlames {
  /**
   * One flickering flame standing on `base` (its bottom-centre): flares up,
   * flickers, then floats up a little and goes out. Shared by Ember and the
   * burning target of Flamethrower.
   `core` sets the outer flame's inner tone and the core's edge tone (orange by default). */
  static burnFlame(
    fxEl: HTMLElement,
    base: Point,
    w: number,
    color: string,
    duration: number,
    delay = 0,
    core: readonly [string, string] = ['#FFB13C', '#FFD25A']
  ): Promise<void> {
    // Outer flame with a yellow-white core; the square tear is rotated so its tip points up.
    const flame = document.createElement('div');
    flame.style.cssText = `position:absolute;left:${base.x - w / 2}px;top:${base.y - w * 1.5}px;width:${w}px;height:${w * 1.5}px;pointer-events:none;transform-origin:50% 100%`;
    for (const [scale, from, to] of [
      [1, core[0], color],
      [0.55, '#fff', core[1]]
    ] as const) {
      const s = w * 0.8 * scale;
      const tear = document.createElement('div');
      tear.style.cssText = `position:absolute;left:${(w - s) / 2}px;bottom:${s * 0.15}px;width:${s}px;height:${s}px;border-radius:50% 0 50% 50%;transform:rotate(-45deg);background:radial-gradient(circle at 40% 60%,${from},${to} 70%);filter:drop-shadow(0 0 5px ${color})`;
      flame.appendChild(tear);
    }
    fxEl.appendChild(flame);

    const flicker: Keyframe[] = [{ transform: 'scale(.2,.1)', opacity: 0 }];
    const n = 8;
    for (let k = 1; k <= n; k++) {
      flicker.push({
        transform: `scale(${1 + (k % 2 ? 0.08 : -0.06)},${1 + (k % 2 ? -0.1 : 0.14)}) skewX(${k % 2 ? 4 : -4}deg)`,
        opacity: 1,
        offset: 0.12 + (k / n) * 0.7
      });
    }
    flicker.push({ transform: 'translateY(-10px) scale(.4,.6)', opacity: 0 });
    return Fx.anim(flame, flicker, { duration, delay, easing: 'ease-in-out' }).then(() => flame.remove());
  }

  /**
   * A flowing stream of fire from `from` to `to`: puffs leave one after
   * another, swirl, change size and fade. Overlapping, ever-moving puffs are
   * what make it read as flame rather than as orbs.
   */
  static fireStream(
    fxEl: HTMLElement,
    from: Point,
    to: Point,
    opts: {
      count: number;
      gap: number;
      travel: number;
      /** puff size range in px */
      size?: [number, number];
      /** scale at the start and at the end of the flight */
      grow?: [number, number];
      /** max px of random scatter at the end */
      jitter?: number;
      /** max px of sideways wave */
      wave?: number;
      delay?: number;
      tone?: 'hot' | 'red';
    }
  ): Promise<void> {
    const { count, gap, travel, size = [14, 24], grow = [0.4, 1.5], jitter = 8, wave = 8, delay = 0, tone = 'hot' } = opts;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sc = (f: number) => grow[0] + (grow[1] - grow[0]) * f;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const puff = FxGlyphs.firePuff(size[0] + Math.random() * (size[1] - size[0]), tone);
      Fx.place(puff, from);
      fxEl.appendChild(puff);
      const jx = (Math.random() * 2 - 1) * jitter;
      const jy = (Math.random() * 2 - 1) * jitter;
      const wav = Math.sin(i * 0.7) * wave;
      const rot = Math.random() * 180;
      flights.push(
        Fx.anim(puff, [
          { transform: `translate(0,0) rotate(${rot}deg) scale(${sc(0)})`, opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15 + wav * 0.3}px) rotate(${rot + 40}deg) scale(${sc(0.27)})`, opacity: 1, offset: 0.12 },
          { transform: `translate(${dx * 0.6 + jx * 0.5}px,${dy * 0.6 + wav + jy * 0.5}px) rotate(${rot + 120}deg) scale(${sc(0.73)})`, opacity: 1, offset: 0.6 },
          { transform: `translate(${dx + jx}px,${dy + jy}px) rotate(${rot + 200}deg) scale(${sc(1)})`, opacity: 0 }
        ], { duration: travel, easing: 'linear', delay: delay + i * gap }).then(() => puff.remove())
      );
    }
    return Promise.all(flights).then(() => void 0);
  }
}
