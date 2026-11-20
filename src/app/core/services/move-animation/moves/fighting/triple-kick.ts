import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Length of one kick, ms; the foot lands `LAND` ms into it. */
const KICK = 300;
const LAND = 100;

/**
 * Triple Kick, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/3/35/Dreifachkick_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/0/06/Dreifachkick_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/f/fd/Dreifachkick_Gen5.png
 *
 * One kick per hit (`v.hits`, 0.3 s apart, landing at 0.1 / 0.4 / 0.7 s for
 * three), each a little bigger than the last as the move's power grows: an
 * orange-yellow foot stamps onto a different spot of the target, a yellow
 * burst flares and the target is knocked back.
 */
export class TripleKick {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const base = targetEl.style.transform;
    const spots = [{ x: -0.15, y: 0.15 }, { x: 0.15, y: -0.1 }, { x: 0, y: 0 }];
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const t0 = hit * KICK;
      const grow = 1 + hit * 0.25;
      const spot = spots[hit % spots.length];
      const at: Point = { x: target.x + spot.x * w * v.dir, y: target.y + spot.y * h };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.footGlyph(Math.max(w * 0.35, 24) * grow, '#F0A840'), at, [
          { transform: 'scale(1.8)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: LAND / KICK },
          { transform: 'scale(1)', opacity: 1, offset: (LAND + 80) / KICK },
          { transform: 'scale(1.05)', opacity: 0 }
        ], { duration: KICK, easing: 'ease-in', delay: t0 }),
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(w * 0.4, 28) * grow, '#F8C820', '#FFEA5A', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 240, easing: 'ease-out', delay: t0 + LAND }),
        Fx.anim(targetEl, [
          { transform: base },
          { transform: `${base} translateX(${v.dir * 5 * grow}px)`, offset: 0.3 },
          { transform: base }
        ], { duration: 200, easing: 'ease-out', delay: t0 + LAND, fill: 'none' })
      );
      setTimeout(() => Fx.flash(targetEl, '#FFE84A', 0.4 + hit * 0.1), t0 + LAND);
    }
    await Promise.all(effects);
  }
}
