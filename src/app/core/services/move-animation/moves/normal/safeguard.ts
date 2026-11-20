import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many veil rings ripple out, and how far apart (ms). */
const RINGS = 4;
const RING_GAP = 160;

/**
 * Safeguard, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/02/Bodyguard_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/52/Bodyguard_Gen5.png
 *
 * Soft cyan rings ripple out round the user one after another (0-1.0 s)
 * while white sparkles twinkle over it (0.3-0.9 s); the user turns pale and
 * see-through under the veil (0.5-1.2 s).
 */
export class Safeguard {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 50) * 1.1;

    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { opacity: 1, filter: 'none' },
        { opacity: 0.6, filter: 'brightness(1.6) saturate(.4) drop-shadow(0 0 6px #7FF0E8)', offset: 0.4 },
        { opacity: 0.6, filter: 'brightness(1.6) saturate(.4) drop-shadow(0 0 6px #7FF0E8)', offset: 0.7 },
        { opacity: 1, filter: 'none' }
      ], { duration: 700, easing: 'ease-in-out', delay: 500, fill: 'none' })
    ];
    for (let i = 0; i < RINGS; i++) {
      const ring = Fx.box(size, size * 0.9, 'border-radius:50%;border:3px solid #7FF0E8;box-shadow:0 0 10px #7FF0E8,inset 0 0 10px #7FF0E8');
      effects.push(
        Fx.spawn(fxEl, ring, launch, [
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(.7)', opacity: 0.9, offset: 0.3 },
          { transform: 'scale(1.3)', opacity: 0 }
        ], { duration: 520, easing: 'ease-out', delay: i * RING_GAP })
      );
    }
    for (let i = 0; i < 8; i++) {
      const p: Point = { x: launch.x + (Math.random() * 2 - 1) * size * 0.4, y: launch.y + (Math.random() * 2 - 1) * size * 0.4 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 6, '#ffffff'), p, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 300, easing: 'ease-in-out', delay: 300 + i * 75 })
      );
    }
    await Promise.all(effects);
  }
}
