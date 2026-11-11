import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Poison Jab, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/ff/Gifthieb_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/37/Gifthieb_Gen5.png
 *
 * Three glowing pink jabs thrust into the target from different angles,
 * 0.2 s apart (0-0.65 s; first hit at 0.15 s); each lands with a magenta
 * star burst and a shake. The target is tinted purple from the second jab
 * on (0.35-1.1 s).
 */
export class PoisonJab {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.width * 0.9, 60);

    // Angles the jabs come from, in degrees from straight at the target (0 = from the user's side).
    const parts: Promise<void>[] = [-35, 30, -5].map(async (deg, i) => {
      await Fx.wait(i * 200);
      const a = ((v.dir > 0 ? 180 : 0) + deg * v.dir) * (Math.PI / 180);
      // Where the jab lands: spread a little over the target.
      const hit: Point = { x: target.x + (i - 1) * tr.width * 0.12, y: target.y + (i === 1 ? 0.18 : -0.1) * tr.height };
      const jab = PoisonJab.spike(len);
      // The spike's tip is its right end: turn it to point at the hit, coming from angle `a`.
      jab.style.left = `${hit.x - len}px`;
      jab.style.top = `${hit.y - len * 0.09}px`;
      fxEl.appendChild(jab);
      const rot = `rotate(${(a * 180) / Math.PI + 180}deg)`;
      const back = len * 0.6;
      const jabDone = Fx.anim(jab, [
        { transform: `${rot} translateX(${-back}px)`, transformOrigin: '100% 50%', opacity: 0 },
        { transform: `${rot} translateX(0)`, transformOrigin: '100% 50%', opacity: 1, offset: 0.5 },
        { transform: `${rot} translateX(${len * 0.1}px) scaleY(.4)`, transformOrigin: '100% 50%', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' }).then(() => jab.remove());

      await Fx.wait(150);
      const star = FxGlyphs.sparkStar(Math.max(tr.width * 0.35, 28), '#F040C8');
      Fx.place(star, hit);
      fxEl.appendChild(star);
      Fx.flash(targetEl, '#E060D0', 0.5);
      Fx.shake(targetEl, 5);
      await Promise.all([
        jabDone,
        Fx.anim(star, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.5) rotate(35deg)', opacity: 0 }
        ], { duration: 320, easing: 'ease-out' }).then(() => star.remove())
      ]);
    });

    await Fx.wait(350);
    parts.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(4) hue-rotate(240deg) brightness(.9)', offset: 0.25 },
        { filter: 'sepia(1) saturate(4) hue-rotate(240deg) brightness(.9)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 750, easing: 'ease-in-out', fill: 'none' })
    );
    await Promise.all(parts);
  }

  /** A pink jab streak `len` px long: a faint tail widening to a bright, pointed tip at the right end. */
  private static spike(len: number): HTMLElement {
    // The glow sits on a wrapper: clip-path on the same element would cut the drop-shadow off.
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${len}px;height:${len * 0.18}px;pointer-events:none;filter:drop-shadow(0 0 5px #F050D0)`;
    const shape = document.createElement('div');
    shape.style.cssText =
      'width:100%;height:100%;clip-path:polygon(0 45%,70% 0,100% 50%,70% 100%,0 55%);' +
      'background:linear-gradient(90deg,#C030B000,#D040C0 45%,#F8A0F0 80%,#FFFFFF)';
    wrap.appendChild(shape);
    return wrap;
  }
}
