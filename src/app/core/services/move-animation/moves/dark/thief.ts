import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The scuffle hits at `HIT`; the stolen item flies off at `GRAB` and reaches the user at `HOME` (ms). */
const HIT = 150;
const GRAB = 600;
const HOME = 1100;

/**
 * Thief, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/4e/Raub_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/de/Raub_Gen5.png
 *
 * A grey dust cloud of a scuffle billows over the target, which shakes (hit
 * at 0.15 s, dust to ~0.6 s). Then an item sack pops up off the target and
 * flies over to the user in an arc (0.6-1.1 s), fading on arrival.
 */
export class Thief {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const effects: Promise<void>[] = [
      FxEffects.smokeCloud(fxEl, target, r.width * 0.8, r.height * 0.6, ['#A8A8B0', '#7A7A84'], 8, 400, 150)
    ];
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#ffffff', 0.5);
    for (let t = 0; t < 3; t++) setTimeout(() => Fx.shake(targetEl, 4), t * 130);
    await Fx.wait(GRAB - HIT);

    const from: Point = { x: target.x, y: target.y - r.height * 0.35 };
    const dx = launch.x - from.x;
    const dy = launch.y - from.y;
    const arc = -Math.max(Math.abs(dx) * 0.3, 50);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.itemBag(Math.max(r.width * 0.3, 20)), from, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: 'translate(0,-16px) scale(1)', opacity: 1, offset: 0.15 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 1, offset: 0.92 },
        { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0 }
      ], { duration: HOME - GRAB + 40, easing: 'linear' })
    );
    await Promise.all(effects);
  }
}
