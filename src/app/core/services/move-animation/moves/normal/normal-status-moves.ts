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
    recover: (refs, launch) => NormalStatusMoveAnimations.playRecover(refs, launch),
    softboiled: (refs, launch) => NormalStatusMoveAnimations.playSoftBoiled(refs, launch),
    swordsdance: (refs, launch) => NormalStatusMoveAnimations.playSwordsDance(refs, launch),
    whirlwind: (refs, _launch, target, v) => NormalStatusMoveAnimations.playWhirlwind(refs, target, v)
  };

  /**
   * Whirlwind: a gust sweeps over the target - white and grey flakes tumble
   * past it in swirling streams with a few white wind streaks - while it
   * leans against the wind. (Blowing it off the field is the move resolver's
   * job, and only happens when there's a Pokémon to drag in.)
   */
  private static async playWhirlwind(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const r = targetEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
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
    const f = fieldEl.getBoundingClientRect();
    const r = targetEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
    const top = r.top - fieldEl.getBoundingClientRect().top;
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
    const r = launchEl.getBoundingClientRect();
    const top = r.top - fieldEl.getBoundingClientRect().top;
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
    const r = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
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
