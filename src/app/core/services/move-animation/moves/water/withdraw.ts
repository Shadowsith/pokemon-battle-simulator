import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Withdraw, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/0c/Panzerschutz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f8/Panzerschutz_Gen5.png
 *
 * A ribbed blue-violet shell rises from the user's feet and closes over it
 * while the user ducks down (0-0.3 s, shut with a knock at 0.3 s). The shell
 * holds while bubbles rise off its top (0.35-0.85 s), then sinks away and the
 * user pops back up (0.8-1.0 s); the stat-up aura follows (1.0-1.8 s).
 */
export class Withdraw {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const w = Math.max(r.width * 0.9, 56);
    const h = Math.max(r.height * 0.85, 56);
    const total = 1000;

    const shell = Fx.box(w, h, '');
    shell.appendChild(Withdraw.shellGlyph(w, h));
    shell.style.transformOrigin = 'center bottom';
    Fx.place(shell, { x: launch.x, y: foot.y - h / 2 });
    fxEl.appendChild(shell);
    const closing = Fx.anim(shell, [
      { transform: 'scaleY(.1) scaleX(.8)', opacity: 0 },
      { transform: 'scaleY(1.05) scaleX(1)', opacity: 1, offset: 260 / total },
      { transform: 'scaleY(.95) scaleX(1.04)', opacity: 1, offset: 320 / total },
      { transform: 'scale(1)', opacity: 1, offset: 400 / total },
      { transform: 'scale(1)', opacity: 1, offset: 800 / total },
      { transform: 'scaleY(.2) scaleX(.9)', opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' }).then(() => shell.remove());

    const base = launchEl.style.transform;
    const duck = Fx.anim(launchEl, [
      { transform: base },
      { transform: `${base} translateY(${h * 0.12}px) scale(.85)`, offset: 0.28 },
      { transform: `${base} translateY(${h * 0.12}px) scale(.85)`, offset: 0.8 },
      { transform: `${base} translateY(-4px)`, offset: 0.92 },
      { transform: base }
    ], { duration: total, easing: 'ease-in-out', fill: 'none' });

    const bubbles: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      const s = 7 + Math.random() * 5;
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * w * 0.2, y: foot.y - h * 0.95 };
      bubbles.push(
        Fx.spawn(fxEl, FxGlyphs.bubbleGlyph(s), at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,-8px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.random() * 14 - 7}px,-36px) scale(.9)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: 350 + i * 100 })
      );
    }

    await Fx.wait(300);
    Fx.flash(launchEl, '#9A9AF0', 0.3);
    await Promise.all([closing, duck, ...bubbles]);
    await FxEffects.statUpAura(refs, launch);
  }

  /** A closed, ribbed blue-violet shell seen from the front: a dome with curved ribs. */
  private static shellGlyph(w: number, h: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 40 50');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('style', `position:absolute;left:0;top:0;overflow:visible;pointer-events:none;width:${w}px;height:${h}px;filter:drop-shadow(0 0 5px #8A8AF0)`);
    const ribs = [8, 14, 20, 26, 32]
      .map((x) => `<path d="M20,3 Q${x + (x - 20) * 0.9},24 ${x},48" stroke="#2A1E5A" stroke-width="1.3" fill="none"/>`)
      .join('');
    svg.innerHTML =
      '<defs><radialGradient id="withdrawShell" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#D4D0FF"/><stop offset=".45" stop-color="#8A82E0"/><stop offset="1" stop-color="#4A3A9A"/></radialGradient></defs>' +
      '<path d="M2,48 C1,18 9,2 20,2 C31,2 39,18 38,48 Q20,51 2,48 Z" fill="url(#withdrawShell)" stroke="#221650" stroke-width="1.8"/>' +
      ribs;
    return svg;
  }
}
