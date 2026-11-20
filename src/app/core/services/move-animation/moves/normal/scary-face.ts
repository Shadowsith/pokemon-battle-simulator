import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The face looms until `FACE_END` (ms); then the target's Speed drops. */
const FACE_END = 1000;

/**
 * Scary Face, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/3c/Grimasse_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/bd/Grimasse_Gen5.png
 *
 * The scene darkens (0-0.2 s) and a huge ghostly face - two slanted glowing
 * purple eyes over a jagged grin - looms up over the user, growing
 * (0.15-0.6 s), holds (to 0.8 s) and fades with the dark (0.8-1.0 s). Then the
 * target's Speed drops sharply: it turns blue under stat-down bubbles
 * (1.0 s to ~1.9 s).
 */
export class ScaryFace {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 1.5, 90);
    const at = (ms: number) => ms / FACE_END;

    const dim = Fx.backdrop(fieldEl, `${DIM_BACKDROP};opacity:0`);
    const scene = Fx.anim(dim, [
      { opacity: 0 },
      { opacity: 0.9, offset: at(200) },
      { opacity: 0.9, offset: at(800) },
      { opacity: 0 }
    ], { duration: FACE_END, easing: 'linear' });
    const face = Fx.spawn(fxEl, ScaryFace.face(w), { x: launch.x, y: launch.y - r.height * 0.1 }, [
      { transform: 'scale(.4)', opacity: 0 },
      { transform: 'scale(.6)', opacity: 0, offset: at(150) },
      { transform: 'scale(1)', opacity: 0.95, offset: at(600) },
      { transform: 'scale(1.05)', opacity: 0.95, offset: at(800) },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: FACE_END, easing: 'linear' });
    await Promise.all([scene, face]);
    dim.remove();
    await FxEffects.blueStatDrop(refs, target);
  }

  /** Two slanted glowing purple eyes over a jagged grin, `w` px wide. */
  private static face(w: number): HTMLElement {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 100 70');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w * 0.7}px;filter:drop-shadow(0 0 6px #C040FF)`);
    svg.innerHTML =
      '<path d="M4,6 L44,26 Q30,34 14,26 Z" fill="#B040F0"/>' +
      '<path d="M96,6 L56,26 Q70,34 86,26 Z" fill="#B040F0"/>' +
      '<path d="M18,44 L28,52 L36,44 L44,54 L50,45 L56,54 L64,44 L72,52 L82,44 Q50,72 18,44 Z" fill="#B040F0"/>' +
      '<circle cx="30" cy="25" r="2.5" fill="#FF3A3A"/><circle cx="70" cy="25" r="2.5" fill="#FF3A3A"/>';
    return svg;
  }
}
