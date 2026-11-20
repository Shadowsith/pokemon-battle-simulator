import { BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** Total length, ms. */
const TOTAL = 1250;

/**
 * Spite, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/fd/Groll_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/be/Groll_Gen5.png
 *
 * The scene darkens (0-0.25 s) and the user flares a ghostly pale white twice
 * with a spiteful glare (0.35-0.55 s and 0.65-0.85 s). The target dims and
 * shudders as it loses PP (0.85-1.05 s), and the scene clears (to ~1.25 s).
 */
export class Spite {
  static async play(refs: BattleStageRefs) {
    const { fieldEl, launchEl, targetEl } = refs;
    const at = (ms: number) => ms / TOTAL;
    const pale = 'grayscale(.8) brightness(2.2) drop-shadow(0 0 8px #E8E0FF)';
    const dim = Fx.backdrop(fieldEl, `${DIM_BACKDROP};opacity:0`);
    const scene = Fx.anim(dim, [
      { opacity: 0 },
      { opacity: 0.9, offset: at(250) },
      { opacity: 0.9, offset: at(1050) },
      { opacity: 0 }
    ], { duration: TOTAL, easing: 'linear' });
    const glare = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: 'none', offset: at(350) },
      { filter: pale, offset: at(450) },
      { filter: 'none', offset: at(550) },
      { filter: 'none', offset: at(650) },
      { filter: pale, offset: at(750) },
      { filter: 'none', offset: at(850) },
      { filter: 'none' }
    ], { duration: TOTAL, easing: 'linear', fill: 'none' });
    const drain = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: 'brightness(.5) saturate(.4)', offset: 0.4 },
      { filter: 'none' }
    ], { duration: 200, easing: 'ease-in-out', delay: 850, fill: 'none' });
    setTimeout(() => Fx.shake(targetEl, 3), 850);
    await Promise.all([scene, glare, drain]);
    dim.remove();
  }
}
