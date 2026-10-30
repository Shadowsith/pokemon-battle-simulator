import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Normal-type punches, kicks and body blows. */
export class NormalBlowMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    dizzypunch: (refs, _launch, target, v) => NormalBlowMoveAnimations.playDizzyPunch(refs, target, v),
    doubleedge: (refs, launch, target, v) => NormalBlowMoveAnimations.playDoubleEdge(refs, launch, target, v),
    extremespeed: (refs, launch, target, v) => NormalBlowMoveAnimations.playExtremeSpeed(refs, launch, target, v),
    headbutt: (refs, _launch, target, v) => NormalBlowMoveAnimations.playHeadbutt(refs, target, v),
    megakick: (refs, _launch, target) => NormalBlowMoveAnimations.playMegaKick(refs, target),
    megapunch: (refs, _launch, target) => NormalBlowMoveAnimations.playMegaPunch(refs, target),
    slam: (refs, _launch, target) => NormalBlowMoveAnimations.playSlam(refs, target),
    strength: (refs, _launch, target) => NormalBlowMoveAnimations.playStrength(refs, target),
    takedown: (refs, _launch, target, v) => NormalBlowMoveAnimations.playTakeDown(refs, target, v),
    thrash: (refs, _launch, target) => NormalBlowMoveAnimations.playThrash(refs, target)
  };

  /**
   * Extreme Speed: the scene goes dark and turns into a green-cyan rush of
   * speed lines; the caster shoots up out of sight in a puff of grey dust,
   * the target is struck twice in a flash (yellow bursts, white dash streaks),
   * then the caster drops back in and the scene clears.
   */
  private static async playExtremeSpeed(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const f = fieldEl.getBoundingClientRect();
    const lr = launchEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();

    // 1. Dark (0-0.25 s), then the green-cyan speed rush (0.25-0.45 s).
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    const rush = document.createElement('div');
    rush.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#0A4A44,#1FA890 30%,#7AF0D8 50%,#1FA890 70%,#0A4A44)';
    dim.appendChild(rush);
    FxEffects.speedLines(rush, W, H, v.dir > 0 ? -1 : 1, ['#FFFFFF', '#B8FFF0']);
    await Fx.anim(rush, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });

    // 2. The caster shoots up out of sight, kicking up grey dust (0.45-0.75 s).
    FxEffects.smokePuff(fxEl, { x: launch.x, y: lr.bottom - f.top - lr.height * 0.1 }, Math.max(lr.width * 0.8, 60), ['#D8D8D8', '#A8A8A8']);
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    await Fx.anim(launchEl, [
      { transform: 'translateY(0)', opacity: 1 },
      { transform: 'translateY(-70px) scaleY(1.2)', opacity: 0 }
    ], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    launchEl.style.opacity = '0';
    await Fx.wait(100);

    // 3. Two strikes in a flash (0.85 / 1.1 s): a white dash streak across the target and a yellow burst.
    const size = Math.max(tr.width * 0.55, 46);
    const hits: Promise<void>[] = [];
    for (let i = 0; i < 2; i++) {
      if (i) await Fx.wait(250);
      const at: Point = { x: target.x + (i ? -1 : 1) * tr.width * 0.12, y: target.y + (i ? 1 : -1) * tr.height * 0.12 };
      const streak = document.createElement('div');
      const len = tr.width * 1.8 + 60;
      streak.style.cssText = `position:absolute;width:${len}px;height:4px;border-radius:4px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff,#ffffff00);box-shadow:0 0 6px #ffffff`;
      Fx.place(streak, at);
      fxEl.appendChild(streak);
      const tilt = i ? 18 : -14;
      hits.push(
        Fx.anim(streak, [
          { transform: `rotate(${tilt}deg) translateX(${-v.dir * len * 0.5}px) scaleX(.2)`, opacity: 0 },
          { transform: `rotate(${tilt}deg) translateX(0) scaleX(1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${tilt}deg) translateX(${v.dir * len * 0.4}px) scaleX(.4)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out' }).then(() => streak.remove())
      );
      const burst = FxGlyphs.spikyBurst(size, '#FFC820', '#FFF080');
      Fx.place(burst, at);
      fxEl.appendChild(burst);
      Fx.flash(targetEl, '#FFE04A', 0.6);
      Fx.shake(targetEl, 6);
      hits.push(
        Fx.anim(burst, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(12deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1.15) rotate(18deg)', opacity: 0 }
        ], { duration: 380, easing: 'ease-out' }).then(() => burst.remove())
      );
    }
    await Promise.all(hits);

    // 4. The caster drops back in (~1.45-1.7 s) and the scene clears (to ~2.05 s).
    await FxEffects.dropBackIn(launchEl);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Thrash: a wild flurry - six dark fists and feet slam onto the target one
   * after another, each over a yellow impact burst, every third with a white
   * starburst, while the target shakes.
   */
  private static async playThrash(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const size = Math.max(r.width * 0.5, 44);
    const hits: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      hits.push(
        Fx.wait(i * 150).then(() => {
          const at: Point = {
            x: target.x + (Math.random() * 2 - 1) * r.width * 0.3,
            y: target.y + (Math.random() * 2 - 1) * r.height * 0.25
          };
          const burst =
            i % 3 === 2
              ? FxGlyphs.spikyBurst(size * 1.1, '#ffffff', '#FFF6C8', '#ffffff')
              : FxGlyphs.spikyBurst(size, '#FFC820', '#FFF080');
          const glyph = i % 2 ? FxGlyphs.footGlyph(size * 0.4) : FxGlyphs.fistGlyph(size * 0.5, 'dark');
          Fx.place(burst, at);
          Fx.place(glyph, at);
          fxEl.appendChild(burst);
          fxEl.appendChild(glyph);
          Fx.flash(targetEl, '#FFE04A', 0.4);
          Fx.shake(targetEl, 5);
          const rot = Math.random() * 30 - 15;
          return Promise.all([
            Fx.anim(burst, [
              { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
              { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.3 },
              { transform: `scale(1.15) rotate(${rot}deg)`, opacity: 0 }
            ], { duration: 360, easing: 'ease-out' }).then(() => burst.remove()),
            Fx.anim(glyph, [
              { transform: 'scale(1.6)', opacity: 0 },
              { transform: 'scale(1)', opacity: 1, offset: 0.25 },
              { transform: 'scale(1)', opacity: 1, offset: 0.7 },
              { transform: 'scale(.9)', opacity: 0 }
            ], { duration: 360, easing: 'ease-out' }).then(() => glyph.remove())
          ]).then(() => void 0);
        })
      );
    }
    await Promise.all(hits);
  }

  /**
   * Take Down: the caster charges into the target - a white-gold flash, a
   * cloud of golden dust and gold sparkles drifting off it - then jolts from
   * the recoil.
   */
  private static async playTakeDown(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. The charge: contact at ~0.12 s.
    const charge = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);

    // 2. Impact: white-gold flash on the target.
    const size = Math.max(r.width * 0.7, 52);
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 20%,#FFF0B0 45%,#E8C04A00 72%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    const flashDone = Fx.anim(flash, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.1)', opacity: 0.9, offset: 0.4 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 360, easing: 'ease-out' }).then(() => flash.remove());
    Fx.flash(targetEl, '#FFE07A', 0.6);
    Fx.shake(targetEl, 6);

    // Golden dust billows out around the target.
    const rx = Math.max(r.width * 0.45, 32);
    const ry = Math.max(r.height * 0.35, 24);
    const dust: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const sz = 20 + Math.random() * 18;
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#D8B45Acc,#B08A3Aaa 50%,#8A6A2A00 72%)`;
      Fx.place(puff, target);
      fxEl.appendChild(puff);
      const ang = Math.random() * Math.PI * 2;
      const x = Math.cos(ang) * rx * (0.4 + Math.random() * 0.6);
      const y = Math.sin(ang) * ry * (0.4 + Math.random() * 0.6);
      dust.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${x * 0.7}px,${y * 0.7}px) scale(1)`, opacity: 0.85, offset: 0.3 },
          { transform: `translate(${x}px,${y - 10}px) scale(1.4)`, opacity: 0 }
        ], { duration: 750, easing: 'ease-out', delay: Math.random() * 100 }).then(() => puff.remove())
      );
    }
    // Gold sparkle dots scatter and drift up.
    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const sz = 3 + Math.random() * 4;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFBE0,#FFD040 60%);box-shadow:0 0 5px #FFC830`;
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const ang = Math.random() * Math.PI * 2;
      const d = rx * (0.8 + Math.random() * 0.9);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.8}px,${Math.sin(ang) * d * 0.7}px)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.7 - 14}px)`, opacity: 0 }
        ], { duration: 700 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 120 }).then(() => spark.remove())
      );
    }

    // 3. Recoil (~0.5 s): the caster jolts.
    await charge;
    await Fx.wait(120);
    Fx.flash(launchEl, '#ffffff', 0.4);
    Fx.shake(launchEl, 4);
    await Promise.all([flashDone, ...dust, ...sparks]);
  }

  /**
   * Strength: the caster powers up - its sprite glows red and trembles - then a flurry of fiery comic-style bursts pounds the target
   * while orange embers drift around it.
   */
  private static async playStrength(refs: BattleStageRefs, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;

    // 1. Power up: red tint and a trembling shake (0.8 s).
    const red = 'sepia(1) saturate(6) hue-rotate(-35deg) brightness(.95) drop-shadow(0 0 8px #FF3A1A)';
    const tint = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: red, offset: 0.25 },
      { filter: red, offset: 0.8 },
      { filter: 'none' }
    ], { duration: 800, easing: 'ease-in-out', fill: 'none' });
    const base = launchEl.style.transform;
    const tremble: Keyframe[] = [];
    for (let k = 0; k <= 12; k++) tremble.push({ transform: `${base} translateX(${k === 0 || k === 12 ? 0 : k % 2 ? 3 : -3}px)` });
    await Promise.all([tint, Fx.anim(launchEl, tremble, { duration: 800, easing: 'linear', fill: 'none' })]);

    // 2. Six bursts pound the target one after another.
    const r = targetEl.getBoundingClientRect();
    const size = Math.max(r.width * 0.4, 36);
    const hits: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      hits.push(
        Fx.wait(i * 120).then(() => {
          const burst = FxGlyphs.spikyBurst(size * (0.8 + Math.random() * 0.4), '#FF5A1A', '#FFC23A');
          Fx.place(burst, {
            x: target.x + (Math.random() * 2 - 1) * r.width * 0.35,
            y: target.y + (Math.random() * 2 - 1) * r.height * 0.3
          });
          fxEl.appendChild(burst);
          Fx.shake(targetEl, 4);
          if (i % 2 === 0) Fx.flash(targetEl, '#FFB13C', 0.5);
          const rot = Math.random() * 40 - 20;
          return Fx.anim(burst, [
            { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
            { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.3 },
            { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
            { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 0 }
          ], { duration: 480, easing: 'ease-out' }).then(() => burst.remove());
        })
      );
    }
    // Orange embers drift up around the target.
    const reach = Math.max(r.width * 0.8, 60);
    for (let i = 0; i < 10; i++) {
      const s = 4 + Math.random() * 4;
      const ember = document.createElement('div');
      ember.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0C0,#FF9A2A 60%);box-shadow:0 0 6px #FF8A1F`;
      Fx.place(ember, { x: target.x + (Math.random() * 2 - 1) * reach, y: target.y + (Math.random() * 2 - 1) * reach * 0.6 });
      fxEl.appendChild(ember);
      Fx.anim(ember, [
        { transform: 'translateY(0) scale(0)', opacity: 0 },
        { transform: 'translateY(-6px) scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'translateY(-20px) scale(.5)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out', delay: Math.random() * 500 }).then(() => ember.remove());
    }
    await Promise.all([...hits, Fx.wait(1100)]);
  }

  /**
   * Slam: a white-yellow flash on the target, which is squashed flat for a
   * moment, while glowing red-and-white sparks fly out around it.
   */
  private static async playSlam(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    const size = Math.max(r.width * 0.75, 52);
    const flash = document.createElement('div');
    flash.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 25%,#FFF6B0 50%,#FFE45A00 72%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    const flashDone = Fx.anim(flash, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.1)', opacity: 0.9, offset: 0.4 },
      { transform: 'scale(1.25)', opacity: 0 }
    ], { duration: 380, easing: 'ease-out' }).then(() => flash.remove());

    // Squash: flattened from the top, then springs back.
    const origin = targetEl.style.transformOrigin;
    const base = targetEl.style.transform;
    targetEl.style.transformOrigin = 'center bottom';
    const squash = Fx.anim(targetEl, [
      { transform: `${base} scale(1,1)` },
      { transform: `${base} scale(1.14,.78)`, offset: 0.3 },
      { transform: `${base} scale(.96,1.04)`, offset: 0.7 },
      { transform: `${base} scale(1,1)` }
    ], { duration: 380, easing: 'ease-out', fill: 'none' }).then(() => (targetEl.style.transformOrigin = origin));
    Fx.flash(targetEl, '#FFF3A0', 0.6);

    // Red-and-white glowing sparks fly out in all directions.
    const sparks: Promise<void>[] = [];
    const reach = Math.max(r.width * 0.45, 34);
    for (let i = 0; i < 12; i++) {
      const s = 7 + Math.random() * 5;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${s}px;height:${s * 1.5}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#fff 0 35%,#FF6A3A 65%,#E0201A);box-shadow:0 0 6px #FF4A2A`;
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const d = reach * (0.7 + Math.random() * 0.5);
      const x = Math.cos(ang) * d;
      const y = Math.sin(ang) * d * 0.8;
      const tilt = (ang * 180) / Math.PI + 90;
      sparks.push(
        Fx.anim(spark, [
          { transform: `translate(0,0) rotate(${tilt}deg) scale(.4)`, opacity: 1 },
          { transform: `translate(${x * 0.8}px,${y * 0.8}px) rotate(${tilt}deg) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${x}px,${y}px) rotate(${tilt}deg) scale(.6)`, opacity: 0 }
        ], { duration: 480 + Math.random() * 120, easing: 'ease-out', delay: 40 }).then(() => spark.remove())
      );
    }
    await Promise.all([flashDone, squash, ...sparks]);
  }

  /**
   * Dizzy Punch: the caster lunges, a yellow fist slams onto the target, then
   * little yellow birds fly out of the fist in arcs and circle dizzily in a
   * row above the target's head, with stars twinkling between them.
   */
  private static async playDizzyPunch(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // Lunge in.
    const original = launchEl.style.transform;
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(${v.dir * -10}px)` },
      { transform: `${original} translateX(${v.dir * 42}px)` }
    ], { duration: 170, easing: 'ease-in', fill: 'none' });

    // The fist slams in from big to normal size.
    const fist = FxGlyphs.fistGlyph(Math.max(r.width * 0.5, 40));
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    Fx.anim(launchEl, [{ transform: `${original} translateX(${v.dir * 42}px)` }, { transform: original }], {
      duration: 160,
      easing: 'ease-out',
      fill: 'none'
    });
    await Fx.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 160, easing: 'ease-in' });
    Fx.flash(targetEl, '#FFE04A', 0.6);
    Fx.shake(targetEl, 5);
    for (let i = 0; i < 6; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 5, '#FFF6C8');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 6;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * 40}px,${Math.sin(ang) * 30}px) scale(1)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out' }).then(() => star.remove());
    }
    Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 500, easing: 'ease-in' }).then(() => fist.remove());

    // Birds fly out of the fist in arcs and line up above the target's head.
    const spread = Math.max(r.width * 0.75, 50);
    const rowY = -Math.max(r.height * 0.6, 40);
    const slots = [-1, -0.35, 0.35, 1];
    const fly = 620;
    const hover = 900;
    const flights = slots.map((sx, i) => {
      const bird = FxGlyphs.birdGlyph(22);
      Fx.place(bird, target);
      fxEl.appendChild(bird);
      const end = { x: sx * spread, y: rowY };
      const ctrl = { x: sx * spread * 1.3, y: rowY - 50 };
      const face = sx < 0 ? -1 : 1;
      const frames: Keyframe[] = [];
      const steps = 12;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        const x = 2 * u * t * ctrl.x + t * t * end.x;
        const y = 2 * u * t * ctrl.y + t * t * end.y;
        frames.push({ transform: `translate(${x}px,${y}px) scaleX(${face}) scale(${0.4 + t * 0.6})`, opacity: Math.min(1, t * 4) });
      }
      const at = `translate(${end.x}px,${end.y}px) scaleX(${face})`;
      return Fx.anim(bird, frames, { duration: fly, easing: 'ease-out', delay: i * 60 })
        .then(() =>
          // Dizzy bobbing, out of step with the neighbours, then fade.
          Fx.anim(bird, [
            { transform: `${at}`, opacity: 1 },
            { transform: `${at} translateY(${i % 2 ? 5 : -5}px)`, opacity: 1, offset: 0.25 },
            { transform: `${at}`, opacity: 1, offset: 0.5 },
            { transform: `${at} translateY(${i % 2 ? 5 : -5}px)`, opacity: 1, offset: 0.75 },
            { transform: `${at}`, opacity: 0 }
          ], { duration: hover, easing: 'ease-in-out' })
        )
        .then(() => bird.remove());
    });

    // Stars twinkle above and between the birds while they bob.
    for (let i = 0; i < 5; i++) {
      const star = FxGlyphs.sparkStar(9, '#FFE04A');
      Fx.place(star, { x: target.x + (i - 2) * spread * 0.45, y: target.y + rowY - 16 - (i % 2) * 6 });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.4) rotate(90deg)', opacity: 0.6, offset: 0.6 },
        { transform: 'scale(1) rotate(135deg)', opacity: 1, offset: 0.8 },
        { transform: 'scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: hover, easing: 'ease-in-out', delay: fly + i * 40 }).then(() => star.remove());
    }
    await Promise.all(flights);
  }

  /**
   * Double-Edge: the caster runs one small circle on the spot while still
   * facing the target, the scene goes dark, then it rams the
   * target: a blazing orange sunburst fills the backdrop, colourful sparkles
   * fly out and the target is squashed flat for a moment. Then recoil.
   */
  private static async playDoubleEdge(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;

    // 1. Run one small circle on the spot (backwards first, then round), still facing the target.
    const radius = 14;
    const circle: Keyframe[] = [];
    const steps = 16;
    for (let k = 0; k <= steps; k++) {
      const a = (Math.PI * 2 * k) / steps;
      // Starts and ends at the home spot; flattened, since the circle lies on the ground.
      circle.push({ transform: `translate(${-v.dir * Math.sin(a) * radius}px,${(1 - Math.cos(a)) * radius * -0.5}px)` });
    }
    await Fx.anim(launchEl, circle, { duration: 600, easing: 'linear', fill: 'none' });

    // 2. The scene goes dark.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await Fx.wait(150);

    // 3. Ram the target.
    const dash = v.dir * 60;
    await Fx.anim(launchEl, [
      { transform: `translateX(${v.dir * -12}px)` },
      { transform: `translateX(${dash}px)` }
    ], { duration: 160, easing: 'ease-in', fill: 'none' });

    // Sunburst backdrop centred on the target: white core, orange rays, darker rim.
    const at = `${target.x}px ${target.y}px`;
    const burst = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${at},#fff 0 6%,#FFF6C8 14%,#FFE08A00 42%),` +
        `radial-gradient(circle at ${at},transparent 50%,#C84A0099 100%),` +
        `repeating-conic-gradient(from 0deg at ${at},#FF8A10 0 7deg,#FFC23A 7deg 14deg)`
    );
    dim.remove();
    const burstShow = Fx.anim(burst, [
      { opacity: 1, transform: 'scale(1.15)' },
      { opacity: 1, transform: 'scale(1)', offset: 0.7 },
      { opacity: 0, transform: 'scale(1)' }
    ], { duration: 1000, easing: 'ease-out' }).then(() => burst.remove());

    Fx.anim(launchEl, [{ transform: `translateX(${dash}px)` }, { transform: 'translateX(0)' }], {
      duration: 260,
      easing: 'ease-out',
      fill: 'none'
    });

    // Target squashed flat on impact, then springs back.
    const origin = targetEl.style.transformOrigin;
    targetEl.style.transformOrigin = 'center bottom';
    Fx.anim(targetEl, [
      { transform: 'scale(1,1)' },
      { transform: 'scale(1.18,.72)', offset: 0.25 },
      { transform: 'scale(.94,1.06)', offset: 0.6 },
      { transform: 'scale(1,1)' }
    ], { duration: 520, easing: 'ease-out', fill: 'none' }).then(() => (targetEl.style.transformOrigin = origin));
    Fx.flash(targetEl, '#ffffff', 0.8);
    Fx.shakeField(fieldEl, 0.8);

    // Sparkles: cyan stars and red / orange / white dots fly out from the target.
    const colors = ['#5FF0E0', '#F04060', '#FF9A2A', '#ffffff', '#F25A9A'];
    for (let i = 0; i < 26; i++) {
      const c = colors[i % colors.length];
      const s = 6 + Math.random() * 8;
      let p: HTMLElement;
      if (i % 3 === 0) {
        p = FxGlyphs.sparkStar(s + 4, c);
      } else {
        p = document.createElement('div');
        p.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,${c} 55%,${c}00 80%)`;
      }
      Fx.place(p, target);
      fxEl.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 80;
      Fx.anim(p, [
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist * 0.7}px,${Math.sin(ang) * dist * 0.7}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(.6) rotate(140deg)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 300, easing: 'ease-out', delay: Math.random() * 120 }).then(() => p.remove());
    }

    await burstShow;
    FxEffects.afterImpact(refs, launch, target, v);
  }

  /**
   * Headbutt: the caster darts forward and straight back, then the target is
   * hit: a bright white-yellow starburst flares on it and a ring of yellow
   * stars bursts outward.
   */
  private static async playHeadbutt(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. Quick dart forward and back.
    await FxEffects.dart(launchEl, v.dir);

    // 2. Hit: starburst flare on the target.
    const size = Math.max(r.width * 0.8, 56);
    const flare = document.createElement('div');
    flare.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 8px #FFF2A0)`;
    const shape = document.createElement('div');
    shape.style.cssText = 'width:100%;height:100%;clip-path:polygon(50% 0,56% 38%,85% 15%,62% 44%,100% 50%,62% 56%,85% 85%,56% 62%,50% 100%,44% 62%,15% 85%,38% 56%,0 50%,38% 44%,15% 15%,44% 38%);background:radial-gradient(circle,#fff 0 25%,#FFF6C0 45%,#FFE04A00 75%)';
    flare.appendChild(shape);
    Fx.place(flare, target);
    fxEl.appendChild(flare);
    const flareDone = Fx.anim(flare, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(15deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.3) rotate(25deg)', opacity: 0 }
    ], { duration: 450, easing: 'ease-out' }).then(() => flare.remove());

    // Ring of yellow stars bursting outward.
    const n = 10;
    const rad = Math.max(r.width * 0.6, 40);
    for (let i = 0; i < n; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 6, '#FFD84A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / n + Math.random() * 0.3;
      const x = Math.cos(ang) * rad;
      const y = Math.sin(ang) * rad * 0.85;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${x}px,${y}px) scale(1) rotate(60deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x * 1.15}px,${y * 1.15}px) scale(.5) rotate(90deg)`, opacity: 0 }
      ], { duration: 550, easing: 'ease-out' }).then(() => star.remove());
    }
    Fx.flash(targetEl, '#FFF2A0', 0.7);
    Fx.shake(targetEl, 6);
    await flareDone;
    await Fx.wait(150);
  }

  /**
   * Mega Kick: the field goes black, then a red backdrop with yellow burst
   * lines flares up around the target while a big dark red foot appears over
   * it, vibrates with power and stamps down.
   */
  private static async playMegaKick(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // Red backdrop with yellow-orange burst lines radiating from the target.
    const at = `${target.x}px ${target.y}px`;
    const red = document.createElement('div');
    red.style.cssText = `position:absolute;inset:0;background:radial-gradient(circle at ${at},#FF3A1A,#C80E0E 35%,#6A0404 85%)`;
    const lines = document.createElement('div');
    lines.style.cssText =
      `position:absolute;inset:0;transform-origin:${at};` +
      `background:radial-gradient(circle at ${at},#C80E0E 0 14%,#C80E0E00 30%),` +
      `repeating-conic-gradient(from 0deg at ${at},#FFC23A00 0 9deg,#FFB03Add 9deg 11deg,#FFE87A 11deg 12deg,#FFC23A00 12deg 22deg)`;
    red.appendChild(lines);
    black.appendChild(red);
    await Fx.anim(red, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
    const flicker = lines.animate([
      { transform: 'scale(1) rotate(0deg)', opacity: 0.85 },
      { transform: 'scale(1.06) rotate(1.5deg)', opacity: 1 },
      { transform: 'scale(1) rotate(0deg)', opacity: 0.85 }
    ], { duration: 160, iterations: Infinity });

    // The big foot: pops in over the target, vibrates, then stamps down.
    const r = targetEl.getBoundingClientRect();
    const w = Math.max(r.width * 0.85, 70);
    const foot = FxGlyphs.footGlyph(w, '#7A1410');
    foot.style.filter = 'drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000) drop-shadow(0 0 6px #00000088)';
    Fx.place(foot, { x: target.x + w * 0.1, y: target.y - w * 0.25 });
    fxEl.appendChild(foot);
    await Fx.anim(foot, [
      { transform: 'scale(.2) rotate(-10deg)', opacity: 0 },
      { transform: 'scale(1.1) rotate(-6deg)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1) rotate(-6deg)', opacity: 1 }
    ], { duration: 220, easing: 'ease-out', fill: 'forwards' });
    const jitter: Keyframe[] = [];
    for (let k = 0; k <= 14; k++) {
      const a = k === 14 ? 0 : 3;
      jitter.push({ transform: `translate(${(Math.random() * 2 - 1) * a}px,${(Math.random() * 2 - 1) * a}px) rotate(-6deg)` });
    }
    await Fx.anim(foot, jitter, { duration: 650, easing: 'linear', fill: 'forwards' });
    await Fx.anim(foot, [
      { transform: 'translate(0,0) rotate(-6deg) scale(1)', opacity: 1 },
      { transform: `translate(0,${w * 0.12}px) rotate(-6deg) scale(.92,.88)`, opacity: 1 }
    ], { duration: 90, easing: 'ease-in', fill: 'forwards' });
    Fx.flash(targetEl, '#FF6A2A', 0.8);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 0.8);
    await Fx.anim(foot, [
      { transform: `translate(0,${w * 0.12}px) rotate(-6deg) scale(.92,.88)`, opacity: 1 },
      { transform: `translate(0,${w * 0.12}px) rotate(-6deg) scale(1)`, opacity: 0 }
    ], { duration: 380, easing: 'ease-out', delay: 120 });
    foot.remove();

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    flicker.cancel();
    black.remove();
  }

  /**
   * Mega Punch: the field goes black, then a red fist slams onto the target
   * with a yellow hit burst around it; red and yellow sparks scatter upward
   * and the ground quakes from the force of the blow.
   */
  private static async playMegaPunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const black = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const r = targetEl.getBoundingClientRect();
    const fistW = Math.max(r.width * 0.6, 46);

    // The fist comes in big from the front and slams onto the target.
    const fist = FxGlyphs.fistGlyph(fistW, 'red');
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [
      { transform: 'scale(2.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 170, easing: 'ease-in', fill: 'forwards' });

    // Yellow hit burst behind the fist, plus a ring spreading out from it.
    const burst = FxGlyphs.spikyBurst(fistW * 1.9, '#FFC21A', '#FFE84A', '#FFFBE0');
    Fx.place(burst, target);
    fxEl.insertBefore(burst, fist);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(12deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(18deg)', opacity: 0.9, offset: 0.7 },
      { transform: 'scale(1.15) rotate(22deg)', opacity: 0 }
    ], { duration: 620, easing: 'ease-out' }).then(() => burst.remove());
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${fistW}px;height:${fistW}px;border-radius:50%;pointer-events:none;border:4px solid #FFE04A;box-shadow:0 0 10px #FFC21A`;
    Fx.place(ring, target);
    fxEl.insertBefore(ring, fist);
    Fx.anim(ring, [
      { transform: 'scale(.5)', opacity: 1 },
      { transform: 'scale(2.4)', opacity: 0 }
    ], { duration: 480, easing: 'ease-out' }).then(() => ring.remove());

    // The ground quakes with the force of the blow.
    Fx.flash(targetEl, '#FFC21A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 1.1);
    setTimeout(() => Fx.shakeField(fieldEl, 0.7), 480);

    // Red and yellow sparks scatter up and out over the fist.
    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      const s = 4 + Math.random() * 6;
      const c = i % 2 ? '#FF3A2A' : '#FFC21A';
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,${c} 55%);box-shadow:0 0 6px ${c}`;
      Fx.place(spark, { x: target.x + (Math.random() * 2 - 1) * fistW * 0.4, y: target.y - fistW * 0.2 });
      fxEl.appendChild(spark);
      const ang = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.3;
      const dist = fistW * (0.8 + Math.random() * 1.2);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * dist * 0.5}px,${Math.sin(ang) * dist * 0.5}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(.8)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 6}px) scale(.5)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 300, easing: 'ease-out', delay: Math.random() * 200 }).then(() => spark.remove())
      );
    }

    await Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.04)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 800, easing: 'ease-in' });
    fist.remove();
    await Promise.all([burstDone, ...sparks]);

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    black.remove();
  }
}
