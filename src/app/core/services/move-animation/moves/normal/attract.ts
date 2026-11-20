import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many hearts pop up round the target, and how far apart (ms). */
const HEARTS = 8;
const HEART_GAP = 90;

/**
 * Attract, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/a/ab/Anziehung_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/f/f6/Anziehung_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/d/d0/Anziehung_Gen5.png
 *
 * Pink hearts pop up all over the target one after another (0-0.95 s, 0.09 s
 * apart), swell, drift upwards and fade, while the target blushes pink
 * (0.2-1.1 s). Then one small heart floats up off its head (1.1-1.6 s).
 */
export class Attract {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);

    const effects: Promise<void>[] = [
      Fx.glow(targetEl, 'sepia(1) saturate(4) hue-rotate(290deg) brightness(1.15) drop-shadow(0 0 6px #FF8AC8)', 900, 200)
    ];
    for (let i = 0; i < HEARTS; i++) {
      const s = 16 + Math.random() * 10;
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * w * 0.38, y: target.y + (Math.random() * 2 - 1) * h * 0.3 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.heartGlyph(s), at, [
          { transform: 'translateY(0) scale(.2)', opacity: 0 },
          { transform: 'translateY(-4px) scale(1.15)', opacity: 1, offset: 0.3 },
          { transform: 'translateY(-10px) scale(1)', opacity: 1, offset: 0.6 },
          { transform: 'translateY(-22px) scale(.9)', opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: i * HEART_GAP })
      );
    }
    const head: Point = { x: target.x + w * 0.1, y: target.y - h * 0.5 };
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.heartGlyph(12), head, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: 'translate(2px,-8px) scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'translate(-3px,-18px) scale(1)', opacity: 1, offset: 0.65 },
        { transform: 'translate(2px,-28px) scale(.9)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: 1100 })
    );
    await Promise.all(effects);
  }
}
