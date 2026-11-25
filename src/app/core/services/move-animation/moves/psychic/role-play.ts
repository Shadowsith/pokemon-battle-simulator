import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** White light motes stream from the target to the user from `STREAM` (ms); the user turns white at `COPY` (ms). */
const STREAM = 500;
const COPY = 950;

/**
 * Role Play, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/7b/Rollenspiel_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/43/Rollenspiel_Gen5.png
 *
 * The scene darkens (0-0.25 s). The target lights up as a white silhouette,
 * twice (0.25-0.85 s), while white light motes stream off it over to the
 * user (0.5-0.95 s). The user turns into a pale white copy for a moment as
 * it takes the ability over (0.95-1.25 s), and the scene clears
 * (1.25-1.45 s).
 */
export class RolePlay {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' });
    const white = 'brightness(0) invert(1) drop-shadow(0 0 6px #ffffff)';
    const effects: Promise<void>[] = [
      Fx.glow(targetEl, white, 280),
      Fx.glow(targetEl, white, 280, 320)
    ];
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    for (let i = 0; i < 9; i++) {
      const from: Point = { x: target.x + ((i % 3) - 1) * tr.width * 0.25, y: target.y + (((i * 5) % 3) - 1) * tr.height * 0.25 };
      const mote = Fx.box(8, 8, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#E8F0FF 50%,#C8D8FF00 75%);box-shadow:0 0 6px #ffffff');
      effects.push(Fx.spawn(fxEl, mote, from, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: `translate(${dx * 0.2}px,${dy * 0.2 - 12}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${launch.x - from.x}px,${launch.y - from.y}px) scale(.6)`, opacity: 0.4 }
      ], { duration: 400, delay: STREAM - 250 + i * 40, easing: 'ease-in' }));
    }
    effects.push(Fx.glow(launchEl, 'brightness(0) invert(1) opacity(.85) drop-shadow(0 0 6px #DDE8FF)', 300, COPY - 250));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }
}
