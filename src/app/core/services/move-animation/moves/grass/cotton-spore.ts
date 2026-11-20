import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** How many cotton puffs drift down. */
const PUFFS = 12;

/**
 * Cotton Spore, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/ce/Baumwollsaat_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/86/Baumwollsaat_Gen5.png
 *
 * A cluster of fluffy white-pink cotton puffs gathers above the target
 * (0-0.3 s) and drifts down onto it, swaying, with white sparkles twinkling
 * between them (0.2-0.9 s). Then the target's Speed drops sharply: it turns
 * blue under stat-down bubbles (0.9 s to ~1.8 s).
 */
export class CottonSpore {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);

    const effects: Promise<void>[] = [];
    for (let i = 0; i < PUFFS; i++) {
      const s = 12 + Math.random() * 10;
      const puff = Fx.box(s, s,
        'border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff,#FCE8F0 50%,#F4C4D8 75%,#F4C4D800);filter:blur(.4px)');
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * w * 0.45, y: target.y - h * (0.55 + Math.random() * 0.25) };
      const fall = h * (0.55 + Math.random() * 0.3);
      const sway = (Math.random() * 2 - 1) * 10;
      effects.push(
        Fx.spawn(fxEl, puff, at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.25 },
          { transform: `translate(${sway}px,${fall * 0.45}px) scale(1)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${-sway}px,${fall * 0.8}px) scale(.95)`, opacity: 0.9, offset: 0.85 },
          { transform: `translate(0,${fall}px) scale(.8)`, opacity: 0 }
        ], { duration: 800, easing: 'ease-in-out', delay: Math.random() * 100 })
      );
    }
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * w * 0.4, y: target.y + (Math.random() * 2 - 1) * h * 0.4 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 6, '#FFFFFF'), at, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 300, easing: 'ease-in-out', delay: 250 + i * 100 })
      );
    }
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
