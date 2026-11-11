import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Hand-made animations for ranged Fighting-type moves (energy shots). */
export class FightingRangedMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    aurasphere: (refs, launch, target) => FightingRangedMoveAnimations.playAuraSphere(refs, launch, target)
  };

  /**
   * Aura Sphere, after the Gen 4 / Gen 5 animation:
   * - Gen 4 (DPPt): https://www.pokewiki.de/images/c/c6/Aurasph%C3%A4re_DPPt.png
   * - Gen 4 (HGSS): https://www.pokewiki.de/images/e/e0/Aurasph%C3%A4re_HGSS.png
   * - Gen 5: https://www.pokewiki.de/images/b/b5/Aurasph%C3%A4re_Gen5.png
   *
   * The scene goes dark (0-0.25 s) and turns into a glowing yellow backdrop
   * with bands of light streaming past (to 0.45 s). A blue swirl gathers
   * round a white core in front of the user (0.45-1.15 s), then the blue-white
   * sphere shoots at the target with a tail (1.15-1.45 s) and bursts there
   * in a ring of blue light. The backdrop goes dark again and clears (to ~2.35 s).
   */
  private static async playAuraSphere(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const dark = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const glow = Fx.backdrop(fieldEl, FightingRangedMoveAnimations.AURA_BANDS);
    glow.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: `${launch.x <= target.x ? 120 : -120}px 0` }], { duration: 400, iterations: Infinity });
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });

    // The swirl gathers round a growing white core in front of the user.
    const dir = target.x >= launch.x ? 1 : -1;
    const at: Point = { x: launch.x + dir * lr.width * 0.15, y: launch.y };
    const size = Math.max(Math.max(lr.width, lr.height) * 0.9, 70);
    const swirl = document.createElement('div');
    const ring = 'radial-gradient(circle,#0000 0 28%,#000 34% 64%,#0000 72%)';
    swirl.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:repeating-conic-gradient(from 0deg,#1E6AE0 0 25deg,#5AD0F0 25deg 40deg,#1E6AE000 40deg 60deg);' +
      `-webkit-mask-image:${ring};mask-image:${ring};filter:drop-shadow(0 0 4px #5AD0F0)`;
    Fx.place(swirl, at);
    fxEl.appendChild(swirl);
    const core = document.createElement('div');
    core.style.cssText = `width:${size * 0.5}px;height:${size * 0.5}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 45%,#CFF4FF 60%,#7AD8FF00 72%);box-shadow:0 0 12px #9CE8FF`;
    Fx.place(core, at);
    fxEl.appendChild(core);
    Fx.anim(swirl, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(-360deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.05) rotate(-900deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(.6) rotate(-1080deg)', opacity: 0 }
    ], { duration: 700, easing: 'linear' }).then(() => swirl.remove());
    await Fx.anim(core, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 700, easing: 'ease-in' });

    // The shot: the sphere flies to the target, a blue tail streaming behind it.
    const dx = target.x - at.x;
    const dy = target.y - at.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const tailLen = size * 1.2;
    const tail = document.createElement('div');
    tail.style.cssText =
      `position:absolute;left:${at.x - tailLen}px;top:${at.y - size * 0.18}px;width:${tailLen}px;height:${size * 0.36}px;transform-origin:100% 50%;pointer-events:none;` +
      'border-radius:50%;background:linear-gradient(90deg,#3A8AF000,#3A8AF0aa 60%,#CFF4FF);filter:blur(1px)';
    fxEl.insertBefore(tail, core);
    const flight = { duration: 300, easing: 'ease-in' };
    Fx.anim(tail, [
      { transform: `translate(0,0) rotate(${angle}deg) scaleX(.2)`, opacity: 0 },
      { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px,${dy}px) rotate(${angle}deg) scaleX(1)`, opacity: 1 }
    ], flight).then(() => tail.remove());
    await Fx.anim(core, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx}px,${dy}px) scale(.8)` }
    ], flight);
    core.remove();

    // The burst: a ring of blue light and sparkles round the target.
    Fx.flash(targetEl, '#9CE8FF', 0.9);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.6);
    const burstSize = Math.max(tr.width * 1.1, 80);
    const burst = document.createElement('div');
    burst.style.cssText = `width:${burstSize}px;height:${burstSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 20%,#9CE8FF88 40%,#3A8AF000 60%);border:3px solid #CFF4FF;box-shadow:0 0 10px #5AD0F0`;
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const effects: Promise<void>[] = [
      Fx.anim(burst, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.25)', opacity: 0 }
      ], { duration: 400, easing: 'ease-out' }).then(() => burst.remove())
    ];
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#9CE8FF');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const d = burstSize * (0.5 + Math.random() * 0.3);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);

    // Dark again, then the scene comes back.
    const back = Fx.backdrop(fieldEl, DIM_BACKDROP);
    glow.after(back);
    await Fx.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    glow.remove();
    dark.remove();
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    back.remove();
  }

  /** Glowing yellow with soft lighter bands of light (tiles horizontally, so it can scroll). */
  private static readonly AURA_BANDS =
    'background:url("data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60" viewBox="0 0 120 60">' +
        '<rect width="120" height="60" fill="#F0C020"/>' +
        '<rect y="8" width="120" height="6" fill="#F8DC5A"/>' +
        '<rect y="26" width="120" height="10" fill="#FCEA8A"/>' +
        '<rect y="46" width="120" height="4" fill="#F8DC5A"/>' +
        '<ellipse cx="30" cy="31" rx="22" ry="5" fill="#FFF6C0"/>' +
        '<ellipse cx="90" cy="11" rx="16" ry="3" fill="#FFF6C0"/>' +
        '</svg>'
    ) +
    '")';
}
