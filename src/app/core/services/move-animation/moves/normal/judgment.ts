import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Judgment, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/20/Urteilskraft_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1a/Urteilskraft_Gen5.png
 *
 * The scene turns pale grey-white (0-0.3 s). Small dark orbs with white
 * halos appear round the target and drift into it, gathering into a black
 * orb flecked with white (0.3-0.8 s). Grey light streaks flash outward from
 * the orb (0.8-1.25 s), then it swells into a big black burst with white
 * rays (hit at 1.25 s, to ~1.65 s); the scene comes back (to ~1.95 s).
 */
export class Judgment {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);
    const reach = Math.max(tr.width, tr.height);

    const pale = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#FAFAFA,#E4E4E4 70%,#CFCFCF)');
    await Fx.anim(pale, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Dark orbs gather into the target; the black orb grows there.
    const size = Math.max(reach * 0.4, 30);
    const core = Judgment.darkOrb(size);
    Fx.place(core, target);
    fxEl.appendChild(core);
    const gather: Promise<void>[] = [
      Fx.anim(core, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(.6)', opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, easing: 'ease-out', fill: 'forwards' })
    ];
    for (let i = 0; i < 9; i++) {
      const orb = Judgment.darkOrb(8 + Math.random() * 6);
      const ang = Math.random() * Math.PI * 2;
      const d = reach * (0.6 + Math.random() * 0.5);
      Fx.place(orb, target);
      fxEl.appendChild(orb);
      gather.push(
        Fx.anim(orb, [
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(0)`, opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: 'translate(0,0) scale(.6)', opacity: 0.8 }
        ], { duration: 420, delay: Math.random() * 80, easing: 'ease-in', fill: 'backwards' }).then(() => orb.remove())
      );
    }
    await Promise.all(gather);

    // Grey streaks flash outward while the orb throbs.
    const streaks: Promise<void>[] = [
      Fx.anim(core, [
        { transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(.95)' }, { transform: 'scale(1.2)' }
      ], { duration: 450, easing: 'ease-in-out', fill: 'forwards' })
    ];
    for (let i = 0; i < 14; i++) {
      const len = 40 + Math.random() * 70;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:${2 + Math.random() * 3}px;border-radius:3px;pointer-events:none;background:linear-gradient(90deg,#8A8A8A00,#8A8A8A,#8A8A8A00)`;
      Fx.place(streak, target);
      fxEl.appendChild(streak);
      const deg = Math.random() * 360;
      streaks.push(
        Fx.anim(streak, [
          { transform: `rotate(${deg}deg) translateX(${size * 0.6}px)`, opacity: 0 },
          { transform: `rotate(${deg}deg) translateX(${size * 0.6 + len * 0.5}px)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${deg}deg) translateX(${Math.max(W, H) * 0.5}px)`, opacity: 0 }
        ], { duration: 300, delay: Math.random() * 150, easing: 'ease-out', fill: 'backwards' }).then(() => streak.remove())
      );
    }
    await Promise.all(streaks);

    // The burst: the orb swells into a big black flare with white rays and vanishes.
    const flare = document.createElement('div');
    const fs = reach * 1.4;
    flare.style.cssText =
      `position:absolute;width:${fs}px;height:${fs}px;border-radius:50%;pointer-events:none;` +
      'background:repeating-conic-gradient(from 0deg,#ffffff00 0 10deg,#ffffffcc 10deg 12deg,#ffffff00 12deg 22deg),' +
      'radial-gradient(circle,#141414 0 30%,#3A3A3A 48%,#8A8A8A88 62%,#ffffff00 70%)';
    Fx.place(flare, target);
    fxEl.appendChild(flare);
    core.remove();
    Fx.flash(targetEl, '#ffffff', 0.9);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 0.7);
    setTimeout(() => Fx.shake(targetEl, 5), 220);
    await Fx.anim(flare, [
      { transform: 'scale(.35) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1) rotate(8deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.2) rotate(12deg)', opacity: 0 }
    ], { duration: 400, easing: 'ease-out' });
    flare.remove();

    await Fx.anim(pale, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    pale.remove();
  }

  /** A black orb `s` px wide with a soft white halo and white flecks. */
  private static darkOrb(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle at 35% 35%,#ffffff 0 6%,#ffffff00 10%),radial-gradient(circle at 65% 60%,#ffffffaa 0 5%,#ffffff00 9%),radial-gradient(circle,#101010 0 55%,#3A3A3A 75%);' +
      `box-shadow:0 0 ${s * 0.3}px ${s * 0.15}px #ffffff`;
    return el;
  }
}
