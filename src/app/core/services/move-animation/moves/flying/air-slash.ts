import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Air Slash, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/cf/Luftschnitt_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8f/Luftschnitt_Gen5.png
 *
 * A thin pale-cyan blade of air shoots from the user to the target
 * (0-0.3 s). There it breaks into a flurry of thin white cut lines that
 * flicker round the target at random angles while it shakes (0.3-0.95 s).
 */
export class AirSlash {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);

    // The blade: a long thin streak flying along the path, head first.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const len = Math.max(Math.hypot(dx, dy) * 0.35, 70);
    const blade = document.createElement('div');
    blade.style.cssText =
      `position:absolute;left:${launch.x - len}px;top:${launch.y - 2}px;width:${len}px;height:4px;transform-origin:100% 50%;border-radius:2px;pointer-events:none;` +
      'background:linear-gradient(90deg,#9CF0FF00,#9CF0FFaa 50%,#E8FDFF);filter:drop-shadow(0 0 3px #7AE0FF)';
    fxEl.appendChild(blade);
    await Fx.anim(blade, [
      { transform: `translate(0,0) rotate(${angle}deg) scaleX(.4)`, opacity: 0 },
      { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx}px,${dy}px) rotate(${angle}deg) scaleX(1)`, opacity: 1 }
    ], { duration: 300, easing: 'ease-in' });
    blade.remove();

    // The flurry of cut lines round the target.
    const spread = Math.max(tr.width * 0.75, 50);
    const cuts: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const cutLen = 14 + Math.random() * 26;
      const cut = document.createElement('div');
      cut.style.cssText = `width:${cutLen}px;height:2px;border-radius:1px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff,#C8F6FF);filter:drop-shadow(0 0 2px #9CF0FF)`;
      Fx.place(cut, {
        x: target.x + (Math.random() * 2 - 1) * spread,
        y: target.y + (Math.random() * 2 - 1) * spread * 0.7
      });
      fxEl.appendChild(cut);
      const rot = Math.random() * 180;
      const drift = (Math.random() * 2 - 1) * 10;
      cuts.push(
        Fx.anim(cut, [
          { transform: `rotate(${rot}deg) scaleX(0)`, opacity: 1 },
          { transform: `rotate(${rot}deg) scaleX(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${drift}px,${drift}px) rotate(${rot}deg) scaleX(.8)`, opacity: 0 }
        ], { duration: 260, delay: i * 25 + Math.random() * 60, easing: 'ease-out' }).then(() => cut.remove())
      );
    }
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, '#C8F6FF', 0.5);
        Fx.shake(targetEl, 4);
      }, i * 180);
    }
    await Promise.all(cuts);
  }
}
