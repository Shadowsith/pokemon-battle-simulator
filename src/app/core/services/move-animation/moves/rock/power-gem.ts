import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Power Gem, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/9/99/Juwelenkraft_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/a/a6/Juwelenkraft_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/d/df/Juwelenkraft_Gen5.png
 *
 * The scene darkens (0-0.25 s) and white gems pop up round the user, glinting
 * (0.25-0.6 s). They fire at the target in a glittering stream
 * (0.57-1.4 s); from the first gem's hit (0.95 s) yellow sparkles burst on
 * the target and white arcs slice round it. The scene clears (1.42-1.67 s).
 */
export class PowerGem {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' });

    // Gems pop up round the user, then fly to the target one after another.
    const parts: Promise<void>[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const s = 10 + Math.random() * 8;
      const gem = PowerGem.gem(s);
      const ang = Math.random() * Math.PI * 2;
      const at: Point = { x: launch.x + Math.cos(ang) * lr.width * 0.45, y: launch.y + Math.sin(ang) * lr.height * 0.35 };
      Fx.place(gem, at);
      fxEl.appendChild(gem);
      const dx = target.x - at.x + (Math.random() * 2 - 1) * tr.width * 0.2;
      const dy = target.y - at.y + (Math.random() * 2 - 1) * tr.height * 0.2;
      parts.push(
        Fx.anim(gem, [
          { transform: 'translate(0,0) scale(0)', opacity: 0, offset: 0 },
          { transform: 'translate(0,0) scale(1.2)', opacity: 1, offset: 0.12 },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.4 },
          { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 1, offset: 0.92 },
          { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 0 }
        ], { duration: 800, delay: (i * 400) / count, easing: 'ease-in', fill: 'backwards' }).then(() => gem.remove())
      );
    }

    // Hit (0.95 s): yellow sparkles and white arcs on the target.
    await Fx.wait(700);
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    setTimeout(() => Fx.shake(targetEl, 4), 250);
    for (let i = 0; i < 5; i++) {
      const star = FxGlyphs.sparkStar(16 + Math.random() * 10, '#FFE040');
      Fx.place(star, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3 });
      fxEl.appendChild(star);
      parts.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(.3) rotate(45deg)', opacity: 0 }
        ], { duration: 320, delay: i * 70, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    const arcSize = Math.max(tr.width * 0.9, 60);
    for (let i = 0; i < 3; i++) {
      const arc = document.createElement('div');
      arc.style.cssText = `position:absolute;width:${arcSize}px;height:${arcSize}px;border-radius:50%;pointer-events:none;border-top:3px solid #ffffff;filter:drop-shadow(0 0 3px #fff)`;
      Fx.place(arc, target);
      fxEl.appendChild(arc);
      const a0 = i * 120 + Math.random() * 40;
      parts.push(
        Fx.anim(arc, [
          { transform: `rotate(${a0}deg) scale(.6)`, opacity: 0 },
          { transform: `rotate(${a0 + 60}deg) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${a0 + 140}deg) scale(1.15)`, opacity: 0 }
        ], { duration: 380, delay: 60 + i * 80, easing: 'ease-out' }).then(() => arc.remove())
      );
    }
    await Promise.all(parts);

    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }

  /** A small white cut gem, `s` px wide, with a pale blue facet and a glint. */
  private static gem(s: number): HTMLElement {
    // The glow sits on a wrapper: clip-path on the same element would cut the drop-shadow off.
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${s}px;height:${s * 1.25}px;pointer-events:none;filter:drop-shadow(0 0 4px #ffffff)`;
    const shape = document.createElement('div');
    shape.style.cssText =
      'width:100%;height:100%;clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);' +
      'background:linear-gradient(135deg,#FFFFFF 0 40%,#D8E8FF 40% 60%,#F4F8FF 60%)';
    wrap.appendChild(shape);
    return wrap;
  }
}
