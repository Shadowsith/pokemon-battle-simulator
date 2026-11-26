import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The orb flares at `FLARE` (ms). */
const FLARE = 450;

/**
 * Copycat, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/4b/Imitator_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/b9/Imitator_Gen5.png
 *
 * A glowing orange-pink orb of light swells in front of the user
 * (0-0.45 s) and flares. A white ring spreads out from it while the user
 * turns into a dark silhouette for a moment (0.45-0.95 s), as if taking
 * on another's shape; then the copied move follows.
 */
export class Copycat {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, 50) * 0.55;
    const at: Point = { x: launch.x, y: launch.y + r.height * 0.05 };
    const orb = Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 18%,#FFD08A 40%,#FF8A6Acc 60%,#FF6A6A00 72%)');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, orb, at, [
        { transform: 'scale(.1)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1.5)', opacity: 0 }
      ], { duration: FLARE + 150, easing: 'ease-out' })
    ];
    effects.push(Fx.wait(FLARE).then(() => Promise.all([
      Fx.spawn(fxEl, Fx.box(size, size, 'border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 8px #ffffff'), at, [
        { transform: 'scale(.5)', opacity: 1 },
        { transform: 'scale(2.6)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }),
      Fx.glow(launchEl, 'brightness(.15)', 500)
    ]).then(() => void 0)));
    await Promise.all(effects);
  }
}
