import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When each snore ring bursts out of the user, ms; the first reaches the target at `HIT`. */
const RINGS = [650, 800, 950];
const FLIGHT = 260;
const HIT = RINGS[0] + FLIGHT;

/**
 * Snore, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/dc/Schnarcher_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/87/Schnarcher_Gen5.png
 *
 * Purple "Z"s float up off the sleeping user (0-0.6 s). Then it snores: three
 * jagged pale blue sound rings burst out of it one after another and rush to
 * the target (0.65, 0.8 and 0.95 s, the first lands at 0.91 s), which shakes
 * as each one hits (to ~1.25 s).
 */
export class Snore {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const size = Math.max(lr.width, lr.height, 50) * 0.8;
    const head: Point = { x: launch.x + v.dir * lr.width * 0.2, y: launch.y - lr.height * 0.35 };

    const effects: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sleepZ(14 + i * 4, '#9A6AE0'), head, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${v.dir * 8}px,-14px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${v.dir * 18}px,-34px) scale(1.1)`, opacity: 0 }
        ], { duration: 400, easing: 'ease-out', delay: i * 100 })
      );
    }
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (const t of RINGS) {
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(size, '#A8D0FF', '#0000', '#0000'), launch, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0.95 },
          { transform: `translate(${dx * 0.35}px,${dy * 0.35}px) scale(.9)`, opacity: 0.95, offset: 0.35 },
          { transform: `translate(${dx}px,${dy}px) scale(1.3)`, opacity: 0.4 }
        ], { duration: FLIGHT, easing: 'linear', delay: t })
      );
      setTimeout(() => Fx.shake(targetEl, 4), t + FLIGHT);
    }
    setTimeout(() => Fx.flash(targetEl, '#A8D0FF', 0.4), HIT);
    await Promise.all(effects);
  }
}
