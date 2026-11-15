import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Wild Charge, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/f/f3/Stromsto%C3%9F_Gen5.png
 *
 * Yellow sparks crackle round the user (0-0.45 s), then a glowing yellow
 * ball swells over it (0.45-0.8 s). The user charges the target (0.8-1.06 s,
 * hit at 0.92 s): lightning crackles over the target (0.92-1.4 s) and it
 * blinks dark (1.17-1.57 s), then the user flinches from the recoil (~1.7 s).
 */
export class WildCharge {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // Sparks crackle round the user.
    const userSize = Math.max(lr.width, 60);
    const userSparks = WildCharge.sparkBox(fxEl, launch, userSize);
    const stopUser = FxEffects.crackle(userSparks, userSize);
    await Fx.wait(450);

    // A glowing yellow ball swells over the user.
    const size = userSize * 1.1;
    const ball = document.createElement('div');
    ball.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#FFFDE8 0 35%,#FFF27A 55%,#E8D82A99 68%,#E8D82A00 74%)';
    Fx.place(ball, launch);
    fxEl.appendChild(ball);
    await Fx.anim(ball, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, easing: 'ease-out' });
    stopUser();
    userSparks.remove();

    // Charge: the ball melts into the user as it darts in.
    const effects: Promise<void>[] = [
      FxEffects.dart(launchEl, v.dir),
      Fx.anim(ball, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.7)' }], { duration: 200, easing: 'ease-in' }).then(() => ball.remove())
    ];
    await Fx.wait(120);

    // Hit: lightning crackles over the target, it blinks dark.
    const hitSize = Math.max(tr.width * 1.1, 60);
    const hitSparks = WildCharge.sparkBox(fxEl, target, hitSize);
    const stopHit = FxEffects.crackle(hitSparks, hitSize, '#F4F03A');
    Fx.flash(targetEl, '#F4F03A', 0.7);
    Fx.shake(targetEl, 6);
    await Fx.wait(250);
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(0)', offset: 0.1 },
        { filter: 'brightness(0)', offset: 0.45 },
        { filter: 'none', offset: 0.55 },
        { filter: 'none' }
      ], { duration: 400, fill: 'none' })
    );
    await Fx.wait(230);
    stopHit();
    hitSparks.remove();
    await Promise.all(effects);
    FxEffects.afterImpact(refs, launch, target, v);
  }

  /** An empty square box centred on `at` for `FxEffects.crackle` to draw into. */
  private static sparkBox(fxEl: HTMLElement, at: Point, size: number): HTMLElement {
    const box = document.createElement('div');
    box.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 3px #FFE84A)`;
    Fx.place(box, at);
    fxEl.appendChild(box);
    return box;
  }
}
