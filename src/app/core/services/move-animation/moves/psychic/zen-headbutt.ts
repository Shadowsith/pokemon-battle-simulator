import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Pale blue of the gathered head energy. */
const CYAN = '#7FE4FF';

/**
 * Zen Headbutt, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1d/Zen-Kopfsto%C3%9F_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/fc/Zen-Kopfsto%C3%9F_Gen5.png
 *
 * The scene dims (0-0.25 s). Cyan streaks rush in onto the user's head while
 * a pale blue orb of energy swells there (0.25-0.8 s). The user rams forward
 * with it (0.8-1.15 s, hit at 0.95 s): white stars burst on the target and
 * purple and cyan sparkles scatter round it (to ~1.75 s). The scene clears
 * (1.8-2.05 s).
 */
export class ZenHeadbutt {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' });

    // Energy gathers on the head: streaks rush in, an orb swells.
    const head: Point = { x: launch.x + v.dir * lr.width * 0.15, y: launch.y - lr.height * 0.25 };
    const size = Math.max(lr.width * 0.45, 30);
    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 25%,${CYAN}DD 50%,${CYAN}00 72%);box-shadow:0 0 12px ${CYAN}`;
    Fx.place(orb, head);
    fxEl.appendChild(orb);
    const gather: Promise<void>[] = [
      Fx.anim(orb, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(.8)', opacity: 1, offset: 0.5 },
        { transform: 'scale(.7)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 550, easing: 'ease-out' })
    ];
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = 45 + Math.random() * 35;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${head.x}px;top:${head.y - 1}px;width:12px;height:2px;pointer-events:none;transform-origin:0 50%;background:linear-gradient(90deg,#fff,${CYAN});box-shadow:0 0 3px ${CYAN}`;
      fxEl.appendChild(streak);
      const deg = (ang * 180) / Math.PI;
      gather.push(
        Fx.anim(streak, [
          { transform: `rotate(${deg}deg) translateX(${r}px)`, opacity: 0 },
          { transform: `rotate(${deg}deg) translateX(${r * 0.6}px)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${deg}deg) translateX(0)`, opacity: 0 }
        ], { duration: 260, delay: Math.random() * 290, easing: 'ease-in', fill: 'backwards' }).then(() => streak.remove())
      );
    }
    await Promise.all(gather);

    // The ram, the orb riding along on the head.
    const lungeFrames = (extra = ''): Keyframe[] => [
      { transform: `translateX(0) ${extra}` },
      { transform: `translateX(${v.dir * 60}px) ${extra}`, offset: 0.45 },
      { transform: `translateX(0) ${extra}` }
    ];
    const parts: Promise<void>[] = [Fx.anim(launchEl, lungeFrames(), { duration: 350, easing: 'ease-in', fill: 'none' })];
    Fx.anim(orb, lungeFrames('scale(1)'), { duration: 350, easing: 'ease-in' });
    await Fx.wait(155);
    orb.remove();

    // Impact: white stars burst, purple and cyan sparkles scatter.
    Fx.flash(targetEl, CYAN, 0.8);
    Fx.shake(targetEl, 7);
    const reach = Math.max(tr.width, 60);
    for (let i = 0; i < 5; i++) {
      const star = FxGlyphs.fivePointStar(12 + Math.random() * 6, CYAN);
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 5 + Math.random() * 0.5;
      const d = reach * (0.35 + Math.random() * 0.2);
      parts.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.7}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d * 1.1}px,${Math.sin(ang) * d * 0.7}px) scale(.6)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    for (let i = 0; i < 14; i++) {
      const spark = FxGlyphs.sparkStar(6 + Math.random() * 5, i % 2 ? '#B070FF' : CYAN);
      Fx.place(spark, { x: target.x + (Math.random() * 2 - 1) * reach * 0.7, y: target.y - tr.height * (0.1 + Math.random() * 0.5) });
      fxEl.appendChild(spark);
      parts.push(
        Fx.anim(spark, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(4px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: 'translateY(18px) scale(.5)', opacity: 0 }
        ], { duration: 450, delay: 80 + Math.random() * 200, easing: 'ease-out', fill: 'backwards' }).then(() => spark.remove())
      );
    }
    await Promise.all(parts);
    await Fx.wait(100);

    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }
}
