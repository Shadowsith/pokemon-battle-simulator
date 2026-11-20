import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Flight time of one flame puff and the gap between puffs, ms. */
const FLIGHT = 300;
const STEP = 25;
const PUFFS = 16;

/**
 * Dragon Breath, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/71/Feuerodem_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/50/Feuerodem_Gen5.png
 *
 * A stream of magenta-pink dragon fire with pink sparkles gushes from the
 * user's mouth to the target (0-0.7 s, the first puff lands at 0.3 s); the
 * target flickers in it, then glows red (0.7-1.15 s).
 */
export class DragonBreath {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y - lr.height * 0.15 };
    const dx = target.x - from.x;
    const dy = target.y - from.y;

    const effects: Promise<void>[] = [];
    for (let i = 0; i < PUFFS; i++) {
      const s = 14 + Math.random() * 10;
      const jitter = (Math.random() * 2 - 1) * 8;
      const puff = Fx.box(s, s,
        'border-radius:50% 50% 45% 55%;background:radial-gradient(circle at 45% 45%,#FFE0F0,#FF5AB4 35%,#D8207A 60%,#A0105A00 78%);mix-blend-mode:screen');
      effects.push(
        Fx.spawn(fxEl, puff, from, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) scale(.8)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx}px,${dy + jitter}px) scale(1.5)`, opacity: 0.5 }
        ], { duration: FLIGHT, easing: 'linear', delay: i * STEP })
      );
      if (i % 2 === 0) {
        const t = Math.random();
        const spark: Point = { x: from.x + dx * t, y: from.y + dy * t + (Math.random() * 2 - 1) * 14 };
        effects.push(
          Fx.spawn(fxEl, FxGlyphs.sparkStar(8 + Math.random() * 5, '#FF9AD0'), spark, [
            { transform: 'scale(0)', opacity: 0 },
            { transform: `translate(${v.dir * 8}px,-4px) scale(1)`, opacity: 1, offset: 0.4 },
            { transform: `translate(${v.dir * 18}px,-8px) scale(0)`, opacity: 0 }
          ], { duration: 320, easing: 'ease-out', delay: 100 + i * STEP })
        );
      }
    }
    const streamEnd = FLIGHT + (PUFFS - 1) * STEP;
    for (let t = FLIGHT; t < streamEnd; t += 120) setTimeout(() => Fx.shake(targetEl, 3), t);
    effects.push(
      Fx.glow(targetEl, 'sepia(1) saturate(6) hue-rotate(-30deg) brightness(.95) drop-shadow(0 0 5px #FF4A3A)', 450, streamEnd),
      Fx.anim(targetEl, [{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }], { duration: 120, iterations: 3, delay: FLIGHT, fill: 'none' })
    );
    await Promise.all(effects);
  }
}
