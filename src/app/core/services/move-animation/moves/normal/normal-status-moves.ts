import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Normal-type status moves (healing, setup). */
export class NormalStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    batonpass: (refs, launch) => NormalStatusMoveAnimations.playBatonPass(refs, launch),
    bellydrum: (refs, launch) => NormalStatusMoveAnimations.playBellyDrum(refs, launch),
    encore: (refs, _launch, target) => NormalStatusMoveAnimations.playEncore(refs, target),
    healbell: (refs, launch) => NormalStatusMoveAnimations.playHealBell(refs, launch),
    milkdrink: (refs, launch) => NormalStatusMoveAnimations.playMilkDrink(refs, launch),
    morningsun: (refs, launch) => NormalStatusMoveAnimations.playMorningSun(refs, launch),
    painsplit: (refs, launch, target) => NormalStatusMoveAnimations.playPainSplit(refs, launch, target),
    protect: (refs, launch) => NormalStatusMoveAnimations.playProtect(refs, launch),
    recover: (refs, launch) => NormalStatusMoveAnimations.playRecover(refs, launch),
    sleeptalk: (refs, launch, target, v) => NormalStatusMoveAnimations.playSleepTalk(refs, launch, target, v),
    softboiled: (refs, launch) => NormalStatusMoveAnimations.playSoftBoiled(refs, launch),
    swordsdance: (refs, launch) => NormalStatusMoveAnimations.playSwordsDance(refs, launch),
    whirlwind: (refs, _launch, target, v) => NormalStatusMoveAnimations.playWhirlwind(refs, target, v)
  };

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
   * Morning Sun: the morning sun glows and pulses in the top-left corner,
   * light rays fan out of it, yellow sparkles twinkle round it and soft white
   * light pulses drift from it toward the caster; then green HP sparkles.
   */
  private static async playMorningSun(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const sun: Point = { x: W * 0.03, y: H * 0.04 };
    const total = 1700;
    const effects: Promise<void>[] = [];

    // The sun: a white-yellow glow that pulses three times, with sparkles round it.
    const size = H * 0.6;
    effects.push(FxEffects.cornerSun(fxEl, sun, size, total));

    // Light rays fanning down-right out of the corner.
    const reach = Math.hypot(W, H) * 0.45;
    for (let i = 0; i < 6; i++) {
      const ang = 18 + i * 11 + Math.random() * 5;
      const ray = document.createElement('div');
      ray.style.cssText = `position:absolute;left:${sun.x}px;top:${sun.y - 2}px;width:${reach}px;height:${i % 2 ? 3 : 5}px;transform-origin:0 50%;pointer-events:none;background:linear-gradient(90deg,#FFFDE8,#FFE45Acc 40%,#FFE45A00);filter:drop-shadow(0 0 3px #FFE45A)`;
      fxEl.appendChild(ray);
      effects.push(
        Fx.anim(ray, [
          { transform: `rotate(${ang}deg) scaleX(0)`, opacity: 0 },
          { transform: `rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${ang + 3}deg) scaleX(1)`, opacity: 0 }
        ], { duration: 900, easing: 'ease-out', delay: 150 + i * 110 }).then(() => ray.remove())
      );
    }

    // Soft white light pulses drift from the sun toward the caster.
    const dx = (launch.x - sun.x) * 0.55;
    const dy = (launch.y - sun.y) * 0.55;
    for (let i = 0; i < 4; i++) {
      const s = H * 0.12;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFFFF,#FFFFFFcc 40%,#FFFFFF00 70%)`;
      Fx.place(orb, sun);
      fxEl.appendChild(orb);
      effects.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(1)`, opacity: 0.95, offset: 0.3 },
          { transform: `translate(${dx}px,${dy}px) scale(1.5)`, opacity: 0 }
        ], { duration: 900, easing: 'ease-out', delay: 300 + i * 260 }).then(() => orb.remove())
      );
    }

    await Promise.all(effects);
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Milk Drink: a milk bottle drops in from above the caster and shakes left
   * and right while blue sparkles twinkle in a small blue ring round the
   * caster; bottle and ring fade, then green HP sparkles show the heal.
   */
  private static async playMilkDrink(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.2, 18);
    const at = { x: launch.x, y: launch.y - r.height * 0.1 };

    // Blue ring round the caster.
    const size = Math.max(r.width, r.height) * 0.95;
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:2.5px solid #8EE0FF;background:radial-gradient(circle,#8EE0FF00 60%,#8EE0FF33 72%,#8EE0FF00 74%);box-shadow:0 0 8px #6FC8FF,inset 0 0 6px #6FC8FF`;
    Fx.place(ring, launch);
    fxEl.appendChild(ring);
    Fx.anim(ring, [{ transform: 'scale(.7)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.9 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // The bottle drops in from above.
    const bottle = FxGlyphs.milkBottleGlyph(w);
    bottle.style.transformOrigin = '50% 90%';
    Fx.place(bottle, at);
    fxEl.appendChild(bottle);
    await Fx.anim(bottle, [
      { transform: `translateY(${-r.height * 0.6}px)`, opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 320, easing: 'ease-out', fill: 'forwards' });

    // It shakes left and right while blue sparkles twinkle inside the ring.
    const shakes = 6;
    const shake = Fx.anim(bottle, [
      { transform: 'translateX(0) rotate(0deg)' },
      ...Array.from({ length: shakes }, (_, k) => ({ transform: `translateX(${k % 2 ? -w * 0.4 : w * 0.4}px) rotate(${k % 2 ? -14 : 14}deg)` })),
      { transform: 'translateX(0) rotate(0deg)' }
    ], { duration: 950, easing: 'ease-in-out', fill: 'forwards' });
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 10, i % 3 ? '#6FC8FF' : '#E8F8FF');
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.2 + Math.random() * 0.32);
      Fx.place(star, { x: launch.x + Math.cos(ang) * d, y: launch.y + Math.sin(ang) * d });
      fxEl.appendChild(star);
      sparkles.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(40deg)', opacity: 0 }
        ], { duration: 480, easing: 'ease-in-out', delay: i * 95 }).then(() => star.remove())
      );
    }
    await Promise.all([shake, ...sparkles]);

    await Promise.all(
      [bottle, ring].map((el) => Fx.anim(el, [{ opacity: el === ring ? 0.9 : 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' }).then(() => el.remove()))
    );
    await FxEffects.healSparkles(refs, launch);
  }

  /** Note colours of Heal Bell: yellow, red, green, blue. */
  private static readonly BELL_NOTE_COLORS = ['#F6D33C', '#E8443A', '#3DBA4E', '#3C7CE8'];

  /**
   * Heal Bell: a golden bell pops up in front of the caster and swings,
   * sending out pulsing yellow rings and music notes in yellow, red, green
   * and blue, then fades away.
   */
  private static async playHealBell(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.32, 28);
    const at = { x: launch.x, y: launch.y + r.height * 0.05 };

    const bell = FxGlyphs.bellGlyph(w);
    bell.style.transformOrigin = '50% 8%';
    Fx.place(bell, at);
    fxEl.appendChild(bell);
    await Fx.anim(bell, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'ease-out' });

    // The bell swings to and fro; each swing sends out a ring and a few notes.
    const swings = 4;
    const swing = 320;
    const swingAnim = Fx.anim(bell, [
      { transform: 'rotate(0deg)' },
      ...Array.from({ length: swings }, (_, k) => ({ transform: `rotate(${k % 2 ? -20 : 20}deg)` })),
      { transform: 'rotate(0deg)' }
    ], { duration: swing * (swings + 1), easing: 'ease-in-out' });

    const effects: Promise<void>[] = [];
    for (let k = 0; k < swings; k++) {
      effects.push(NormalStatusMoveAnimations.bellRing(fxEl, at, w));
      for (let n = 0; n < 3; n++) effects.push(NormalStatusMoveAnimations.bellNote(fxEl, at, w, k * 3 + n));
      await Fx.wait(swing);
    }
    await swingAnim;
    await Fx.anim(bell, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    bell.remove();
    await Promise.all(effects);
  }

  /** One pulsing yellow ring growing out of the bell and fading. */
  private static bellRing(fxEl: HTMLElement, at: Point, w: number): Promise<void> {
    const size = w * 1.3;
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:3px solid #F6D33C;box-shadow:0 0 8px #FFE48A,inset 0 0 6px #FFE48A`;
    Fx.place(ring, at);
    fxEl.appendChild(ring);
    return Fx.anim(ring, [
      { transform: 'scale(.6)', opacity: 0 },
      { transform: 'scale(1.2)', opacity: 0.95, offset: 0.2 },
      { transform: 'scale(3.4)', opacity: 0 }
    ], { duration: 900, easing: 'ease-out' }).then(() => ring.remove());
  }

  /** One music note floating out of the bell in a random direction, drifting up as it fades. */
  private static bellNote(fxEl: HTMLElement, at: Point, w: number, i: number): Promise<void> {
    const colors = NormalStatusMoveAnimations.BELL_NOTE_COLORS;
    const note = FxGlyphs.musicNote(w * (0.55 + Math.random() * 0.25), colors[i % colors.length], i % 3 ? '♪' : '♫');
    Fx.place(note, at);
    fxEl.appendChild(note);
    const ang = Math.random() * Math.PI * 2;
    const d = w * (1.6 + Math.random() * 1.4);
    const x = Math.cos(ang) * d;
    const y = Math.sin(ang) * d * 0.75 - w * 0.6;
    return Fx.anim(note, [
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${x * 0.35}px,${y * 0.35}px) scale(1)`, opacity: 1, offset: 0.25 },
      { transform: `translate(${x}px,${y - w * 0.4}px) scale(1)`, opacity: 0 }
    ], { duration: 1100, easing: 'ease-out', delay: Math.random() * 120 }).then(() => note.remove());
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

  /**
   * Soft-Boiled: an egg drops onto the caster's head and cracks open - its
   * halves fly apart, blue sparkles burst out and a pale blue wave washes
   * quickly over the caster - then green HP sparkles show it healing.
   */
  private static async playSoftBoiled(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const head: Point = { x: launch.x, y: r.top - f.top + r.height * 0.15 };

    // 1. The egg drops onto the head.
    const w = Math.max(r.width * 0.22, 22);
    const egg = FxGlyphs.eggGlyph(w);
    Fx.place(egg, head);
    fxEl.appendChild(egg);
    await Fx.anim(egg, [
      { transform: 'translateY(-70px)', opacity: 0 },
      { transform: 'translateY(-50px)', opacity: 1, offset: 0.25 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 420, easing: 'ease-in' });
    egg.remove();

    // 2. Crack: the two shell halves tip and fly apart.
    const halves = [-1, 1].map((side) => {
      const half = FxGlyphs.eggGlyph(w);
      half.style.clipPath = side < 0 ? 'polygon(0 0,100% 0,100% 45%,75% 55%,50% 42%,25% 55%,0 45%)' : 'polygon(0 45%,25% 55%,50% 42%,75% 55%,100% 45%,100% 100%,0 100%)';
      Fx.place(half, head);
      fxEl.appendChild(half);
      return Fx.anim(half, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${side * 4}px,${side * 3}px) rotate(${side * 8}deg)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${side * 26}px,${side < 0 ? -22 : 14}px) rotate(${side * 40}deg)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-out' }).then(() => half.remove());
    });

    // Pale blue wave: a ring that swells fast over the caster and fades.
    const size = Math.max(r.width, r.height) * 1.1;
    const wave = document.createElement('div');
    wave.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:3px solid #BFE6FF;background:radial-gradient(circle,#D8F0FF00 40%,#A8DCFF66 70%,#D8F0FF00);box-shadow:0 0 12px #A8DCFF`;
    Fx.place(wave, launch);
    fxEl.appendChild(wave);
    const waveDone = Fx.anim(wave, [
      { transform: 'scale(.2)', opacity: 0.9 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => wave.remove());

    // Blue sparkles twinkle all over the caster.
    const rx = Math.max(r.width * 0.5, 30);
    const ry = Math.max(r.height * 0.5, 30);
    for (let i = 0; i < 14; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 12, i % 3 ? '#7FC8FF' : '#ffffff');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * rx, y: launch.y + (Math.random() * 2 - 1) * ry });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * 600 }).then(() => star.remove());
    }
    Fx.flash(launchEl, '#A8DCFF', 0.4);
    await Promise.all([...halves, waveDone, Fx.wait(1150)]);

    // 3. HP gain.
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Recover: orange and golden stars twinkle all over the caster while it
   * glows warmly, then green HP sparkles rise as it regains health.
   */
  private static async playRecover(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const rx = Math.max(r.width * 0.5, 30);
    const ry = Math.max(r.height * 0.45, 28);
    const colors = ['#FFA62B', '#FFD34D', '#FF8A1F'];

    for (let i = 0; i < 18; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 14, colors[i % colors.length]);
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * rx,
        y: launch.y + (Math.random() * 2 - 1) * ry
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.3) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(.8) rotate(70deg)', opacity: 0.9, offset: 0.6 },
        { transform: 'scale(0) rotate(110deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * 700 }).then(() => star.remove());
    }
    Fx.flash(launchEl, '#FFA62B', 0.4);
    setTimeout(() => Fx.flash(launchEl, '#FFD34D', 0.3), 400);
    await Fx.wait(1250);

    await FxEffects.healSparkles(refs, launch);
  }
}
