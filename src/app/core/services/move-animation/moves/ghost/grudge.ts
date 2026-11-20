import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** How many ghost flames flicker round the user. */
const FLAMES = 6;
const TOTAL = 1500;

/**
 * Grudge, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/26/Nachspiel_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/01/Nachspiel_Gen5.png
 *
 * The scene goes dark (0-0.25 s). Purple-blue ghost flames rise round the
 * user and flicker there (0.2-1.3 s) while the user takes on a magenta
 * tint (0.4-1.35 s). The scene clears (1.25-1.5 s).
 */
export class Grudge {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const foot = Fx.footOf(launchEl, fieldEl);
    const at = (ms: number) => ms / TOTAL;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.9, offset: at(250) },
        { opacity: 0.9, offset: at(1250) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' }),
      Fx.glow(launchEl, 'sepia(1) saturate(4) hue-rotate(260deg) brightness(1.1) drop-shadow(0 0 6px #C040E0)', 950, 400)
    ];
    for (let i = 0; i < FLAMES; i++) {
      const u = i / (FLAMES - 1);
      const p: Point = { x: launch.x + (u - 0.5) * w * 1.2, y: foot.y - h * (0.1 + Math.abs(u - 0.5) * 0.5) };
      const flame = Fx.box(14, 22, 'border-radius:50% 50% 45% 45% / 70% 70% 30% 30%;background:radial-gradient(circle at 50% 70%,#F0D8FF,#9A6AF0 45%,#4A2AA8 80%,#2A1A6800);box-shadow:0 0 8px #8A5AF0;transform-origin:50% 100%');
      const frames: Keyframe[] = [{ transform: 'translateY(16px) scale(.3)', opacity: 0 }];
      frames.push({ transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.2 });
      for (let k = 1; k <= 5; k++) {
        frames.push({ transform: `translate(${Math.sin(k * 2 + i) * 3}px,${-k * 2}px) scale(${1 + (k % 2) * 0.15},${1 - (k % 2) * 0.1})`, opacity: 1, offset: 0.2 + k * 0.13 });
      }
      frames.push({ transform: 'translateY(-16px) scale(.6)', opacity: 0 });
      effects.push(Fx.spawn(fxEl, flame, p, frames, { duration: 1050, easing: 'linear', delay: 200 + (i % 3) * 50 }));
    }
    await Promise.all(effects);
    dim.remove();
  }
}
