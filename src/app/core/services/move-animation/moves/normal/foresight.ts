import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The glass circles the target until `SPOTTED` ms, then the target is seen through. */
const SPOTTED = 900;

/**
 * Foresight, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/71/Scharfblick_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/ac/Scharfblick_Gen5.png
 *
 * A magnifying glass fades in beside the target and sweeps round it once on
 * an ellipse, its lens glinting (0-0.9 s). It stops on the target and fades
 * while the target flashes pale and see-through - it has been spotted
 * (0.9-1.3 s).
 */
export class Foresight {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const size = Math.max(w * 0.4, 28);
    const glass = Foresight.magnifier(size);
    const rx = w * 0.45;
    const ry = h * 0.32;

    const steps = 12;
    const frames: Keyframe[] = [];
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (Math.PI * 2 * i) / steps;
      frames.push({
        transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * ry}px)`,
        opacity: i === 0 ? 0 : 1,
        offset: (i / steps) * (SPOTTED / 1300)
      });
    }
    frames.push({ transform: 'translate(0,0) scale(1.15)', opacity: 1, offset: (SPOTTED + 150) / 1300 });
    frames.push({ transform: 'translate(0,0) scale(1.2)', opacity: 0 });
    const sweep = Fx.spawn(fxEl, glass, target, frames, { duration: 1300, easing: 'linear' });

    const seen = Fx.anim(targetEl, [
      { opacity: 1, filter: 'none' },
      { opacity: 0.45, filter: 'brightness(2) grayscale(.6)', offset: 0.35 },
      { opacity: 0.8, filter: 'brightness(1.5)', offset: 0.7 },
      { opacity: 1, filter: 'none' }
    ], { duration: 400, easing: 'ease-in-out', delay: SPOTTED, fill: 'none' });
    await Promise.all([sweep, seen]);
  }

  /** A magnifying glass `size` px wide: a dark rim round a pale blue lens with a glint, handle down to the right. */
  private static magnifier(size: number): HTMLElement {
    const el = Fx.box(size, size, 'filter:drop-shadow(0 0 3px #ffffffaa)');
    const handle = Fx.box(size * 0.16, size * 0.5, `left:${size * 0.66}px;top:${size * 0.56}px;border-radius:3px;background:linear-gradient(90deg,#6A4A2A,#A07A48,#6A4A2A);transform:rotate(-45deg);transform-origin:50% 0`);
    const lens = Fx.box(size * 0.72, size * 0.72,
      'left:0;top:0;border-radius:50%;border:3px solid #4A4A5A;box-sizing:border-box;' +
      'background:radial-gradient(circle at 32% 30%,#ffffff 0 12%,#D8F0FFaa 22%,#A8D8F888 60%,#88C0E866)');
    el.append(handle, lens);
    return el;
  }
}
