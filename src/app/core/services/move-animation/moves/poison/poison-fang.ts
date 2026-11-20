import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { ChompFx } from '../../chomp-fx';

/** The jaw snaps shut at `SNAP` (ms) (see `ChompFx.chomp`). */
const SNAP = 450;
/** How many poison bubbles rise off the target. */
const BUBBLES = 9;

/**
 * Poison Fang, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/fa/Giftzahn_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1d/Giftzahn_Gen5.png
 *
 * A white jaw opens over the target and snaps shut on it (0-0.45 s, the
 * jaw letting go by ~0.9 s). On the bite the target turns poison purple
 * (0.45-1.15 s) and glossy magenta poison bubbles well up and rise off it
 * (0.45-1.3 s).
 */
export class PoisonFang {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const effects: Promise<void>[] = [
      ChompFx.chomp(refs, target, { w: Math.max(r.width * 1.1, 72), tilt: 0, grinds: 0, rays: false }),
      Fx.glow(targetEl, 'sepia(1) saturate(4) hue-rotate(250deg) brightness(.9)', 700, SNAP)
    ];
    for (let i = 0; i < BUBBLES; i++) {
      const x = ((i % 5) - 2) * w * 0.18;
      const size = 10 + (i % 3) * 5;
      effects.push(Fx.spawn(fxEl, FxGlyphs.poisonBubble(size), { x: target.x + x, y: target.y + r.height * 0.15 }, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: `translate(${x * 0.2}px,${-r.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x * 0.4}px,${-r.height * 0.75}px) scale(1.1)`, opacity: 0 }
      ], { duration: 600, delay: SNAP + (i % 4) * 60 + (i >> 2) * 30, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
