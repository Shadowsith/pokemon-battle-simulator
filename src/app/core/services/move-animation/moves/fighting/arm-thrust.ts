import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Length of one shove, ms; the palm lands `LAND` ms into it. */
const SHOVE = 300;
const LAND = 100;

/**
 * Arm Thrust, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b5/Armsto%C3%9F_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/ca/Armsto%C3%9F_Gen5.png
 *
 * One shove per hit (`v.hits`, 0.3 s apart, landing at 0.1 / 0.4 / 0.7 s
 * for three): a yellow open palm thrusts onto a different spot of the
 * target, yellow sparkles flare round it, the target flickers dark and is
 * pushed back.
 */
export class ArmThrust {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const base = targetEl.style.transform;
    const spots = [{ x: 0.12, y: -0.12 }, { x: -0.12, y: 0.12 }, { x: 0, y: -0.02 }, { x: 0.15, y: 0.1 }, { x: -0.1, y: -0.15 }];
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const t0 = hit * SHOVE;
      const spot = spots[hit % spots.length];
      const p: Point = { x: target.x + spot.x * w * v.dir, y: target.y + spot.y * h };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.gloveGlyph(Math.max(w * 0.38, 26), '#FFE04A', '#B88A10'), p, [
          { transform: `translateX(${-v.dir * w * 0.35}px) scale(.7)`, opacity: 0 },
          { transform: 'translateX(0) scale(1.05)', opacity: 1, offset: LAND / SHOVE },
          { transform: `translateX(${v.dir * 4}px) scale(1)`, opacity: 1, offset: (LAND + 90) / SHOVE },
          { transform: `translateX(${v.dir * 6}px) scale(1)`, opacity: 0 }
        ], { duration: SHOVE, easing: 'ease-out', delay: t0 })
      );
      for (let s = 0; s < 4; s++) {
        const a = (Math.PI * 2 * s) / 4 + hit;
        const d = w * 0.3;
        effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(12, '#FFE84A'), p, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out', delay: t0 + LAND }));
      }
      effects.push(Fx.anim(targetEl, [
        { transform: base, filter: 'brightness(.25)' },
        { transform: `${base} translateX(${v.dir * 6}px)`, filter: 'none', offset: 0.4 },
        { transform: base, filter: 'none' }
      ], { duration: 180, easing: 'ease-out', delay: t0 + LAND, fill: 'none' }));
    }
    await Promise.all(effects);
  }
}
