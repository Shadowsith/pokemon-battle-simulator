import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Dark-type moves. */
export class DarkMoveAnimations {
  /** Hand-made Dark move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bite: (refs, _launch, target) => DarkMoveAnimations.playBite(refs, target),
    darkpulse: (refs, launch, target) => DarkMoveAnimations.playDarkPulse(refs, launch, target)
  };

  /**
   * Bite: a white jaw with sharp teeth opens above and below the target and
   * snaps shut on it, stopping just before the teeth touch.
   */
  private static async playBite(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 1.1, 72);
    const h = w * 0.46;
    // Tooth tips sit at 45/46 of the glyph height; stop them a few px apart so the halves never touch.
    const gap = 3;
    const shut = h * (45 / 46 - 0.5) + gap;
    const open = shut + Math.max(r.height * 0.22, 16);

    const upper = FxGlyphs.jawGlyph(w, h, false);
    const lower = FxGlyphs.jawGlyph(w, h, true);
    Fx.place(upper, target);
    Fx.place(lower, target);
    fxEl.append(upper, lower);

    const move = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      Fx.anim(el, [
        { transform: `translateY(${sign * (open + 8)}px) ${flip}`, opacity: 0, offset: 0 },
        { transform: `translateY(${sign * open}px) ${flip}`, opacity: 1, offset: 0.43 },
        { transform: `translateY(${sign * (open + 4)}px) ${flip}`, opacity: 1, offset: 0.79 },
        // Must end at offset 1: otherwise the browser adds a final frame at the untransformed spot.
        { transform: `translateY(${sign * shut}px) ${flip}`, opacity: 1, offset: 1 }
      ], { duration: 450, easing: 'ease-in' });
    await Promise.all([move(upper, -1, ''), move(lower, 1, 'scaleY(-1)')]);

    // Snap: flash, shake and a burst of white sparks where the teeth meet.
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#FFF6C8');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 8;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * w * 0.55}px,${Math.sin(ang) * h * 0.6}px) scale(1)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => star.remove());
    }
    await Fx.wait(220);
    const release = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      Fx.anim(el, [
        { transform: `translateY(${sign * shut}px) ${flip}`, opacity: 1 },
        { transform: `translateY(${sign * (shut + 10)}px) ${flip}`, opacity: 0 }
      ], { duration: 220, easing: 'ease-out' }).then(() => el.remove());
    await Promise.all([release(upper, -1, ''), release(lower, 1, 'scaleY(-1)')]);
  }

  /**
   * Dark Pulse: the backdrop turns grey, dark purple rings ripple out over
   * the ground from the caster's feet while dark sparks fly out around it;
   * the target is hit as the waves reach it.
   */
  private static async playDarkPulse(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const purple = '#4B1A63';
    const grey = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#7C7A80,#A5A3A8 45%,#8A888E)');
    await Fx.anim(grey, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });

    // Ground layer: above the platforms, below HUD and sprites.
    const ground = document.createElement('div');
    ground.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fieldEl.insertBefore(ground, fieldEl.querySelector('.hud') ?? fieldEl.querySelector('.sprite'));

    const foot = Fx.footOf(launchEl, fieldEl);
    const reach = Math.hypot(target.x - foot.x, target.y - foot.y) * 1.25;
    const rings = 5;
    const ringDur = 1000;
    const ringGap = 170;
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('div');
      const w = reach * 2;
      ring.style.cssText = `position:absolute;width:${w}px;height:${w * 0.3}px;border-radius:50%;border:${5 - i * 0.6}px solid ${purple};box-shadow:0 0 8px ${purple},inset 0 0 8px ${purple}`;
      Fx.place(ring, foot);
      ground.appendChild(ring);
      Fx.anim(ring, [
        { transform: 'scale(.08)', opacity: 0 },
        { transform: 'scale(.25)', opacity: 0.9, offset: 0.15 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: ringDur, easing: 'ease-out', delay: i * ringGap }).then(() => ring.remove());
    }

    // Dark sparks: short smoky streaks flying out around the caster.
    const r = launchEl.getBoundingClientRect();
    const rad = Math.max(r.width * 0.4, 28);
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 10 + Math.random() * 16;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${len}px;height:${3 + Math.random() * 3}px;border-radius:3px;pointer-events:none;background:linear-gradient(90deg,transparent,${purple},#8E3FB0);filter:blur(.6px);box-shadow:0 0 6px ${purple}`;
      const from = { x: launch.x + Math.cos(ang) * rad * 0.6, y: launch.y + Math.sin(ang) * rad * 0.6 };
      Fx.place(spark, from);
      fxEl.appendChild(spark);
      const dist = rad * (0.8 + Math.random() * 1.2);
      const deg = (ang * 180) / Math.PI;
      Fx.anim(spark, [
        { transform: `rotate(${deg}deg) translateX(0) scaleX(.3)`, opacity: 0 },
        { transform: `rotate(${deg}deg) translateX(${dist * 0.4}px) scaleX(1)`, opacity: 1, offset: 0.3 },
        { transform: `rotate(${deg}deg) translateX(${dist}px) scaleX(.6)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * (rings * ringGap + 300) }).then(() => spark.remove());
    }
    Fx.flash(launchEl, purple, 0.5);

    // The target is hit when the first wave reaches it, and again as later waves pass.
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, purple, 0.55);
        Fx.shake(targetEl, 4);
      }, ringDur * 0.45 + i * ringGap * 1.6);
    }

    await Fx.wait(ringDur + (rings - 1) * ringGap);
    ground.remove();
    await Fx.anim(grey, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    grey.remove();
  }
}
