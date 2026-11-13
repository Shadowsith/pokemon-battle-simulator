import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP, PSYCHIC_WAVES } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { PsychicFx } from './psychic-fx';
import { HyperspaceHole } from './hyperspace-hole';
import { PsychoCut } from './psycho-cut';
import { Psyshock } from './psyshock';
import { Psystrike } from './psystrike';
import { ZenHeadbutt } from './zen-headbutt';

/** Hand-made animations for Psychic-type attacks (Hyperspace Hole, Psycho Cut and Zen Headbutt have their own files). */
export class PsychicAttackMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    dreameater: (refs, launch, target, v) => PsychicAttackMoveAnimations.playDreamEater(refs, launch, target, v),
    extrasensory: (refs, launch) => PsychicAttackMoveAnimations.playExtrasensory(refs, launch),
    futuresight: (refs) => PsychicAttackMoveAnimations.playFutureSightHit(refs),
    hyperspacehole: (refs, launch, target, v) => HyperspaceHole.play(refs, launch, target, v),
    lusterpurge: (refs, launch, target) => PsychicAttackMoveAnimations.playLusterPurge(refs, launch, target),
    psychic: (refs) => PsychicAttackMoveAnimations.playPsychic(refs),
    psychoboost: (refs, launch, target) => PsychicAttackMoveAnimations.playPsychoBoost(refs, launch, target),
    psychocut: (refs, launch, target, v) => PsychoCut.play(refs, launch, target, v),
    psyshock: (refs, _launch, target) => Psyshock.play(refs, target),
    psystrike: (refs, launch, target) => Psystrike.play(refs, launch, target),
    zenheadbutt: (refs, launch, target, v) => ZenHeadbutt.play(refs, launch, target, v)
  };

  static readonly chargeAnims: MoveAnimRegistry = {
    futuresight: (refs) => PsychicAttackMoveAnimations.playFutureSightForesee(refs)
  };

  /** Future Sight, the turn it's used: the scene dims for a moment while the user trembles. */
  private static async playFutureSightForesee(refs: BattleStageRefs) {
    const dim = await PsychicFx.dimIn(refs.fieldEl);
    await PsychicFx.tremble(refs.launchEl, 700, 3);
    await PsychicFx.dimOut(dim);
  }

  /**
   * Future Sight, two turns later: the scene dims, the target trembles while
   * it blanks out white, then the field jolts and the target blinks as it's hit.
   */
  private static async playFutureSightHit(refs: BattleStageRefs) {
    const { fieldEl, targetEl } = refs;
    const dim = await PsychicFx.dimIn(fieldEl);
    const white = 'brightness(0) invert(1)';
    await Promise.all([
      PsychicFx.tremble(targetEl, 800, 5),
      Fx.anim(targetEl, [
        { filter: 'brightness(1) invert(0)' },
        { filter: white, offset: 0.25 },
        { filter: white, offset: 0.75 },
        { filter: 'brightness(1) invert(0)' }
      ], { duration: 800, easing: 'ease-in-out', fill: 'none' })
    ]);
    Fx.shakeField(fieldEl, 0.7);
    await Fx.blink(targetEl, 3);
    await PsychicFx.dimOut(dim);
  }

  /**
   * Extrasensory: the scene goes dark (0-0.28 s), four red psychic rings
   * with an orange glow burst outward from the user one after another
   * (0.28-1.05 s), then the target shudders very fast (1.05-1.6 s) and the scene clears.
   */
  private static async playExtrasensory(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const dim = await PsychicFx.dimIn(fieldEl);

    const reach = Math.max(r.width, r.height) * 1.8 + 40;
    const bw = Math.max(reach * 0.035, 4);
    const rings: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:${reach}px;height:${reach}px;border-radius:50%;pointer-events:none;box-sizing:border-box;border:${bw}px solid #E8302Ee6;box-shadow:0 0 12px #FF7A2Acc,inset 0 0 12px #FF7A2Acc`;
      Fx.place(ring, launch);
      fxEl.appendChild(ring);
      rings.push(
        Fx.anim(ring, [
          { transform: 'scale(.12)', opacity: 0 },
          { transform: 'scale(.3)', opacity: 1, offset: 0.15 },
          { transform: 'scale(.85)', opacity: 0.85, offset: 0.7 },
          { transform: 'scale(1.1)', opacity: 0 }
        ], { duration: 420, easing: 'ease-out', delay: i * 120, fill: 'backwards' }).then(() => ring.remove())
      );
    }
    await Promise.all(rings);

    Fx.flash(targetEl, '#F28BF0', 0.45);
    await PsychicFx.tremble(targetEl, 550, 4);
    await PsychicFx.dimOut(dim);
  }

  /**
   * Luster Purge: the scene turns pale white (0-0.25 s); the user shines in a
   * bright white glow at the heart of a burst of light whose rays sweep the
   * whole screen (0.25-1.1 s); the rays fade but the scene stays white while
   * quick black bursts strike the target (1.2-1.85 s); then it clears.
   */
  private static async playLusterPurge(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. Pale white scene.
    const pale = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#F2F3F6,#CDD1D8)');
    await Fx.anim(pale, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // 2. The user shines; a burst of light with long rays turns slowly round it.
    const size = W * 2.2;
    const burst = document.createElement('div');
    const mask = 'radial-gradient(circle,#000 0 8%,#000a 25%,#0000 55%)';
    burst.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#ffffff 0 3%,#F4FFE8ee 5%,#ffffff00 10%),' +
      'repeating-conic-gradient(#ffffffee 0 2deg,#ffffff00 2deg 9deg,#E8FFF4cc 9deg 10.5deg,#ffffff00 10.5deg 17deg);' +
      `-webkit-mask-image:${mask};mask-image:${mask}`;
    Fx.place(burst, launch);
    fxEl.appendChild(burst);
    const shine = Fx.anim(launchEl, [
      { filter: 'brightness(1) drop-shadow(0 0 0 #fff0)' },
      { filter: 'brightness(2.4) saturate(.3) drop-shadow(0 0 14px #ffffff)', offset: 0.3 },
      { filter: 'brightness(2.4) saturate(.3) drop-shadow(0 0 14px #ffffff)', offset: 0.75 },
      { filter: 'brightness(1) drop-shadow(0 0 0 #fff0)' }
    ], { duration: 850, easing: 'ease-in-out', fill: 'none' });
    await Fx.anim(burst, [
      { transform: 'scale(.05) rotate(0deg)', opacity: 0 },
      { transform: 'scale(.8) rotate(8deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.05) rotate(26deg)', opacity: 0 }
    ], { duration: 850, easing: 'ease-out' });
    burst.remove();
    await shine;
    await Fx.wait(100);

    // 3. Quick black bursts on the target.
    const bursts: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const hit = FxGlyphs.spikyBurst(Math.max(tr.width * (0.35 + Math.random() * 0.2), 28), '#141414', '#3A3A3A', '#6A6A6A');
      Fx.place(hit, {
        x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3,
        y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3
      });
      fxEl.appendChild(hit);
      const delay = i * 90;
      bursts.push(
        Fx.anim(hit, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.9) rotate(25deg)', opacity: 0 }
        ], { duration: 200, easing: 'ease-out', delay, fill: 'backwards' }).then(() => hit.remove())
      );
      setTimeout(() => Fx.shake(targetEl, 4), delay);
    }
    await Promise.all(bursts);
    await Fx.blink(targetEl, 2);

    await Fx.anim(pale, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    pale.remove();
  }

  /**
   * Psycho Boost, after the DPPt animation: a magenta glow swells round the
   * user while pink sparks streak about it (0-0.9 s); glow and user turn
   * white-hot (0.9-1.3 s); white psychic swirls spin out from the user over
   * the screen as the scene goes black (1.3-2.0 s); a pink bubble grows on
   * the target (2.0-2.3 s), then a red-brown backdrop with peach rays bursts
   * round it while the bubble becomes a red glow and pink rings pop all over
   * the target (2.3-3.2 s); the scene goes black and returns (3.2-3.8 s),
   * and blue stat-down bubbles drift over the user (from 3.5 s).
   */
  private static async playPsychoBoost(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. A magenta glow swells and flickers round the user, then a white glow takes over.
    const glowSize = Math.max(Math.max(lr.width, lr.height) * 1.6, 90);
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;width:${glowSize}px;height:${glowSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 12%,#F8A8F0cc 30%,#E040C899 50%,#E040C800 70%)`;
    Fx.place(glow, launch);
    fxEl.appendChild(glow);
    const glowDone = Fx.anim(glow, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.08)', opacity: 1, offset: 0.45 },
      { transform: 'scale(.96)', opacity: 1, offset: 0.55 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 1600, easing: 'ease-in-out' }).then(() => glow.remove());
    const white = document.createElement('div');
    white.style.cssText = `position:absolute;width:${glowSize * 1.15}px;height:${glowSize * 1.15}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 28%,#ffffffcc 45%,#ffffff00 70%)`;
    Fx.place(white, launch);
    fxEl.appendChild(white);
    const whiteDone = Fx.anim(white, [
      { opacity: 0 },
      { opacity: 1, offset: 0.4 },
      { opacity: 1, offset: 0.6 },
      { opacity: 0 }
    ], { duration: 900, delay: 900, easing: 'ease-in-out', fill: 'backwards' }).then(() => white.remove());
    const pale = 'brightness(3) saturate(0) drop-shadow(0 0 10px #ffffff)';
    const userGlow = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: 'brightness(1.3) drop-shadow(0 0 8px #E040C8)', offset: 0.45 },
      { filter: pale, offset: 0.65 },
      { filter: pale, offset: 0.85 },
      { filter: 'none' }
    ], { duration: 2000, easing: 'linear', fill: 'none' });

    // Thin pink sparks streak outward round the glow.
    for (let i = 0; i < 22; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = glowSize * (0.3 + Math.random() * 0.5);
      const len = 10 + Math.random() * 10;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${len}px;height:2px;border-radius:1px;pointer-events:none;background:linear-gradient(90deg,#FF9AF000,#FF5AE0 50%,#FFD0F8)`;
      Fx.place(spark, { x: launch.x + Math.cos(a) * d, y: launch.y + Math.sin(a) * d * 0.85 });
      fxEl.appendChild(spark);
      const rot = `rotate(${(a * 180) / Math.PI}deg)`;
      Fx.anim(spark, [
        { transform: `${rot} translateX(0)`, opacity: 0 },
        { transform: `${rot} translateX(8px)`, opacity: 1, offset: 0.3 },
        { transform: `${rot} translateX(26px)`, opacity: 0 }
      ], { duration: 300, delay: 150 + Math.random() * 950, easing: 'ease-out', fill: 'backwards' }).then(() => spark.remove());
    }
    await Fx.wait(1300);

    // 2. White psychic swirls spin out from the user over the screen, and the scene goes black.
    const swirlBase = Math.min(W, H) * 0.5;
    const swirls: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const s = swirlBase * (1 + i * 0.45);
      const arc = document.createElement('div');
      arc.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:${5 + i}px solid;border-color:#ffffffee #ffffff00 #ffffffaa #ffffff00;filter:blur(1.5px)`;
      Fx.place(arc, launch);
      fxEl.appendChild(arc);
      swirls.push(
        Fx.anim(arc, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(-140deg)', opacity: 0.9, offset: 0.45 },
          { transform: 'scale(2.2) rotate(-300deg)', opacity: 0 }
        ], { duration: 700, delay: i * 80, easing: 'ease-out', fill: 'backwards' }).then(() => arc.remove())
      );
    }
    await Fx.wait(400);
    const dim = await PsychicFx.dimIn(fieldEl);
    await Promise.all([...swirls, glowDone, whiteDone]);

    // 3. A pink bubble grows on the target while the red-brown ray backdrop opens behind the black.
    const bubbleSize = Math.max(Math.max(tr.width, tr.height) * 1.3, 70);
    const bubble = document.createElement('div');
    bubble.style.cssText = `position:absolute;width:${bubbleSize}px;height:${bubbleSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#FFE4F4 0 10%,#F8A8D8 35%,#EE6AB0 62%,#F8B8DCcc 68%,#F8B8DC00 72%)`;
    Fx.place(bubble, target);
    fxEl.appendChild(bubble);
    const [rays] = await Promise.all([
      FxEffects.burstBackdrop(fieldEl, target, 'ember'),
      Fx.anim(bubble, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 300, easing: 'ease-out' })
    ]);

    // The black clears off the rays; the bubble becomes a red glow and pink rings pop all over the target.
    Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in' }).then(() => dim.remove());
    Fx.anim(bubble, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 300, easing: 'ease-out' }).then(() =>
      bubble.remove()
    );
    const red = document.createElement('div');
    red.style.cssText = `position:absolute;width:${bubbleSize * 1.5}px;height:${bubbleSize * 1.5}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FF1A2A 0 30%,#FF2A3Acc 50%,#FF2A3A00 72%)`;
    Fx.place(red, target);
    fxEl.appendChild(red);
    const redDone = Fx.anim(red, [
      { transform: 'scale(.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1.06)', opacity: 1, offset: 0.5 },
      { transform: 'scale(1)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1)', opacity: 0 }
    ], { duration: 900, easing: 'ease-in-out' }).then(() => red.remove());
    const pops: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const s = 10 + Math.random() * 12;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:2px solid #FFA8D8;box-shadow:0 0 4px #FF5AB0,inset 0 0 3px #FF5AB0`;
      Fx.place(ring, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.45, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.45 });
      fxEl.appendChild(ring);
      pops.push(
        Fx.anim(ring, [
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.3)', opacity: 0 }
        ], { duration: 350, delay: i * 45, easing: 'ease-out', fill: 'backwards' }).then(() => ring.remove())
      );
    }
    Fx.shakeField(fieldEl, 0.6);
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.shake(targetEl, 5), i * 250);
    await Promise.all([redDone, ...pops, userGlow]);

    // 4. Black again, then back to the battle scene while the user's Sp. Atk falls sharply.
    // A new backdrop goes in as the field's first child, so lift it above the rays.
    const dark = Fx.backdrop(fieldEl, DIM_BACKDROP);
    rays.after(dark);
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
    rays.remove();
    await Promise.all([PsychicFx.dimOut(dark), FxEffects.statDownBubbles(refs, launch)]);
  }

  /**
   * Psychic: the backdrop goes dark, then a moving psychedelic wave pattern
   * fades in while the target warps and glows.
   */
  private static async playPsychic(refs: BattleStageRefs) {
    const { fieldEl, targetEl } = refs;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Wave layer goes on top of the dim layer, still behind platforms and sprites.
    const waves = document.createElement('div');
    waves.style.cssText = `position:absolute;inset:-48px;background-image:${PSYCHIC_WAVES};background-size:60px 24px`;
    dim.appendChild(waves);
    waves.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '60px 24px' }], {
      duration: 700,
      iterations: Infinity,
      easing: 'linear'
    });
    // A slow sway makes the whole pattern ripple, not just scroll.
    waves.animate(
      [{ transform: 'skewY(0deg) scaleY(1)' }, { transform: 'skewY(4deg) scaleY(1.08)' }, { transform: 'skewY(0deg) scaleY(1)' }],
      { duration: 900, iterations: Infinity, easing: 'ease-in-out' }
    );
    await Fx.anim(waves, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The target is warped back and forth and glows.
    const original = targetEl.style.transform;
    const warp: Keyframe[] = [];
    const n = 10;
    for (let k = 0; k <= n; k++) {
      const a = k === 0 || k === n ? 0 : (k % 2 ? 1 : -1);
      warp.push({ transform: `${original} skewX(${a * 10}deg) scale(${1 + a * 0.06},${1 - a * 0.05})` });
    }
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.flash(targetEl, i % 2 ? '#F28BF0' : '#FFE37A', 0.55), i * 260);
    await Fx.anim(targetEl, warp, { duration: 1100, easing: 'ease-in-out', fill: 'none' });
    targetEl.style.transform = original;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Dream Eater: the scene goes dark, glowing yellow dream orbs drift out of
   * the sleeping target into the caster, the caster glows with purple psychic
   * sparkles, then the target is hit and the caster gains HP (green sparkles).
   */
  private static async playDreamEater(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl } = refs;

    // 1. Darkness.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Yellow dream orbs float from the target to the caster on wavy paths.
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    const count = 16;
    const travel = 1000;
    const spread = 900;
    for (let i = 0; i < count; i++) {
      const s = 8 + Math.random() * 8;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFBE0,#FFE36A 45%,#F2C23A00 75%);box-shadow:0 0 ${s}px #FFE36A88`;
      Fx.place(orb, { x: target.x + (Math.random() * 40 - 20), y: target.y + (Math.random() * 40 - 20) });
      fxEl.appendChild(orb);
      const bend = (Math.random() * 2 - 1) * 40;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = t * t * (3 - 2 * t);
        frames.push({
          transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px) scale(${0.5 + Math.sin(t * Math.PI) * 0.6})`,
          opacity: Math.min(1, t * 5, (1 - t) * 4 + 0.2)
        });
      }
      Fx.anim(orb, frames, { duration: travel, easing: 'linear', delay: (i / count) * spread }).then(() => orb.remove());
    }
    await Fx.wait(travel + spread * 0.85);

    // 3. The caster glows while purple psychic sparkles twinkle over it.
    const r = Fx.rect(launchEl);
    const rad = Math.max(r.width * 0.45, 28);
    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.7) drop-shadow(0 0 10px #E9A8FF)', offset: 0.3 },
      { filter: 'brightness(1.5) drop-shadow(0 0 8px #E9A8FF)', offset: 0.75 },
      { filter: 'brightness(1)' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 12; i++) {
      const sp = FxGlyphs.psySparkle(14 + Math.random() * 10);
      Fx.place(sp, { x: launch.x + (Math.random() * 2 - 1) * rad, y: launch.y + (Math.random() * 2 - 1) * rad });
      fxEl.appendChild(sp);
      Fx.anim(sp, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.2) rotate(90deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: Math.random() * 400 }).then(() => sp.remove());
    }
    await glow;

    // 4. The target takes the hit (blinking); the caster recovers HP.
    await Promise.all([Fx.blink(refs.targetEl), FxEffects.impact(refs, target, v, 0)]);
    const fade = Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 300 }).then(() => dim.remove());
    await FxEffects.healSparkles(refs, launch);
    await fade;
  }
}
