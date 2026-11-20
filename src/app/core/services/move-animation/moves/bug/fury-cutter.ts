import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the blade crosses the target, ms from the start. */
const HIT = 400;

/**
 * Fury Cutter, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/e0/Zornklinge_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/2d/Zornklinge_Gen5.png
 *
 * The scene dims (0-0.3 s). A yellow-white blade streak slashes diagonally
 * up across the target (0.3-0.5 s, hit at 0.4 s) and a yellow spiky burst
 * flares on it; the target blinks and the scene brightens again
 * (0.5-0.85 s).
 */
export class FuryCutter {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const len = Math.hypot(w, h) * 0.95;
    // Lower near side up to the upper far side.
    const angle = v.dir === 1 ? -50 : -130;
    const rad = (angle * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);

    const dim = Fx.backdrop(fieldEl, 'background:#1A1A22;opacity:0');
    const scene = Fx.anim(dim, [
      { opacity: 0 },
      { opacity: 0.55, offset: 0.35 },
      { opacity: 0.55, offset: 0.6 },
      { opacity: 0 }
    ], { duration: 850, easing: 'ease-in-out' });

    const blade = Fx.box(len, 6, 'border-radius:3px;background:linear-gradient(90deg,#FFE04000,#FFE040 30%,#ffffff 60%,#FFF6C0);box-shadow:0 0 8px #FFD820');
    const slash = Fx.spawn(fxEl, blade, target, [
      { transform: `translate(${-ux * len * 0.7}px,${-uy * len * 0.7}px) rotate(${angle}deg) scaleX(.2)`, opacity: 0 },
      { transform: `translate(0,0) rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${ux * len * 0.7}px,${uy * len * 0.7}px) rotate(${angle}deg) scaleX(.2)`, opacity: 0 }
    ], { duration: 200, easing: 'linear', delay: HIT - 100 });

    await Fx.wait(HIT);
    const burst = Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(w * 0.5, 32), '#F8C820', '#FFEA5A', '#ffffff'), target, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
    ], { duration: 260, easing: 'ease-out' });
    await Promise.all([scene, slash, burst, Fx.blink(targetEl, 2, 70)]);
    dim.remove();
  }
}
