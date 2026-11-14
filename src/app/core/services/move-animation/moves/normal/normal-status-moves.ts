import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { ShellSmash } from './shell-smash';

/** Hand-made animations for Normal-type status moves (setup, protection, support; Shell Smash lives in `shell-smash.ts`). */
export class NormalStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    batonpass: (refs, launch) => NormalStatusMoveAnimations.playBatonPass(refs, launch),
    bellydrum: (refs, launch) => NormalStatusMoveAnimations.playBellyDrum(refs, launch),
    encore: (refs, _launch, target) => NormalStatusMoveAnimations.playEncore(refs, target),
    followme: (refs, launch) => NormalStatusMoveAnimations.playFollowMe(refs, launch),
    painsplit: (refs, launch, target) => NormalStatusMoveAnimations.playPainSplit(refs, launch, target),
    protect: (refs, launch) => NormalStatusMoveAnimations.playProtect(refs, launch),
    shellsmash: (refs, launch) => ShellSmash.play(refs, launch),
    sleeptalk: (refs, launch, target, v) => NormalStatusMoveAnimations.playSleepTalk(refs, launch, target, v),
    swordsdance: (refs, launch) => NormalStatusMoveAnimations.playSwordsDance(refs, launch),
    whirlwind: (refs, _launch, target, v) => NormalStatusMoveAnimations.playWhirlwind(refs, target, v),
    yawn: (refs, launch, target) => NormalStatusMoveAnimations.playYawn(refs, launch, target)
  };

  /**
   * Yawn, after the DPPt animation: the user stretches up in a big yawn
   * (0-0.4 s); a stream of grey-white breath puffs floats over to the target,
   * wobbling and swelling, engulfs it and drifts on past (0.2-1.5 s); then a
   * drowsy bubble swells and shrinks at its face like slow breathing while
   * little rings rise off it and drift away, and it pops (1.4-2.6 s).
   */
  private static async playYawn(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. The yawn: a stretch up and back down (no turning, the sprite keeps facing its foe).
    const original = launchEl.style.transform;
    const stretch = Fx.anim(launchEl, [
      { transform: `${original} translateY(0) scale(1,1)` },
      { transform: `${original} translateY(${-lr.height * 0.06}px) scale(.97,1.06)`, offset: 0.5 },
      { transform: `${original} translateY(0) scale(1,1)` }
    ], { duration: 400, easing: 'ease-in-out', fill: 'none' });

    // 2. The breath: puffs leave the user's mouth one after another and float past the target.
    const mouth: Point = { x: launch.x + (target.x - launch.x) * 0.1, y: launch.y - lr.height * 0.25 };
    const dx = target.x - mouth.x;
    const dy = target.y - mouth.y;
    const len = Math.max(Math.hypot(dx, dy), 1);
    const sx = -dy / len;
    const sy = dx / len;
    const breath: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const s = Math.max(tr.width * (0.22 + Math.random() * 0.12), 18);
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:46% 54% 50% 50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#ffffff,#E4E6EE 50%,#C4C8D6cc 70%,#C4C8D600 74%)`;
      Fx.place(puff, mouth);
      fxEl.appendChild(puff);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        // On past the target by a third, wobbling sideways on the way.
        const f = t * 1.35;
        const wob = Math.sin(t * Math.PI * 2 + i * 0.9) * s * 0.5;
        frames.push({
          transform: `translate(${dx * f + sx * wob}px,${dy * f + sy * wob - t * 10}px) scale(${0.5 + t * 0.9})`,
          opacity: t === 0 ? 0 : t < 0.7 ? 0.9 : (1 - t) * 3
        });
      }
      breath.push(Fx.anim(puff, frames, { duration: 900, delay: 200 + i * 70, easing: 'linear', fill: 'backwards' }).then(() => puff.remove()));
    }
    setTimeout(() => Fx.flash(targetEl, '#E4E6EE', 0.3), 900);
    await Promise.all([stretch, ...breath]);

    // 3. The drowsy bubble breathes at the target's face; little rings drift up off it.
    const face: Point = { x: target.x + (launch.x - target.x) * 0.08, y: target.y - tr.height * 0.12 };
    const size = Math.max(tr.width * 0.3, 22);
    const bubble = NormalStatusMoveAnimations.drowsyBubble(size);
    Fx.place(bubble, face);
    fxEl.appendChild(bubble);
    const parts: Promise<void>[] = [
      Fx.anim(bubble, [
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(.78)', opacity: 1, offset: 0.42 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.65 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.85 },
        { transform: 'scale(1.3)', opacity: 0 }
      ], { duration: 1200, easing: 'ease-in-out' }).then(() => bubble.remove())
    ];
    for (let i = 0; i < 5; i++) {
      const ring = NormalStatusMoveAnimations.drowsyBubble(size * (0.4 + Math.random() * 0.25));
      Fx.place(ring, face);
      fxEl.appendChild(ring);
      const drift = (Math.random() * 2 - 1) * size * 0.6;
      parts.push(
        Fx.anim(ring, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,${-size * 0.6}px) scale(1)`, opacity: 0.9, offset: 0.3 },
          { transform: `translate(${drift}px,${-size * 2}px) scale(1.1)`, opacity: 0 }
        ], { duration: 800, delay: 150 + i * 180, easing: 'ease-out', fill: 'backwards' }).then(() => ring.remove())
      );
    }
    await Promise.all(parts);
  }

  /** A see-through bubble, `size` px wide: white rim, pale blue inside and a highlight (Yawn). */
  private static drowsyBubble(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;box-sizing:border-box;` +
      'border:1.5px solid #ffffffdd;box-shadow:0 0 3px #ffffff88;' +
      'background:radial-gradient(circle at 32% 30%,#ffffffcc 0 12%,#ffffff00 20%),radial-gradient(circle,#D8ECFF33,#B8D8FF66)';
    return el;
  }

  /**
   * Follow Me: a white glove with its index finger up whirls twice round the
   * user (0-1.0 s; smaller and dimmer while it passes behind), then rises
   * above the user's head and wags its finger four times (1.2-2.1 s).
   */
  private static async playFollowMe(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.32, 26);
    const hand = FxGlyphs.pointingHandGlyph(w);
    Fx.place(hand, launch);
    fxEl.appendChild(hand);

    // 1. Two laps round the user on a flat ellipse; the back half reads as further away.
    const rx = Math.max(r.width * 0.65, 40);
    const ry = Math.max(r.height * 0.18, 12);
    const steps = 24;
    const laps: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const a = (k / steps) * Math.PI * 4;
      const depth = (1 + Math.cos(a)) / 2; // 1 = in front, 0 = behind
      laps.push({
        transform: `translate(${Math.sin(a) * rx}px,${Math.cos(a) * ry}px) scale(${0.7 + 0.3 * depth})`,
        opacity: k === 0 ? 0 : 0.55 + 0.45 * depth
      });
    }
    await Fx.anim(hand, laps, { duration: 1000, easing: 'linear' });

    // 2. Up above the head, then the finger wags.
    const up = -r.height * 0.5 - w * 0.6;
    await Fx.anim(hand, [{ transform: 'translate(0,0) scale(1)' }, { transform: `translate(0,${up}px) scale(1)` }], {
      duration: 200,
      easing: 'ease-out',
      fill: 'forwards'
    });
    hand.style.transformOrigin = '50% 100%';
    const wag: Keyframe[] = [{ transform: `translate(0,${up}px) rotate(0deg)` }];
    for (let i = 0; i < 4; i++) {
      wag.push({ transform: `translate(0,${up}px) rotate(-18deg)` }, { transform: `translate(0,${up}px) rotate(18deg)` });
    }
    wag.push({ transform: `translate(0,${up}px) rotate(0deg)` });
    await Fx.anim(hand, wag, { duration: 900, easing: 'ease-in-out' });
    await Fx.anim(hand, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    hand.remove();
  }

  /** Particle colours of Protect's barrier: green, white, light blue. */
  private static readonly PROTECT_COLORS = ['#86E8A8', '#FFFFFF', '#8FD0FF', '#B8F0D0', '#CFE8FF'];

  /**
   * Protect: a barrier of tightly packed green, white and light-blue
   * particles gathers over the caster, shimmers for a moment, then breaks up.
   */
  private static async playProtect(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const rx = Math.max(r.width * 0.58, 36);
    const ry = Math.max(r.height * 0.5, 32);
    const colors = NormalStatusMoveAnimations.PROTECT_COLORS;
    const hold = 1100;

    const parts: Promise<void>[] = [];
    for (let i = 0; i < 80; i++) {
      // Spread evenly over an ellipse round the caster.
      const ang = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const at = { x: launch.x + Math.cos(ang) * d * rx, y: launch.y + Math.sin(ang) * d * ry };
      const s = 5 + Math.random() * 7;
      const c = colors[i % colors.length];
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:${s * 0.3}px;pointer-events:none;background:${c};box-shadow:0 0 ${s * 0.8}px ${c};opacity:0`;
      Fx.place(p, at);
      fxEl.appendChild(p);
      // Gather in from slightly outside, shimmer in place, then scatter outward.
      const inX = Math.cos(ang) * rx * 0.25;
      const inY = Math.sin(ang) * ry * 0.25;
      const jx = (Math.random() * 2 - 1) * 2;
      const jy = (Math.random() * 2 - 1) * 2;
      parts.push(
        Fx.anim(p, [
          { transform: `translate(${inX}px,${inY}px) scale(.3)`, opacity: 0 },
          { transform: 'translate(0,0) scale(1)', opacity: 0.9, offset: 0.2 },
          { transform: `translate(${jx}px,${jy}px) scale(.8)`, opacity: 0.55, offset: 0.4 },
          { transform: 'translate(0,0) scale(1.05)', opacity: 0.95, offset: 0.6 },
          { transform: `translate(${-jx}px,${-jy}px) scale(.85)`, opacity: 0.6, offset: 0.78 },
          { transform: `translate(${inX * 1.4}px,${inY * 1.4}px) scale(.4)`, opacity: 0 }
        ], { duration: hold, easing: 'ease-in-out', delay: Math.random() * 180 }).then(() => p.remove())
      );
    }
    await Promise.all(parts);
  }

  /**
   * Sleep Talk: pale blue rings pulse out round the sleeping caster while blue
   * "Z"s float up from its head (0 - 1.1 s); then it lunges at the foe like a
   * tackle and a yellow burst lands on the target (~1.27 s).
   */
  private static async playSleepTalk(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);

    // Phase 1: rings and Zs.
    const effects: Promise<void>[] = [];
    const ring = Math.max(r.width, r.height) * 0.9;
    for (let i = 0; i < 3; i++) {
      const c = document.createElement('div');
      c.style.cssText = `width:${ring}px;height:${ring}px;border-radius:50%;pointer-events:none;border:3px solid #BFE4FFcc;background:radial-gradient(circle,#9CD4FF00 55%,#9CD4FF44 72%,#9CD4FF00 76%);box-shadow:0 0 8px #9CD4FF88`;
      Fx.place(c, launch);
      fxEl.appendChild(c);
      effects.push(
        Fx.anim(c, [
          { transform: 'scale(.4)', opacity: 0 },
          { transform: 'scale(.8)', opacity: 0.9, offset: 0.35 },
          { transform: 'scale(1.25)', opacity: 0 }
        ], { duration: 750, delay: i * 220, easing: 'ease-out' }).then(() => c.remove())
      );
    }
    const away = -v.dir;
    const head: Point = { x: launch.x + away * r.width * 0.15, y: r.top - f.top + r.height * 0.2 };
    effects.push(FxEffects.sleepZs(fxEl, head, away, ['#8FC8FF', '#BFE0FF']));
    await Fx.wait(1100);

    // Phase 2: a tackle-like lunge at the foe.
    const original = launchEl.style.transform;
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(${v.dir * -10}px)` },
      { transform: `${original} translateX(${v.dir * 42}px)` }
    ], { duration: 170, easing: 'ease-in' });

    // Phase 3: yellow hit on the target.
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width * 0.7, 52);
    const burst = FxGlyphs.spikyBurst(size, '#FFD83A', '#FFF3A0', '#ffffff');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    effects.push(
      Fx.anim(burst, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.25)', opacity: 0 }
      ], { duration: 420, easing: 'ease-out' }).then(() => burst.remove())
    );
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#FFE04A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.45 + Math.random() * 0.4);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px) scale(1) rotate(60deg)`, opacity: 0 }
        ], { duration: 450 + Math.random() * 150, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    Fx.flash(targetEl, '#FFE04A', 0.7);
    Fx.shake(targetEl, 6);
    await Fx.anim(launchEl, [{ transform: `${original} translateX(${v.dir * 42}px)` }, { transform: original }], {
      duration: 110,
      easing: 'ease-out'
    });
    launchEl.style.transform = original;
    await Promise.all(effects);
  }

  /** Pain Split: the same orange hit bursts strike the caster and the target at once. */
  private static async playPainSplit(refs: BattleStageRefs, launch: Point, target: Point) {
    await Promise.all([
      NormalStatusMoveAnimations.painBursts(refs.fxEl, refs.launchEl, launch),
      NormalStatusMoveAnimations.painBursts(refs.fxEl, refs.targetEl, target)
    ]);
  }

  /** Three orange spiky bursts, each with a white ring, pop on one Pokémon as it flashes and shakes. */
  private static async painBursts(fxEl: HTMLElement, el: HTMLElement, at: Point): Promise<void> {
    const r = Fx.rect(el);
    const size = Math.max(r.width * 0.75, 56);
    const pops: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      await Fx.wait(i ? 230 : 0);
      const p = { x: at.x + (Math.random() * 2 - 1) * r.width * 0.2, y: at.y + (Math.random() * 2 - 1) * r.height * 0.2 };
      const burst = FxGlyphs.spikyBurst(size, '#FF7A1A', '#FFB040', '#FFF6E0');
      const ring = document.createElement('div');
      const rs = size * 0.5;
      ring.style.cssText = `position:absolute;width:${rs}px;height:${rs}px;border-radius:50%;pointer-events:none;border:${Math.max(rs * 0.12, 3)}px dashed #ffffff;box-shadow:0 0 4px #ffffffaa`;
      for (const e of [burst, ring]) {
        Fx.place(e, p);
        fxEl.appendChild(e);
      }
      pops.push(
        Fx.anim(burst, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(12deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(18deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-out' }).then(() => burst.remove()),
        Fx.anim(ring, [
          { transform: 'scale(.4) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.3) rotate(40deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-out' }).then(() => ring.remove())
      );
      Fx.flash(el, '#FF9A3A', 0.6);
      Fx.shake(el, 4);
    }
    await Promise.all(pops);
  }

  /**
   * Whirlwind: a gust sweeps over the target - white and grey flakes tumble
   * past it in swirling streams with a few white wind streaks - while it
   * leans against the wind. (Blowing it off the field is the move resolver's
   * job, and only happens when there's a Pokémon to drag in.)
   */
  private static async playWhirlwind(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const r = Fx.rect(targetEl);
    const span = Math.max(W * 0.35, r.width * 1.6);
    const band = Math.max(r.height * 0.6, 40);
    const gust = 1000;

    const flakes: Promise<void>[] = [];
    for (let i = 0; i < 34; i++) {
      const s = 4 + Math.random() * 5;
      const flake = document.createElement('div');
      flake.style.cssText = `position:absolute;width:${s}px;height:${s * (0.6 + Math.random() * 0.6)}px;pointer-events:none;background:${i % 3 ? '#F4F4F4' : '#B8B8B8'};box-shadow:0 0 2px #00000055`;
      const y0 = target.y + (Math.random() * 2 - 1) * band;
      Fx.place(flake, { x: target.x - v.dir * span, y: y0 });
      fxEl.appendChild(flake);
      const frames: Keyframe[] = [];
      const wob = 10 + Math.random() * 18;
      const phase = Math.random() * Math.PI * 2;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360);
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        frames.push({
          transform: `translate(${v.dir * span * 2 * t}px,${Math.sin(phase + t * Math.PI * 2.5) * wob - t * 12}px) rotate(${spin * t}deg)`,
          opacity: k === 0 || k === 8 ? 0 : 1
        });
      }
      flakes.push(Fx.anim(flake, frames, { duration: 520 + Math.random() * 240, easing: 'linear', delay: Math.random() * (gust - 600) }).then(() => flake.remove()));
    }
    // Thin white wind streaks curl past.
    for (let i = 0; i < 5; i++) {
      const len = span * (0.5 + Math.random() * 0.4);
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:${8 + Math.random() * 8}px;pointer-events:none;border-top:2px solid #ffffffcc;border-radius:50%`;
      Fx.place(streak, { x: target.x - v.dir * span * 0.6, y: target.y + (Math.random() * 2 - 1) * band * 0.8 });
      fxEl.appendChild(streak);
      flakes.push(
        Fx.anim(streak, [
          { transform: 'translateX(0) scaleX(.4)', opacity: 0 },
          { transform: `translateX(${v.dir * span * 0.6}px) scaleX(1)`, opacity: 0.9, offset: 0.5 },
          { transform: `translateX(${v.dir * span * 1.3}px) scaleX(.6)`, opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: 100 + Math.random() * (gust - 600) }).then(() => streak.remove())
      );
    }

    // The target leans with the wind and wobbles (position only, it keeps facing its foe).
    const base = targetEl.style.transform;
    const lean: Keyframe[] = [];
    for (let k = 0; k <= 10; k++) {
      const push = k === 0 || k === 10 ? 0 : v.dir * (6 + (k % 2 ? 3 : -3));
      lean.push({ transform: `${base} translateX(${push}px)` });
    }
    flakes.push(Fx.anim(targetEl, lean, { duration: gust, easing: 'ease-in-out', fill: 'none' }));
    await Promise.all(flakes);
  }

  /**
   * Swords Dance: six teal swords appear and dance round the caster on a
   * ring while cyan sparkles twinkle, then fade; orange stat-up sparkles
   * drift down over the caster.
   */
  private static async playSwordsDance(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const rx = Math.max(r.width * 0.65, 46);
    const ry = Math.max(r.height * 0.2, 14);
    const centre: Point = { x: launch.x, y: launch.y + r.height * 0.05 };
    const swordH = Math.max(r.height * 0.75, 56);
    const count = 6;
    const dance = 1200;

    // 1. Swords pop in (0-0.25 s), circle once with a bob (0.25-1.45 s), fade (1.45-1.7 s).
    const swords = Array.from({ length: count }, (_, i) => {
      const sword = FxGlyphs.swordGlyph(swordH);
      Fx.place(sword, centre);
      fxEl.appendChild(sword);
      return { sword, a0: (Math.PI * 2 * i) / count };
    });
    const at = (a: number, bob: number) => {
      // Lower on the ring = nearer the viewer: a touch bigger and brighter.
      const near = Math.sin(a);
      return { transform: `translate(${Math.cos(a) * rx}px,${near * ry + bob}px) scale(${0.85 + 0.15 * near})`, opacity: 0.75 + 0.25 * near };
    };
    await Promise.all(
      swords.map(({ sword, a0 }) =>
        Fx.anim(sword, [{ ...at(a0, -20), opacity: 0 }, at(a0, 0)], { duration: 250, easing: 'ease-out', fill: 'forwards' })
      )
    );
    const steps = 24;
    const danced = swords.map(({ sword, a0 }, i) => {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        frames.push(at(a0 + t * Math.PI * 2, Math.sin(t * Math.PI * 4 + i) * 5));
      }
      return Fx.anim(sword, frames, { duration: dance, easing: 'ease-in-out', fill: 'forwards' });
    });
    // Cyan sparkles twinkle round the ring while the swords dance.
    for (let i = 0; i < 16; i++) {
      const star = FxGlyphs.sparkStar(9 + Math.random() * 9, i % 3 ? '#7FF0F0' : '#ffffff');
      Fx.place(star, {
        x: centre.x + (Math.random() * 2 - 1) * rx * 1.1,
        y: r.top - f.top + Math.random() * r.height
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: Math.random() * (dance - 400) }).then(() => star.remove());
    }
    await Promise.all(danced);
    await Promise.all(
      swords.map(({ sword }) => Fx.anim(sword, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => sword.remove()))
    );

    // 2. Attack up (1.7 s): orange stat sparkles.
    await FxEffects.orangeSparkles(refs, launch, r.top - f.top);
  }

  /**
   * Encore: the stage goes dark, a pink-white spotlight shines down on the
   * target from above with a pool of light at its feet, and colourful confetti
   * flutters down around it.
   */
  private static async playEncore(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const r = Fx.rect(targetEl);
    const foot = r.bottom - f.top - r.height * 0.06;

    // 1. Dark stage (0-0.3 s).
    const dark = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#2A2230,#0C0A10)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // 2. The spotlight switches on (0.3-0.5 s): a cone from the top of the field and a pool of light.
    const poolW = Math.max(r.width * 1.3, 90);
    const cone = document.createElement('div');
    const topW = poolW * 0.35;
    cone.style.cssText = `position:absolute;left:${target.x - poolW / 2}px;top:0;width:${poolW}px;height:${foot}px;pointer-events:none;clip-path:polygon(${50 - (topW / poolW) * 50}% 0,${50 + (topW / poolW) * 50}% 0,100% 100%,0 100%);background:linear-gradient(180deg,#FFE8F4cc,#FFD0E888 60%,#FFC8E066)`;
    const pool = document.createElement('div');
    pool.style.cssText = `position:absolute;width:${poolW}px;height:${poolW * 0.32}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFF0F8ee,#FFD0E8aa 55%,#FFC8E000 72%)`;
    Fx.place(pool, { x: target.x, y: foot });
    dark.append(cone, pool);
    const light = [cone, pool].map((el) =>
      Fx.anim(el, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.9, offset: 0.85 }, { opacity: 0 }], { duration: 1500, easing: 'ease-out' })
    );
    Fx.anim(targetEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(1.35) drop-shadow(0 0 6px #FFD0E8)', offset: 0.2 },
      { filter: 'brightness(1.35) drop-shadow(0 0 6px #FFD0E8)', offset: 0.8 },
      { filter: 'brightness(1)' }
    ], { duration: 1500, easing: 'ease-out', fill: 'none' });

    // 3. Confetti flutters down around the target (0.4-1.8 s).
    const colors = ['#FF4A4A', '#FFC83A', '#4AC8FF', '#7AE05A', '#C86AFF', '#FF8AD0'];
    const spread = poolW * 0.6;
    const confetti: Promise<void>[] = [];
    for (let i = 0; i < 26; i++) {
      const w = 5 + Math.random() * 4;
      const bit = document.createElement('div');
      bit.style.cssText = `position:absolute;width:${w}px;height:${w * 0.55}px;pointer-events:none;background:${colors[i % colors.length]}`;
      const x0 = target.x + (Math.random() * 2 - 1) * spread;
      const y0 = r.top - f.top - 20 - Math.random() * r.height * 0.5;
      Fx.place(bit, { x: x0, y: y0 });
      fxEl.appendChild(bit);
      const fall = r.height * (0.8 + Math.random() * 0.5);
      const sway = 8 + Math.random() * 10;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (300 + Math.random() * 400);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        frames.push({
          transform: `translate(${Math.sin(t * Math.PI * 3 + i) * sway}px,${t * fall}px) rotate(${spin * t}deg) scaleY(${Math.cos(t * Math.PI * 4)})`,
          opacity: k === 0 ? 0 : k === 6 ? 0 : 1
        });
      }
      confetti.push(Fx.anim(bit, frames, { duration: 1000 + Math.random() * 400, easing: 'linear', delay: 100 + Math.random() * 400 }).then(() => bit.remove()));
    }
    await Promise.all([...light, ...confetti]);

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }

  /**
   * Belly Drum: two dark hands drum on the caster's belly, faster and faster,
   * and each beat sends a white music-note bubble floating up; then orange
   * stat-up sparkles drift down over it.
   */
  private static async playBellyDrum(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const top = r.top - Fx.rect(fieldEl).top;
    const belly: Point = { x: launch.x, y: launch.y + r.height * 0.12 };
    const head: Point = { x: launch.x, y: top + r.height * 0.15 };
    const hw = Math.max(r.width * 0.3, 28);

    // Two hands, tilted toward the belly, one on each side.
    const hands = [-1, 1].map((side) => {
      const hand = FxGlyphs.gloveGlyph(hw, '#4A4A54', '#18181E');
      Fx.place(hand, { x: belly.x + side * hw * 0.55, y: belly.y });
      fxEl.appendChild(hand);
      Fx.anim(hand, [{ transform: `rotate(${side * 30}deg)`, opacity: 0 }, { transform: `rotate(${side * 30}deg)`, opacity: 1 }], { duration: 120, fill: 'forwards' });
      return { hand, side };
    });

    // 1. Six beats, speeding up (0-0.63 s): a hand pats in, a note bubble floats up.
    const beats = [0, 0.17, 0.31, 0.43, 0.53, 0.63];
    const notes: Promise<void>[] = [];
    for (let i = 0; i < beats.length; i++) {
      await Fx.wait((beats[i] - (beats[i - 1] ?? 0)) * 1000);
      const { hand, side } = hands[i % 2];
      Fx.anim(hand, [
        { transform: `rotate(${side * 30}deg) translate(0,0)` },
        { transform: `rotate(${side * 30}deg) translate(${-side * 5}px,6px) scale(1.05,.9)`, offset: 0.4 },
        { transform: `rotate(${side * 30}deg) translate(0,0)` }
      ], { duration: 110, easing: 'ease-out', fill: 'forwards' });
      Fx.shake(launchEl, 2);
      const bubble = FxGlyphs.noteBubble(Math.max(r.width * 0.2, 20), i % 2 ? '♫' : '♪');
      Fx.place(bubble, { x: head.x + (Math.random() * 2 - 1) * r.width * 0.25, y: head.y });
      fxEl.appendChild(bubble);
      const drift = (Math.random() * 2 - 1) * 24;
      notes.push(
        Fx.anim(bubble, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,-14px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${drift}px,-44px) scale(1.05)`, opacity: 0 }
        ], { duration: 700, easing: 'ease-out' }).then(() => bubble.remove())
      );
    }

    // 2. Hands fade (0.75-0.95 s), notes finish, then Attack up (from ~0.95 s).
    await Fx.wait(120);
    await Promise.all(
      hands.map(({ hand }) => Fx.anim(hand, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' }).then(() => hand.remove()))
    );
    await FxEffects.orangeSparkles(refs, launch, top);
    await Promise.all(notes);
  }

  /**
   * Baton Pass: a red baton is tossed up from the caster, spinning, and falls
   * back into a white glove that rises to catch it. (The switch itself is
   * the battle flow's job.)
   */
  private static async playBatonPass(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const top = r.top - Fx.rect(fieldEl).top;
    const catchAt: Point = { x: launch.x, y: top + r.height * 0.2 };
    const bw = Math.max(r.width * 0.35, 30);
    const rise = Math.max(r.height * 0.9, 70);

    // 1. Toss (0-0.85 s): up, spinning, then down into the glove.
    const baton = FxGlyphs.batonGlyph(bw);
    Fx.place(baton, catchAt);
    fxEl.appendChild(baton);
    const toss = Fx.anim(baton, [
      { transform: 'translateY(10px) rotate(0deg)', opacity: 0, easing: 'ease-out' },
      { transform: 'translateY(0) rotate(60deg)', opacity: 1, offset: 0.1, easing: 'ease-out' },
      { transform: `translateY(${-rise}px) rotate(400deg)`, opacity: 1, offset: 0.5, easing: 'ease-in' },
      { transform: 'translateY(0) rotate(720deg)', opacity: 1 }
    ], { duration: 850, fill: 'forwards' });

    // The glove rises into place (0.45-0.7 s) to catch it.
    const glove = FxGlyphs.gloveGlyph(Math.max(r.width * 0.4, 34));
    Fx.place(glove, { x: catchAt.x, y: catchAt.y + bw * 0.3 });
    fxEl.appendChild(glove);
    await Fx.wait(450);
    await Fx.anim(glove, [
      { transform: 'translateY(16px) scale(.7)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    await toss;

    // 2. Catch (0.85 s): the glove dips with the weight, then both fade.
    Fx.flash(launchEl, '#ffffff', 0.3);
    await Fx.anim(glove, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(6px)', offset: 0.4 },
      { transform: 'translateY(0)' }
    ], { duration: 220, easing: 'ease-out', fill: 'forwards' });
    await Fx.wait(200);
    await Promise.all(
      [baton, glove].map((el) => Fx.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => el.remove()))
    );
  }
}
