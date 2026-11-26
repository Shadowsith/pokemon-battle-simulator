import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The item leaves the user at `THROW` (ms) and hits at `HIT` (ms). */
const THROW = 150;
const HIT = 550;

/**
 * Fling, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/e5/Schleuder_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/22/Schleuder_Gen5.png
 *
 * A glowing white ball (the held item) flares at the user (0-0.15 s) and is
 * hurled straight at the target, trailing faint sparkles (0.15-0.55 s). It
 * bursts there into a ring of white puffs; the target flashes and shakes
 * (0.55-1.1 s).
 */
export class Fling {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const ball = () => Fx.box(18, 18, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 35%,#F0F4FFcc 55%,#D8E4FF00 72%);box-shadow:0 0 10px #ffffff');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, ball(), launch, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: 'translate(0,0) scale(1.4)', opacity: 1, offset: THROW / HIT },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 }
      ], { duration: HIT, easing: 'ease-in' })
    ];
    for (let i = 1; i <= 5; i++) {
      const u = i / 6;
      effects.push(Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#ffffff;box-shadow:0 0 4px #DDE6FF'), { x: launch.x + dx * u, y: launch.y + dy * u }, [
        { opacity: 0 }, { opacity: 0.9, offset: 0.2 }, { opacity: 0 }
      ], { duration: 300, delay: THROW + u * (HIT - THROW), easing: 'ease-out' }));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#ffffff', 0.6);
      Fx.shake(targetEl, 5);
      const reach = Math.max(r.width * 0.4, 28);
      return Promise.all(Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        return FxEffects.smokePuff(fxEl, { x: target.x + Math.cos(a) * reach, y: target.y + Math.sin(a) * reach * 0.7 }, Math.max(r.width * 0.3, 20));
      })).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
