import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** A boulder drops in at each of `DROPS` (ms) and lands `FALL` ms later. */
const DROPS = [0, 140, 280, 420, 560];
const FALL = 300;

/**
 * Rock Tomb, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/70/Felsgrab_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1a/Felsgrab_Gen5.png
 *
 * Five boulders crash down from above one after another (landing at 0.3,
 * 0.44, 0.58, 0.72 and 0.86 s), walling the target in on both sides and in
 * front; each lands with a puff of dust and shakes the field. They hold a
 * moment, then crumble away (1.0-1.4 s), and the target's Speed drops - it
 * turns blue under stat-down bubbles (1.4-2.3 s).
 */
export class RockTomb {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const foot = Fx.footOf(targetEl, fieldEl);
    const size = Math.max(w * 0.45, 26);
    const spots: Point[] = [
      { x: foot.x - w * 0.55, y: foot.y - size * 0.35 },
      { x: foot.x + w * 0.55, y: foot.y - size * 0.35 },
      { x: foot.x - w * 0.3, y: foot.y - size * 0.15 },
      { x: foot.x + w * 0.3, y: foot.y - size * 0.15 },
      { x: foot.x, y: foot.y - size * 0.05 }
    ];
    const rocks = spots.map((at, i) => {
      const rock = FxGlyphs.rockChunk(size * (1 + (i % 2) * 0.15));
      Fx.place(rock, at);
      rock.style.opacity = '0';
      fxEl.appendChild(rock);
      return rock;
    });
    const puffs: Promise<void>[] = [];
    // Each boulder starts out of view above its spot.
    const falls = rocks.map((rock, i) =>
      Fx.anim(rock, [
        { transform: `translateY(${-(spots[i].y + size)}px) rotate(-40deg)`, opacity: 1 },
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 }
      ], { duration: FALL, delay: DROPS[i], easing: 'ease-in' }).then(() => {
        Fx.shakeField(fieldEl, 0.4);
        Fx.shake(targetEl, 3);
        puffs.push(FxEffects.smokePuff(fxEl, { x: spots[i].x, y: spots[i].y + size * 0.3 }, size, ['#D8C8A0', '#A89068']));
      })
    );
    await Promise.all(falls);
    await Fx.wait(150);
    await Promise.all([
      ...puffs,
      ...rocks.map((rock, i) =>
        Fx.anim(rock, [
          { transform: 'translateY(0) scale(1)', opacity: 1 },
          { transform: 'translateY(6px) scale(.85,.6)', opacity: 0 }
        ], { duration: 300, delay: i * 20, easing: 'ease-in' }).then(() => rock.remove())
      )
    ]);
    await FxEffects.blueStatDrop(refs, target);
  }
}
