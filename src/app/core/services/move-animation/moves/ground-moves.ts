import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Ground-type moves. */
export class GroundMoveAnimations {
  /** Hand-made Ground move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    boneclub: (refs, launch, target, v) => GroundMoveAnimations.playBoneClub(refs, launch, target, v),
    bonemerang: (refs, launch, target, v) => GroundMoveAnimations.playBonemerang(refs, launch, target, v),
    dig: (refs, _launch, target) => GroundMoveAnimations.playDigUp(refs, target),
    earthquake: (refs) => GroundMoveAnimations.playEarthquake(refs)
  };

  /**
   * Bone Club: a spinning bone is thrown high and drops onto the target from
   * above, lands with a hit, then bounces off.
   */
  private static async playBoneClub(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl } = refs;
    const bone = FxGlyphs.boneGlyph(46);
    Fx.place(bone, launch);
    fxEl.appendChild(bone);

    // Quadratic arc: up past the target, then straight down onto its head.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const apex = { x: dx * 0.85, y: Math.min(0, dy) - 130 };
    const spin = v.dir * 360 * 3;
    const steps = 14;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const x = 2 * u * t * apex.x + t * t * dx;
      const y = 2 * u * t * apex.y + t * t * (dy - 10);
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${spin * t}deg)`, opacity: t === 0 ? 0 : 1 });
    }
    // The last quarter-turn settles upright, as it falls onto the target.
    frames[steps] = { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin + 90 * v.dir}deg)`, opacity: 1 };
    await Fx.anim(bone, frames, { duration: 760, easing: 'ease-in' });

    FxEffects.meleeGlyph(fxEl, target, { ...v, meleeStyle: 'hit', color: '#ffffff' });
    const hit = FxEffects.impact(refs, target, v, 0);
    // Bounce off and fade.
    Fx.anim(bone, [
      { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin + 90 * v.dir}deg)`, opacity: 1 },
      { transform: `translate(${dx - v.dir * 30}px,${dy - 50}px) rotate(${spin + 90 * v.dir - 200 * v.dir}deg)`, opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => bone.remove());
    await hit;
    await Fx.wait(300);
  }

  /**
   * Bonemerang: like Bone Club, but the spinning bone flies out on a curve,
   * hits the target and curves back to the caster on the other side, like a
   * boomerang.
   */
  private static async playBonemerang(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const bone = FxGlyphs.boneGlyph(46);
    Fx.place(bone, launch);
    fxEl.appendChild(bone);

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular bulge: out along one side of the line, back along the other.
    const bulge = Math.min(90, len * 0.35);
    const nx = (-dy / len) * bulge;
    const ny = (dx / len) * bulge;
    const out = { x: dx * 0.5 - nx, y: dy * 0.5 - ny };
    const back = { x: dx * 0.5 + nx, y: dy * 0.5 + ny };
    const turnsPerLeg = 3;

    // Quadratic Bezier from a to b through control point c, spinning as it goes.
    const leg = (a: Point, c: Point, b: Point, rot0: number, fadeIn: boolean): Keyframe[] => {
      const frames: Keyframe[] = [];
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
        const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
        frames.push({
          transform: `translate(${x}px,${y}px) rotate(${rot0 + v.dir * 360 * turnsPerLeg * t}deg)`,
          opacity: fadeIn && t === 0 ? 0 : 1
        });
      }
      return frames;
    };
    const origin = { x: 0, y: 0 };
    const hitAt = { x: dx, y: dy };
    const midRot = v.dir * 360 * turnsPerLeg;

    await Fx.anim(bone, leg(origin, out, hitAt, 0, true), { duration: 560, easing: 'ease-in' });
    FxEffects.meleeGlyph(fxEl, target, { ...v, meleeStyle: 'hit', color: '#ffffff' });
    const hit = FxEffects.impact(refs, target, v, 0);
    await Fx.anim(bone, leg(hitAt, back, origin, midRot, false), { duration: 620, easing: 'ease-out' });
    await hit;

    // Caught: the bone disappears into the caster with a small flash.
    Fx.flash(launchEl, '#F6F3EA', 0.35);
    await Fx.anim(bone, [
      { transform: `rotate(${midRot * 2}deg) scale(1)`, opacity: 1 },
      { transform: `rotate(${midRot * 2 + v.dir * 90}deg) scale(.5)`, opacity: 0 }
    ], { duration: 160, easing: 'ease-out' });
    bone.remove();
  }

  /**
   * Earthquake: the whole field shakes fast left and right (and a little up
   * and down) while small rocks keep jumping up on both sides of the target.
   */
  private static async playEarthquake(refs: BattleStageRefs) {
    const { fieldEl, fxEl, targetEl } = refs;
    const total = 1500;

    // Field shake: quick alternating offsets, strongest in the middle.
    const beats = 30;
    const shake: Keyframe[] = [];
    for (let k = 0; k <= beats; k++) {
      const t = k / beats;
      const amp = k === 0 || k === beats ? 0 : 3 + Math.sin(t * Math.PI) * 5;
      shake.push({ transform: `translate(${k % 2 ? -amp : amp}px,${k % 3 === 0 ? amp * 0.3 : -amp * 0.25}px)` });
    }
    const quake = Fx.anim(fieldEl, shake, { duration: total, easing: 'linear', fill: 'none' });

    // Rocks pop out of the ground left and right of the target.
    const r = targetEl.getBoundingClientRect();
    const foot = Fx.footOf(targetEl, fieldEl);
    const side = Math.max(r.width * 0.5, 30);
    const rocks = 16;
    for (let i = 0; i < rocks; i++) {
      const dirX = i % 2 ? 1 : -1;
      const s = 6 + Math.random() * 7;
      const rock = document.createElement('div');
      rock.style.cssText = `position:absolute;width:${s}px;height:${s * 0.85}px;pointer-events:none;clip-path:polygon(20% 0,75% 8%,100% 45%,85% 100%,15% 95%,0 40%);background:linear-gradient(135deg,#B08A5A,#6E5232 70%,#4A3622)`;
      Fx.place(rock, { x: foot.x + dirX * (side + Math.random() * side * 0.6), y: foot.y - Math.random() * 8 });
      fxEl.appendChild(rock);
      const up = 18 + Math.random() * 26;
      const drift = dirX * (4 + Math.random() * 10);
      const spin = (Math.random() * 2 - 1) * 240;
      Fx.anim(rock, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${drift * 0.5}px,${-up}px) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${drift}px,0) rotate(${spin}deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${drift}px,0) rotate(${spin}deg)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-in-out', delay: 80 + (i / rocks) * (total - 600) }).then(() => rock.remove());
    }

    for (let i = 0; i < 4; i++) {
      setTimeout(() => Fx.flash(targetEl, '#C9A24B', 0.4), 200 + i * 320);
    }
    await quake;
  }

  /**
   * Dig, turn 1: the user wriggles down into the ground. The part below the
   * ground line is clipped away, so it sinks through the platform, while dust
   * clouds billow around it and clods of dirt are thrown up.
   */
  static async playDigDown(refs: BattleStageRefs) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = el.getBoundingClientRect();
    const foot = Fx.footOf(el, fieldEl);
    const dur = 1000;

    GroundMoveAnimations.kickUpDirt(fxEl, foot, Math.max(r.width * 0.6, 34), dur, '#B89A5E');

    const steps = 12;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const depth = r.height * t;
      const wiggle = k === 0 || k === steps ? 0 : (k % 2 ? 1 : -1) * 4;
      frames.push({ transform: `translate(${wiggle}px,${depth}px)`, clipPath: `inset(0 0 ${depth}px 0)` });
    }
    await Fx.anim(el, frames, { duration: dur, easing: 'ease-in', fill: 'forwards' });
    el.style.opacity = '0';
  }

  /**
   * Dig, turn 2: the user bursts back up out of the ground in a cloud of dust
   * and dirt, then the target is hit and white dust specks rise around it.
   */
  private static async playDigUp(refs: BattleStageRefs, target: Point) {
    const { launchEl: el, fieldEl, fxEl, targetEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    const r = el.getBoundingClientRect();
    const foot = Fx.footOf(el, fieldEl);

    GroundMoveAnimations.kickUpDirt(fxEl, foot, Math.max(r.width * 0.6, 34), 700, '#D8CBB0');
    await Fx.anim(el, [
      { transform: `translateY(${r.height}px)`, clipPath: `inset(0 0 ${r.height}px 0)` },
      { transform: 'translateY(-16px)', clipPath: 'inset(0 0 -40px 0)', offset: 0.6 },
      { transform: 'translateY(0)', clipPath: 'inset(0 0 -40px 0)' }
    ], { duration: 520, easing: 'ease-out', fill: 'none' });

    // Hit: the target shakes and white dust specks rise up around it.
    const tr = targetEl.getBoundingClientRect();
    Fx.flash(targetEl, '#F6F3EA', 0.6);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.4);
    const specks: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const s = 4 + Math.random() * 6;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,#E8E4DA 60%,#C9C2B0);box-shadow:0 0 3px #ffffffaa`;
      Fx.place(d, {
        x: target.x + (Math.random() * 2 - 1) * Math.max(tr.width * 0.35, 20),
        y: target.y + Math.random() * tr.height * 0.2
      });
      fxEl.appendChild(d);
      const rise = 30 + Math.random() * 40;
      specks.push(
        Fx.anim(d, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(0,${-rise * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${(Math.random() * 2 - 1) * 8}px,${-rise}px) scale(.8)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 200 }).then(() => d.remove())
      );
    }
    await Promise.all(specks);
  }

  /** Dust clouds swelling around a spot on the ground, plus clods of dirt thrown up and falling back. */
  private static kickUpDirt(fxEl: HTMLElement, foot: Point, spread: number, dur: number, dust: string) {
    for (let i = 0; i < 9; i++) {
      const s = 22 + Math.random() * 18;
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s * 0.8}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 45% 40%,${dust},${dust}cc 45%,${dust}00 72%)`;
      const side = i % 2 ? 1 : -1;
      Fx.place(puff, { x: foot.x + side * Math.random() * spread, y: foot.y - Math.random() * 10 });
      fxEl.appendChild(puff);
      Fx.anim(puff, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${side * 6}px,-6px) scale(1)`, opacity: 0.95, offset: 0.3 },
        { transform: `translate(${side * 16}px,-18px) scale(1.5)`, opacity: 0 }
      ], { duration: dur * 0.7, easing: 'ease-out', delay: Math.random() * dur * 0.4 }).then(() => puff.remove());
    }
    for (let i = 0; i < 12; i++) {
      const s = 8 + Math.random() * 8;
      const clod = document.createElement('div');
      clod.style.cssText = `position:absolute;width:${s}px;height:${s * 0.9}px;border-radius:45% 55% 50% 40%;pointer-events:none;background:radial-gradient(circle at 30% 70%,#3E3A16 0 18%,transparent 22%),radial-gradient(circle at 65% 35%,#9A9A4A,#6E6A2A 55%,#4A4618)`;
      Fx.place(clod, { x: foot.x + (Math.random() * 2 - 1) * spread * 0.6, y: foot.y - 6 });
      fxEl.appendChild(clod);
      const vx = (Math.random() * 2 - 1) * 50;
      const up = 70 + Math.random() * 70;
      const spin = (Math.random() * 2 - 1) * 300;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        // Thrown up, then pulled back down a little below where it started.
        frames.push({
          transform: `translate(${vx * t}px,${-up * 4 * t * (1 - t) + 20 * t}px) rotate(${spin * t}deg)`,
          opacity: t < 0.8 ? 1 : (1 - t) / 0.2
        });
      }
      Fx.anim(clod, frames, { duration: 700 + Math.random() * 200, easing: 'linear', delay: Math.random() * dur * 0.5 }).then(() => clod.remove());
    }
  }
}
