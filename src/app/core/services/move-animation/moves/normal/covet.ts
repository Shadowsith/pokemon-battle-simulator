import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The hearts reach the target at `HIT`; the item flies from `GRAB` and reaches the user at `HOME` (ms). */
const HIT = 600;
const GRAB = 700;
const HOME = 1200;

/**
 * Covet, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/4f/Bezirzer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e7/Bezirzer_Gen5.png
 *
 * Three pink hearts float from the user over to the target in a gentle
 * wave (0-0.6 s); the target flashes pink and jolts (0.6 s). Then an item
 * sack pops up off the target and flies over to the user (0.7-1.2 s).
 */
export class Covet {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        frames.push({ transform: `translate(${dx * u}px,${dy * u - Math.sin(u * Math.PI) * 30 + Math.sin(u * Math.PI * 3 + i) * 8}px) scale(${0.7 + u * 0.4})`, opacity: k === 0 ? 0 : k === 6 ? 0.2 : 1 });
      }
      effects.push(Fx.spawn(fxEl, FxGlyphs.heartGlyph(16), launch, frames, { duration: 450, easing: 'linear', delay: i * 75 }));
    }
    setTimeout(() => {
      Fx.flash(targetEl, '#FF9AC8', 0.5);
      Fx.shake(targetEl, 4);
    }, HIT);
    const from: Point = { x: target.x, y: target.y - r.height * 0.35 };
    const bx = launch.x - from.x;
    const by = launch.y - from.y;
    const arc = -Math.max(Math.abs(bx) * 0.3, 50);
    effects.push(Fx.spawn(fxEl, FxGlyphs.itemBag(Math.max(r.width * 0.3, 20)), from, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: 'translate(0,-16px) scale(1)', opacity: 1, offset: 0.15 },
      { transform: `translate(${bx * 0.5}px,${by * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${bx}px,${by}px) scale(.8)`, opacity: 1, offset: 0.92 },
      { transform: `translate(${bx}px,${by}px) scale(.5)`, opacity: 0 }
    ], { duration: HOME - GRAB + 40, easing: 'linear', delay: GRAB }));
    await Promise.all(effects);
  }
}
