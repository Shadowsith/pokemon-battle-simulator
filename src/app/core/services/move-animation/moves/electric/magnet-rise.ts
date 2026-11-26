import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The user lifts off at `LIFT` (ms) and hovers until `LAND` (ms). */
const LIFT = 250;
const LAND = 1250;

/**
 * Magnet Rise, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/6b/Magnetflug_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/3c/Magnetflug_Gen5.png
 *
 * Yellow electromagnetic sparks flicker under the user and stream upward
 * past it (0.1-1.1 s) as it lifts off the ground (0.25-0.55 s) and hovers,
 * bobbing gently (0.55-1.25 s), then settles back to its spot (1.25-1.45 s).
 */
export class MagnetRise {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const original = launchEl.style.transform;
    const up = -Math.max(r.height * 0.18, 12);
    const at = (dy: number) => ({ transform: `${original} translateY(${dy}px)` });
    const total = LAND + 200;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { ...at(0), offset: 0 },
        { ...at(0), offset: LIFT / total },
        { ...at(up), offset: (LIFT + 300) / total },
        { ...at(up + 4), offset: (LIFT + 550) / total },
        { ...at(up), offset: (LIFT + 800) / total },
        { ...at(up), offset: LAND / total },
        { ...at(0), offset: 1 }
      ], { duration: total, easing: 'ease-in-out', fill: 'none' })
    ];
    const foot = launch.y + r.height * 0.45;
    for (let i = 0; i < 16; i++) {
      const x = launch.x + (((i * 5) % 9) / 8 - 0.5) * r.width * 0.9;
      const spark = Fx.box(4, 10 + (i % 3) * 4, 'border-radius:3px;background:linear-gradient(180deg,#FFF6A0,#FFE04A);box-shadow:0 0 5px #FFE04A');
      effects.push(Fx.spawn(fxEl, spark, { x, y: foot }, [
        { transform: 'translateY(0) scaleY(.4)', opacity: 0 },
        { transform: `translateY(${-r.height * 0.3}px) scaleY(1)`, opacity: 1, offset: 0.3 },
        { transform: `translateY(${-r.height * 1.1}px) scaleY(.6)`, opacity: 0 }
      ], { duration: 500, delay: 100 + (i * 59) % 500, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
