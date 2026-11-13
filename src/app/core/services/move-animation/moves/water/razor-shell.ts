import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Razor Shell, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/a/ad/Kalkklinge_Gen5.png
 *
 * A big faint shell outline looms over the target and shrinks into a small
 * sandy shell above it (0-0.5 s). The shell swoops down past the target
 * (0.5-0.7 s) and a cyan blade arc slashes diagonally across it with yellow
 * sparkles flying off (hit at 0.7 s, slash to ~1.1 s).
 */
export class RazorShell {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const above: Point = { x: target.x - v.dir * tr.width * 0.4, y: target.y - tr.height * 0.55 };

    // A faint shell outline looms and shrinks into a small shell.
    const big = Math.max(tr.width * 1.6, 110);
    const ghost = RazorShell.shellGlyph(big, 'none', '#FFFFFF55');
    Fx.place(ghost, target);
    fxEl.appendChild(ghost);
    const shell = RazorShell.shellGlyph(22, '#E8D49A', '#A8884A');
    Fx.place(shell, above);
    fxEl.appendChild(shell);
    await Promise.all([
      Fx.anim(ghost, [
        { transform: 'translate(0,0) scale(1)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.4 },
        { transform: `translate(${above.x - target.x}px,${above.y - target.y}px) scale(.15)`, opacity: 0 }
      ], { duration: 500, easing: 'ease-in' }).then(() => ghost.remove()),
      Fx.anim(shell, [{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: 500 })
    ]);

    // The shell swoops down past the target, then the blade slashes.
    const low: Point = { x: target.x + v.dir * tr.width * 0.4, y: target.y + tr.height * 0.3 };
    await Fx.anim(shell, [
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${low.x - above.x}px,${low.y - above.y}px) rotate(${v.dir * 200}deg)`, opacity: 0 }
    ], { duration: 200, easing: 'ease-in' });
    shell.remove();

    const len = Math.max(tr.width * 1.3, 90);
    const blade = document.createElement('div');
    blade.style.cssText =
      `width:${len}px;height:${len}px;border-radius:50%;pointer-events:none;` +
      'border-bottom:7px solid #8AF0F8;border-left:3px solid #C8FAFF00;filter:drop-shadow(0 0 4px #4AD8F0)';
    Fx.place(blade, target);
    fxEl.appendChild(blade);
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    const effects: Promise<void>[] = [
      Fx.anim(blade, [
        { transform: `rotate(${v.dir * -60}deg) scale(.8)`, opacity: 0, clipPath: 'inset(0 100% 0 0)' },
        { transform: `rotate(${v.dir * -30}deg) scale(1)`, opacity: 1, clipPath: 'inset(0 0 0 0)', offset: 0.5 },
        { transform: `rotate(${v.dir * -15}deg) scale(1.05)`, opacity: 0, clipPath: 'inset(0 0 0 0)' }
      ], { duration: 400, easing: 'ease-out' }).then(() => blade.remove())
    ];
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#FFE84A');
      const t = i / 7;
      const p: Point = { x: target.x + (t - 0.5) * len * 0.8 * v.dir, y: target.y + tr.height * (0.25 - t * 0.6) };
      Fx.place(star, p);
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(0)', opacity: 0 },
          { transform: 'translate(0,-4px) scale(1.2)', opacity: 1, offset: 0.35 },
          { transform: `translate(${(Math.random() * 2 - 1) * 14}px,-16px) scale(0)`, opacity: 0 }
        ], { duration: 350, delay: 60 + i * 25, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);
  }

  /** A scallop shell (ribbed fan with a hinge), `w` px wide. */
  private static shellGlyph(w: number, fill: string, stroke: string): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${w}px;height:${w}px;pointer-events:none`;
    const ribs = [-50, -25, 0, 25, 50]
      .map((a) => {
        const r = (a * Math.PI) / 180;
        return `<line x1="50" y1="85" x2="${50 + Math.sin(r) * 38}" y2="${85 - Math.cos(r) * 62}"/>`;
      })
      .join('');
    el.innerHTML =
      `<svg viewBox="0 0 100 100" width="100%" height="100%" fill="${fill}" stroke="${stroke}" stroke-width="${w > 60 ? 2 : 5}" stroke-linejoin="round">` +
      '<path d="M50 85 L12 40 Q14 18 32 14 Q50 8 68 14 Q86 18 88 40 Z"/>' +
      '<path d="M40 85 L60 85 L56 94 L44 94 Z"/>' +
      `<g fill="none">${ribs}</g></svg>`;
    return el;
  }
}
