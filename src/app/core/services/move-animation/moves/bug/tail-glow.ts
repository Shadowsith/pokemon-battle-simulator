import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The tail light shines from `LIGHT` (ms) for `SHINE` ms. */
const LIGHT = 200;
const SHINE = 750;

/**
 * Tail Glow, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/54/Schweifglanz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a0/Schweifglanz_Gen5.png
 *
 * The scene darkens (0-0.25 s). A bright yellow-white light swells at the
 * base of the user, pulses twice in a wide halo (0.2-0.95 s) and fades as
 * the scene clears (0.95-1.15 s). The user's Sp. Atk sharply rises: orange
 * stat-up bands scroll over it (1.15-1.95 s).
 */
export class TailGlow {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const at: Point = { x: launch.x, y: launch.y + r.height * 0.2 };
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const halo = Fx.box(w * 1.6, w * 1.6, 'border-radius:50%;background:radial-gradient(circle,#FFFFF0ee,#FFF6A0cc 18%,#FFE84A66 38%,#FFD02A00 68%);mix-blend-mode:screen');
    const core = Fx.box(w * 0.45, w * 0.45, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFFCD0 50%,#FFF06A00 75%)');
    await Promise.all([
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' }),
      Fx.spawn(fxEl, halo, at, [
        { transform: 'scale(.1)', opacity: 0 },
        { transform: 'scale(.8)', opacity: 1, offset: 0.25 },
        { transform: 'scale(.6)', opacity: 0.7, offset: 0.45 },
        { transform: 'scale(1)', opacity: 1, offset: 0.65 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: SHINE, delay: LIGHT, easing: 'ease-in-out' }),
      Fx.spawn(fxEl, core, at, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(.8)', opacity: 1, offset: 0.7 },
        { transform: 'scale(.3)', opacity: 0 }
      ], { duration: SHINE, delay: LIGHT, easing: 'ease-in-out' }),
      Fx.glow(launchEl, 'brightness(1.4) sepia(.4) saturate(2)', SHINE, LIGHT)
    ]);
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
    await FxEffects.statUpAura(refs, launch);
  }
}
