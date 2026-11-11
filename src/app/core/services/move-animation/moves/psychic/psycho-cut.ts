import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Psycho Cut, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/76/Psychoklinge_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/c7/Psychoklinge_Gen5.png
 *
 * A dark purple swirl spins up in front of the user (0-0.45 s) and a glowing
 * pink crescent blade forms out of it (0.3-0.5 s). The blade flies to the
 * target, spinning (0.5-0.8 s), and cuts it with a pink flash (hit at 0.8 s);
 * the blade's arc sweeps on through and fades (to ~1.15 s).
 */
export class PsychoCut {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const front: Point = { x: launch.x + v.dir * lr.width * 0.15, y: launch.y + lr.height * 0.1 };

    // The swirl: a spinning purple disc that swells and fades.
    const ds = Math.max(lr.width * 0.6, 48);
    const disc = document.createElement('div');
    disc.style.cssText =
      `position:absolute;width:${ds}px;height:${ds}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#2A0A3A 0 12%,#2A0A3A00 30%),repeating-conic-gradient(#6A2A8Acc 0 20deg,#B04AC0cc 20deg 40deg);' +
      '-webkit-mask-image:radial-gradient(circle,#000 55%,#0000 72%);mask-image:radial-gradient(circle,#000 55%,#0000 72%)';
    Fx.place(disc, front);
    fxEl.appendChild(disc);
    const discDone = Fx.anim(disc, [
      { transform: 'scale(.2) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(240deg)', opacity: 1, offset: 0.45 },
      { transform: 'scale(1.1) rotate(540deg)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out' }).then(() => disc.remove());

    // The blade forms over the swirl, then flies to the target spinning.
    await Fx.wait(300);
    const bs = Math.max(lr.width * 0.55, 44);
    const blade = PsychoCut.crescent(bs);
    Fx.place(blade, front);
    fxEl.appendChild(blade);
    await Fx.anim(blade, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 200, easing: 'ease-out' });
    const dx = target.x - front.x;
    const dy = target.y - front.y;
    await Fx.anim(blade, [
      { transform: 'translate(0,0) rotate(0deg) scale(1)' },
      { transform: `translate(${dx}px,${dy}px) rotate(${v.dir * 540}deg) scale(1.2)` }
    ], { duration: 300, easing: 'ease-in' });
    blade.remove();

    // Hit: the target flashes pink; the blade's arc sweeps through and fades.
    Fx.flash(targetEl, '#FF8AE0', 0.7);
    Fx.shake(targetEl, 6);
    const arc = PsychoCut.crescent(Math.max(tr.width * 0.9, 60));
    Fx.place(arc, target);
    fxEl.appendChild(arc);
    await Promise.all([
      discDone,
      Fx.anim(arc, [
        { transform: `rotate(${v.dir > 0 ? -40 : 220}deg) scale(.8)`, opacity: 1 },
        { transform: `rotate(${v.dir > 0 ? 20 : 160}deg) scale(1.1)`, opacity: 0.9, offset: 0.5 },
        { transform: `rotate(${v.dir > 0 ? 60 : 120}deg) scale(1.3)`, opacity: 0 }
      ], { duration: 350, easing: 'ease-out' }).then(() => arc.remove())
    ]);
  }

  /** A glowing pink crescent blade, `s` px across, its bright edge on the right. */
  private static crescent(s: number): HTMLElement {
    // The glow sits on a wrapper so it follows the crescent's shape.
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${s}px;height:${s}px;pointer-events:none;filter:drop-shadow(0 0 4px #FF7AD8) drop-shadow(0 0 8px #C04AC0)`;
    const shape = document.createElement('div');
    shape.style.cssText = `width:100%;height:100%;border-radius:50%;box-shadow:inset ${-s * 0.16}px 0 0 0 #FFB8F0,inset ${-s * 0.2}px 0 0 0 #E060C8`;
    wrap.appendChild(shape);
    return wrap;
  }
}
