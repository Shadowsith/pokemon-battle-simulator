import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Grass Knot, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/be/Strauchler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/10/Strauchler_Gen5.png
 *
 * A loop of green grass springs up round the target's feet and pulls tight
 * round its body (0-0.5 s); the target trips (hit at 0.5 s) and leaves burst
 * up from it and flutter down (0.5-1.55 s).
 */
export class GrassKnot {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);

    // The knot: a green loop rises from the feet and tightens.
    const w = Math.max(tr.width * 1.1, 60);
    const loop = document.createElement('div');
    loop.style.cssText = `width:${w}px;height:${w * 0.35}px;border-radius:50%;pointer-events:none;border:${Math.max(w * 0.07, 4)}px solid #4AC04A;box-shadow:0 0 6px #8AF06A,inset 0 0 4px #1E7A2A`;
    Fx.place(loop, foot);
    fxEl.appendChild(loop);
    const rise = foot.y - (target.y + tr.height * 0.1);
    await Fx.anim(loop, [
      { transform: 'translateY(0) scale(1.3)', opacity: 0 },
      { transform: `translateY(${-rise * 0.6}px) scale(1)`, opacity: 1, offset: 0.5 },
      { transform: `translateY(${-rise}px) scale(.75,.9)`, opacity: 1 }
    ], { duration: 500, easing: 'ease-out' });

    // The trip: the target jolts while the loop snaps and leaves fly.
    Fx.flash(targetEl, '#7AE05A', 0.7);
    Fx.shake(targetEl, 6);
    const effects: Promise<void>[] = [
      Fx.anim(loop, [
        { transform: `translateY(${-rise}px) scale(.75,.9)`, opacity: 1 },
        { transform: `translateY(${-rise}px) scale(.6,.7)`, opacity: 0 }
      ], { duration: 250, easing: 'ease-in' }).then(() => loop.remove())
    ];
    for (let i = 0; i < 9; i++) {
      const leaf = FxGlyphs.leafGlyph(12 + Math.random() * 8);
      Fx.place(leaf, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3, y: target.y });
      fxEl.appendChild(leaf);
      const side = Math.random() * 2 - 1;
      const up = tr.height * (0.5 + Math.random() * 0.4);
      const out = side * tr.width * 0.8;
      const spin = side * (200 + Math.random() * 200);
      effects.push(
        Fx.anim(leaf, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          { transform: `translate(${out * 0.4}px,${-up}px) rotate(${spin * 0.4}deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${out * 0.8}px,${-up * 0.7}px) rotate(${spin * 0.7}deg)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${out}px,${-up * 0.35}px) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 150, delay: Math.random() * 120, easing: 'ease-out' }).then(() => leaf.remove())
      );
    }
    await Promise.all(effects);
  }
}
