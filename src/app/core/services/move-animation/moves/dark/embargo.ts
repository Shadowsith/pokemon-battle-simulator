import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The tiles close in on the target until `CLOSE` (ms), then hold and scatter. */
const CLOSE = 650;
const TOTAL = 1350;
const PER_ROW = 4;

/**
 * Embargo, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/73/Itemsperre_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/52/Itemsperre_Gen5.png
 *
 * Two rows of glowing magenta hexagon tiles appear above and below the
 * target and slide together onto it, locking it in (0-0.65 s); they hold
 * and flicker while the target tints pink (0.65-1.0 s), then drift apart
 * and fade (1.0-1.35 s).
 */
export class Embargo {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const hex = Math.max(r.width * 0.2, 14);
    const gapY = r.height * 0.45;
    const effects: Promise<void>[] = [Fx.glow(targetEl, 'brightness(1.1) sepia(.6) hue-rotate(280deg) saturate(3)', 500, CLOSE)];
    for (const row of [-1, 1]) {
      for (let i = 0; i < PER_ROW; i++) {
        const x = (i - (PER_ROW - 1) / 2) * hex * 1.3;
        const end: Point = { x: target.x + x, y: target.y + row * hex * 0.5 };
        const tile = FxGlyphs.hexagon(hex, 'linear-gradient(160deg,#FFE0F8,#F07AD8 45%,#C03AB0)', '#FF5AD8');
        effects.push(Fx.spawn(fxEl, tile, end, [
          { transform: `translate(0,${row * gapY}px) scale(.6)`, opacity: 0, offset: 0 },
          { transform: `translate(0,${row * gapY}px) scale(1)`, opacity: 1, offset: 0.12 },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: CLOSE / TOTAL },
          { transform: 'translate(0,0) scale(1)', opacity: 0.5, offset: (CLOSE + 120) / TOTAL },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: (CLOSE + 240) / TOTAL },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 1000 / TOTAL },
          { transform: `translate(${x * 0.6}px,${row * gapY * 0.6}px) scale(.7)`, opacity: 0, offset: 1 }
        ], { duration: TOTAL, delay: i * 30, easing: 'ease-in-out' }));
      }
    }
    effects.push(Fx.wait(CLOSE).then(() => Fx.shake(targetEl, 3)));
    await Promise.all(effects);
  }
}
