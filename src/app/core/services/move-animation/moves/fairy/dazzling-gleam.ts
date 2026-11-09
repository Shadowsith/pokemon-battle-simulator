import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** A rainbow ring of prismatic rays, as a conic gradient masked to a soft ring. */
const PRISM =
  'background:repeating-conic-gradient(from 0deg,#FF8AA855 0 6deg,#FFE08A55 6deg 12deg,#8AFFB055 12deg 18deg,#8AC8FF55 18deg 24deg,#C8A0FF55 24deg 30deg);' +
  '-webkit-mask-image:radial-gradient(circle,transparent 18%,#000 30%,#000 52%,transparent 70%);mask-image:radial-gradient(circle,transparent 18%,#000 30%,#000 52%,transparent 70%)';

/**
 * Dazzling Gleam, after the XY animation: the scene washes out to white
 * (0-0.3 s) and a grey shadow halo gathers round the user while a prismatic
 * rainbow ring flares at it with white sparkles (0.3-0.9 s). Dark streaks
 * shoot off toward the foe (0.8-1.25 s), then a blinding prismatic flash
 * bursts over the target (1.25-1.8 s) and the scene clears (to ~2.1 s).
 */
export class DazzlingGleam {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const wash = Fx.backdrop(fieldEl, 'background:#F8F8FC');
    await Fx.anim(wash, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // A grey shadow halo round the user and a flaring prism ring with sparkles.
    const haloSize = Math.max(lr.height * 1.8, 140);
    const halo = document.createElement('div');
    halo.style.cssText = `width:${haloSize}px;height:${haloSize * 0.8}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#0000 0 25%,#40404888 45%,#40404800 70%)`;
    Fx.place(halo, launch);
    wash.appendChild(halo);
    const prismSize = Math.max(lr.height * 1.3, 100);
    const prism = document.createElement('div');
    prism.style.cssText = `width:${prismSize}px;height:${prismSize}px;border-radius:50%;pointer-events:none;${PRISM}`;
    Fx.place(prism, launch);
    fxEl.appendChild(prism);
    const effects: Promise<void>[] = [
      Fx.anim(halo, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1100, easing: 'linear' }).then(() => halo.remove()),
      Fx.anim(prism, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.3) rotate(60deg)', opacity: 0 }
      ], { duration: 650, easing: 'ease-out' }).then(() => prism.remove())
    ];
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, '#ffffff');
      star.style.filter = 'drop-shadow(0 0 2px #8AA0C0)';
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.6, y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.5 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(0)', opacity: 0 }], {
          duration: 400,
          delay: 100 + Math.random() * 400,
          easing: 'ease-out'
        }).then(() => star.remove())
      );
    }
    await Fx.wait(500);

    // Dark streaks shoot off toward the foe.
    for (let i = 0; i < 6; i++) {
      const len = 50 + Math.random() * 50;
      const from: Point = { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.3, y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.3 };
      const to: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.6, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.5 };
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${from.x - len}px;top:${from.y - 1.5}px;width:${len}px;height:3px;transform-origin:100% 50%;pointer-events:none;border-radius:2px;background:linear-gradient(90deg,#2A2A3000,#2A2A30)`;
      fxEl.appendChild(streak);
      effects.push(
        Fx.anim(streak, [
          { transform: `translate(0,0) rotate(${angle}deg)`, opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) rotate(${angle}deg)`, opacity: 0.6 }
        ], { duration: 380, delay: i * 30, easing: 'ease-in' }).then(() => streak.remove())
      );
    }
    await Fx.wait(450);

    // The blinding prismatic flash over the target.
    const flashSize = Math.max(tr.width * 2.6, 200);
    const flash = document.createElement('div');
    flash.style.cssText = `width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 35%,#ffffffcc 50%,#ffffff00 70%)`;
    const rays = document.createElement('div');
    rays.style.cssText = `width:${flashSize * 1.3}px;height:${flashSize * 1.3}px;border-radius:50%;pointer-events:none;${PRISM}`;
    Fx.place(rays, target);
    Fx.place(flash, target);
    fxEl.append(rays, flash);
    Fx.screenWash(screenFxEl, '#FFFFFFcc', 60, 250, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.shake(targetEl, 6);
    effects.push(
      Fx.anim(flash, [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 550, easing: 'ease-out' })
        .then(() => flash.remove()),
      Fx.anim(rays, [{ transform: 'scale(.4) rotate(0deg)', opacity: 0 }, { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.2) rotate(40deg)', opacity: 0 }], { duration: 550, easing: 'ease-out' })
        .then(() => rays.remove())
    );
    await Promise.all(effects);
    await Fx.anim(wash, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    wash.remove();
  }
}
