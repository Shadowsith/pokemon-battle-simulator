import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/** The reticles close in until `LOCKED` ms, then blink twice. */
const LOCKED = 600;
const TOTAL = 1000;

/**
 * Lock-On, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/97/Zielschuss_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/b6/Zielschuss_Gen5.png
 *
 * Three cyan targeting reticles slide in from the user's side, one behind the
 * other, and close in on the target's middle, shrinking (0-0.6 s). Locked on,
 * the reticle blinks twice (0.6-0.9 s) and the target flashes pale
 * (0.7-1.0 s).
 */
export class LockOn {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(Math.min(r.width, r.height) * 0.7, 40);
    const stagger = 60;
    const span = TOTAL - 2 * stagger;
    const at = (ms: number) => ms / span;

    const effects: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const from = -v.dir * (size * 1.6 + i * size * 0.5);
      // Reticle i starts `i * stagger` late and arrives so the last one locks on at LOCKED.
      const arrive = LOCKED - 2 * stagger - (2 - i) * 50;
      const frames: Keyframe[] = [
        { transform: `translateX(${from}px) scale(1.6)`, opacity: 0 },
        { transform: `translateX(${from * 0.6}px) scale(1.4)`, opacity: 0.9, offset: at(arrive * 0.3), easing: 'ease-in' },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: at(arrive) }
      ];
      if (i === 2) {
        const lock = LOCKED - 2 * stagger;
        frames.push(
          { opacity: 1, offset: at(lock + 75), easing: 'steps(1, end)' },
          { opacity: 0, offset: at(lock + 75), easing: 'steps(1, end)' },
          { opacity: 0, offset: at(lock + 150), easing: 'steps(1, end)' },
          { opacity: 1, offset: at(lock + 150), easing: 'steps(1, end)' },
          { opacity: 1, offset: at(lock + 225), easing: 'steps(1, end)' },
          { opacity: 0, offset: at(lock + 225), easing: 'steps(1, end)' },
          { opacity: 0, offset: at(lock + 300) },
          { transform: 'translateX(0) scale(1.1)', opacity: 1, offset: at(lock + 300) },
          { transform: 'translateX(0) scale(1.1)', opacity: 0 }
        );
      } else {
        frames.push({ transform: 'translateX(0) scale(1)', opacity: 0, offset: at(arrive + 60) }, { transform: 'translateX(0) scale(1)', opacity: 0 });
      }
      effects.push(Fx.spawn(fxEl, LockOn.reticle(size), target, frames, { duration: span, easing: 'linear', delay: i * stagger }));
    }
    effects.push(Fx.glow(targetEl, 'brightness(2) grayscale(.5)', 300, LOCKED + 100));
    await Promise.all(effects);
  }

  /** A cyan crosshair `size` px wide: a ring with an inner ring and four ticks through the middle. */
  private static reticle(size: number): HTMLElement {
    const c = '#7FF0FF';
    return Fx.box(size, size,
      `border-radius:50%;border:2px solid ${c};box-sizing:border-box;box-shadow:0 0 6px ${c},inset 0 0 0 ${size * 0.18}px #7FF0FF00,inset 0 0 6px ${c};` +
      `background:radial-gradient(circle,#0000 0 ${size * 0.16}px,${c} ${size * 0.16}px ${size * 0.16 + 1.5}px,#0000 ${size * 0.16 + 2}px),` +
      `linear-gradient(${c},${c}) center/2px 100% no-repeat,linear-gradient(${c},${c}) center/100% 2px no-repeat`);
  }
}
