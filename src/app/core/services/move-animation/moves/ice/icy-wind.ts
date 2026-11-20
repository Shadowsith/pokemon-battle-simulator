import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Flight time of one frost puff and the gap between puffs, ms. */
const FLIGHT = 350;
const STEP = 30;
const PUFFS = 14;

/**
 * Icy Wind, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/21/Eissturm_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/46/Eissturm_Gen5.png
 *
 * A chilly white-blue mist gusts from the user over to the target with
 * glittering ice sparkles (0-0.75 s, the first gust lands at 0.35 s). The
 * target frosts over icy blue (0.45-0.95 s), then its Speed drops: blue
 * stat-down bubbles drift down over it (0.95 s to ~1.85 s).
 */
export class IcyWind {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y };
    const dx = target.x - from.x;
    const dy = target.y - from.y;

    const effects: Promise<void>[] = [];
    for (let i = 0; i < PUFFS; i++) {
      const s = 26 + Math.random() * 18;
      const lift = (Math.random() * 2 - 1) * 16;
      const puff = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#FFFFFFee,#DCEFFFaa 45%,#B8DCF800 72%);filter:blur(1px)');
      effects.push(
        Fx.spawn(fxEl, puff, from, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${dy * 0.3 + lift}px) scale(.9)`, opacity: 0.95, offset: 0.3 },
          { transform: `translate(${dx}px,${dy + lift * 0.5}px) scale(1.3)`, opacity: 0.85, offset: 0.85 },
          { transform: `translate(${dx + v.dir * 20}px,${dy + lift * 0.5}px) scale(1.5)`, opacity: 0 }
        ], { duration: FLIGHT / 0.85, easing: 'linear', delay: i * STEP })
      );
      if (i % 2 === 0) {
        const t = 0.3 + Math.random() * 0.7;
        const at: Point = { x: from.x + dx * t, y: from.y + dy * t + (Math.random() * 2 - 1) * 18 };
        effects.push(
          Fx.spawn(fxEl, FxGlyphs.sparkStar(9 + Math.random() * 6, '#BFE8FF'), at, [
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1, offset: 0.5 },
            { transform: `translate(${v.dir * 10}px,0) scale(0)`, opacity: 0 }
          ], { duration: 300, easing: 'ease-in-out', delay: 120 + i * STEP })
        );
      }
    }
    effects.push(Fx.glow(targetEl, 'grayscale(.6) brightness(1.3) sepia(1) saturate(3) hue-rotate(170deg) drop-shadow(0 0 6px #A8DCFF)', 500, 450));
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
