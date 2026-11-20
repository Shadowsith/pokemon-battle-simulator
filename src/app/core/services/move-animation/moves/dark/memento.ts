import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The shadow orb reaches the target at `REACH` (ms); then its stats drop. */
const REACH = 1000;

/**
 * Memento, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/eb/Memento-Mori_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/83/Memento-Mori_Gen5.png
 *
 * The scene darkens and the user fades to a black shadow of itself
 * (0-0.4 s). A dark purple shadow orb wells up out of it (0.3-0.55 s) and
 * drifts over to the target (0.55-1.0 s), where it sinks in: the target
 * darkens for a moment (1.0-1.25 s) while the user regains its colour. The
 * scene clears (1.25-1.45 s), then the target's Attack and Sp. Atk drop - it
 * turns blue under stat-down bubbles (1.45-2.35 s). The user faints
 * afterwards.
 */
export class Memento {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const s = Math.max(r.width, 50) * 0.75;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const orb = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 45% 40%,#6A3A8A,#3A1A5A 45%,#1A0A2Acc 65%,#1A0A2A00 75%);filter:blur(1px)');
    await Promise.all([
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 300, easing: 'ease-out' }),
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(0) opacity(.8)', offset: 0.3 },
        { filter: 'brightness(0) opacity(.8)', offset: 0.8 },
        { filter: 'none' }
      ], { duration: REACH + 250, easing: 'ease-in-out', fill: 'none' }),
      Fx.spawn(fxEl, orb, launch, [
        { transform: 'translate(0,0) scale(.2)', opacity: 0, offset: 0 },
        { transform: 'translate(0,0) scale(.2)', opacity: 0, offset: 0.3 },
        { transform: `translate(0,${-r.height * 0.15}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.95 },
        { transform: `translate(${dx}px,${dy}px) scale(.4)`, opacity: 0 }
      ], { duration: REACH + 50, easing: 'ease-in-out' }),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(.25) sepia(1) hue-rotate(220deg)', offset: 0.4 },
        { filter: 'none' }
      ], { duration: 250, delay: REACH, fill: 'none' })
    ]);
    await Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
    await FxEffects.blueStatDrop(refs, target);
  }
}
