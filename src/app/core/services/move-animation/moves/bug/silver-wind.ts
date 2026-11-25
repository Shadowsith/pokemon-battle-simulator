import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The silver gale blows for `BLOW` ms. */
const BLOW = 1200;

/**
 * Silver Wind, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/8f/Silberhauch_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/72/Silberhauch_Gen5.png
 *
 * The scene fades to a silvery grey gale: grey-white streaks of wind rush
 * across the whole field toward the target (0-1.2 s, in over 0.25 s, out
 * from 0.95 s). Glittering white scales blow along with it from the user to
 * the target (0.15-1.1 s), and the target flickers and shakes in the wind
 * (0.45-0.95 s).
 */
export class SilverWind {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const gale = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#8A8C94,#B8BAC2 50%,#7A7C84)');
    FxEffects.speedLines(gale, f.width, f.height, v.dir, ['#F0F0F4', '#A0A2AA']);
    const effects: Promise<void>[] = [
      Fx.anim(gale, [
        { opacity: 0 },
        { opacity: 0.85, offset: 0.2 },
        { opacity: 0.85, offset: 0.8 },
        { opacity: 0 }
      ], { duration: BLOW, easing: 'ease-in-out' })
    ];
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let i = 0; i < 16; i++) {
      const s = 5 + (i % 3) * 3;
      const scale = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#F4F4FF 45%,#ffffff00 72%);box-shadow:0 0 5px #ffffff');
      const lift = ((i * 7) % 5 - 2) * 18;
      effects.push(Fx.spawn(fxEl, scale, { x: launch.x, y: launch.y + ((i * 3) % 5 - 2) * 12 }, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px,${dy * 0.3 + lift}px)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.7 - lift * 0.5}px)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${dx * 1.15}px,${dy * 1.15 + lift * 0.3}px)`, opacity: 0 }
      ], { duration: 600, delay: 150 + i * 22, easing: 'linear' }));
    }
    effects.push(Fx.wait(450).then(() => Fx.blink(targetEl, 3, 80)));
    for (const at of [450, 700]) effects.push(Fx.wait(at).then(() => Fx.shake(targetEl, 4)));
    await Promise.all(effects);
    gale.remove();
  }
}
