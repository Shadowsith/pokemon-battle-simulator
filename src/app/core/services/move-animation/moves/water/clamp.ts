import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Clamp, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/4/4f/Schnapper_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/f/f8/Schnapper_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/0/00/Schnapper_Gen5.png
 *
 * Two ridged blue-violet shell halves open up on either side of the target
 * (0-0.3 s) and snap shut on it (0.3-0.45 s, hit at 0.45 s): the target is
 * squeezed and flashes blue, blue-white sparkles pop out of the seam. The
 * shells hold it (to 0.9 s), then part a little and fade (0.9-1.2 s).
 */
export class Clamp {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const h = Math.max(r.height * 1.05, 64);
    const w = h * 0.5;
    const open = Math.max(r.width * 0.75, 50);
    const shut = w * 0.48;
    const total = 1200;

    const halves = ([-1, 1] as const).map((side) => {
      const shell = Clamp.shellHalf(w, h);
      // The right half is the left one mirrored (only the glyph flips, never a sprite).
      if (side > 0) shell.style.transform = 'scaleX(-1)';
      const wrap = Fx.box(w, h, '');
      wrap.appendChild(shell);
      Fx.place(wrap, target);
      fxEl.appendChild(wrap);
      return Fx.anim(wrap, [
        { transform: `translateX(${side * open}px) scale(.6)`, opacity: 0 },
        { transform: `translateX(${side * open}px) scale(1)`, opacity: 1, offset: 300 / total },
        { transform: `translateX(${side * shut}px) scale(1)`, opacity: 1, offset: 450 / total },
        { transform: `translateX(${side * shut * 0.9}px) scale(1)`, opacity: 1, offset: 900 / total },
        { transform: `translateX(${side * shut * 1.8}px) scale(1)`, opacity: 0 }
      ], { duration: total, easing: 'ease-in' }).then(() => wrap.remove());
    });

    await Fx.wait(450);
    Fx.flash(targetEl, '#7AB8FF', 0.6);
    Fx.shake(targetEl, 4);
    const original = targetEl.style.transform;
    const effects: Promise<void>[] = [
      ...halves,
      Fx.anim(targetEl, [
        { transform: original },
        { transform: `${original} scaleX(.88)`, offset: 0.2 },
        { transform: `${original} scaleX(.9)`, offset: 0.75 },
        { transform: original }
      ], { duration: 600, easing: 'ease-out', fill: 'none' })
    ];
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * 8, y: target.y + (Math.random() * 2 - 1) * r.height * 0.35 };
      const side = i % 2 ? 1 : -1;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(8 + Math.random() * 6, '#9AD0FF'), at, [
          { transform: 'translate(0,0) scale(0)', opacity: 0 },
          { transform: `translate(${side * 10}px,-4px) scale(1.1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${side * 24}px,-10px) scale(.3)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: i * 40 })
      );
    }
    await Promise.all(effects);
  }

  /** The left half of an open clam seen edge-on: a ridged D shape, flat edge (the seam) on the right. */
  private static shellHalf(w: number, h: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 30 60');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('style', `position:absolute;left:0;top:0;overflow:visible;pointer-events:none;width:${w}px;height:${h}px;filter:drop-shadow(0 0 4px #6A8AF0)`);
    const ridges = [10, 20, 30, 40, 50]
      .map((y) => `<path d="M28,30 L${3 + Math.abs(y - 30) * 0.35},${y}" stroke="#3A2A7A" stroke-width="1.2" fill="none"/>`)
      .join('');
    svg.innerHTML =
      '<defs><linearGradient id="clampShell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A4AB0"/><stop offset=".6" stop-color="#8A8AE8"/><stop offset="1" stop-color="#C8C8FF"/></linearGradient></defs>' +
      '<path d="M28,2 Q2,6 2,30 Q2,54 28,58 Z" fill="url(#clampShell)" stroke="#2A1E5A" stroke-width="1.6"/>' +
      ridges;
    return svg;
  }
}
