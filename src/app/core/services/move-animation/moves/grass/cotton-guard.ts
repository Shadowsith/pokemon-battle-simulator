import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Cotton Guard, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/9/99/Watteschild_Gen5.png
 *
 * Fluffy cotton balls drift in from all round and pile onto the user until
 * it is wrapped in white fluff (0-1.0 s); the fluff glows white and puffs
 * away (0.9-1.35 s). Then orange sparkles drift down over the user as its
 * Defense rises sharply (1.25-2.45 s).
 */
export class CottonGuard {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const size = Math.max(lr.width, lr.height, 50);
    const effects: Promise<void>[] = [];
    const stuck: { el: HTMLElement; anim: Promise<void> }[] = [];

    for (let i = 0; i < 12; i++) {
      const s = size * (0.35 + Math.random() * 0.2);
      const ball = CottonGuard.cottonBall(s);
      const end: Point = {
        x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.35,
        y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.35
      };
      Fx.place(ball, end);
      fxEl.appendChild(ball);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (1 + Math.random() * 0.5);
      const fx = Math.cos(ang) * d;
      const fy = Math.sin(ang) * d * 0.7;
      const anim = Fx.anim(ball, [
        { transform: `translate(${fx}px,${fy}px) scale(.5)`, opacity: 0 },
        { transform: `translate(${fx * 0.5}px,${fy * 0.5 - 8}px) scale(.8)`, opacity: 0.9, offset: 0.4 },
        { transform: 'translate(0,0) scale(1)', opacity: 1 }
      ], { duration: 550, delay: i * 40, easing: 'ease-out', fill: 'forwards' });
      stuck.push({ el: ball, anim });
    }
    await Promise.all(stuck.map((b) => b.anim));
    await Fx.wait(100);

    // The fluff glows white and puffs away.
    Fx.flash(launchEl, '#ffffff', 0.7);
    for (const { el } of stuck) {
      effects.push(
        Fx.anim(el, [
          { transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' },
          { transform: 'scale(1.1)', opacity: 1, filter: 'brightness(1.3)', offset: 0.4 },
          { transform: 'scale(1.4)', opacity: 0, filter: 'brightness(1.3)' }
        ], { duration: 400, delay: Math.random() * 80, easing: 'ease-out' }).then(() => el.remove())
      );
    }
    await Fx.wait(300);

    effects.push(FxEffects.orangeSparkles(refs, launch, launch.y - lr.height * 0.45));
    await Promise.all(effects);
  }

  /** A soft cotton ball `s` px wide: a few overlapping cream-white lobes. */
  private static cottonBall(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;pointer-events:none;filter:drop-shadow(0 1px 2px #8A887E88)`;
    for (const [x, y, r] of [
      [50, 55, 34],
      [30, 45, 24],
      [70, 42, 26],
      [48, 30, 24]
    ]) {
      const lobe = document.createElement('div');
      lobe.style.cssText = `position:absolute;left:${x - r}%;top:${y - r}%;width:${r * 2}%;height:${r * 2}%;border-radius:50%;background:radial-gradient(circle at 40% 35%,#FFFFFF,#F4F0E4 55%,#D8D2C0)`;
      el.appendChild(lobe);
    }
    return el;
  }
}
