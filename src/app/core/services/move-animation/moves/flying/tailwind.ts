import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Tailwind, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f7/R%C3%BCckenwind_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/7d/R%C3%BCckenwind_Gen5.png
 *
 * The scene turns pale grey-white (0-0.25 s) and white wind streaks blow
 * across the whole field from behind the user toward the foe (0.1-1.3 s),
 * thickest in the middle; the user sways forward with the gusts. The scene
 * clears (1.3-1.55 s).
 */
export class Tailwind {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    // Tailwind targets the user's side, so the wind follows the way the user faces.
    const flow: 1 | -1 = launch.x < W / 2 ? 1 : -1;

    const pale = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#C4CED6,#E8EEF2 50%,#B4C0C8)');
    const parts: Promise<void>[] = [
      Fx.anim(pale, [{ opacity: 0 }, { opacity: 0.85, offset: 0.16 }, { opacity: 0.85, offset: 0.84 }, { opacity: 0 }], { duration: 1550, easing: 'ease-in-out' }),
      Fx.anim(launchEl, [
        { transform: 'translateX(0)' },
        { transform: `translateX(${flow * 7}px)`, offset: 0.3 },
        { transform: 'translateX(0)', offset: 0.5 },
        { transform: `translateX(${flow * 7}px)`, offset: 0.75 },
        { transform: 'translateX(0)' }
      ], { duration: 1300, delay: 150, easing: 'ease-in-out', fill: 'none' })
    ];

    for (let i = 0; i < 26; i++) {
      const len = 70 + Math.random() * 90;
      const thick = 2 + Math.random() * 2;
      const streak = document.createElement('div');
      const y = H * (0.2 + Math.random() * 0.7);
      const x0 = flow > 0 ? -len : W;
      streak.style.cssText =
        `position:absolute;left:${x0}px;top:${y}px;width:${len}px;height:${thick}px;border-radius:${thick}px;pointer-events:none;` +
        `background:linear-gradient(${flow > 0 ? 90 : 270}deg,#ffffff00,#ffffffcc 70%,#ffffff);box-shadow:0 0 4px #ffffff88`;
      fxEl.appendChild(streak);
      const dx = flow * (W + len);
      parts.push(
        Fx.anim(streak, [
          { transform: 'translateX(0)', opacity: 0 },
          { transform: `translateX(${dx * 0.15}px)`, opacity: 1, offset: 0.15 },
          { transform: `translateX(${dx * 0.85}px)`, opacity: 1, offset: 0.85 },
          { transform: `translateX(${dx}px)`, opacity: 0 }
        ], { duration: 380 + Math.random() * 160, delay: 100 + Math.random() * 700, easing: 'linear', fill: 'backwards' }).then(() => streak.remove())
      );
    }
    await Promise.all(parts);
    pale.remove();
  }
}
