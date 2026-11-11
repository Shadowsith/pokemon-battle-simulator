import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Defog, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/3d/Auflockern_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/77/Auflockern_Gen5.png
 *
 * A pale grey fog rolls over the scene (0-0.4 s) and white and pink gusts
 * of wind rush through it from the user's side; the target fades almost
 * out of sight in the wind and comes back (0.3-1.3 s). The fog clears
 * (to 1.55 s) and blue bubbles drift down over the target as its evasion
 * drops (to ~2.45 s).
 */
export class Defog {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const flow = target.x >= launch.x ? 1 : -1;

    const fog = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#B8B8C0,#D8D8DE 45%,#C4C4CC)');
    const gusts = document.createElement('div');
    gusts.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fog.appendChild(gusts);
    FxEffects.speedLines(gusts, W, H, flow, ['#ffffff', '#F4D8EC']);
    await Fx.anim(fog, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });

    await Fx.anim(targetEl, [
      { opacity: 1, filter: 'none' },
      { opacity: 0.25, filter: 'brightness(1.4) blur(1px)', offset: 0.4 },
      { opacity: 0.25, filter: 'brightness(1.4) blur(1px)', offset: 0.65 },
      { opacity: 1, filter: 'none' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });

    await Fx.anim(fog, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    fog.remove();

    // The evasion drop plays on the target, so it stands in for the caster here.
    await FxEffects.statDownBubbles({ ...refs, launchEl: targetEl }, target);
  }
}
