import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** How many rocks rise. */
const ROCKS = 6;
/** When the first rock lands on the target, ms from the start; the others follow `LAND_GAP` apart. */
const FIRST_LAND = 900;
const LAND_GAP = 40;

/**
 * Ancient Power, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f5/Antik-Kraft_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/73/Antik-Kraft_Gen5.png
 *
 * Six dark olive rocks with a purple glow rise from the ground round the user
 * (0-0.5 s) and hover, bobbing (0.5-0.75 s). Then they hurl themselves at the
 * target one after another (first lands at 0.9 s, the last at 1.1 s): the
 * target shakes and flashes, and the rocks bounce off and scatter upwards,
 * fading (to ~1.45 s).
 */
export class AncientPower {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const total = FIRST_LAND + (ROCKS - 1) * LAND_GAP + 350;
    const at = (ms: number) => ms / total;

    const rocks: Promise<void>[] = [];
    for (let i = 0; i < ROCKS; i++) {
      const s = 12 + Math.random() * 8;
      const rock = Fx.box(s, s * 0.9,
        'border-radius:45% 55% 50% 40%;background:radial-gradient(circle at 35% 35%,#9A9658,#5E5C2C 55%,#33321A);' +
        'box-shadow:0 0 0 2px #7A3AA0,0 0 8px #B060E0');
      const start: Point = { x: launch.x + ((i + 0.5) / ROCKS - 0.5) * Math.max(lr.width * 1.3, 70), y: foot.y };
      const rise = -(lr.height * (0.45 + Math.random() * 0.45) + 10);
      const hit: Point = {
        x: target.x - start.x + (Math.random() * 2 - 1) * tr.width * 0.25,
        y: target.y - start.y + (Math.random() * 2 - 1) * tr.height * 0.25
      };
      const land = FIRST_LAND + i * LAND_GAP;
      const flyFrom = land - 220;
      const bounce = { x: hit.x + (Math.random() * 2 - 1) * 40, y: hit.y - 30 - Math.random() * 30 };
      rocks.push(
        Fx.spawn(fxEl, rock, start, [
          { transform: 'translate(0,0) scale(.6)', opacity: 0, easing: 'ease-out' },
          { transform: `translate(0,${rise * 0.6}px) scale(1)`, opacity: 1, offset: at(250 + i * 25) },
          { transform: `translate(0,${rise}px)`, opacity: 1, offset: at(500), easing: 'ease-in-out' },
          { transform: `translate(0,${rise - 5}px)`, opacity: 1, offset: at(620) },
          { transform: `translate(0,${rise}px)`, opacity: 1, offset: at(flyFrom), easing: 'ease-in' },
          { transform: `translate(${hit.x}px,${hit.y}px)`, opacity: 1, offset: at(land), easing: 'ease-out' },
          { transform: `translate(${bounce.x}px,${bounce.y}px) scale(.8)`, opacity: 0, offset: at(land + 330) },
          { transform: `translate(${bounce.x}px,${bounce.y}px) scale(.8)`, opacity: 0 }
        ], { duration: total, easing: 'linear' })
      );
      if (i % 2 === 0) {
        setTimeout(() => {
          Fx.flash(targetEl, '#C890F0', 0.5);
          Fx.shake(targetEl, 4);
        }, land);
      }
    }
    await Promise.all(rocks);
  }
}
