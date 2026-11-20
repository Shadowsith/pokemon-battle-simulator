import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** Pastel pixel colours, as in the original. */
const PIXELS = ['#F8C8D8', '#D8C8F8', '#C8E0F8', '#FFFFFF', '#F0B8C8'];
const COUNT = 16;

/**
 * Conversion 2, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/18/Umwandlung_2_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/25/Umwandlung_2_Gen5.png
 *
 * Pastel pixel squares flicker on all over the target, reading it
 * (0-0.55 s). Then they stream across to the user (0.55-0.9 s) and flicker
 * round it while the user flickers too, taking on the new type (0.9-1.4 s).
 */
export class Conversion2 {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const lr = Fx.rect(launchEl);
    const total = 1400;
    const at = (ms: number) => ms / total;

    const pixels: Promise<void>[] = [];
    for (let i = 0; i < COUNT; i++) {
      const s = Math.max(tr.width * 0.13, 10) * (0.7 + Math.random() * 0.6);
      const c = PIXELS[i % PIXELS.length];
      const from: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.42, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.4 };
      const to: Point = { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.42, y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.4 };
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const appear = (i / COUNT) * 350;
      const leave = 550 + (i % 5) * 40;
      const arrive = leave + 260;
      pixels.push(
        Fx.spawn(fxEl, Fx.box(s, s, `background:${c};box-shadow:0 0 3px ${c}`), from, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: 'translate(0,0)', opacity: 0, offset: at(appear) },
          { transform: 'translate(0,0)', opacity: 0.95, offset: at(appear + 40) },
          { transform: 'translate(0,0)', opacity: 0.35, offset: at(appear + 140) },
          { transform: 'translate(0,0)', opacity: 0.95, offset: at(leave), easing: 'ease-in-out' },
          { transform: `translate(${dx}px,${dy}px)`, opacity: 0.95, offset: at(arrive) },
          { transform: `translate(${dx}px,${dy}px)`, opacity: 0.3, offset: at(arrive + 120) },
          { transform: `translate(${dx}px,${dy}px)`, opacity: 0.95, offset: at(arrive + 240) },
          { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }
        ], { duration: total, easing: 'linear' })
      );
    }
    const flicker = Fx.anim(launchEl, [
      { opacity: 1 },
      { opacity: 1, offset: at(900) },
      { opacity: 0.55, offset: at(1000) },
      { opacity: 1, offset: at(1100) },
      { opacity: 0.55, offset: at(1200) },
      { opacity: 1, offset: at(1300) },
      { opacity: 1 }
    ], { duration: total, easing: 'steps(1, end)', fill: 'none' });
    await Promise.all([flicker, ...pixels]);
  }
}
