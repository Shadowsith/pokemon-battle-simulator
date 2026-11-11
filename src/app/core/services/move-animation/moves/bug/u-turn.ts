import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * U-turn, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/ee/Kehrtwende_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e8/Kehrtwende_Gen5.png
 *
 * The user flashes white and fades out as a glowing white orb shoots up from
 * it and arcs onto the target (0.05-0.45 s, hit at 0.45 s): white rings
 * whirl round the target and sparkles burst off it (to ~0.95 s). The orb
 * arcs back (0.6-0.95 s) and the user fades back in (0.9-1.05 s).
 */
export class UTurn {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const arc = Math.max(fieldEl.clientHeight * 0.3, 70);

    Fx.flash(launchEl, '#ffffff', 0.9);
    const parts: Promise<void>[] = [
      Fx.anim(launchEl, [{ opacity: 1 }, { opacity: 0, offset: 0.15 }, { opacity: 0, offset: 0.86 }, { opacity: 1 }], { duration: 1050, easing: 'ease-in-out', fill: 'none' })
    ];

    const size = 30;
    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 40%,#E4F2FF 55%,#ffffff00 72%);box-shadow:0 0 14px #fff`;
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const flight = (back: boolean, hump: number): Keyframe[] => {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = back ? 1 - k / 10 : k / 10;
        frames.push({ transform: `translate(${dx * t}px,${dy * t - hump * 4 * t * (1 - t)}px)` });
      }
      return frames;
    };
    await Fx.wait(50);
    await Fx.anim(orb, flight(false, arc), { duration: 400, easing: 'ease-in' });

    // Hit: white rings whirl round the target, sparkles burst.
    Fx.flash(targetEl, '#ffffff', 0.8);
    Fx.shake(targetEl, 6);
    for (let i = 0; i < 3; i++) parts.push(UTurn.whirlRing(fxEl, { x: target.x, y: target.y + tr.height * (0.25 - i * 0.2) }, Math.max(tr.width * 1.3, 70), i * 70));
    for (let i = 0; i < 6; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 6, '#DCEBFF');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const d = Math.max(tr.width, 60) * (0.45 + Math.random() * 0.25);
      parts.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.7}px) scale(1)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }).then(() => star.remove())
      );
    }

    // The orb arcs back to where the user fades in again.
    await Fx.wait(150);
    await Fx.anim(orb, flight(true, arc * 0.6), { duration: 350, easing: 'ease-out' });
    await Fx.anim(orb, [{ opacity: 1, transform: `translate(0,0) scale(1)` }, { opacity: 0, transform: `translate(0,0) scale(1.6)` }], { duration: 120, easing: 'ease-out' });
    orb.remove();
    await Promise.all(parts);
  }

  /** A white ring whirling flat round `at`, `w` px wide (drawn in a squashed wrapper so it reads as an orbit). */
  private static whirlRing(fxEl: HTMLElement, at: Point, w: number, delay: number): Promise<void> {
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${w}px;height:${w}px;pointer-events:none;transform:scaleY(.32)`;
    const ring = document.createElement('div');
    ring.style.cssText = 'width:100%;height:100%;border-radius:50%;box-sizing:border-box;border:4px solid;border-color:#fff #ffffff88 #ffffff00 #ffffff88;filter:drop-shadow(0 0 3px #fff)';
    wrap.appendChild(ring);
    Fx.place(wrap, at);
    fxEl.appendChild(wrap);
    return Fx.anim(ring, [
      { transform: 'rotate(0deg) scale(.6)', opacity: 0 },
      { transform: 'rotate(240deg) scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'rotate(720deg) scale(1.1)', opacity: 0 }
    ], { duration: 500, delay, easing: 'linear', fill: 'backwards' }).then(() => wrap.remove());
  }
}
