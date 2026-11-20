import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP, PSYCHIC_WAVES } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { PsychicFx } from './psychic-fx';
import { HyperspaceHole } from './hyperspace-hole';
import { MirrorCoat } from './mirror-coat';
import { PsychoCut } from './psycho-cut';
import { Psyshock } from './psyshock';
import { Psystrike } from './psystrike';
import { Synchronoise } from './synchronoise';
import { ZenHeadbutt } from './zen-headbutt';

/** Hand-made animations for Psychic-type attacks (Hyperspace Hole, Mirror Coat, Psycho Cut, Psyshock, Psystrike, Synchronoise and Zen Headbutt have their own files). */
export class PsychicAttackMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    confusion: (refs, _launch, target) => PsychicAttackMoveAnimations.playConfusion(refs, target),
    dreameater: (refs, launch, target, v) => PsychicAttackMoveAnimations.playDreamEater(refs, launch, target, v),
    extrasensory: (refs, launch) => PsychicAttackMoveAnimations.playExtrasensory(refs, launch),
    futuresight: (refs) => PsychicAttackMoveAnimations.playFutureSightHit(refs),
    hyperspacehole: (refs, launch, target, v) => HyperspaceHole.play(refs, launch, target, v),
    lusterpurge: (refs, launch, target) => PsychicAttackMoveAnimations.playLusterPurge(refs, launch, target),
    mirrorcoat: (refs, launch, target) => MirrorCoat.play(refs, launch, target),
    psychic: (refs) => PsychicAttackMoveAnimations.playPsychic(refs),
    psychoboost: (refs, launch, target) => PsychicAttackMoveAnimations.playPsychoBoost(refs, launch, target),
    psybeam: (refs, launch, target) => PsychicAttackMoveAnimations.playPsybeam(refs, launch, target),
    psychocut: (refs, launch, target, v) => PsychoCut.play(refs, launch, target, v),
    psyshock: (refs, _launch, target) => Psyshock.play(refs, target),
    psystrike: (refs, launch, target) => Psystrike.play(refs, launch, target),
    psywave: (refs, launch, target) => PsychicAttackMoveAnimations.playPsywave(refs, launch, target),
    synchronoise: (refs, launch, target) => Synchronoise.play(refs, launch, target),
    zenheadbutt: (refs, launch, target, v) => ZenHeadbutt.play(refs, launch, target, v)
  };

  /**
   * Psybeam, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/7/70/Psystrahl_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/7/7a/Psystrahl_Gen5.png
   *
   * A beam of rainbow rings (pink, violet, blue, gold) pours out of the user
   * one after another, each ring swelling as it flies to the target
   * (0-1.0 s). The first rings reach it at 0.35 s (hit): the target turns
   * purple and trembles until the last ring has passed (to ~1.2 s).
   */
  private static async playPsybeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const lr = Fx.rect(launchEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const size = Math.max(Math.min(tr.height, lr.height) * 0.55, 40);
    const colors = ['#F070D0', '#A070F0', '#60A8F0', '#F0C840'];
    const rings: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const c = colors[i % colors.length];
      // A ring seen edge-on: a narrow ellipse standing across the beam.
      const ring = Fx.box(size * 0.4, size, `border-radius:50%;border:3px solid ${c};box-shadow:0 0 6px ${c},inset 0 0 4px ${c}`);
      rings.push(
        Fx.spawn(fxEl, ring, launch, [
          { transform: `translate(0,0) rotate(${deg}deg) scale(.3)`, opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) rotate(${deg}deg) scale(.5)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${dx}px,${dy}px) rotate(${deg}deg) scale(1.1)`, opacity: 0.9, offset: 0.9 },
          { transform: `translate(${dx * 1.06}px,${dy * 1.06}px) rotate(${deg}deg) scale(1.25)`, opacity: 0 }
        ], { duration: 380, delay: i * 45, easing: 'linear' })
      );
    }
    await Fx.wait(350);
    Fx.flash(targetEl, '#C860FF', 0.5);
    await Promise.all([
      ...rings,
      Fx.glow(targetEl, 'sepia(1) saturate(3) hue-rotate(230deg) brightness(1.05)', 850),
      PsychicFx.tremble(targetEl, 700, 3)
    ]);
  }

  /**
   * Psywave, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/a/a6/Psywelle_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/c/cb/Psywelle_Gen5.png
   *
   * A pink-violet glow wells up round the user (0-0.3 s) and a wavy ribbon
   * of pink energy snakes over to the target (0.15-1.0 s; hit at 0.6 s).
   * Pink rings ripple out round the target three times while it trembles
   * (0.6-1.4 s).
   */
  private static async playPsywave(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy) || 1;
    // Unit normal to the path, for the sideways sway of the wave.
    const nx = -dy / len;
    const ny = dx / len;
    const amp = Math.max(tr.height * 0.25, 18);
    const blob = Math.max(tr.width * 0.32, 24);
    const effects: Promise<unknown>[] = [Fx.glow(launchEl, 'drop-shadow(0 0 10px #E060F0) brightness(1.1)', 500)];
    await Fx.wait(150);

    // The ribbon: blobs follow the same wavy path one after another.
    for (let i = 0; i < 18; i++) {
      const c = i % 3 ? '#F070C8' : '#B060F0';
      const el = Fx.box(blob, blob * 0.6, `border-radius:50%;background:radial-gradient(ellipse,#FFD0F4ee,${c}cc 55%,${c}00 75%)`);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const sway = Math.sin(t * Math.PI * 3) * amp * (1 - t * 0.6);
        frames.push({ transform: `translate(${dx * t + nx * sway}px,${dy * t + ny * sway}px) scale(${0.6 + t * 0.5})`, opacity: k === 0 ? 0 : k === 10 ? 0.3 : 0.95 });
      }
      effects.push(Fx.spawn(fxEl, el, launch, frames, { duration: 450, delay: i * 22, easing: 'linear' }));
    }
    await Fx.wait(450);

    // Pink rings ripple out round the target.
    Fx.flash(targetEl, '#F070D0', 0.5);
    effects.push(
      Fx.glow(targetEl, 'sepia(1) saturate(3) hue-rotate(260deg) brightness(1.05)', 750),
      PsychicFx.tremble(targetEl, 750, 3)
    );
    const foot = Fx.footOf(targetEl, fieldEl);
    const at: Point = { x: target.x, y: (target.y + foot.y) / 2 };
    const ring = Math.max(tr.width * 1.1, 70);
    for (let i = 0; i < 3; i++) {
      effects.push(
        Fx.spawn(fxEl, Fx.box(ring, ring * 0.45, 'border-radius:50%;border:4px solid #F070D0;box-shadow:0 0 8px #C050F0,inset 0 0 8px #C050F0'), at, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(.6)', opacity: 1, offset: 0.3 },
          { transform: 'scale(1.2)', opacity: 0 }
        ], { duration: 450, delay: i * 170, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }

  /**
   * Confusion, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/9/95/Konfusion_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/a/a0/Konfusion_Gen5.png
   *
   * The scene goes dark (0-0.28 s); the target glows pink and trembles while
   * three purple rings close in round it one after another (0.3-1.1 s, hit at
   * 0.55 s), then the scene clears (1.1-1.4 s).
   */
  private static async playConfusion(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dim = await PsychicFx.dimIn(fieldEl);
    const effects: Promise<void>[] = [
      PsychicFx.tremble(targetEl, 800, 3),
      Fx.glow(targetEl, 'sepia(.6) saturate(3) hue-rotate(260deg) brightness(1.25) drop-shadow(0 0 8px #FF6AD8)', 800)
    ];
    const w = Math.max(r.width * 0.95, 60);
    for (let i = 0; i < 3; i++) {
      const ring = Fx.box(w, w * 0.9, 'border-radius:50%;border:3px solid #C860F0;box-shadow:0 0 8px #E070FF,inset 0 0 8px #E070FF');
      effects.push(
        Fx.spawn(fxEl, ring, target, [
          { transform: 'scale(2)', opacity: 0 },
          { transform: 'scale(1.4)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.7)', opacity: 0 }
        ], { duration: 480, easing: 'ease-in', delay: i * 160 })
      );
    }
    await Fx.wait(250);
    Fx.flash(targetEl, '#FF8AE0', 0.5);
    await Promise.all(effects);
    await PsychicFx.dimOut(dim);
  }

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
