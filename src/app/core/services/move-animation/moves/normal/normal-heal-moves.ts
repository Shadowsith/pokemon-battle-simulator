import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Normal-type healing moves (HP recovery, status cures). */
export class NormalHealMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    healbell: (refs, launch) => NormalHealMoveAnimations.playHealBell(refs, launch),
    milkdrink: (refs, launch) => NormalHealMoveAnimations.playMilkDrink(refs, launch),
    morningsun: (refs, launch) => NormalHealMoveAnimations.playMorningSun(refs, launch),
    recover: (refs, launch) => NormalHealMoveAnimations.playRecover(refs, launch),
    slackoff: (refs, launch) => NormalHealMoveAnimations.playSlackOff(refs, launch),
    softboiled: (refs, launch) => NormalHealMoveAnimations.playSoftBoiled(refs, launch),
    wish: (refs, launch) => NormalHealMoveAnimations.playWish(refs, launch)
  };

  /**
   * Wish, after the Gen 5 animation (the HP is restored right away here, so
   * it plays the wish and its coming true in one go): the scene fades into a
   * purple starry night sky with a faint galaxy (0-0.4 s); a big yellow
   * shooting star sweeps across it, trailing stars that fade from yellow to
   * pink (0.5-1.4 s); glowing pink and yellow sparkles drift down onto the
   * user as it glows (1.3-2.4 s); the sky fades (2.4-2.8 s) and the user
   * recovers HP with the heal sparkles (to ~3.7 s).
   */
  private static async playWish(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);

    // 1. The night sky: twinkling coloured stars and a faint galaxy in the top-left.
    const sky = Fx.backdrop(fieldEl, 'background:radial-gradient(ellipse at 60% 70%,#4A2490,#2A1258 45%,#0A0418)');
    const starColors = ['#ffffff', '#ffffff', '#8FE8FF', '#FF6A6A', '#FFE86A'];
    for (let i = 0; i < 45; i++) {
      const s = 1 + Math.random() * 2;
      const c = starColors[i % starColors.length];
      const star = document.createElement('div');
      star.style.cssText = `position:absolute;left:${Math.random() * W}px;top:${Math.random() * H}px;width:${s}px;height:${s}px;border-radius:50%;background:${c};box-shadow:0 0 3px ${c}`;
      sky.appendChild(star);
      star.animate([{ opacity: 0.3 }, { opacity: 1 }, { opacity: 0.3 }], { duration: 500 + Math.random() * 700, delay: -Math.random() * 800, iterations: Infinity });
    }
    const galaxy = document.createElement('div');
    galaxy.style.cssText = `position:absolute;left:${W * 0.04}px;top:${H * 0.05}px;width:${W * 0.14}px;height:${W * 0.07}px;border-radius:50%;transform:rotate(-20deg);filter:blur(1px);background:radial-gradient(ellipse,#ffffff 0 8%,#C8C8D8aa 25%,#8A8AA055 50%,#8A8AA000 70%)`;
    sky.appendChild(galaxy);
    await Fx.anim(sky, [{ opacity: 0, filter: 'brightness(0)' }, { opacity: 1, filter: 'brightness(0)', offset: 0.4 }, { opacity: 1, filter: 'brightness(1)' }], {
      duration: 400,
      easing: 'ease-out'
    });
    await Fx.wait(100);

    // 2. The shooting star sweeps from the top-left to the bottom-right, shedding a trail of stars.
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);
    const from: Point = { x: -30, y: H * 0.08 };
    const to: Point = { x: W + 30, y: H * 0.85 };
    const big = Math.max(H * 0.12, 28);
    const head = FxGlyphs.fivePointStar(big, '#FFE04A', '#FFF8C0', '#F0C020');
    Fx.place(head, from);
    layer.appendChild(head);
    const sweep = 900;
    const flight = Fx.anim(head, [
      { transform: 'translate(0,0) rotate(0deg)' },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) rotate(180deg)` }
    ], { duration: sweep, easing: 'ease-in' });
    const trail: Promise<void>[] = [];
    const drops = 22;
    for (let i = 0; i < drops; i++) {
      // ease-in: the head is at u² of the way after fraction u of the sweep.
      const u = i / drops;
      const p: Point = { x: from.x + (to.x - from.x) * u * u, y: from.y + (to.y - from.y) * u * u };
      const s = big * (0.45 + Math.random() * 0.35);
      const star = FxGlyphs.fivePointStar(s, '#FFE04A', '#FFF8C0', '#F0C020');
      Fx.place(star, { x: p.x + (Math.random() * 2 - 1) * big * 0.4, y: p.y + (Math.random() * 2 - 1) * big * 0.4 });
      layer.appendChild(star);
      trail.push(
        Fx.anim(star, [
          { transform: 'scale(1) rotate(0deg)', opacity: 0.95, filter: 'none' },
          { transform: 'scale(.9) rotate(20deg)', opacity: 0.85, filter: 'hue-rotate(-70deg) saturate(.8)', offset: 0.5 },
          { transform: 'scale(.6) rotate(40deg)', opacity: 0, filter: 'hue-rotate(-90deg) saturate(.6)' }
        ], { duration: 700, delay: u * sweep, easing: 'ease-out', fill: 'backwards' }).then(() => star.remove())
      );
    }

    // 3. Glowing sparkles drift down onto the user, which glows warm.
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const s = 14 + Math.random() * 12;
      const c = i % 2 ? '#FFE48A' : '#FFB0C8';
      const glow = document.createElement('div');
      glow.style.cssText = `position:absolute;width:${s * 2}px;height:${s * 2}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,${c}cc,${c}44 40%,${c}00 70%)`;
      const spark = FxGlyphs.sparkStar(s, c);
      spark.style.left = `${s / 2}px`;
      spark.style.top = `${s / 2}px`;
      glow.appendChild(spark);
      const land: Point = { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.5, y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.3 };
      Fx.place(glow, land);
      fxEl.appendChild(glow);
      const rise = lr.height * (0.6 + Math.random() * 0.5);
      sparkles.push(
        Fx.anim(glow, [
          { transform: `translateY(${-rise}px) scale(.5)`, opacity: 0 },
          { transform: `translateY(${-rise * 0.5}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: 'translateY(0) scale(.6)', opacity: 0 }
        ], { duration: 800, delay: 800 + Math.random() * 500, easing: 'ease-in', fill: 'backwards' }).then(() => glow.remove())
      );
    }
    const warm = 'brightness(1.4) drop-shadow(0 0 8px #FFE8A0)';
    const userGlow = Fx.wait(1300).then(() =>
      Fx.anim(launchEl, [{ filter: 'none' }, { filter: warm, offset: 0.3 }, { filter: warm, offset: 0.7 }, { filter: 'none' }], {
        duration: 1000,
        easing: 'ease-in-out',
        fill: 'none'
      })
    );
    await Promise.all([flight, ...trail, ...sparkles, userGlow]);
    layer.remove();
    head.remove();

    // 4. The sky fades; the HP comes back.
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' });
    sky.remove();
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Slack Off, after the Gen 5 animation: the user slowly flattens out as it
   * lazes about (0-0.5 s); cyan ring sparkles twinkle over it and drift up
   * while it fades to a pale pink-white (0.5-1.35 s); it springs back into
   * shape and colour (1.35-1.8 s), then recovers HP with the heal sparkles
   * (1.8-2.7 s).
   */
  private static async playSlackOff(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const original = launchEl.style.transform;
    // Squash only, never a turn: the sprite keeps facing its foe.
    const flat = `${original} translateY(${r.height * 0.08}px) scale(1.12,.82)`;
    const pale = 'brightness(1.6) saturate(.35)';
    const laze = Fx.anim(launchEl, [
      { transform: `${original} translateY(0) scale(1,1)`, filter: 'none' },
      { transform: flat, filter: 'none', offset: 0.28 },
      { transform: flat, filter: pale, offset: 0.75 },
      { transform: `${original} translateY(${-r.height * 0.04}px) scale(.95,1.06)`, filter: 'brightness(1.2) saturate(.8)', offset: 0.88 },
      { transform: `${original} translateY(0) scale(1,1)`, filter: 'none' }
    ], { duration: 1800, easing: 'ease-in-out', fill: 'none' });

    // Cyan sparkles twinkle over the lazing user and drift up.
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const sparkle = FxGlyphs.ringSparkle(10 + Math.random() * 14, '#3FD8F0', '#C8F6FF');
      Fx.place(sparkle, {
        x: launch.x + (Math.random() * 2 - 1) * r.width * 0.45,
        y: launch.y + (Math.random() * 2 - 1) * r.height * 0.3
      });
      fxEl.appendChild(sparkle);
      const dx = (Math.random() * 2 - 1) * 12;
      const up = 20 + Math.random() * r.height * 0.4;
      sparkles.push(
        Fx.anim(sparkle, [
          { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
          { transform: `translate(${dx * 0.4}px,${-up * 0.35}px) scale(1) rotate(25deg)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${dx}px,${-up}px) scale(.5) rotate(45deg)`, opacity: 0 }
        ], { duration: 700, easing: 'ease-out', delay: 450 + Math.random() * 700, fill: 'backwards' }).then(() => sparkle.remove())
      );
    }
    await Promise.all([laze, ...sparkles]);
    await FxEffects.healSparkles(refs, launch);
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
      effects.push(NormalHealMoveAnimations.bellRing(fxEl, at, w));
      for (let n = 0; n < 3; n++) effects.push(NormalHealMoveAnimations.bellNote(fxEl, at, w, k * 3 + n));
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
    const colors = NormalHealMoveAnimations.BELL_NOTE_COLORS;
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
