import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Double Slap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1f/Duplexhieb_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/6b/Duplexhieb_Gen5.png
 *
 * One slap per hit (`v.hits`, 0.36 s each), from alternating sides: a white
 * open hand swings in from beside the target to its upper body (hit 0.14 s
 * into each slap), a yellow spiky burst flares on that side, the target is
 * knocked a little the other way and the hand swings back out.
 */
export class DoubleSlap {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.42, 30);
    const reach = Math.max(r.width * 0.7, 50);
    const base = targetEl.style.transform;
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      // The first slap comes from the caster's side, then they alternate.
      const side = (hit % 2 ? 1 : -1) * v.dir;
      const at: Point = { x: target.x + side * r.width * 0.28, y: target.y - r.height * 0.18 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.gloveGlyph(w), at, [
          { transform: `translate(${side * reach}px,-6px) rotate(${side * 40}deg)`, opacity: 0 },
          { transform: `translate(0,0) rotate(${side * 10}deg)`, opacity: 1, offset: 0.38 },
          { transform: `translate(${-side * 4}px,0) rotate(0deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${side * reach * 0.6}px,-4px) rotate(${side * 30}deg)`, opacity: 0 }
        ], { duration: 360, easing: 'ease-out' })
      );
      await Fx.wait(140);
      Fx.flash(targetEl, '#FFE84A', 0.5);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(w * 1.5, '#F8C820', '#FFEA5A', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 260, easing: 'ease-out' }),
        // Knocked aside by the slap, then back.
        Fx.anim(targetEl, [
          { transform: `${base} translate(0,0)` },
          { transform: `${base} translate(${-side * 7}px,0)`, offset: 0.3 },
          { transform: `${base} translate(0,0)` }
        ], { duration: 200, easing: 'ease-out', fill: 'none' })
      );
      await Fx.wait(220);
    }
    await Promise.all(effects);
  }
}
