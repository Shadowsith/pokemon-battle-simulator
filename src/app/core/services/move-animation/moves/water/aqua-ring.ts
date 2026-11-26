import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The rings spin round the user from `RINGS` (ms) for `SPIN` ms. */
const RINGS = 200;
const SPIN = 1100;

/**
 * Aqua Ring, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/22/Wasserring_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/cf/Wasserring_Gen5.png
 *
 * A glowing white-blue orb of water swells over the user (0-0.3 s) while
 * three blue rings, tilted like an atom's orbits, spin round it (0.2-1.3 s)
 * and a few drops trickle down. The user glows pale blue; then orb and
 * rings fade (1.1-1.5 s).
 */
export class AquaRing {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 60) * 0.95;
    const orb = Fx.box(size * 0.7, size * 0.7, 'border-radius:50%;background:radial-gradient(circle,#ffffffee 0 25%,#AEE2FFaa 50%,#5AB8FF33 70%,#5AB8FF00 75%)');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, orb, launch, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 0.9, offset: 0.2 },
        { transform: 'scale(1.05)', opacity: 0.8, offset: 0.8 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 1500, easing: 'ease-out' }),
      Fx.glow(launchEl, 'brightness(1.3) sepia(.5) hue-rotate(170deg) saturate(2)', 1300, 200)
    ];
    for (let i = 0; i < 3; i++) {
      const tilt = i * 60;
      const ring = Fx.box(size, size * 0.4, 'border-radius:50%;border:3px solid #5AB8FF;box-shadow:0 0 8px #7AD0FF,inset 0 0 6px #7AD0FF');
      // A flattened ring turning in the picture plane reads as an orbit (only the effect turns).
      effects.push(Fx.spawn(fxEl, ring, launch, [
        { transform: `rotate(${tilt}deg) scale(.3)`, opacity: 0 },
        { transform: `rotate(${tilt + 40}deg) scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `rotate(${tilt + 150}deg) scale(1)`, opacity: 1, offset: 0.8 },
        { transform: `rotate(${tilt + 190}deg) scale(1.15)`, opacity: 0 }
      ], { duration: SPIN, delay: RINGS + i * 40, easing: 'linear' }));
    }
    for (let i = 0; i < 6; i++) {
      effects.push(Fx.spawn(fxEl, FxGlyphs.bubbleGlyph(6 + (i % 3) * 3), { x: launch.x + (i - 2.5) * size * 0.14, y: launch.y - size * 0.25 }, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: 'translateY(8px)', opacity: 1, offset: 0.3 },
        { transform: `translateY(${size * 0.5}px)`, opacity: 0 }
      ], { duration: 650, delay: 350 + (i * 113) % 500, easing: 'ease-in' }));
    }
    await Promise.all(effects);
  }
}
