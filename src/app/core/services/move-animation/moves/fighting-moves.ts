import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Fighting-type moves. */
export class FightingMoveAnimations {
  /** Hand-made Fighting move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    highjumpkick: (refs, _launch, target, v) => FightingMoveAnimations.playHighJumpKick(refs, target, v),
    jumpkick: (refs, launch, target) => FightingMoveAnimations.playJumpKick(refs, launch, target),
    lowkick: (refs, _launch, target) => FightingMoveAnimations.playLowKick(refs, target)
  };

  /**
   * High Jump Kick: the caster darts forward and back, then jagged comic-style
   * impact bursts - a big red one, a yellow-orange one over it, then a
   * smaller one - pop on the target while red specks scatter.
   */
  private static async playHighJumpKick(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const size = Math.max(r.width * 0.9, 64);

    await FxEffects.dart(launchEl, v.dir);

    // [x offset, y offset, size factor, outer colour, inner colour, delay]
    const bursts: [number, number, number, string, string, number][] = [
      [-0.15, -0.1, 1, '#E8281C', '#FF6A2A', 0],
      [0.18, 0.08, 0.85, '#FF9A1A', '#FFE84A', 70],
      [-0.05, 0.22, 0.55, '#E8281C', '#FFB02A', 150]
    ];
    const pops = bursts.map(([ox, oy, f, outer, inner, delay]) =>
      Fx.wait(delay).then(() => {
        const s = size * f;
        const el = FxGlyphs.spikyBurst(s, outer, inner);
        Fx.place(el, { x: target.x + ox * size, y: target.y + oy * size });
        fxEl.appendChild(el);
        const rot = Math.random() * 30 - 15;
        return Fx.anim(el, [
          { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
          { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.25 },
          { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
          { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: 480, easing: 'ease-out' }).then(() => el.remove());
      })
    );

    // Red specks scatter out, some landing on the platform.
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#FF8A70,#E0281C 60%,#A01010)`;
      Fx.place(d, target);
      fxEl.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.5 + Math.random() * 0.5);
      Fx.anim(d, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 12}px)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 16}px)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 200, easing: 'ease-out' }).then(() => d.remove());
    }
    Fx.flash(targetEl, '#FF6A2A', 0.7);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    await Promise.all(pops);
  }

  /**
   * Jump Kick: several black feet fly at the target one after another, each
   * stamping it with a jolt, then a white hit flash bursts into yellow sparkles.
   */
  private static async playJumpKick(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 0.32, 22);
    const spread = Math.max(r.width * 0.3, 18);
    // Feet come in from the caster's side, a bit short of the caster itself.
    const from = { x: target.x + (launch.x - target.x) * 0.45, y: target.y + (launch.y - target.y) * 0.45 };
    const angle = (Math.atan2(target.y - from.y, target.x - from.x) * 180) / Math.PI + 90;
    const kicks = 4;
    const gap = 140;

    const stamps: Promise<void>[] = [];
    for (let i = 0; i < kicks; i++) {
      const hit = { x: target.x + (Math.random() * 2 - 1) * spread, y: target.y + (Math.random() * 2 - 1) * spread * 0.8 };
      const foot = FxGlyphs.footGlyph(w);
      Fx.place(foot, hit);
      fxEl.appendChild(foot);
      const ox = from.x - hit.x;
      const oy = from.y - hit.y;
      stamps.push(
        Fx.anim(foot, [
          { transform: `translate(${ox}px,${oy}px) rotate(${angle}deg) scale(.7)`, opacity: 0, filter: 'blur(3px)' },
          { transform: `translate(${ox * 0.4}px,${oy * 0.4}px) rotate(${angle}deg) scale(.9)`, opacity: 0.8, filter: 'blur(2px)', offset: 0.4 },
          { transform: `translate(0,0) rotate(${angle}deg) scale(1.05)`, opacity: 1, filter: 'blur(0)', offset: 0.7 },
          { transform: `translate(0,0) rotate(${angle}deg) scale(1)`, opacity: 0, filter: 'blur(0)' }
        ], { duration: 380, easing: 'ease-in', delay: i * gap }).then(() => foot.remove())
      );
      setTimeout(() => Fx.shake(targetEl, 4), i * gap + 260);
    }
    await Fx.wait((kicks - 1) * gap + 270);

    await Promise.all([...stamps, FightingMoveAnimations.sparkleHit(fxEl, targetEl, target)]);
  }

  /**
   * Low Kick: a single black foot sweeps from left to right across the target;
   * a yellow sparkle hit bursts the moment it passes over the sprite.
   */
  private static async playLowKick(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 0.32, 22);
    const reach = Math.max(r.width * 0.9, 60);
    const y = target.y + Math.max(r.height * 0.15, 8);
    const travel = 520;

    const foot = FxGlyphs.footGlyph(w);
    Fx.place(foot, { x: target.x, y });
    fxEl.appendChild(foot);
    // Toes lead to the right; it is sharp over the sprite and blurred at the ends.
    const sweep = Fx.anim(foot, [
      { transform: `translateX(${-reach}px) rotate(90deg)`, opacity: 0, filter: 'blur(2px)' },
      { transform: `translateX(${-reach * 0.4}px) rotate(90deg)`, opacity: 1, filter: 'blur(1px)', offset: 0.3 },
      { transform: 'translateX(0) rotate(90deg)', opacity: 1, filter: 'blur(0)', offset: 0.5 },
      { transform: `translateX(${reach * 0.4}px) rotate(90deg)`, opacity: 1, filter: 'blur(1px)', offset: 0.7 },
      { transform: `translateX(${reach}px) rotate(90deg)`, opacity: 0, filter: 'blur(2px)' }
    ], { duration: travel, easing: 'linear' }).then(() => foot.remove());

    await Fx.wait(travel * 0.45);
    await Promise.all([sweep, FightingMoveAnimations.sparkleHit(fxEl, targetEl, target)]);
  }

  /** A kick lands: a white flash on the target with yellow sparkles flying out (Jump Kick, Low Kick). */
  private static sparkleHit(fxEl: HTMLElement, targetEl: HTMLElement, target: Point): Promise<void> {
    const r = targetEl.getBoundingClientRect();
    const flashSize = Math.max(r.width * 0.7, 48);
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,#FFF3A0 40%,#FFE04A00 72%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    const flashDone = Fx.anim(flash, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 320, easing: 'ease-out' }).then(() => flash.remove());
    Fx.flash(targetEl, '#FFE04A', 0.7);
    Fx.shake(targetEl, 6);
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#FFD83A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const dist = flashSize * (0.4 + Math.random() * 0.5);
      sparkles.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3) rotate(0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * dist * 1.1}px,${Math.sin(ang) * dist * 1.1}px) scale(.6) rotate(130deg)`, opacity: 0 }
        ], { duration: 520 + Math.random() * 160, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    return Promise.all([flashDone, ...sparkles]).then(() => void 0);
  }
}
