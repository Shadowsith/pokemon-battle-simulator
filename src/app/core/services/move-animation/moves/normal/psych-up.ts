import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** How many swirl rings close in on the user, and how far apart (ms). */
const RINGS = 4;
const RING_GAP = 150;

/**
 * Psych Up, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a6/Psycho-Plus_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/fb/Psycho-Plus_Gen5.png
 *
 * Yellow and pink swirl rings spiral in on the user one after another,
 * shrinking and spinning (0-0.95 s), while it glows pink and pulses
 * (0.2-1.1 s) - it tunes into the target's mood.
 */
export class PsychUp {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 50) * 1.3;

    const effects: Promise<void>[] = [
      Fx.glow(launchEl, 'sepia(1) saturate(3) hue-rotate(290deg) brightness(1.2) drop-shadow(0 0 6px #FF8AC8)', 900, 200)
    ];
    for (let i = 0; i < RINGS; i++) {
      const c = i % 2 ? '#FF8AC8' : '#F8E048';
      const ring = Fx.box(size, size,
        `border-radius:50%;background:repeating-radial-gradient(circle,#0000 0 6px,${c}cc 6px 9px,#0000 9px 14px);` +
        '-webkit-mask-image:conic-gradient(#000 0 75%,#0000 100%);mask-image:conic-gradient(#000 0 75%,#0000 100%)');
      effects.push(
        Fx.spawn(fxEl, ring, launch, [
          { transform: 'rotate(0deg) scale(1.2)', opacity: 0 },
          { transform: 'rotate(160deg) scale(.9)', opacity: 0.9, offset: 0.35 },
          { transform: 'rotate(360deg) scale(.2)', opacity: 0 }
        ], { duration: 500, easing: 'ease-in', delay: i * RING_GAP })
      );
    }
    await Promise.all(effects);
  }
}
