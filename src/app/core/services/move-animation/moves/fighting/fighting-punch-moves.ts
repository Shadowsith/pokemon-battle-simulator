import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { HammerArm } from './hammer-arm';
import { WakeUpSlap } from './wake-up-slap';

/** Hand-made animations for Fighting-type punches, chops and full-power blows (Hammer Arm and Wake-Up Slap live in `hammer-arm.ts` / `wake-up-slap.ts`). */
export class FightingPunchMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    brickbreak: (refs, _launch, target) => FightingPunchMoveAnimations.playBrickBreak(refs, target),
    closecombat: (refs, launch, target) => FightingPunchMoveAnimations.playCloseCombat(refs, launch, target),
    crosschop: (refs, _launch, target) => FightingPunchMoveAnimations.playCrossChop(refs, target),
    drainpunch: (refs, launch, target) => FightingPunchMoveAnimations.playDrainPunch(refs, launch, target),
    dynamicpunch: (refs, _launch, target) => FightingPunchMoveAnimations.playDynamicPunch(refs, target),
    focuspunch: (refs, launch, target) => FightingPunchMoveAnimations.playFocusPunch(refs, launch, target),
    hammerarm: (refs, launch, target, v) => HammerArm.play(refs, launch, target, v),
    skyuppercut: (refs) => FightingPunchMoveAnimations.playSkyUppercut(refs),
    superpower: (refs, launch, target, v) => FightingPunchMoveAnimations.playSuperpower(refs, launch, target, v),
    wakeupslap: (refs, launch, target) => WakeUpSlap.play(refs, launch, target)
  };

  /**
   * Drain Punch, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/34/Ableithieb_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/8/88/Ableithieb_Gen5.png
   *
   * The scene dims (0-0.2 s) and a brown fist slams into the target (hit at
   * 0.35 s). Glowing yellow orbs float out of the target and drift back to the
   * user on wavy arcs (0.5-1.5 s) while the scene clears; then green heal
   * stars twinkle round the user (1.5-2.4 s).
   */
  private static async playDrainPunch(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.7 }], { duration: 200, easing: 'ease-out' });

    // The punch.
    const fist = FxGlyphs.fistGlyph(Math.max(tr.width * 0.5, 40), 'brown');
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [{ transform: 'scale(1.8)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 150, easing: 'ease-in' });
    Fx.flash(targetEl, '#F0C860', 0.7);
    Fx.shake(targetEl, 6);
    await Fx.anim(fist, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 150, easing: 'ease-out' });
    fist.remove();

    // The drained energy: yellow orbs float back to the user.
    Fx.anim(dim, [{ opacity: 0.7 }, { opacity: 0 }], { duration: 900, easing: 'ease-in' }).then(() => dim.remove());
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    const orbs: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const s = 8 + Math.random() * 6;
      const orb = document.createElement('div');
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFDE0,#FFE45A 45%,#E0B02A00 72%);box-shadow:0 0 ${s}px #FFE45A`;
      Fx.place(orb, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.25, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.25 });
      fxEl.appendChild(orb);
      const bend = (Math.random() * 2 - 1) * 50;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const ease = t * t * (3 - 2 * t);
        frames.push({ transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px)`, opacity: Math.min(1, t * 6, (1 - t) * 5) });
      }
      orbs.push(Fx.anim(orb, frames, { duration: 700, easing: 'linear', delay: i * 35 }).then(() => orb.remove()));
    }
    await Promise.all(orbs);
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Superpower, after the Gen 5 animation: pale yellow streaks of light shoot
   * up round the user while it glows red (0-1.2 s) and a pink-red haze rises
   * off it (0.3-1.2 s); the scene goes dark as the user lunges (1.2-1.45 s);
   * pink sparks pop on the target, then a red backdrop with orange rays
   * bursts behind it while the sparks scatter (1.6-2.6 s); black, then back
   * (2.6-3.15 s) as the target blinks; last, blue stat-down bubbles drift over
   * the user (its Attack and Defense fall, to ~4.05 s).
   */
  private static async playSuperpower(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. Power up: the user glows red, light streaks shoot up and a pink haze rises round it.
    const hot = 'brightness(1.15) sepia(.4) saturate(2) hue-rotate(-20deg) drop-shadow(0 0 8px #FF5A5A)';
    const glow = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: hot, offset: 0.25 },
      { filter: hot, offset: 0.8 },
      { filter: 'none' }
    ], { duration: 1200, easing: 'ease-in-out', fill: 'none' });
    const power: Promise<void>[] = [glow];
    for (let i = 0; i < 14; i++) {
      const w = 3 + Math.random() * 2;
      const h = 18 + Math.random() * 16;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(0deg,#FFF6C000,#FFF2B0 50%,#FFFFFF);box-shadow:0 0 4px #FFE89A`;
      Fx.place(streak, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.7, y: launch.y + lr.height * (Math.random() * 0.6 - 0.2) });
      fxEl.appendChild(streak);
      const up = lr.height * (0.8 + Math.random() * 0.4);
      power.push(
        Fx.anim(streak, [
          { transform: 'translateY(0)', opacity: 0 },
          { transform: `translateY(${-up * 0.3}px)`, opacity: 1, offset: 0.3 },
          { transform: `translateY(${-up}px)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: Math.random() * 600, fill: 'backwards' }).then(() => streak.remove())
      );
    }
    for (let i = 0; i < 14; i++) {
      const s = Math.max(lr.width * (0.3 + Math.random() * 0.2), 22);
      const haze = document.createElement('div');
      haze.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FF8A9Acc,#FF6A8066 45%,#FF6A8000 70%)`;
      Fx.place(haze, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.55, y: launch.y + lr.height * (Math.random() * 0.6 - 0.1) });
      fxEl.appendChild(haze);
      const up = 30 + Math.random() * 20;
      power.push(
        Fx.anim(haze, [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { transform: `translateY(${-up * 0.4}px) scale(1)`, opacity: 0.8, offset: 0.35 },
          { transform: `translateY(${-up}px) scale(1.4)`, opacity: 0 }
        ], { duration: 700, easing: 'ease-out', delay: 300 + Math.random() * 200, fill: 'backwards' }).then(() => haze.remove())
      );
    }
    await Promise.all(power);

    // 2. Darkness while the user lunges at the target.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const original = launchEl.style.transform;
    const lunge = Fx.anim(launchEl, [
      { transform: `${original} translateX(0)` },
      { transform: `${original} translateX(${v.dir * 40}px)`, offset: 0.45 },
      { transform: `${original} translateX(0)` }
    ], { duration: 450, easing: 'ease-in-out', fill: 'none' });
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // 3. Pink sparks pop on the target; the red ray backdrop opens behind the black, which clears off it.
    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      const s = 3 + Math.random() * 3;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff,#FF9AC0 60%);box-shadow:0 0 4px #FF8AB0`;
      const a = Math.random() * Math.PI * 2;
      const r0 = Math.random() * tr.width * 0.3;
      Fx.place(spark, { x: target.x + Math.cos(a) * r0, y: target.y + Math.sin(a) * r0 * 0.8 });
      fxEl.appendChild(spark);
      const d = tr.width * (0.6 + Math.random() * 0.6);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,0) scale(1.2)', opacity: 1, offset: 0.2 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.8}px) scale(.6)`, opacity: 0 }
        ], { duration: 900, easing: 'ease-out', delay: Math.random() * 120, fill: 'backwards' }).then(() => spark.remove())
      );
    }
    await Fx.wait(150);
    const rays = await FxEffects.burstBackdrop(fieldEl, target, 'red');
    Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: 'ease-in' }).then(() => dim.remove());
    Fx.flash(targetEl, '#FF6A6A', 0.7);
    Fx.shakeField(fieldEl, 0.6);
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.shake(targetEl, 5), i * 220);
    await Promise.all([lunge, ...sparks, Fx.wait(750)]);

    // 4. Black again - a new backdrop goes in first, so lift it above the rays - then back to the scene.
    const dark = Fx.backdrop(fieldEl, DIM_BACKDROP);
    rays.after(dark);
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    rays.remove();
    await Promise.all([
      Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' }).then(() => dark.remove()),
      Fx.blink(targetEl, 3)
    ]);

    // 5. The user's Attack and Defense fall.
    await FxEffects.statDownBubbles(refs, launch);
  }

  /**
   * Sky Uppercut, after the HGSS animation: the scene turns dark red and
   * white rings pulse on both platforms (0.25-0.95 s); it goes black and a
   * blue sky with white streaks rushing upward takes over (0.95-1.35 s);
   * a blue fist shoots up from below the screen (1.55 s), turns icy as it
   * strikes the target's lower body (1.8 s) in a blue-violet spiky burst and
   * punches on up through it (to ~2.2 s); the sky fades (to ~2.8 s).
   */
  private static async playSkyUppercut(refs: BattleStageRefs) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);
    const target = Fx.centerOf(targetEl, fieldEl);

    // 1. Dark red scene; white rings pulse on both platforms.
    const red = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#140404,#4A0E0E 40%,#A8361C 60%,#3E0A0A 78%,#100303)');
    await Fx.anim(red, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    await Promise.all([launchEl, targetEl].map((el) => FightingPunchMoveAnimations.platformRings(fxEl, Fx.footOf(el, fieldEl), Fx.rect(el).width)));

    // 2. Black, then the blue sky with rising streaks (already waiting behind the red).
    const sky = Fx.backdrop(
      fieldEl,
      'background:linear-gradient(90deg,#1450E0,#5A9AF4 22%,#D8ECFF 42%,#EAF4FF 50%,#D8ECFF 58%,#5A9AF4 78%,#1450E0)'
    );
    FightingPunchMoveAnimations.risingStreaks(sky, W, H);
    await Fx.anim(red, [
      { filter: 'brightness(1)', opacity: 1 },
      { filter: 'brightness(0)', opacity: 1, offset: 0.5 },
      { filter: 'brightness(0)', opacity: 0 }
    ], { duration: 400, easing: 'linear' });
    red.remove();
    await Fx.wait(200);

    // 3. The fist shoots up from below the screen, through the target and out the top.
    const fistW = Math.max(tr.width * 0.45, 36);
    const yHit = target.y + tr.height * 0.15;
    const yTop = target.y - tr.height * 0.9;
    const rise = 600;
    const hitAt = 0.42;
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.65, 48), '#3A3AD8', '#8A9AFF', '#FFFFFF');
    Fx.place(burst, { x: target.x, y: 0 });
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: `translateY(${yHit}px) scale(.3)`, opacity: 0 },
      { transform: `translateY(${yHit - tr.height * 0.1}px) scale(1.1)`, opacity: 1, offset: 0.2 },
      { transform: `translateY(${target.y - tr.height * 0.25}px) scale(.9)`, opacity: 1, offset: 0.6 },
      { transform: `translateY(${target.y - tr.height * 0.45}px) scale(1.05)`, opacity: 0 }
    ], { duration: 400, delay: rise * hitAt, easing: 'ease-out', fill: 'backwards' }).then(() => burst.remove());

    // The fist leads; two fading copies trail it. Only the lead turns icy at the hit.
    const fists: Promise<void>[] = [];
    for (let k = 0; k < 3; k++) {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
      const tones: ('blue' | 'ice')[] = k === 0 ? ['blue', 'ice'] : ['blue'];
      const glyphs = tones.map((tone) => {
        const g = FxGlyphs.fistGlyph(fistW, tone);
        // Knuckles up: the glyph points right, so turn it a quarter left.
        g.style.left = `${-fistW / 2}px`;
        g.style.top = `${(-fistW * (20 / 24)) / 2}px`;
        g.style.transform = 'rotate(-90deg)';
        wrap.appendChild(g);
        return g;
      });
      Fx.place(wrap, { x: target.x, y: 0 });
      fxEl.appendChild(wrap);
      const fade = k === 0 ? 1 : 0.45 - k * 0.15;
      fists.push(
        Fx.anim(wrap, [
          { transform: `translateY(${H + fistW}px)`, opacity: fade, easing: 'ease-in' },
          { transform: `translateY(${yHit}px)`, opacity: fade, offset: hitAt, easing: 'ease-out' },
          { transform: `translateY(${yTop}px)`, opacity: fade, offset: 0.9 },
          { transform: `translateY(${yTop - 12}px)`, opacity: 0 }
        ], { duration: rise, delay: k * 45, fill: 'backwards' }).then(() => wrap.remove())
      );
      if (k === 0) {
        Fx.anim(glyphs[0], [{ opacity: 1 }, { opacity: 1, offset: hitAt }, { opacity: 0, offset: hitAt + 0.08 }, { opacity: 0 }], { duration: rise });
        Fx.anim(glyphs[1], [{ opacity: 0 }, { opacity: 0, offset: hitAt }, { opacity: 1, offset: hitAt + 0.08 }, { opacity: 1 }], { duration: rise });
      }
    }

    // The hit lifts the target with a jolt.
    const tOrig = targetEl.style.transform;
    const jolt = Fx.wait(rise * hitAt).then(() => {
      Fx.flash(targetEl, '#9AB0FF', 0.7);
      return Fx.anim(targetEl, [
        { transform: `${tOrig} translateY(0)` },
        { transform: `${tOrig} translateY(-12px)`, offset: 0.3 },
        { transform: `${tOrig} translateY(0)` }
      ], { duration: 320, easing: 'ease-out', fill: 'none' });
    });
    await Promise.all([...fists, burstDone, jolt]);

    // 4. The sky holds a moment, then fades.
    await Fx.wait(250);
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    sky.remove();
  }

  /** White concentric rings that light up a platform round `foot` and pulse twice (Sky Uppercut). */
  private static platformRings(fxEl: HTMLElement, foot: Point, spriteW: number): Promise<void> {
    const w = Math.max(spriteW * 1.7, 80);
    const ring = document.createElement('div');
    ring.style.cssText =
      `position:absolute;width:${w}px;height:${w * 0.3}px;border-radius:50%;pointer-events:none;` +
      'background:repeating-radial-gradient(ellipse at center,#ffffffee 0 6%,#ffffff00 9% 24%,#ffffffcc 27% 33%,#ffffff00 36% 50%),radial-gradient(ellipse at center,#ffffff55,#ffffff00 70%)';
    Fx.place(ring, foot);
    fxEl.appendChild(ring);
    return Fx.anim(ring, [
      { transform: 'scale(.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1)', opacity: 0.45, offset: 0.5 },
      { transform: 'scale(1.03)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.06)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in-out' }).then(() => ring.remove());
  }

  /** White streaks rushing endlessly upward through `layer` (W x H); they stop when the layer is removed (Sky Uppercut). */
  private static risingStreaks(layer: HTMLElement, W: number, H: number): void {
    for (let i = 0; i < 28; i++) {
      const w = 3 + Math.random() * 6;
      const h = H * (0.1 + Math.random() * 0.2);
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${Math.random() * W}px;top:0;width:${w}px;height:${h}px;border-radius:${w}px;background:linear-gradient(0deg,#ffffff00,#ffffffee 40%,#ffffff 70%,#ffffff00);opacity:${0.6 + Math.random() * 0.4}`;
      layer.appendChild(streak);
      streak.animate([{ transform: `translateY(${H}px)` }, { transform: `translateY(${-h}px)` }], {
        duration: 300 + Math.random() * 300,
        delay: -Math.random() * 600,
        iterations: Infinity,
        easing: 'linear'
      });
    }
  }

  /**
   * Focus Punch: a red steel girder drops onto the user's head and is held
   * up there while red streaks rush upward round it (0-1.0 s); then the
   * scene turns into a blue burst of white rays and a red fist slams into
   * the target (1.41 s).
   */
  private static async playFocusPunch(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. Girder over the user's head, with red streaks rushing up.
    const girderW = Math.max(lr.width * 1.15, 70);
    const girder = FxGlyphs.girderGlyph(girderW);
    const top = { x: launch.x, y: launch.y - lr.height * 0.45 };
    Fx.place(girder, top);
    fxEl.appendChild(girder);
    const hold = Fx.anim(girder, [
      { transform: 'translateY(-40px)', opacity: 0 },
      { transform: 'translateY(4px)', opacity: 1, offset: 0.18 },
      { transform: 'translateY(0)', opacity: 1, offset: 0.26 },
      { transform: 'translateY(2px)', opacity: 1, offset: 0.6 },
      { transform: 'translateY(0)', opacity: 1, offset: 0.9 },
      { transform: 'translateY(-6px)', opacity: 0 }
    ], { duration: 1000, easing: 'ease-out' }).then(() => girder.remove());
    Fx.wait(180).then(() => Fx.shake(launchEl, 2));
    for (let i = 0; i < 14; i++) {
      const h = 18 + Math.random() * 22;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:2px;height:${h}px;border-radius:1px;pointer-events:none;background:linear-gradient(#FF8A7A00,#FF5A4A 60%,#FFD0C8);box-shadow:0 0 4px #FF4A3A`;
      Fx.place(streak, {
        x: launch.x + (Math.random() * 2 - 1) * girderW * 0.55,
        y: launch.y + lr.height * (0.1 + Math.random() * 0.35)
      });
      fxEl.appendChild(streak);
      const rise = lr.height * (0.9 + Math.random() * 0.5);
      Fx.anim(streak, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: `translateY(${-rise * 0.25}px)`, opacity: 1, offset: 0.25 },
        { transform: `translateY(${-rise}px)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-in', delay: 150 + Math.random() * 650, fill: 'backwards' }).then(() => streak.remove());
    }
    await hold;

    // 2. Blue burst backdrop, then the red fist slams in.
    const blue = await FxEffects.burstBackdrop(fieldEl, target, 'blue');
    const fistW = Math.max(tr.width * 0.55, 44);
    const fist = FxGlyphs.fistGlyph(fistW, 'red');
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
      duration: 160,
      easing: 'ease-in',
      fill: 'forwards'
    });
    const glow = FxGlyphs.spikyBurst(fistW * 2, '#FF9A9A', '#FFD0D0', '#ffffff');
    Fx.place(glow, target);
    fxEl.insertBefore(glow, fist);
    const glowDone = Fx.anim(glow, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(10deg)', opacity: 0.9, offset: 0.35 },
      { transform: 'scale(1.25) rotate(18deg)', opacity: 0 }
    ], { duration: 600, easing: 'ease-out' }).then(() => glow.remove());
    Fx.flash(targetEl, '#FF6A5A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 1);
    const fistDone = Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 600, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all([glowDone, fistDone]);

    // 3. The backdrop clears.
    await Fx.anim(blue, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    blue.remove();
  }

  /**
   * Dynamic Punch: a red backdrop with yellow burst rays flares up round the
   * target, a big yellow fist slams onto it in an orange blast and stones fly
   * out in all directions; the backdrop clears and little yellow birds circle
   * dizzily round the target's head (it's confused).
   */
  private static async playDynamicPunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const f = Fx.rect(fieldEl);

    // 1. Red burst backdrop (0-0.25 s), flickering behind the sprites.
    const red = await FxEffects.burstBackdrop(fieldEl, target);

    // 2. The fist slams in (0.25-0.42 s) over an orange blast; stones fly out.
    const fistW = Math.max(r.width * 0.55, 44);
    const fist = FxGlyphs.fistGlyph(fistW);
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [{ transform: 'scale(2.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
      duration: 170,
      easing: 'ease-in',
      fill: 'forwards'
    });
    const blast = FxGlyphs.spikyBurst(fistW * 2, '#FF7A1A', '#FFC23A', '#FFF6C0');
    Fx.place(blast, target);
    fxEl.insertBefore(blast, fist);
    const blastDone = Fx.anim(blast, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(10deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.2) rotate(18deg)', opacity: 0 }
    ], { duration: 600, easing: 'ease-out' }).then(() => blast.remove());
    Fx.flash(targetEl, '#FFC23A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 1);
    const stones: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const stone = FxGlyphs.rockChunk(8 + Math.random() * 10);
      Fx.place(stone, target);
      fxEl.appendChild(stone);
      const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const d = Math.max(f.width * 0.3, fistW * 2.5) * (0.6 + Math.random() * 0.5);
      stones.push(
        Fx.anim(stone, [
          { transform: 'translate(0,0) scale(.5) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1.1) rotate(${(Math.random() * 2 - 1) * 300}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'ease-out' }).then(() => stone.remove())
      );
    }
    const fistDone = Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 600, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all([blastDone, fistDone, ...stones]);

    // 3. The backdrop clears (~1.27-1.57 s).
    await Fx.anim(red, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    red.remove();

    // 4. Confused: three little birds circle the target's head, stars twinkle (~1.57-2.97 s).
    const head: Point = { x: target.x, y: r.top - f.top + r.height * 0.05 };
    const rx = Math.max(r.width * 0.45, 32);
    const ry = Math.max(r.height * 0.12, 10);
    const circle = 1400;
    const birds = [0, 1, 2].map((i) => {
      const bird = FxGlyphs.birdGlyph(20);
      Fx.place(bird, head);
      fxEl.appendChild(bird);
      const frames: Keyframe[] = [];
      const steps = 24;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const a = (Math.PI * 2 * i) / 3 + t * Math.PI * 3;
        // Facing the way it flies: left along the front (lower) half of the loop, right along the back.
        const face = Math.sin(a) >= 0 ? -1 : 1;
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * ry}px) scaleX(${face}) scale(${0.85 + 0.15 * Math.sin(a)})`,
          opacity: k === 0 || k === steps ? 0 : 1
        });
      }
      return Fx.anim(bird, frames, { duration: circle, easing: 'linear' }).then(() => bird.remove());
    });
    for (let i = 0; i < 4; i++) {
      const star = FxGlyphs.sparkStar(9, '#FFE04A');
      Fx.place(star, { x: head.x + (i - 1.5) * rx * 0.6, y: head.y - ry - 10 - (i % 2) * 6 });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.4) rotate(90deg)', opacity: 0.6, offset: 0.6 },
        { transform: 'scale(1) rotate(135deg)', opacity: 1, offset: 0.8 },
        { transform: 'scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: circle - 200, easing: 'ease-in-out', delay: 100 + i * 60 }).then(() => star.remove());
    }
    await Promise.all(birds);
  }

  /**
   * Brick Break: a grey glass pane appears in front of the target, a black,
   * white-outlined hand rises above it and chops straight down; on impact
   * the pane shatters into outlined glass shards that fly out and fade.
   */
  private static async playBrickBreak(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.9, 60);
    const h = Math.max(r.height * 0.95, 64);

    // 1. The glass pane opens in front of the target (0-0.25 s), a sheen runs over it.
    const pane = document.createElement('div');
    pane.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;overflow:hidden;border:2px solid #ffffffdd;border-radius:2px;background:linear-gradient(150deg,#F4F6FA99,#B8C0CC77 45%,#8E98A866);box-shadow:0 0 8px #ffffff88,inset 0 0 12px #ffffff66`;
    const sheen = document.createElement('div');
    sheen.style.cssText = `position:absolute;top:-20%;left:0;width:${w * 0.3}px;height:140%;background:linear-gradient(90deg,transparent,#ffffffdd,transparent);transform:skewX(-25deg)`;
    pane.appendChild(sheen);
    Fx.place(pane, target);
    fxEl.appendChild(pane);
    Fx.anim(sheen, [
      { transform: `translateX(${-w * 0.4}px) skewX(-25deg)` },
      { transform: `translateX(${w * 1.2}px) skewX(-25deg)` }
    ], { duration: 500, easing: 'ease-in-out', delay: 100 });
    await Fx.anim(pane, [
      { transform: 'scale(1,.05)', opacity: 0 },
      { transform: 'scale(1,1)', opacity: 1 }
    ], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // 2. The flat hand appears above the pane, edge down (0.25-0.4 s) ...
    const hw = Math.max(r.width * 0.7, 60);
    const hand = FxGlyphs.chopHandGlyph(hw);
    Fx.place(hand, target);
    fxEl.appendChild(hand);
    const above = -h / 2 - hw * 0.35;
    const pose = (y: number) => `translate(0,${y}px) rotate(-6deg)`;
    await Fx.anim(hand, [
      { transform: pose(above - 12), opacity: 0 },
      { transform: pose(above), opacity: 1 }
    ], { duration: 150, easing: 'ease-out', fill: 'forwards' });

    // ... and chops straight down through it (0.4-0.56 s).
    await Fx.anim(hand, [
      { transform: pose(above) },
      { transform: pose(0) }
    ], { duration: 160, easing: 'ease-in', fill: 'forwards' });

    // 3. Impact: the pane shatters, the target shakes, the hand fades.
    pane.remove();
    const shards: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const shard = FightingPunchMoveAnimations.glassShard(14 + Math.random() * 18);
      Fx.place(shard, {
        x: target.x + (Math.random() * 2 - 1) * w * 0.35,
        y: target.y + (Math.random() * 2 - 1) * h * 0.35
      });
      fxEl.appendChild(shard);
      const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const dist = Math.max(w, h) * (0.45 + Math.random() * 0.4);
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist * 0.75;
      const spin = (Math.random() * 2 - 1) * 200;
      shards.push(
        Fx.anim(shard, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) rotate(${spin * 0.6}deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx}px,${dy + 14}px) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'ease-out' }).then(() => shard.remove())
      );
    }
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.4);
    const fade = Fx.anim(hand, [
      { transform: pose(0), opacity: 1 },
      { transform: pose(12), opacity: 0 }
    ], { duration: 300, easing: 'ease-in' }).then(() => hand.remove());
    await Promise.all([Fx.blink(targetEl), fade, ...shards]);
  }

  /** A jagged piece of broken glass, `s` px wide: pale translucent fill with a white edge (Brick Break). */
  private static glassShard(s: number): HTMLElement {
    const pts = [0, 1, 2, 3, 4]
      .slice(0, 3 + Math.floor(Math.random() * 2))
      .map((i, _, all) => {
        const a = (i / all.length) * Math.PI * 2 + Math.random() * 0.8;
        const d = 0.55 + Math.random() * 0.45;
        return `${(50 + Math.cos(a) * 48 * d).toFixed(1)},${(50 + Math.sin(a) * 48 * d).toFixed(1)}`;
      })
      .join(' ');
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;pointer-events:none;filter:drop-shadow(0 0 2px #ffffffaa)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 100 100">' +
      `<polygon points="${pts}" fill="#E8EEF655" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/></svg>`;
    return el;
  }

  /**
   * Cross Chop: two black, white-outlined hands appear raised on either side
   * of the target, then chop down across it in an X; where they cross, yellow
   * impact bursts flare and the target shakes.
   */
  private static async playCrossChop(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const hw = Math.max(r.width * 0.38, 34);
    const sx = Math.max(r.width * 0.45, 36);
    const sy = Math.max(r.height * 0.35, 28);

    // 1. The hands appear raised, upper left and upper right (0-0.4 s).
    const hands = [-1, 1].map((side) => {
      const hand = FxGlyphs.gloveGlyph(hw, '#141414', '#ffffff');
      Fx.place(hand, target);
      fxEl.appendChild(hand);
      return { hand, side };
    });
    const pose = (side: number, x: number, y: number) => `translate(${side * x}px,${y}px) rotate(${side * 20}deg)`;
    await Promise.all(
      hands.map(({ hand, side }) =>
        Fx.anim(hand, [
          { transform: pose(side, sx, -sy + 10), opacity: 0 },
          { transform: pose(side, sx, -sy), opacity: 1 }
        ], { duration: 250, easing: 'ease-out', fill: 'forwards' })
      )
    );
    await Fx.wait(150);

    // 2. The chop (0.4-0.6 s): each hand sweeps down to the opposite side; they cross at ~0.5 s.
    const chop = Promise.all(
      hands.map(({ hand, side }) =>
        Fx.anim(hand, [
          { transform: pose(side, sx, -sy) },
          { transform: pose(side, -sx * 0.9, sy * 0.9) }
        ], { duration: 200, easing: 'ease-in', fill: 'forwards' })
      )
    );
    await Fx.wait(100);
    const bursts: Promise<void>[] = [];
    for (const [i, scale] of [[0, 1], [1, 0.7]] as const) {
      bursts.push(
        Fx.wait(i * 80).then(() => {
          const burst = FxGlyphs.spikyBurst(Math.max(r.width * 0.55, 46) * scale, '#E8D020', '#FFF27A');
          Fx.place(burst, { x: target.x + (i ? sx * 0.3 : 0), y: target.y + (i ? sy * 0.3 : 0) });
          fxEl.appendChild(burst);
          Fx.flash(targetEl, '#FFE04A', 0.6);
          Fx.shake(targetEl, 6);
          return Fx.anim(burst, [
            { transform: 'scale(.3)', opacity: 1 },
            { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
            { transform: 'scale(1.15)', opacity: 0 }
          ], { duration: 380, easing: 'ease-out' }).then(() => burst.remove());
        })
      );
    }
    await chop;

    // 3. The hands fade (0.6-0.85 s).
    await Promise.all([
      ...bursts,
      ...hands.map(({ hand }) => Fx.anim(hand, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => hand.remove()))
    ]);
  }

  /**
   * Close Combat, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/3c/Nahkampf_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/6/63/Nahkampf_Gen5.png
   *
   * The scene flashes black (0-0.2 s), then blue speed lines rush past while
   * a barrage of red fists and black feet slams into the target with red-orange
   * bursts and flying specks (eight blows, 0.25-1.3 s). A pale flash clears
   * the scene (to 1.55 s); last, blue stat-down bubbles drift over the user
   * (its Defense and Sp. Def fall, to ~2.45 s).
   */
  private static async playCloseCombat(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);

    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
    await Fx.wait(50);
    const blue = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#0A3A9A,#1E78E0 40%,#4AB4FF 50%,#1E78E0 60%,#0A3A9A)');
    FxEffects.speedLines(blue, W, H, target.x >= launch.x ? -1 : 1, ['#ffffff', '#9CE4FF']);
    black.remove();

    // The barrage: fists and feet slam in round the target with bursts and specks.
    const blowSize = Math.max(tr.width * 0.45, 34);
    const blows: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      await Fx.wait(i ? 110 : 50);
      const at: Point = {
        x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3,
        y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3
      };
      const burst = FxGlyphs.spikyBurst(blowSize * 1.4, '#E0301A', '#FF8A3A');
      Fx.place(burst, at);
      fxEl.appendChild(burst);
      const blow = i % 2 ? FxGlyphs.footGlyph(blowSize * 0.75) : FxGlyphs.fistGlyph(blowSize, 'red');
      Fx.place(blow, at);
      fxEl.appendChild(blow);
      blows.push(
        Fx.anim(burst, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.2)', opacity: 0 }
        ], { duration: 300, easing: 'ease-out' }).then(() => burst.remove()),
        Fx.anim(blow, [
          { transform: 'scale(1.7)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'scale(.95)', opacity: 0 }
        ], { duration: 260, easing: 'ease-in' }).then(() => blow.remove()),
        FightingPunchMoveAnimations.specks(fxEl, at, blowSize)
      );
      Fx.flash(targetEl, '#FF8A3A', 0.6);
      Fx.shake(targetEl, 5);
      if (i === 7) Fx.shakeField(fieldEl, 0.6);
    }
    await Promise.all(blows);

    // A pale flash clears the scene.
    const pale = Fx.backdrop(fieldEl, 'background:#F4E4DA');
    blue.after(pale);
    await Fx.anim(pale, [{ opacity: 0 }, { opacity: 1 }], { duration: 80, easing: 'ease-out' });
    blue.remove();
    await Fx.anim(pale, [{ opacity: 1 }, { opacity: 0 }], { duration: 170, easing: 'ease-in' });
    pale.remove();

    // The user's Defense and Sp. Def fall.
    await FxEffects.statDownBubbles(refs, launch);
  }

  /** A few small orange-red specks flying out from a blow at `at`. */
  private static specks(fxEl: HTMLElement, at: Point, reach: number): Promise<void> {
    const parts: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const speck = document.createElement('div');
      speck.style.cssText = `width:${4 + Math.random() * 3}px;height:3px;pointer-events:none;background:${i % 2 ? '#FF6A2A' : '#E0301A'}`;
      Fx.place(speck, at);
      fxEl.appendChild(speck);
      const ang = Math.random() * Math.PI * 2;
      const d = reach * (1 + Math.random());
      parts.push(
        Fx.anim(speck, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], { duration: 400 + Math.random() * 200, easing: 'ease-out' }).then(() => speck.remove())
      );
    }
    return Promise.all(parts).then(() => void 0);
  }
}
