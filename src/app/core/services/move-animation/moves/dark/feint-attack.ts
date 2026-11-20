import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the unseen blow lands, ms from the start. */
const HIT = 550;

/**
 * Feint Attack, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/87/Finte_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/bf/Finte_Gen5.png
 *
 * The scene darkens (0-0.25 s) and the user fades away (0.2-0.45 s). Out of
 * nowhere white sparkles burst on the target (hit at 0.55 s) and it shakes.
 * Then the user fades back in and the scene clears (0.8-1.15 s).
 */
export class FeintAttack {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);

    const dim = Fx.backdrop(fieldEl, `${DIM_BACKDROP};opacity:0`);
    const scene = Fx.anim(dim, [
      { opacity: 0 },
      { opacity: 0.85, offset: 0.22 },
      { opacity: 0.85, offset: 0.7 },
      { opacity: 0 }
    ], { duration: 1150, easing: 'ease-in-out' });
    const vanish = Fx.anim(launchEl, [
      { opacity: 1 },
      { opacity: 1, offset: 0.17 },
      { opacity: 0, offset: 0.39 },
      { opacity: 0, offset: 0.7 },
      { opacity: 1 }
    ], { duration: 1150, easing: 'linear', fill: 'none' });

    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
      const dist = Math.min(w, h) * (0.2 + Math.random() * 0.2);
      sparks.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 6, '#E8E0FF'), target, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * dist * 0.5}px,${Math.sin(a) * dist * 0.5}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) scale(.4)`, opacity: 0 }
        ], { duration: 380, easing: 'ease-out', delay: HIT - 30 + Math.random() * 60 })
      );
    }
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#ffffff', 0.5);
    Fx.shake(targetEl, 5);
    await Promise.all([scene, vanish, ...sparks]);
    dim.remove();
  }
}
