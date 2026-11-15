import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Wide Guard, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/b/be/Rundumschutz_Gen5.png
 *
 * See-through light bars, yellow, blue and green, rise one after another in
 * a row in front of the user's side (0-0.6 s) and merge into one wide pale
 * green wall (0.6-0.9 s) that holds and fades (to ~1.5 s).
 */
export class WideGuard {
  private static readonly BARS = ['#F4F07A', '#7AB8FF', '#9CF07A', '#F4F07A', '#7AB8FF'];

  static async play(refs: BattleStageRefs, launch: Point, dir: 1 | -1) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const wallW = Math.max(lr.width * 2.2, 160);
    const wallH = Math.max(lr.height * 0.8, 60);
    const centre: Point = { x: launch.x + dir * lr.width * 0.45, y: launch.y + lr.height * 0.15 };

    // Bars rise in a row.
    const barW = wallW / 9;
    const bars = WideGuard.BARS.map((color, i) => {
      const bar = document.createElement('div');
      bar.style.cssText =
        `width:${barW}px;height:${wallH}px;pointer-events:none;transform-origin:50% 100%;` +
        `background:linear-gradient(180deg,${color}00,${color}99 40%,${color}cc);box-shadow:0 0 6px ${color}88`;
      Fx.place(bar, { x: centre.x + (i - 2) * barW * 1.8, y: centre.y });
      fxEl.appendChild(bar);
      return Fx.anim(bar, [
        { transform: 'scaleY(0)', opacity: 0 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.4 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.8 },
        { transform: 'scaleY(1) scaleX(1.6)', opacity: 0 }
      ], { duration: 600, delay: i * 70, easing: 'ease-out', fill: 'backwards' }).then(() => bar.remove());
    });
    await Fx.wait(500);

    // They merge into one wide green wall.
    const wall = document.createElement('div');
    wall.style.cssText =
      `width:${wallW}px;height:${wallH}px;pointer-events:none;border:1.5px solid #D8FFE0aa;box-sizing:border-box;` +
      'background:linear-gradient(180deg,#B8F4C855,#8CE0A888 60%,#8CE0A8aa);box-shadow:0 0 10px #A8F0C088';
    Fx.place(wall, centre);
    fxEl.appendChild(wall);
    await Promise.all([
      ...bars,
      Fx.anim(wall, [
        { transform: 'scaleX(.4)', opacity: 0 },
        { transform: 'scaleX(1)', opacity: 1, offset: 0.3 },
        { transform: 'scaleX(1)', opacity: 0.9, offset: 0.7 },
        { transform: 'scaleX(1)', opacity: 0 }
      ], { duration: 1000, easing: 'ease-out' }).then(() => wall.remove())
    ]);
  }
}
