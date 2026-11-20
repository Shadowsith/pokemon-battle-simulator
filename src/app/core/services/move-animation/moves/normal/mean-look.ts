import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** Total length, ms. */
const TOTAL = 1400;

/**
 * Mean Look, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1d/Horrorblick_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/bc/Horrorblick_Gen5.png
 *
 * The scene washes magenta (0-0.25 s). A huge black eye opens over the target
 * - its lids part to show a glowing yellow iris (0.3-0.6 s) - stares,
 * pulsing once (0.6-1.0 s), and narrows shut again while the scene clears
 * (1.0-1.4 s).
 */
export class MeanLook {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.1, 70);
    const at = (ms: number) => ms / TOTAL;

    const wash = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 65% 45%,#E060E0,#A020A8 60%,#6A0A70);opacity:0');
    const scene = Fx.anim(wash, [
      { opacity: 0 },
      { opacity: 1, offset: at(250) },
      { opacity: 1, offset: at(1050) },
      { opacity: 0 }
    ], { duration: TOTAL, easing: 'linear' });
    const eye = Fx.spawn(fxEl, MeanLook.eye(w), target, [
      { transform: 'scaleY(0)', opacity: 0 },
      { transform: 'scaleY(0.05)', opacity: 1, offset: at(300), easing: 'ease-out' },
      { transform: 'scaleY(1)', opacity: 1, offset: at(600) },
      { transform: 'scaleY(1) scale(1.08)', opacity: 1, offset: at(800) },
      { transform: 'scaleY(1) scale(1)', opacity: 1, offset: at(1000), easing: 'ease-in' },
      { transform: 'scaleY(0.05)', opacity: 1, offset: at(1300) },
      { transform: 'scaleY(0)', opacity: 0 }
    ], { duration: TOTAL, easing: 'linear' });
    setTimeout(() => Fx.shake(targetEl, 3), 600);
    await Promise.all([scene, eye]);
    wash.remove();
  }

  /** A black almond eye `w` px wide with a glowing yellow iris and a dark pupil. */
  private static eye(w: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 60 30');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * 0.5}px;filter:drop-shadow(0 0 4px #300030)`);
    svg.innerHTML =
      '<path d="M1,15 Q30,-6 59,15 Q30,36 1,15 Z" fill="#141014" stroke="#000" stroke-width="1"/>' +
      '<circle cx="30" cy="15" r="9" fill="#F8E040" stroke="#A88A10" stroke-width="1"/>' +
      '<circle cx="30" cy="15" r="5.5" fill="none" stroke="#C8A818" stroke-width="1.2"/>' +
      '<circle cx="30" cy="15" r="3" fill="#141014"/>';
    return svg;
  }
}
