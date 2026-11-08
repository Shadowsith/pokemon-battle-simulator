import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** Small effects shared by several Psychic move animations. */
export class PsychicFx {
  /** Fades the dark backdrop in and hands it back for {@link PsychicFx.dimOut}. */
  static async dimIn(fieldEl: HTMLElement): Promise<HTMLElement> {
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
    return dim;
  }

  static async dimOut(dim: HTMLElement) {
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    dim.remove();
  }

  /** A quick side-to-side tremble in place (`amp` px); the sprite keeps facing its foe. */
  static tremble(el: HTMLElement, duration: number, amp: number): Promise<void> {
    const original = el.style.transform;
    const frames: Keyframe[] = [];
    const n = Math.round(duration / 45);
    for (let k = 0; k <= n; k++) {
      const x = k === 0 || k === n ? 0 : (k % 2 ? amp : -amp);
      frames.push({ transform: `${original} translateX(${x}px)` });
    }
    return Fx.anim(el, frames, { duration, easing: 'linear', fill: 'none' });
  }
}
