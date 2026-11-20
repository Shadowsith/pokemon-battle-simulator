import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** How many leafy flecks shimmer over the user. */
const FLECKS = 8;
const TOTAL = 1300;

/**
 * Camouflage, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/70/Tarnung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/dd/Tarnung_Gen5.png
 *
 * The user fades out and takes on the colours of the ground, nearly
 * invisible while green-brown flecks shimmer over it (0-0.5 s, hidden to
 * 0.9 s), then it fades back in with its new type (0.9-1.3 s).
 */
export class Camouflage {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const hidden = 'sepia(1) saturate(1.6) hue-rotate(40deg) brightness(.9)';
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { opacity: 1, filter: 'none' },
        { opacity: 0.2, filter: hidden, offset: 500 / TOTAL },
        { opacity: 0.2, filter: hidden, offset: 900 / TOTAL },
        { opacity: 1, filter: 'none' }
      ], { duration: TOTAL, easing: 'linear', fill: 'none' })
    ];
    for (let i = 0; i < FLECKS; i++) {
      const p: Point = { x: launch.x + ((i * 5) % FLECKS / FLECKS - 0.5) * w * 0.9, y: launch.y + ((i * 3) % FLECKS / FLECKS - 0.5) * h * 0.8 };
      const fleck = Fx.box(10, 10, `border-radius:50%;background:radial-gradient(circle,${i % 2 ? '#9AD86A' : '#C8A86A'},#0000 70%)`);
      effects.push(Fx.spawn(fxEl, fleck, p, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1.3)', opacity: 0.9, offset: 0.5 },
        { transform: 'scale(.5)', opacity: 0 }
      ], { duration: 450, easing: 'ease-in-out', delay: 50 + (i % 4) * 100 }));
    }
    await Promise.all(effects);
  }
}
