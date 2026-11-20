import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The two hands clap at each of `CLAPS` (ms); the ally glows until `TOTAL`. */
const CLAPS = [250, 500];
const TOTAL = 1050;

/**
 * Helping Hand, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/8e/Rechte_Hand_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/74/Rechte_Hand_Gen5.png
 *
 * Two white hands rise up beside the ally being helped and clap together
 * above it twice (0.25 and 0.5 s) with a white sparkle at each clap, then
 * fade (to 0.7 s) while the ally glows a bright cheering yellow
 * (0.6-1.05 s).
 */
export class HelpingHand {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const hw = Math.max(w * 0.35, 26);
    const above: Point = { x: target.x, y: target.y - Math.max(r.height, 50) * 0.55 };
    const span = 700;
    const effects: Promise<void>[] = [];
    for (const side of [-1, 1]) {
      const open = `translateX(${side * hw * 0.8}px) rotate(${side * 25}deg)`;
      const shut = `translateX(${side * hw * 0.32}px) rotate(${side * 8}deg)`;
      effects.push(Fx.spawn(fxEl, FxGlyphs.gloveGlyph(hw), above, [
        { transform: `translate(${side * hw * 0.8}px,24px) rotate(${side * 25}deg)`, opacity: 0 },
        { transform: open, opacity: 1, offset: 150 / span },
        { transform: shut, opacity: 1, offset: CLAPS[0] / span },
        { transform: open, opacity: 1, offset: 380 / span },
        { transform: shut, opacity: 1, offset: CLAPS[1] / span },
        { transform: shut, opacity: 1, offset: 580 / span },
        { transform: `translate(${side * hw * 0.32}px,-10px) rotate(${side * 8}deg)`, opacity: 0 }
      ], { duration: span, easing: 'linear' }));
    }
    for (const t of CLAPS) {
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(w * 0.35, 24), '#FFF8D0'), above, [
        { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.6) rotate(45deg)', opacity: 0 }
      ], { duration: 220, easing: 'ease-out', delay: t }));
    }
    effects.push(Fx.glow(targetEl, 'sepia(1) saturate(3) hue-rotate(10deg) brightness(1.4) drop-shadow(0 0 6px #FFE84A)', TOTAL - 600, 600));
    await Promise.all(effects);
  }
}
