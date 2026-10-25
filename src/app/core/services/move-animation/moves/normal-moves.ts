import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Normal-type moves. */
export class NormalMoveAnimations {
  /** Hand-made Normal move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    barrage: (refs, launch, target) => NormalMoveAnimations.playBarrage(refs, launch, target),
    bind: (refs, _launch, target) => NormalMoveAnimations.playBind(refs, target),
    dizzypunch: (refs, _launch, target, v) => NormalMoveAnimations.playDizzyPunch(refs, target, v),
    doubleedge: (refs, launch, target, v) => NormalMoveAnimations.playDoubleEdge(refs, launch, target, v),
    eggbomb: (refs, launch, target) => NormalMoveAnimations.playEggBomb(refs, launch, target),
    explosion: (refs, launch, target, v) => NormalMoveAnimations.playExplosion(refs, launch, target, v),
    glare: (refs, launch, target) => NormalMoveAnimations.playGlare(refs, launch, target),
    headbutt: (refs, _launch, target, v) => NormalMoveAnimations.playHeadbutt(refs, target, v),
    hyperfang: (refs, _launch, target, v) => NormalMoveAnimations.playHyperFang(refs, target, v),
    hyperbeam: (refs, launch, target) => NormalMoveAnimations.playHyperBeam(refs, launch, target)
  };

  /**
   * Barrage: one large glowing white orb is lobbed at the target; the ground
   * shakes once it lands.
   */
  private static async playBarrage(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, fieldEl, targetEl } = refs;
    const size = 46;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const arc = Math.min(launch.y, target.y) - 70 - launch.y;

    const orb = document.createElement('div');
    orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 38% 32%,#fff,#F3EEFF 45%,#CFC6E6 80%,#B7ADD4);box-shadow:0 0 14px #fff,0 0 28px #E8E0FFaa`;
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    await Fx.anim(orb, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0, offset: 0 },
      { transform: `translate(${dx * 0.12}px,${arc * 0.4}px) scale(.75)`, opacity: 1, offset: 0.12 },
      { transform: `translate(${dx * 0.5}px,${arc}px) scale(1)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(1.1)`, offset: 1 }
    ], { duration: 620, easing: 'ease-in' });

    // Impact: the orb squashes and bursts into light, the target recoils, then the ground shakes.
    Fx.anim(orb, [
      { transform: `translate(${dx}px,${dy}px) scale(1.1,1.1)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(1.6,1.2)`, opacity: 0 }
    ], { duration: 260, easing: 'ease-out' }).then(() => orb.remove());
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    await Fx.wait(120);
    Fx.shakeField(fieldEl, 0.6);
    await Fx.wait(480);
  }

  /**
   * Bind: nested dark arcs close in on both sides of the target and squeeze
   * in and out quickly while the target is pressed together.
   */
  private static async playBind(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const baseW = Math.max(r.width * 0.95, 60);
    const baseH = Math.max(r.height * 0.8, 50);
    const squeezes = 6;
    const beat = 150;
    const hold = squeezes * beat;

    // Only the left and right borders are coloured, so each ring reads as "( )".
    const rings: HTMLElement[] = [];
    for (let i = 0; i < 4; i++) {
      const w = baseW * (1 + i * 0.14);
      const h = baseH * (1 - i * 0.06);
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;border:${3 - i * 0.4}px solid transparent;border-left-color:#1E1A24;border-right-color:#1E1A24;opacity:${0.85 - i * 0.15}`;
      Fx.place(ring, target);
      fxEl.appendChild(ring);
      rings.push(ring);
    }

    // Close in from wide, then pulse: tight - loose - tight ...
    const frames = (i: number): Keyframe[] => {
      const out: Keyframe[] = [{ transform: 'scaleX(1.6)', opacity: 0, offset: 0 }];
      const start = 0.15;
      for (let k = 0; k <= squeezes * 2; k++) {
        out.push({
          transform: `scaleX(${k % 2 ? 1.08 + i * 0.02 : 0.86})`,
          opacity: 1,
          offset: start + (k / (squeezes * 2)) * (0.85 - start)
        });
      }
      out.push({ transform: 'scaleX(1.2)', opacity: 0, offset: 1 });
      return out;
    };
    const total = hold / 0.7;
    const done = rings.map((ring, i) =>
      Fx.anim(ring, frames(i), { duration: total, easing: 'ease-in-out', delay: i * 20 }).then(() => ring.remove())
    );

    // The target gets squeezed in time with the arcs.
    const original = targetEl.style.transform;
    const squash: Keyframe[] = [{ transform: original, offset: 0 }];
    for (let k = 0; k <= squeezes * 2; k++) {
      squash.push({
        transform: `${original} scaleX(${k % 2 ? 1 : 0.93})`,
        offset: 0.15 + (k / (squeezes * 2)) * 0.7
      });
    }
    squash.push({ transform: original, offset: 1 });
    // A dim flash on every tight squeeze (the even keyframes above).
    for (let j = 0; j < squeezes; j++) {
      setTimeout(() => Fx.flash(targetEl, '#8a7a9a', 0.25), total * (0.15 + (j / squeezes) * 0.7));
    }
    await Fx.anim(targetEl, squash, { duration: total, easing: 'ease-in-out' });
    targetEl.getAnimations?.().forEach((a) => a.cancel());
    targetEl.style.transform = original;
    await Promise.all(done);
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
   * Egg Bomb: a white egg is lobbed in a high arc, tumbling, onto the target,
   * where it blows up in a fiery blast with red sparks flying out.
   */
  private static async playEggBomb(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. The egg flies in a high arc and lands on the target.
    const egg = document.createElement('div');
    egg.style.cssText = 'position:absolute;width:20px;height:26px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#fff 0 30%,#ECEAE4 60%,#BDB9B0);box-shadow:0 0 3px #00000055';
    Fx.place(egg, launch);
    fxEl.appendChild(egg);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const apexY = Math.min(0, dy) - 120;
    const steps = 14;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const x = t * dx;
      const y = 2 * u * t * apexY + t * t * dy;
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${t * 300 * Math.sign(dx || 1)}deg) scale(${0.8 + t * 0.2})`, opacity: t === 0 ? 0 : 1 });
    }
    await Fx.anim(egg, frames, { duration: 700, easing: 'ease-in' });
    egg.remove();

    // 2. Explosion on the target.
    const blast = FxEffects.fireBlastCloud(fxEl, { x: target.x, y: target.y + r.height * 0.1 }, Math.max(r.width * 0.55, 44), 12, '#E0201A');
    Fx.flash(targetEl, '#FFB13C', 0.8);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    await blast;
  }

  /**
   * Explosion: glowing orange sparks gather into the caster as it lights up,
   * then it blows up - a huge fireball with light rays and a white flash that
   * fill the screen - and the target is hit (blinking).
   */
  private static async playExplosion(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl, screenFxEl } = refs;
    const field = fieldEl.getBoundingClientRect();
    const r = launchEl.getBoundingClientRect();

    // 1. Orange sparks drift in from all around and gather on the caster.
    const gather = 900;
    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.8) drop-shadow(0 0 12px #FFB060)' }
    ], { duration: gather, easing: 'ease-in', fill: 'forwards' });
    for (let i = 0; i < 14; i++) {
      const s = 8 + Math.random() * 6;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0C0,#FF8A2A 45%,#F0501A00 75%);box-shadow:0 0 ${s}px #FF8A2A`;
      const ang = Math.random() * Math.PI * 2;
      const dist = Math.max(r.width * 0.7, 50) * (0.8 + Math.random() * 0.4);
      Fx.place(orb, { x: launch.x + Math.cos(ang) * dist, y: launch.y + Math.sin(ang) * dist * 0.8 });
      fxEl.appendChild(orb);
      Fx.anim(orb, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.3 },
        { transform: `translate(${-Math.cos(ang) * dist}px,${-Math.sin(ang) * dist * 0.8}px) scale(.3)`, opacity: 0.8 }
      ], { duration: 600, easing: 'ease-in', delay: Math.random() * (gather - 600) }).then(() => orb.remove());
    }
    await glow;

    // 2. Boom: white flash, light rays and a giant fireball on the caster.
    const at = `${launch.x}px ${launch.y}px`;
    // Behind the sprites, so the target stays visible in front of the glare.
    const rays = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${at},#fff 0 18%,#FFFDF0cc 35%,#FFF6D000 70%),` +
        `repeating-conic-gradient(from 0deg at ${at},#FFE87Acc 0 8deg,#FFE87A00 8deg 24deg),#FFFBEF`
    );
    const raysShow = Fx.anim(rays, [
      { opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { opacity: 1, offset: 0.65 },
      { opacity: 0 }
    ], { duration: 1400, easing: 'ease-out' }).then(() => rays.remove());
    Fx.screenWash(screenFxEl, '#ffffffcc', 80, 200, `${(launch.x / field.width) * 100}%`);
    launchEl.getAnimations().forEach((a) => a.cancel());
    const blast = FxEffects.fireBlastCloud(fxEl, launch, Math.max(field.width * 0.32, 110), 18, '#FF8A2A');
    Fx.shakeField(fieldEl, 1.4);

    // 3. The target is caught in the blast.
    await Fx.wait(250);
    await Promise.all([Fx.blink(targetEl), FxEffects.impact(refs, target, v, 0)]);
    await Promise.all([blast, raysShow]);
  }

  /**
   * Glare: the scene turns dark red and a pair of glowing red snake eyes
   * opens above the field and stares; then the target is paralysed - its
   * sprite goes dark while yellow sparks crackle around it.
   */
  private static async playGlare(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const field = fieldEl.getBoundingClientRect();

    const dark = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 45% 40%,#4A1A12,#24080A 60%,#120404)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 1. The eyes open (squeezed flat -> open), glow, narrow once, then fade.
    const eyeW = Math.max(field.width * 0.16, 56);
    const gap = eyeW * 0.25;
    const centre = { x: (launch.x + target.x) / 2, y: Math.min(launch.y, target.y) - 10 };
    const eyes = [-1, 1].map((side) => {
      const eye = FxGlyphs.snakeEyeGlyph(eyeW, side as 1 | -1);
      Fx.place(eye, { x: centre.x + side * (eyeW / 2 + gap / 2), y: centre.y });
      fxEl.appendChild(eye);
      return eye;
    });
    await Promise.all(
      eyes.map((eye) =>
        Fx.anim(eye, [
          { transform: 'scaleY(0)', opacity: 0 },
          { transform: 'scaleY(1.1)', opacity: 1, offset: 0.7 },
          { transform: 'scaleY(1)', opacity: 1 }
        ], { duration: 280, easing: 'ease-out' })
      )
    );
    await Promise.all(
      eyes.map((eye) =>
        Fx.anim(eye, [
          { transform: 'scaleY(1)', filter: 'brightness(1)' },
          { transform: 'scaleY(.55)', filter: 'brightness(1.6)', offset: 0.45 },
          { transform: 'scaleY(1)', filter: 'brightness(1.3)', offset: 0.7 },
          { transform: 'scaleY(1)', filter: 'brightness(1)' }
        ], { duration: 600, easing: 'ease-in-out' })
      )
    );
    eyes.forEach((eye) =>
      Fx.anim(eye, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => eye.remove())
    );

    // 2. Shock: the target goes dark and twitches while sparks crackle round it.
    const r = targetEl.getBoundingClientRect();
    const darken = Fx.anim(targetEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(.35) saturate(.6)', offset: 0.15 },
      { filter: 'brightness(.45) saturate(.6)', offset: 0.85 },
      { filter: 'brightness(1)' }
    ], { duration: 1100, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const bolt = FxGlyphs.boltGlyph('#FFE04A', 8 + Math.random() * 6);
        Fx.place(bolt, {
          x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.5, 26),
          y: target.y + (Math.random() * 2 - 1) * Math.max(r.height * 0.45, 24)
        });
        bolt.style.filter = 'drop-shadow(0 0 4px #FFE04A)';
        fxEl.appendChild(bolt);
        const rot = Math.random() * 60 - 30;
        Fx.anim(bolt, [
          { transform: `rotate(${rot}deg) scale(.4)`, opacity: 0 },
          { transform: `rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out' }).then(() => bolt.remove());
        if (i % 3 === 0) Fx.shake(targetEl, 3);
      }, 60 + i * 70);
    }
    await darken;

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
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
   * Hyper Beam: the backdrop turns bright green with dark green streaks racing
   * along the top and bottom edges. A thick golden beam with a spiky glowing
   * fringe and rolling energy bulges blasts the target, throwing off sparkles.
   */
  private static async playHyperBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const gold = '#FFC21A';

    // Backdrop: green field, with streaks scrolling in a band along the top and bottom edges.
    const bg = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#3E8E1E,#8CC63A 22%,#C9E35A 50%,#8CC63A 78%,#3E8E1E);opacity:0');
    for (let i = 0; i < 26; i++) {
      const top = i % 2 === 0;
      const len = 30 + Math.random() * 70;
      const h = 4 + Math.random() * 6;
      const y = top ? Math.random() * H * 0.2 : H * 0.8 + Math.random() * H * 0.2 - h;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${y}px;width:${len}px;height:${h}px;border-radius:${h}px;background:${Math.random() < 0.6 ? '#1F6A12' : '#2E8A1A'};opacity:${0.6 + Math.random() * 0.4}`;
      bg.appendChild(streak);
      streak.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px)` },
          { transform: `translateX(${dir > 0 ? W : -len}px)` }
        ],
        { duration: 500 + Math.random() * 400, delay: -Math.random() * 900, iterations: Infinity, easing: 'linear' }
      );
    }
    // The scene goes dark first; backdrop() inserts at the back, so the dim layer sits behind the green one.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await Fx.wait(150);
    await Fx.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-in-out' });
    dim.remove();

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nx = -dy / dist;
    const ny = dx / dist;
    const thick = 40;
    const len = dist + 30; // reaches a little past the target, as if blasting through it
    const grow = 220;
    const hold = 1000;
    const fadeOut = 280;
    const total = grow + hold + fadeOut;

    // Beam: a spiky cream fringe (tiled SVG spikes) around a golden core of rolling bulges.
    const spikes =
      'url("data:image/svg+xml,' +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="40" viewBox="0 0 12 40" preserveAspectRatio="none">' +
          '<path d="M0,20 L1,7 L3,14 L6,1 L8,13 L11,5 L12,20 L11,35 L8,27 L6,39 L3,26 L1,33 Z" fill="#FFF4C8"/>' +
          '</svg>'
      ) +
      '")';
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${len}px;height:${thick}px;pointer-events:none;transform-origin:0 50%;filter:drop-shadow(0 0 6px ${gold})`;
    const fringe = document.createElement('div');
    fringe.style.cssText = `position:absolute;inset:0;background:${spikes} 0 0/12px 100% repeat-x`;
    const core = document.createElement('div');
    core.style.cssText = `position:absolute;left:0;right:0;top:22%;height:56%;border-radius:${thick}px;background:radial-gradient(ellipse at center,#FFFBE0 0,#FFE066 30%,${gold} 55%,#E89200 72%,transparent 74%) 0 0/26px 100% repeat-x`;
    beam.append(fringe, core);
    fxEl.appendChild(beam);
    // Spikes and bulges roll along the beam towards the target.
    fringe.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '36px 0' }], { duration: 160, iterations: Infinity });
    core.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '52px 0' }], { duration: 160, iterations: Infinity });

    const rot = `rotate(${angle}deg)`;
    const frames: Keyframe[] = [{ transform: `${rot} scale(0,.6)`, opacity: 1, offset: 0 }];
    const flickers = 12;
    for (let k = 0; k <= flickers; k++) {
      frames.push({
        transform: `${rot} scale(1,${k % 2 ? 0.88 : 1.1})`,
        opacity: 1,
        offset: (grow + (k / flickers) * hold) / total
      });
    }
    frames.push({ transform: `${rot} scale(1,.1)`, opacity: 0, offset: 1 });
    const beamDone = Fx.anim(beam, frames, { duration: total, easing: 'linear' }).then(() => beam.remove());

    // Golden and white sparkles burst off the sides of the beam.
    for (let i = 0; i < 36; i++) {
      const t = Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = side * (10 + Math.random() * 8);
      const drift = side * (14 + Math.random() * 26);
      const star = FxGlyphs.sparkStar(7 + Math.random() * 9, i % 3 ? gold : '#FFFFFF');
      Fx.place(star, { x: launch.x + dx * t + nx * off, y: launch.y + dy * t + ny * off });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${nx * drift * 0.4}px,${ny * drift * 0.4}px) scale(1.2) rotate(70deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${nx * drift}px,${ny * drift}px) scale(.2) rotate(160deg)`, opacity: 0 }
      ], { duration: 450 + Math.random() * 250, easing: 'ease-out', delay: grow * t + Math.random() * hold * 0.85 }).then(() => star.remove());
    }

    // Impact: the target is pummelled with golden flashes and the field shakes.
    await Fx.wait(grow);
    Fx.shakeField(fieldEl, 0.8);
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, gold, 0.6);
        Fx.shake(targetEl, 5);
      }, i * 210);
    }
    await beamDone;

    // Final burst of sparkles from the target.
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, i % 2 ? gold : '#FFFFFF');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 10;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * 46}px,${Math.sin(ang) * 46}px) scale(1)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => star.remove());
    }
    await Fx.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    bg.remove();
  }

  /**
   * Hyper Fang: a pair of big rodent incisors chomps diagonally down into the
   * target, while clusters of little red sparkles twinkle around it.
   */
  private static async playHyperFang(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { targetEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const h = Math.max(r.height * 0.55, 40);
    // Tilted toward the caster's side, like a bite from that direction.
    const tilt = `rotate(${-v.dir * 35}deg)`;

    const teeth = FxGlyphs.incisorGlyph(h);
    Fx.place(teeth, target);
    fxEl.appendChild(teeth);
    await Fx.anim(teeth, [
      { transform: `${tilt} translateY(${-h * 0.8}px)`, opacity: 0 },
      { transform: `${tilt} translateY(0)`, opacity: 1 }
    ], { duration: 160, easing: 'ease-in' });

    Fx.flash(targetEl, '#FF6A4A', 0.6);
    Fx.shake(targetEl, 6);
    const done = Fx.anim(teeth, [
      { transform: `${tilt} translateY(0)`, opacity: 1 },
      { transform: `${tilt} translateY(-6px)`, opacity: 1, offset: 0.2 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.4 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.75 },
      { transform: `${tilt} translateY(-10px)`, opacity: 0 }
    ], { duration: 650, easing: 'ease-out' }).then(() => teeth.remove());

    // Red sparkle clusters pop up at a few spots around the target.
    const spots = 4;
    const start = Math.random() * Math.PI * 2;
    for (let c = 0; c < spots; c++) {
      const a = start + (Math.PI * 2 * c) / spots;
      const centre = {
        x: target.x + Math.cos(a) * Math.max(r.width * 0.55, 34),
        y: target.y + Math.sin(a) * Math.max(r.height * 0.45, 28)
      };
      for (let i = 0; i < 4; i++) {
        const star = FxGlyphs.sparkStar(6 + Math.random() * 7, i % 2 ? '#FF3A2A' : '#FF8A6A');
        Fx.place(star, { x: centre.x + (Math.random() * 2 - 1) * 12, y: centre.y + (Math.random() * 2 - 1) * 12 });
        fxEl.appendChild(star);
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(.6) rotate(90deg)', opacity: 0.8, offset: 0.65 },
          { transform: 'scale(0) rotate(135deg)', opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: c * 70 + Math.random() * 120 }).then(() => star.remove());
      }
    }
    await done;
  }
}
