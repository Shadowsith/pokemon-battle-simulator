import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Spacial Rend, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/8/88/Raumschlag_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/d/d8/Raumschlag_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/3/38/Raumschlag_Gen5.png
 *
 * The scene darkens (0-0.25 s) and a dark rift of pink-rimmed space swirls
 * open round the user and closes again (0.25-0.85 s). The screen blacks out
 * for a moment (0.85-0.95 s), then flips to pink rays round the target,
 * where space tears open into a black hole with a pink rim that swells and
 * snaps shut twice (hit at 1.05 s, to ~1.85 s). The scene clears (1.85-2.1 s).
 */
export class SpacialRend {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // A swirling rift opens round the user.
    const rift = SpacialRend.rift(Math.max(lr.height * 1.4, 110));
    Fx.place(rift, launch);
    fxEl.appendChild(rift);
    await Fx.anim(rift, [
      { transform: 'scale(.2) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(-200deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.05) rotate(-420deg)', opacity: 0.9, offset: 0.7 },
      { transform: 'scale(.3) rotate(-600deg)', opacity: 0 }
    ], { duration: 600, easing: 'linear' });
    rift.remove();

    // Blackout, then the scene flips to pink rays round the target.
    const black = Fx.backdrop(fieldEl, 'background:#000');
    dim.after(black);
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 60, fill: 'forwards' });
    dim.remove();
    await Fx.wait(40);
    const rays = await FxEffects.burstBackdrop(fieldEl, target, 'magenta');
    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 100 });
    black.remove();

    // Space tears open on the target: a black hole with a pink rim, twice.
    const size = Math.max(tr.width * 1.3, 100);
    const parts: Promise<void>[] = [];
    for (let i = 0; i < 2; i++) {
      const hole = SpacialRend.hole(size);
      Fx.place(hole, target);
      fxEl.appendChild(hole);
      parts.push(
        Fx.anim(hole, [
          { transform: 'scale(.1) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(90deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(160deg)', opacity: 0.9, offset: 0.7 },
          { transform: 'scale(.1) rotate(240deg)', opacity: 0 }
        ], { duration: 400, delay: i * 320, easing: 'ease-in-out', fill: 'backwards' }).then(() => hole.remove())
      );
      setTimeout(() => {
        Fx.flash(targetEl, '#FF6AB0', 0.6);
        Fx.shake(targetEl, i ? 5 : 7);
        if (!i) Fx.shakeField(fieldEl, 0.6);
      }, i * 320 + 100);
    }
    await Promise.all(parts);

    await Fx.anim(rays, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    rays.remove();
  }

  /** A swirling ring of warped space `size` px wide: dark bands with pink rims round a clear centre. */
  private static rift(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:repeating-conic-gradient(from 0deg,#2A0A20cc 0 20deg,#FF8AC0aa 20deg 26deg,#40102A99 26deg 50deg,#0000 50deg 60deg);' +
      '-webkit-mask:radial-gradient(circle,#0000 0 28%,#000 34% 62%,#0000 70%);mask:radial-gradient(circle,#0000 0 28%,#000 34% 62%,#0000 70%)';
    return el;
  }

  /** A black hole `size` px wide: a black core in a dark ring with a glowing pink rim. */
  private static hole(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#000 0 30%,#1A0010 42%,#5A1A3A 52%,#FF8AC0 58%,#FFD0E8 61%,#FF5AA066 66%,#FF5AA000 74%),' +
      'repeating-conic-gradient(#0000 0 15deg,#FFFFFF22 15deg 20deg)';
    return el;
  }
}
