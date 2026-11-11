import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The washed-out grey scene of Shadow Force's strike. */
const GREY_BACKDROP = 'background:radial-gradient(circle at 50% 45%,#8A8A90,#4A4A52 60%,#26262C)';

/**
 * Shadow Force, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f4/Schemenkraft_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/14/Schemenkraft_Gen5.png
 */
export class ShadowForce {
  /**
   * Turn 1: the user flickers and fades out of sight (0-0.6 s) and stays
   * away until turn 2.
   */
  static async vanish(refs: BattleStageRefs) {
    const { launchEl: el } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    await Fx.anim(el, [
      { opacity: 1, filter: 'none' },
      { opacity: 0.3, filter: 'brightness(.5)', offset: 0.2 },
      { opacity: 0.9, filter: 'brightness(.7)', offset: 0.35 },
      { opacity: 0.2, filter: 'brightness(.4)', offset: 0.55 },
      { opacity: 0.6, filter: 'brightness(.5)', offset: 0.7 },
      { opacity: 0, filter: 'brightness(.3)' }
    ], { duration: 600, easing: 'linear', fill: 'none' });
    el.style.opacity = '0';
  }

  /**
   * Turn 2: the scene turns a washed-out grey (0-0.3 s) and the user
   * reappears out of nowhere, lunging at the target (0.3-0.6 s). A purple
   * flash strikes the target (hit at 0.6 s) and black shadow clouds billow up
   * round it (0.6-1.3 s) as the user falls back; the scene clears (1.3-1.6 s).
   */
  static async strike(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl: el, fieldEl, fxEl, targetEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const tr = Fx.rect(targetEl);

    const grey = Fx.backdrop(fieldEl, GREY_BACKDROP);
    await Fx.anim(grey, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // The user reappears mid-lunge.
    el.style.opacity = '1';
    await Fx.anim(el, [
      { transform: 'translateX(0)', opacity: 0, filter: 'brightness(.3)' },
      { transform: `translateX(${v.dir * 20}px)`, opacity: 1, filter: 'brightness(.8)', offset: 0.6 },
      { transform: `translateX(${v.dir * 40}px)`, opacity: 1, filter: 'none' }
    ], { duration: 300, easing: 'ease-in', fill: 'forwards' });

    // A purple flash on the target, then black shadow clouds.
    const size = Math.max(tr.width * 1.1, 80);
    const flash = document.createElement('div');
    flash.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#F8D8FF 0 18%,#C040F0cc 40%,#7010B000 70%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    const parts: Promise<void>[] = [
      Fx.anim(flash, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 400, easing: 'ease-out' }).then(() => flash.remove()),
      Fx.anim(el, [
        { transform: `translateX(${v.dir * 40}px)` },
        { transform: 'translateX(0)' }
      ], { duration: 350, delay: 100, easing: 'ease-out', fill: 'forwards' })
    ];
    Fx.flash(targetEl, '#C040F0', 0.6);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    for (let i = 0; i < 3; i++) {
      const at: Point = { x: target.x + (i - 1) * tr.width * 0.35, y: target.y + (i === 1 ? -tr.height * 0.25 : tr.height * 0.1) };
      setTimeout(() => parts.push(FxEffects.smokePuff(fxEl, at, size * 0.8, ['#2A2430', '#0A080C'])), 80 + i * 120);
    }
    await Fx.wait(400);
    await Promise.all(parts);
    el.getAnimations?.().forEach((a) => a.cancel());

    await Fx.anim(grey, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    grey.remove();
  }
}
