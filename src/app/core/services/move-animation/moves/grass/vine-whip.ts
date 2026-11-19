import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Vine Whip, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/9/9d/Rankenhieb_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/0/01/Rankenhieb_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/c/c7/Rankenhieb_Gen5.png
 *
 * Two green vines lash across the target, one after the other and crosswise
 * (0-0.18 s and 0.15-0.33 s; hit at 0.18 s), each leaving a white slash flash.
 * Torn green vine strips then flutter up off the target and drift away while
 * the vines fade (0.3-1.1 s).
 */
export class VineWhip {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const reach = Math.max(r.width * 0.55, 40);
    const effects: Promise<unknown>[] = [
      VineWhip.lash(fxEl, target, reach, v.dir === 1 ? -1 : 1, 0),
      VineWhip.lash(fxEl, target, reach, v.dir, 150)
    ];
    await Fx.wait(180);
    Fx.flash(targetEl, '#ffffff', 0.45);
    Fx.shake(targetEl, 4);
    await Fx.wait(120);

    for (let i = 0; i < 9; i++) {
      const w = 10 + Math.random() * 8;
      const strip = Fx.box(w, w * 0.6, 'border-radius:50%;border-top:3px solid #4CC04A;filter:drop-shadow(0 0 2px #2E8A2C)');
      const x = (Math.random() * 2 - 1) * reach;
      const up = r.height * (0.5 + Math.random() * 0.5);
      const spin = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 180);
      effects.push(
        Fx.spawn(fxEl, strip, { x: target.x + x * 0.3, y: target.y - r.height * 0.1 }, [
          { transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0 },
          { transform: `translate(${x * 0.5}px,${-up * 0.6}px) rotate(${spin * 0.5}deg) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${x}px,${-up}px) rotate(${spin}deg) scale(1)`, opacity: 0.9, offset: 0.7 },
          { transform: `translate(${x * 1.2}px,${-up * 0.85}px) rotate(${spin * 1.3}deg) scale(.8)`, opacity: 0 }
        ], { duration: 750, delay: Math.random() * 100, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }

  /** One vine lash: a curved green stroke whips across `at` (`side` = which top corner it starts from), then fades; a white slash flashes along it. */
  private static lash(fxEl: HTMLElement, at: Point, reach: number, side: 1 | -1, delay: number): Promise<void> {
    const ns = 'http://www.w3.org/2000/svg';
    const size = reach * 2;
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '-1 -1 2 2');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${size}px;height:${size}px;filter:drop-shadow(0 0 2px #1E5A1E)`);
    const d = `M${side * 0.9},-0.8 Q${side * 0.2},0.3 ${-side * 0.85},0.75`;
    svg.innerHTML =
      `<path d="${d}" pathLength="1" fill="none" stroke="#2E8A2C" stroke-width=".13" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>` +
      `<path d="${d}" pathLength="1" fill="none" stroke="#7CE070" stroke-width=".05" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/>` +
      `<path d="${d}" pathLength="1" fill="none" stroke="#ffffff" stroke-width=".08" stroke-linecap="round" stroke-dasharray=".25 1" stroke-dashoffset="1" opacity=".9"/>`;
    Fx.place(svg, at);
    fxEl.appendChild(svg);
    const [outer, inner, slash] = Array.from(svg.querySelectorAll('path'));
    const opts = { duration: 180, delay, easing: 'ease-in', fill: 'forwards' as FillMode };
    Fx.anim(outer, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], opts);
    Fx.anim(inner, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], opts);
    Fx.anim(slash, [{ strokeDashoffset: 1, opacity: 0.9 }, { strokeDashoffset: -0.25, opacity: 0 }], { ...opts, duration: 260 });
    return Fx.anim(svg, [{ opacity: 1 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 700, delay, easing: 'ease-in' }).then(() => svg.remove());
  }
}
