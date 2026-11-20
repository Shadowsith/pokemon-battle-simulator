import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** Total length, ms; the ring has closed in at `FOCUSED`. */
const TOTAL = 1300;
const FOCUSED = 750;

/**
 * Mind Reader, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/84/Willensleser_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a9/Willensleser_Gen5.png
 *
 * The scene darkens (0-0.25 s). A hazy violet ring of psychic light closes in
 * on the target, shrinking and brightening to a cyan core (0.25-0.75 s), then
 * flares green-yellow (0.75-0.95 s) while the target turns see-through violet.
 * The scene clears (to ~1.3 s).
 */
export class MindReader {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width, r.height, 60) * 1.1;
    const at = (ms: number) => ms / TOTAL;

    const dim = Fx.backdrop(fieldEl, `${DIM_BACKDROP};opacity:0`);
    const scene = Fx.anim(dim, [
      { opacity: 0 },
      { opacity: 0.9, offset: at(250) },
      { opacity: 0.9, offset: at(1000) },
      { opacity: 0 }
    ], { duration: TOTAL, easing: 'linear' });
    const ring = Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle,#7FF0FF 0 12%,#3A6AD8 22%,#8A5AE000 40%,#B07AF0aa 58%,#7A4AC8 66%,#5A2AA000 76%);mix-blend-mode:screen');
    const focus = Fx.spawn(fxEl, ring, target, [
      { transform: 'scale(1.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.9, offset: at(450) },
      { transform: 'scale(.55)', opacity: 1, offset: at(FOCUSED) },
      { transform: 'scale(.5)', opacity: 1, filter: 'hue-rotate(-120deg) brightness(1.4)', offset: at(FOCUSED + 100) },
      { transform: 'scale(.6)', opacity: 0, filter: 'hue-rotate(-120deg) brightness(1.4)', offset: at(FOCUSED + 250) },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: TOTAL, easing: 'linear', delay: 0 });
    const read = Fx.anim(targetEl, [
      { opacity: 1, filter: 'none' },
      { opacity: 0.55, filter: 'sepia(1) saturate(3) hue-rotate(220deg) brightness(1.2)', offset: 0.4 },
      { opacity: 1, filter: 'none' }
    ], { duration: 450, easing: 'ease-in-out', delay: FOCUSED, fill: 'none' });
    await Promise.all([scene, focus, read]);
    dim.remove();
  }
}
