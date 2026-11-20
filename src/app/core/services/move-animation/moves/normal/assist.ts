import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** One paw print appears every `STEP` ms; how many lead to the user and ring it. */
const STEP = 100;
const TRAIL = 8;
const RING = 4;
const TOTAL = 1500;

/**
 * Assist, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/ac/Zuschuss_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/17/Zuschuss_Gen5.png
 *
 * The scene dims (0-0.15 s) and a trail of dark paw prints walks across the
 * field towards the user, one every 0.1 s (0.1-0.8 s), then four more appear
 * round the user (0.9-1.2 s) as a teammate lends its move. The prints fade
 * and the scene clears (to 1.5 s). The called move plays after.
 */
export class Assist {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const at = (ms: number) => ms / TOTAL;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.6, offset: at(150) },
        { opacity: 0.6, offset: at(1250) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' })
    ];
    const print = (p: Point, delay: number) => effects.push(Fx.spawn(fxEl, Assist.paw(Math.max(w * 0.22, 16)), p, [
      { transform: 'scale(.4)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out', delay }));
    for (let i = 0; i < TRAIL; i++) {
      const u = i / TRAIL;
      const side = i % 2 ? 1 : -1;
      print({ x: target.x + (launch.x - target.x) * u, y: target.y + (launch.y - target.y) * u + side * 12 + 30 }, 100 + i * STEP);
    }
    for (let i = 0; i < RING; i++) {
      const a = (Math.PI * 2 * i) / RING + Math.PI / 4;
      print({ x: launch.x + Math.cos(a) * w * 0.55, y: launch.y + Math.sin(a) * r.height * 0.4 }, 900 + i * STEP);
    }
    await Promise.all(effects);
    dim.remove();
  }

  /** A dark paw print `s` px wide: a round pad under four toe beans. */
  private static paw(s: number): HTMLElement {
    const el = Fx.box(s, s, 'filter:drop-shadow(0 0 2px #ffffff88)');
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 20 20" fill="#2A2230">' +
      '<ellipse cx="10" cy="13.5" rx="5.5" ry="4.5"/><circle cx="3.5" cy="8" r="2.2"/><circle cx="7.5" cy="4.2" r="2.2"/>' +
      '<circle cx="12.5" cy="4.2" r="2.2"/><circle cx="16.5" cy="8" r="2.2"/></svg>';
    return el;
  }
}
