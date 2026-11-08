import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Fighting-type kicks and throws. */
export class FightingKickThrowMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    highjumpkick: (refs, _launch, target, v) => FightingKickThrowMoveAnimations.playHighJumpKick(refs, target, v),
    jumpkick: (refs, launch, target) => FightingKickThrowMoveAnimations.playJumpKick(refs, launch, target),
    lowkick: (refs, _launch, target) => FightingKickThrowMoveAnimations.playLowKick(refs, target),
    seismictoss: (refs, _launch, target) => FightingKickThrowMoveAnimations.playSeismicToss(refs, target),
    submission: (refs, _launch, target) => FightingKickThrowMoveAnimations.playSubmission(refs, target),
    vitalthrow: (refs, _launch, target) => FightingKickThrowMoveAnimations.playVitalThrow(refs, target)
  };

  /**
   * Submission: caster and target tumble together - both run two laps round
   * a small counter-clockwise circle - while four quick yellow hits land on
   * the target; then dust swirls up around it.
   */
  private static async playSubmission(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const roll = Promise.all([FxEffects.orbit(launchEl, 16, 2, 1200, 1), FxEffects.orbit(targetEl, 16, 2, 1200, 1)]);

    // Hits at 0.25 / 0.5 / 0.75 / 1.0 s while they roll.
    const hits: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      hits.push(
        Fx.wait(250 + i * 250).then(() => {
          const star = FxGlyphs.spikyBurst(Math.max(r.width * 0.3, 28), '#FFD83A', '#FFF3A0', '#ffffff');
          Fx.place(star, {
            x: target.x + (Math.random() * 2 - 1) * r.width * 0.25,
            y: target.y - r.height * (0.05 + Math.random() * 0.25)
          });
          fxEl.appendChild(star);
          Fx.flash(targetEl, '#FFE04A', 0.4);
          return Fx.anim(star, [
            { transform: 'scale(.3)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 1, offset: 0.4 },
            { transform: 'scale(.9)', opacity: 0 }
          ], { duration: 260, easing: 'ease-out' }).then(() => star.remove());
        })
      );
    }
    await Promise.all([roll, ...hits]);

    // Dust: grey-brown puffs swirl round the target's feet, swell and fade.
    const f = Fx.rect(fieldEl);
    const foot = { x: target.x, y: r.bottom - f.top - r.height * 0.15 };
    const rx = Math.max(r.width * 0.4, 30);
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const s = 18 + Math.random() * 16;
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#D8CBB0cc,#A8987Aaa 50%,#8A7A5C00 72%)`;
      Fx.place(puff, foot);
      fxEl.appendChild(puff);
      const a0 = (i / 10) * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        // Counter-clockwise on screen, rising a little as it spreads.
        const a = a0 - t * Math.PI * 1.2;
        const d = rx * (0.4 + t * 0.7);
        frames.push({
          transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.35 - t * r.height * 0.35}px) scale(${0.5 + t})`,
          opacity: k === 0 ? 0 : k === 6 ? 0 : 0.9
        });
      }
      puffs.push(Fx.anim(puff, frames, { duration: 700, easing: 'ease-out', delay: Math.random() * 120 }).then(() => puff.remove()));
    }
    Fx.shake(targetEl, 3);
    await Promise.all(puffs);
  }

  /**
   * High Jump Kick: the caster darts forward and back, then jagged comic-style
   * impact bursts - a big red one, a yellow-orange one over it, then a
   * smaller one - pop on the target while red specks scatter.
   */
  private static async playHighJumpKick(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;
    const r = Fx.rect(targetEl);
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
    const r = Fx.rect(targetEl);
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

    await Promise.all([...stamps, FightingKickThrowMoveAnimations.sparkleHit(fxEl, targetEl, target)]);
  }

  /**
   * Low Kick: a single black foot sweeps from left to right across the target;
   * a yellow sparkle hit bursts the moment it passes over the sprite.
   */
  private static async playLowKick(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
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
    await Promise.all([sweep, FightingKickThrowMoveAnimations.sparkleHit(fxEl, targetEl, target)]);
  }

  /**
   * Seismic Toss: the backdrop goes dark, then a deep blue sky fades in with
   * yellow-orange streaks rushing upward (the target is hurled up). The
   * streaks turn and rush downward (the fall), then the target slams down:
   * a yellow impact burst while stones fly out left and right of it.
   */
  private static async playSeismicToss(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Blue sky layer on top of the dim layer, still behind platforms and sprites.
    const sky = document.createElement('div');
    sky.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:linear-gradient(90deg,#06123A,#1B4FB0 30%,#3C86E0 50%,#1B4FB0 70%,#06123A)';
    dim.appendChild(sky);
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    await FightingKickThrowMoveAnimations.rushStreaks(sky, -1, 900);
    await FightingKickThrowMoveAnimations.rushStreaks(sky, 1, 700);

    // Impact: yellow burst on the target, the ground shakes, stones fly out sideways.
    const r = Fx.rect(targetEl);
    const burstSize = Math.max(r.width * 0.6, 50);
    const burst = FxGlyphs.spikyBurst(burstSize, '#FFB020', '#FFE04A');
    Fx.place(burst, { x: target.x, y: target.y + r.height * 0.15 });
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 520, easing: 'ease-out' }).then(() => burst.remove());
    Fx.shakeField(fieldEl, 0.7);

    const stones: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? 1 : -1;
      const stone = FxGlyphs.rockChunk(10 + Math.random() * 10);
      Fx.place(stone, { x: target.x + side * r.width * 0.2, y: target.y + r.height * 0.3 });
      fxEl.appendChild(stone);
      const dx = side * (r.width * 0.45 + Math.random() * 30);
      const peak = -(20 + Math.random() * 30);
      stones.push(
        Fx.anim(stone, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx * 0.6}px,${peak}px) rotate(${side * 120}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${peak * 0.2}px) rotate(${side * 220}deg)`, opacity: 0 }
        ], { duration: 600 + Math.random() * 150, easing: 'ease-out', delay: Math.random() * 80 }).then(() => stone.remove())
      );
    }
    await Promise.all([burstDone, FightingKickThrowMoveAnimations.sparkleHit(fxEl, targetEl, target), ...stones]);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Vital Throw: the caster runs one quick clockwise lap round a small circle
   * (sizing the target up), then the throw lands - an orange flash on the
   * target while glowing orange orbs fly away from it.
   */
  private static async playVitalThrow(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;

    // Phase 1: one clockwise lap, ending on the big thud of the sound (~0.5 s).
    await FxEffects.orbit(launchEl, 18, 1, 480, -1);

    // Phase 2: orange hit.
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 0.75, 52);
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,#FFD27A 35%,#FF9A2A 55%,#FF8A1F00 72%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    const flashDone = Fx.anim(flash, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.15)', opacity: 0.9, offset: 0.4 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 380, easing: 'ease-out' }).then(() => flash.remove());
    const burst = FxGlyphs.spikyBurst(size * 0.8, '#FF8A1F', '#FFC04A');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => burst.remove());
    Fx.flash(targetEl, '#FF9A2A', 0.8);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.5);

    // Glowing orange orbs fly away from the target in every direction.
    const orbs: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const sz = 8 + Math.random() * 8;
      const orb = document.createElement('div');
      orb.style.cssText = `width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFBE0,#FFD04A 45%,#FF9A2A00 75%);box-shadow:0 0 10px #FFB43A`;
      Fx.place(orb, target);
      fxEl.appendChild(orb);
      const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const dist = size * (0.9 + Math.random() * 0.8);
      orbs.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * dist * 0.35}px,${Math.sin(ang) * dist * 0.35}px) scale(1.1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(.8)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 60 }).then(() => orb.remove())
      );
    }
    await Promise.all([flashDone, burstDone, ...orbs]);
  }

  /** Glowing yellow-orange streaks rush across `layer` for `duration` ms: up (-1) or down (1). */
  private static rushStreaks(layer: HTMLElement, dir: 1 | -1, duration: number): Promise<void> {
    const { width, height } = Fx.rect(layer);
    const runs: Promise<void>[] = [];
    const count = 22;
    for (let i = 0; i < count; i++) {
      const len = 50 + Math.random() * 70;
      const w = 4 + Math.random() * 5;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${Math.random() * width}px;top:0;width:${w}px;height:${len}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(${dir < 0 ? 0 : 180}deg,#FF8A1F00,#FFA62B 50%,#FFF0A0);box-shadow:0 0 8px #FFB020`;
      layer.appendChild(streak);
      const from = dir < 0 ? height : -len;
      const to = dir < 0 ? -len : height;
      const travel = 280 + Math.random() * 160;
      runs.push(
        Fx.anim(streak, [
          { transform: `translateY(${from}px)` },
          { transform: `translateY(${to}px)` }
        ], { duration: travel, easing: 'linear', delay: (i / count) * (duration - travel) }).then(() => streak.remove())
      );
    }
    return Promise.all(runs).then(() => void 0);
  }

  /** A kick lands: a white flash on the target with yellow sparkles flying out (Jump Kick, Low Kick). */
  private static sparkleHit(fxEl: HTMLElement, targetEl: HTMLElement, target: Point): Promise<void> {
    const r = Fx.rect(targetEl);
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
