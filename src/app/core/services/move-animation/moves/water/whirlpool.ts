import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many bubbles swirl round the target. */
const BUBBLES = 18;
/** When the target is caught in the swirl, ms from the start. */
const HITS = [400, 700];
const TOTAL = 1300;

/**
 * Whirlpool, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b0/Whirlpool_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/d7/Whirlpool_Gen5.png
 *
 * The scene turns a deep sea blue (0-0.25 s). Blue bubbles swirl round the
 * target in a rising spiral, a vortex closing in (0.2-1.0 s); the target is
 * dragged into it, flickering blue and shaking (0.4 and 0.7 s). The scene
 * clears (1.0-1.3 s).
 */
export class Whirlpool {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const rx = Math.max(r.width, 50) * 0.6;
    const h = Math.max(r.height, 50);
    const at = (ms: number) => ms / TOTAL;

    const sea = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 65% 45%,#2A5AC8,#123A8A 55%,#081C50);opacity:0');
    const effects: Promise<void>[] = [
      Fx.anim(sea, [
        { opacity: 0 },
        { opacity: 0.9, offset: at(250) },
        { opacity: 0.9, offset: at(1000) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' })
    ];
    for (let i = 0; i < BUBBLES; i++) {
      const a0 = (Math.PI * 2 * i) / BUBBLES;
      const y0 = h * 0.45 - (i % 3) * 6;
      const frames: Keyframe[] = [];
      const steps = 10;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const a = a0 + u * Math.PI * 3;
        const rr = rx * (1 - u * 0.45);
        frames.push({
          transform: `translate(${Math.cos(a) * rr}px,${y0 - u * h * 0.95 + Math.sin(a) * rr * 0.25}px) scale(${0.8 + 0.3 * Math.sin(a)})`,
          opacity: k === 0 || k === steps ? 0 : 1
        });
      }
      effects.push(Fx.spawn(fxEl, FxGlyphs.bubbleGlyph(8 + Math.random() * 8), target, frames, { duration: 800, easing: 'linear', delay: 200 + (i % 6) * 30 }));
    }
    for (const t of HITS) setTimeout(() => {
      Fx.flash(targetEl, '#5AA8FF', 0.5);
      Fx.shake(targetEl, 4);
    }, t);
    effects.push(Fx.glow(targetEl, 'sepia(1) saturate(4) hue-rotate(180deg) brightness(.9)', 600, 400));
    await Promise.all(effects);
    sea.remove();
  }
}
