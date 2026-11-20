import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The recycling arrows spin round the user for `SPIN` ms. */
const SPIN = 1100;

/**
 * Recycle, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b3/Aufbereitung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0b/Aufbereitung_Gen5.png
 *
 * Two big round arrows - a white outer one and a yellow inner one - appear
 * over the user and spin round in opposite directions, chasing their own
 * tails (0-1.1 s, fading in over 0.2 s and out from 0.8 s). The user flashes
 * white as they fade, with a few white sparkles (0.85-1.25 s).
 */
export class Recycle {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 60) * 1.0;
    const outer = Recycle.arrowRing(size, '#FFFFFF', '#B8C0D0');
    const inner = Recycle.arrowRing(size * 0.6, '#FFD020', '#B88A00');
    const fade = (deg: number): Keyframe[] => [
      { transform: 'rotate(0deg) scale(.6)', opacity: 0 },
      { transform: `rotate(${deg * 0.2}deg) scale(1)`, opacity: 0.95, offset: 0.18 },
      { transform: `rotate(${deg * 0.75}deg) scale(1)`, opacity: 0.95, offset: 0.73 },
      { transform: `rotate(${deg}deg) scale(1.05)`, opacity: 0 }
    ];
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, outer, launch, fade(-540), { duration: SPIN, easing: 'linear' }),
      Fx.spawn(fxEl, inner, launch, fade(720), { duration: SPIN, easing: 'linear' }),
      Fx.wait(850).then(() => {
        Fx.flash(launchEl, '#FFFFFF', 0.6);
        const stars: Promise<void>[] = [];
        for (let i = 0; i < 5; i++) {
          const a = (Math.PI * 2 * i) / 5 - 0.6;
          stars.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(12, '#FFFFFF'), { x: launch.x + Math.cos(a) * size * 0.45, y: launch.y + Math.sin(a) * size * 0.4 }, [
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1, offset: 0.4 },
            { transform: 'scale(0)', opacity: 0 }
          ], { duration: 320, delay: i * 25, easing: 'ease-out' }));
        }
        return Promise.all(stars).then(() => void 0);
      })
    ];
    await Promise.all(effects);
  }

  /** A thick ring split into two curved arrows that chase each other round, `size` px across. */
  private static arrowRing(size: number, fill: string, edge: string): HTMLElement {
    const el = Fx.box(size, size, `filter:drop-shadow(0 0 3px ${fill}aa)`);
    // Each arrow covers ~150° of the ring and ends in a head; the second is the first turned by 180°.
    const arrow = `<path d="M50 12 A38 38 0 0 1 86 38 L94 36 L84 56 L68 40 L76 40 A28 28 0 0 0 50 22 Z" fill="${fill}" stroke="${edge}" stroke-width="2" stroke-linejoin="round"/>`;
    el.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100">${arrow}<g transform="rotate(180 50 50)">${arrow}</g></svg>`;
    return el;
  }
}
