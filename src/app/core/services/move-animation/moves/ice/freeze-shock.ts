import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Freeze Shock, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/7/73/Frostvolt_Gen5.png
 *
 * Turn 1 (charge): a small yellow spark ball flickers at the user's front
 * (0-0.5 s), then the user is wrapped in a cold white light that pulses and
 * fades (0.5-1.3 s).
 *
 * Turn 2 (attack): the scene goes black (0-0.25 s). The user turns pale ice
 * blue behind an icy white ball crackling with yellow-green sparks that
 * flares (0.25-1.0 s), then charges (1.0-1.2 s). At the hit (1.2 s) a yellow
 * ray backdrop opens on the target, which glows yellow while yellow-green
 * sparks crackle over it (to ~1.95 s); the scene clears (to ~2.2 s).
 */
export class FreezeShock {
  static async charge(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const size = Math.max(lr.width * 0.35, 30);
    const ball = document.createElement('div');
    ball.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFFFF 0 20%,#FFF68Acc 45%,#F2D83A00 72%)`;
    Fx.place(ball, { x: launch.x + dir * lr.width * 0.15, y: launch.y });
    fxEl.appendChild(ball);
    const stop = FxEffects.crackle(ball, size, '#E8F070');
    await Fx.anim(ball, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(.85)', opacity: 1, offset: 0.8 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out' });
    stop();
    ball.remove();

    // The cold white light.
    const w = Math.max(lr.width, lr.height) * 1.2;
    const light = document.createElement('div');
    light.style.cssText = `width:${w}px;height:${w}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFFFFcc,#DCE8F0aa 45%,#DCE8F000 70%)`;
    Fx.place(light, launch);
    fxEl.appendChild(light);
    await Promise.all([
      Fx.anim(light, [
        { transform: 'scale(.6)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.95)', opacity: 0.8, offset: 0.6 },
        { transform: 'scale(1.05)', opacity: 0 }
      ], { duration: 800, easing: 'ease-in-out' }).then(() => light.remove()),
      Fx.anim(launchEl, [{ filter: 'none' }, { filter: 'brightness(1.8) saturate(.2)', offset: 0.4 }, { filter: 'none' }], {
        duration: 800,
        fill: 'none'
      })
    ]);
  }

  static play(refs: BattleStageRefs, launch: Point, target: Point) {
    return FxEffects.crackleRam(refs, launch, target, {
      userFilter: 'brightness(1.4) saturate(.4) hue-rotate(-10deg)',
      ball: 'radial-gradient(circle at 40% 40%,#FFFFFF 0 18%,#C8F0FF 35%,#7ACCE8cc 55%,#7ACCE800 72%)',
      ballSpark: '#C8F04A',
      flare: '#C8F0FF',
      hitSpark: '#D8F04A',
      hitGlow: '#E8F070'
    });
  }
}
