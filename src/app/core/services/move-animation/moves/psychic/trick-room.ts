import { BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** Glowing cyan grid lines, every 36 px. */
const GRID =
  'background-image:repeating-linear-gradient(0deg,#7FE8FF 0 2px,#7FE8FF00 2px 36px),repeating-linear-gradient(90deg,#7FE8FF 0 2px,#7FE8FF00 2px 36px);' +
  'filter:drop-shadow(0 0 3px #3FC8FF)';

/**
 * Trick Room, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/24/Bizarroraum_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/ae/Bizarroraum_Gen5.png
 *
 * A white-cyan flash fills the screen (0-0.3 s) and the scene turns into a
 * dark room of glowing cyan grid lines, a floor in perspective and a back wall
 * (0.15-0.45 s). The grid drifts and pulses (0.45-1.25 s), flickers
 * out (1.25-1.8 s).
 */
export class TrickRoom {
  static async play(refs: BattleStageRefs) {
    const { fieldEl, screenFxEl } = refs;
    Fx.screenWash(screenFxEl, '#E8FFFFEE', 120, 200, '50%');
    await Fx.wait(150);

    const room = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#04050C,#0C1428 55%,#162648)');
    const wall = document.createElement('div');
    wall.style.cssText =
      `position:absolute;left:0;right:0;top:0;height:46%;${GRID};opacity:.55;` +
      '-webkit-mask-image:linear-gradient(0deg,#000,#0000);mask-image:linear-gradient(0deg,#000,#0000)';
    const floor = document.createElement('div');
    floor.style.cssText = `position:absolute;left:-60%;width:220%;top:46%;height:120%;${GRID};transform-origin:50% 0;transform:perspective(260px) rotateX(62deg)`;
    room.append(wall, floor);
    await Fx.anim(room, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The grid drifts toward the viewer while pulsing, then flickers out.
    await Promise.all([
      Fx.anim(floor, [{ backgroundPosition: '0 0' }, { backgroundPosition: '0 72px' }], { duration: 800, easing: 'linear' }),
      Fx.anim(room, [
        { opacity: 1 },
        { opacity: 0.7, offset: 0.25 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0.7, offset: 0.75 },
        { opacity: 1 }
      ], { duration: 800, easing: 'ease-in-out' })
    ]);
    await Fx.anim(room, [
      { opacity: 1 },
      { opacity: 0.35, offset: 0.2 },
      { opacity: 1, offset: 0.4 },
      { opacity: 0.25, offset: 0.6 },
      { opacity: 0.9, offset: 0.8 },
      { opacity: 0 }
    ], { duration: 550, easing: 'linear' });
    room.remove();
  }
}
