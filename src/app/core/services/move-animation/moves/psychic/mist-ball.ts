import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The mist ball bursts on the target at `HIT` (ms). */
const HIT = 750;

/**
 * Mist Ball, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/e7/Nebelball_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8d/Nebelball_Gen5.png
 *
 * The scene turns into a blue sky with soft white cloud bands drifting past
 * (0-0.3 s). A see-through, glassy ball of mist floats over to the target
 * (0.3-0.75 s) and bursts on it (0.75 s): a thick white mist billows over
 * the target, which fades to a ghostly see-through look (0.75-1.6 s). The
 * mist clears and the sky fades back to the scene (1.6-1.9 s).
 */
export class MistBall {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const field = Fx.rect(fieldEl);
    const tr = Fx.rect(targetEl);
    const s = Math.max(Fx.rect(launchEl).width, 50) * 0.7;
    const sky = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#3A8AE0,#6AB8F4 55%,#9AD4FA)');
    for (let i = 0; i < 5; i++) {
      const band = Fx.box(field.width * 1.6, 18 + (i % 2) * 10, `left:${-field.width * 0.3}px;top:${field.height * (0.12 + i * 0.18)}px;border-radius:50%;background:radial-gradient(ellipse,#FFFFFFcc,#FFFFFF00 70%);filter:blur(2px)`);
      sky.appendChild(band);
      Fx.anim(band, [{ transform: 'translateX(0)' }, { transform: `translateX(${(i % 2 ? -1 : 1) * field.width * 0.25}px)` }], { duration: 1900, easing: 'linear' });
    }
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const ball = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFFFFFee,#E8F6FFaa 35%,#B8E0F888 65%,#88C8F0aa);box-shadow:inset 0 0 8px #FFFFFF,0 0 8px #E8F8FF');
    const flight = HIT - 300;
    await Fx.spawn(fxEl, ball, launch, [
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${dx * 0.2}px,${dy * 0.2 - 12}px) scale(.8)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx * 0.6}px,${dy * 0.6 - 18}px) scale(1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(${dx}px,${dy}px) scale(1.15)`, opacity: 1 }
    ], { duration: flight, easing: 'ease-in-out' });

    Fx.shake(targetEl, 3);
    await Promise.all([
      FxEffects.smokeCloud(fxEl, target, tr.width * 1.4, tr.height * 1.1, ['#FFFFFF', '#E0F0FA'], 14, 600, 250),
      Fx.anim(targetEl, [
        { opacity: 1 },
        { opacity: 0.35, offset: 0.3 },
        { opacity: 0.35, offset: 0.8 },
        { opacity: 1 }
      ], { duration: 850, easing: 'ease-in-out', fill: 'none' })
    ]);
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sky.remove();
  }
}
