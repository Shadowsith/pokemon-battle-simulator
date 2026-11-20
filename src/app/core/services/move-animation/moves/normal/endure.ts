import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Endure, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/3f/Ausdauer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0f/Ausdauer_Gen5.png
 *
 * The user braces itself - it squats down a little and glows red
 * (0-0.95 s, braced at 0.15 s) - while pale yellow streaks of light rise up
 * round it one after another (0.1-0.9 s).
 */
export class Endure {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const base = launchEl.style.transform;

    const brace = Fx.anim(launchEl, [
      { transform: base, filter: 'none' },
      { transform: `${base} translateY(3px) scale(1.04,.94)`, filter: 'sepia(1) saturate(5) hue-rotate(-40deg) drop-shadow(0 0 6px #FF4030)', offset: 0.16 },
      { transform: `${base} translateY(2px) scale(1.03,.96)`, filter: 'sepia(1) saturate(5) hue-rotate(-40deg) drop-shadow(0 0 6px #FF4030)', offset: 0.8 },
      { transform: base, filter: 'none' }
    ], { duration: 950, easing: 'ease-in-out', fill: 'none' });

    const streaks: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const sh = h * (0.35 + Math.random() * 0.2);
      const streak = Fx.box(5, sh, 'border-radius:3px;background:linear-gradient(0deg,#FFF6A800,#FFF6A8 40%,#FFFDE8);box-shadow:0 0 6px #FFE860');
      const at: Point = { x: launch.x + ((i % 4) / 3 - 0.5) * w * 0.8 + (Math.random() * 2 - 1) * 4, y: launch.y + h * 0.25 };
      streaks.push(
        Fx.spawn(fxEl, streak, at, [
          { transform: 'translateY(0) scaleY(.4)', opacity: 0 },
          { transform: `translateY(${-h * 0.25}px) scaleY(1)`, opacity: 0.95, offset: 0.4 },
          { transform: `translateY(${-h * 0.6}px) scaleY(.7)`, opacity: 0 }
        ], { duration: 420, easing: 'ease-out', delay: 100 + i * 70 })
      );
    }
    await Promise.all([brace, ...streaks]);
  }
}
