import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { ClawStyle, FxEffects } from '../../fx-effects';
import { FalseSwipe } from './false-swipe';
import { Guillotine } from './guillotine';
import { HeadCharge } from './head-charge';
import { HornDrill } from './horn-drill';
import { LastResort } from './last-resort';
import { QuickAttack } from './quick-attack';
import { Rage } from './rage';
import { RockClimb } from './rock-climb';
import { Scratch } from './scratch';
import { Struggle } from './struggle';
import { ViseGrip } from './vise-grip';
import { Wrap } from './wrap';

/** Crush Claw's marks: black with a red glow. */
const CRUSH_CLAW: ClawStyle = { glow: ['#FF2A2A', '#E01818'] };

/** Look of a single diagonal blade stroke with its spark spray (Slash, Cut). */
interface BladeStyle {
  blade: string;
  glow: string;
  width: number;
  sparks: number;
  /** Spark reach relative to Slash. */
  reach: number;
  /** How far the sparks sink at the end, px. */
  sink: number;
  sparkMs: number;
}
const SLASH: BladeStyle = { blade: '#fff', glow: '#FFF3A0', width: 7, sparks: 16, reach: 1, sink: 10, sparkMs: 520 };
const CUT: BladeStyle = { blade: '#FFF0A0', glow: '#F8C030', width: 5, sparks: 22, reach: 1.5, sink: 30, sparkMs: 950 };

/** Hand-made animations for Normal-type contact moves that bite, cut, bind, or ram after charging up (False Swipe, Guillotine, Head Charge, Horn Drill, Last Resort, Quick Attack, Rage, Rock Climb, Scratch, Struggle, Vise Grip and Wrap live in their own files). */
export class NormalStrikeMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bind: (refs, _launch, target) => NormalStrikeMoveAnimations.playBind(refs, target),
    chipaway: (refs, launch, target, v) => NormalStrikeMoveAnimations.playChipAway(refs, launch, target, v),
    constrict: (refs, _launch, target) => NormalStrikeMoveAnimations.playConstrict(refs, target),
    crushclaw: (refs, _launch, target) => NormalStrikeMoveAnimations.playCrushClaw(refs, target),
    cut: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSlash(refs, target, v, CUT),
    falseswipe: (refs, _launch, target, v) => FalseSwipe.play(refs, target, v),
    furyattack: (refs, launch, target, v) => NormalStrikeMoveAnimations.playFuryAttack(refs, launch, target, v),
    furyswipes: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playFurySwipes(refs, target, v),
    gigaimpact: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playGigaImpact(refs, target, v),
    guillotine: (refs, _launch, target) => Guillotine.play(refs, target),
    headcharge: (refs, launch, target) => HeadCharge.play(refs, launch, target),
    holdback: (refs, launch, target) => NormalStrikeMoveAnimations.playHoldBack(refs, launch, target),
    hornattack: (refs, launch, target) => NormalStrikeMoveAnimations.playHornAttack(refs, launch, target),
    horndrill: (refs, launch, target) => HornDrill.play(refs, launch, target),
    hyperfang: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playHyperFang(refs, target, v),
    lastresort: (refs, _launch, target, v) => LastResort.play(refs, target, v),
    quickattack: (refs, _launch, target, v) => QuickAttack.play(refs, target, v),
    rage: (refs, launch, target, v) => Rage.play(refs, launch, target, v),
    rockclimb: (refs, launch, target, v) => RockClimb.play(refs, launch, target, v),
    scratch: (refs, _launch, target) => Scratch.play(refs, target),
    skullbash: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSkullBash(refs, target, v),
    slash: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSlash(refs, target, v),
    smellingsalts: (refs, _launch, target) => NormalStrikeMoveAnimations.playSmellingSalts(refs, target),
    struggle: (refs, _launch, target, v) => Struggle.play(refs, target, v),
    superfang: (refs, _launch, target, v) => NormalStrikeMoveAnimations.playSuperFang(refs, target, v),
    visegrip: (refs, _launch, target) => ViseGrip.play(refs, target),
    wrap: (refs, _launch, target) => Wrap.play(refs, target)
  };

  /**
   * Fury Attack, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/c/cb/Furienschlag_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/d/dc/Furienschlag_Gen5.png
   *
   * One jab per hit (`v.hits`, 0.32 s each, see `hornJab`): a black horn
   * stabs point-first into a different spot on the target (hit 0.1 s into
   * each jab), a small yellow burst flares, a ring of orange dots springs out
   * of it and red specks drift off, and the horn pulls back.
   */
  private static async playFuryAttack(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const r = Fx.rect(refs.targetEl);
    const len = Math.max(r.width * 0.5, 40);
    const spots: Point[] = [
      { x: -0.12, y: -0.15 },
      { x: 0.1, y: 0.1 },
      { x: -0.05, y: 0.18 },
      { x: 0.14, y: -0.08 },
      { x: 0, y: 0 }
    ];
    const jabs: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const spot = spots[hit % spots.length];
      jabs.push(NormalStrikeMoveAnimations.hornJab(refs, launch, { x: target.x + spot.x * r.width, y: target.y + spot.y * r.height }, len, 8));
      await Fx.wait(320);
    }
    await Promise.all(jabs);
  }

  /**
   * Horn Attack, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/38/Hornattacke_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/e/ea/Hornattacke_Gen5.png
   *
   * One big jab (see `hornJab`): a large black horn drives point-first into
   * the target's middle (hit 0.1 s), a yellow burst flares, a wide ring of
   * orange dots springs out and red specks drift off (to ~0.5 s).
   */
  private static async playHornAttack(refs: BattleStageRefs, launch: Point, target: Point) {
    const r = Fx.rect(refs.targetEl);
    await NormalStrikeMoveAnimations.hornJab(refs, launch, target, Math.max(r.width * 0.7, 54), 12);
  }

  /**
   * One horn jab at `at` (0.32 s): the horn, `len` px long and pointing from
   * the caster toward the target, stabs in tip-first (hit at 0.1 s: flash,
   * shake, yellow burst, a ring of `dots` orange dots and three red specks)
   * and pulls back. Resolves when every piece is gone (~0.5 s).
   */
  private static async hornJab(refs: BattleStageRefs, launch: Point, at: Point, len: number, dots: number) {
    const { fxEl, targetEl } = refs;
    const angle = Math.atan2(at.y - launch.y, at.x - launch.x);
    const deg = (angle * 180) / Math.PI;
    const back = { x: -Math.cos(angle) * len * 0.8, y: -Math.sin(angle) * len * 0.8 };
    // The horn's tip lands on the spot: its box centre sits half a length behind it.
    const hornAt: Point = { x: at.x - Math.cos(angle) * len * 0.45, y: at.y - Math.sin(angle) * len * 0.45 };
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, FxGlyphs.hornGlyph(len), hornAt, [
        { transform: `translate(${back.x}px,${back.y}px) rotate(${deg}deg)`, opacity: 0 },
        { transform: `translate(0,0) rotate(${deg}deg)`, opacity: 1, offset: 0.32 },
        { transform: `translate(0,0) rotate(${deg}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${back.x * 0.6}px,${back.y * 0.6}px) rotate(${deg}deg)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' })
    ];
    await Fx.wait(100);
    Fx.flash(targetEl, '#FFE84A', 0.5);
    Fx.shake(targetEl, 4);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(len * 0.7, '#F8C820', '#FFF27A', '#ffffff'), at, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 260, easing: 'ease-out' })
    );
    // Ring of orange dots springs outward; a few red specks drift up and off.
    const ring = len * 0.6;
    for (let i = 0; i < dots; i++) {
      const a = (i / dots) * Math.PI * 2;
      effects.push(
        Fx.spawn(fxEl, Fx.box(6, 6, 'border-radius:50%;background:radial-gradient(circle,#FFE0A0,#FF8A1A 65%);box-shadow:0 0 4px #FF8A1A'), at, [
          { transform: `translate(${Math.cos(a) * ring * 0.3}px,${Math.sin(a) * ring * 0.3}px)`, opacity: 1 },
          { transform: `translate(${Math.cos(a) * ring}px,${Math.sin(a) * ring}px)`, opacity: 0 }
        ], { duration: 300, easing: 'ease-out' })
      );
    }
    for (let i = 0; i < 3; i++) {
      const dx = (Math.random() * 2 - 1) * len * 0.6;
      effects.push(
        Fx.spawn(fxEl, Fx.box(4, 4, 'border-radius:50%;background:#D82818;box-shadow:0 0 3px #FF4A2A'), at, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${dx}px,${-len * 0.5 - Math.random() * len * 0.3}px)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: 40 })
      );
    }
    await Promise.all(effects);
  }

  /**
   * Fury Swipes, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/d/d3/Kratzfurie_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/9/9f/Kratzfurie_Gen5.png
   *
   * One swipe per hit (`v.hits`, 0.36 s each) at a different spot: three
   * parallel yellow claw streaks rake down across the target from the top
   * back corner (hit 0.1 s into each swipe), a white glint flares and orange
   * specks pop out and sink.
   */
  private static async playFurySwipes(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const len = Math.max(r.width * 0.6, 46);
    // Down and toward the caster's side, like a paw swiping from top-back.
    const deg = v.dir > 0 ? 115 : 65;
    const rad = (deg * Math.PI) / 180;
    const spots: Point[] = [
      { x: 0.1, y: -0.12 },
      { x: -0.1, y: 0.08 },
      { x: 0.05, y: 0.15 },
      { x: -0.12, y: -0.1 },
      { x: 0, y: 0 }
    ];
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const spot = spots[hit % spots.length];
      const at: Point = { x: target.x + spot.x * r.width, y: target.y + spot.y * r.height };
      for (let k = -1; k <= 1; k++) {
        // Streaks side by side, square to the swipe direction.
        const off = k * len * 0.16;
        const c: Point = { x: at.x - Math.sin(rad) * off, y: at.y + Math.cos(rad) * off };
        const streak = Fx.box(len, 4, 'border-radius:2px;background:linear-gradient(90deg,#FFF6B000,#FFF6B0 30%,#FFE040 70%,#FFE04000);box-shadow:0 0 6px #F8C030');
        effects.push(
          Fx.spawn(fxEl, streak, c, [
            { transform: `rotate(${deg}deg) scaleX(0)`, opacity: 1 },
            { transform: `rotate(${deg}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
            { transform: `rotate(${deg}deg) scaleX(1) scaleY(.4)`, opacity: 0 }
          ], { duration: 300, easing: 'ease-out', delay: (k + 1) * 20 })
        );
      }
      await Fx.wait(100);
      Fx.flash(targetEl, '#ffffff', 0.5);
      Fx.shake(targetEl, 4);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(len * 0.45, '#FFE04A'), at, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.5) rotate(45deg)', opacity: 0 }
        ], { duration: 260, easing: 'ease-out' })
      );
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.3;
        const d = len * (0.4 + Math.random() * 0.4);
        effects.push(
          Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:radial-gradient(circle,#FFF0C0,#FF9A2A 60%);box-shadow:0 0 4px #FF9A2A'), at, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 16}px)`, opacity: 0 }
          ], { duration: 500, easing: 'ease-out' })
        );
      }
      await Fx.wait(260);
    }
    await Promise.all(effects);
  }

  /**
   * Smelling Salts, after the DPPt animation: two white open hands appear on
   * either side of the target (0-0.25 s) and clap twice - each turns edge-on
   * and back, and a pale yellow-green burst with white specks flares on its
   * outer side while the target jolts (0.4 s and 0.85 s); then the hands
   * fade (1.25-1.5 s).
   */
  private static async playSmellingSalts(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.38, 26);
    const off = Math.max(r.width * 0.55, 36);
    const y = target.y + r.height * 0.1;

    // The hands: the right one is a mirror image of the left (only the glyph flips, never a sprite).
    const sides = [-1, 1] as const;
    const hands = sides.map((side) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
      const glove = FxGlyphs.gloveGlyph(w);
      glove.style.left = `${-w / 2}px`;
      glove.style.top = `${-w * 0.55}px`;
      if (side > 0) glove.style.transform = 'scaleX(-1)';
      wrap.appendChild(glove);
      Fx.place(wrap, { x: target.x + side * off, y });
      fxEl.appendChild(wrap);
      return wrap;
    });

    const claps = [400, 850];
    const clap = 260;
    const total = 1500;
    const done = hands.map((wrap, i) => {
      const side = sides[i];
      const frames: Keyframe[] = [
        { transform: 'translateX(0) scale(.6,.6)', opacity: 0, offset: 0 },
        { transform: 'translateX(0) scale(1,1)', opacity: 1, offset: 250 / total }
      ];
      // Each clap: the hand swings in a little and turns edge-on, then opens again.
      for (const at of claps) {
        frames.push(
          { transform: 'translateX(0) scale(1,1)', opacity: 1, offset: (at - clap * 0.4) / total },
          { transform: `translateX(${-side * 4}px) scale(.22,1)`, opacity: 1, offset: at / total },
          { transform: 'translateX(0) scale(1,1)', opacity: 1, offset: (at + clap * 0.6) / total }
        );
      }
      frames.push({ transform: 'translateX(0) scale(1,1)', opacity: 1, offset: 1250 / total }, { transform: 'translateX(0) scale(.9,.9)', opacity: 0, offset: 1 });
      return Fx.anim(wrap, frames, { duration: total, easing: 'ease-in-out' }).then(() => wrap.remove());
    });

    // A burst with specks on the outer side of each hand at every clap; the target jolts.
    const bursts = claps.map((at) =>
      Fx.wait(at).then(() => {
        Fx.shake(targetEl, 4);
        Fx.flash(targetEl, '#F0FFC0', 0.4);
        return Promise.all(sides.map((side) => NormalStrikeMoveAnimations.clapBurst(fxEl, { x: target.x + side * (off + w * 0.7), y }, side, w)));
      })
    );
    await Promise.all([...done, ...bursts]);
  }

  /** A pale yellow-green burst at `at` and white specks drifting up and outward (`side`) from it (Smelling Salts). */
  private static clapBurst(fxEl: HTMLElement, at: Point, side: 1 | -1, size: number): Promise<void> {
    const parts: Promise<void>[] = [];
    const burst = FxGlyphs.spikyBurst(size * 1.5, '#B8E07A', '#F0FFC0', '#FFFFFF');
    Fx.place(burst, at);
    fxEl.appendChild(burst);
    parts.push(
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 0.9 },
        { transform: 'scale(1.1) rotate(10deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.25) rotate(18deg)', opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => burst.remove())
    );
    for (let i = 0; i < 9; i++) {
      const s = 2 + Math.random() * 2;
      const speck = document.createElement('div');
      speck.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${i % 3 ? '#ffffff' : '#D8C8FF'};box-shadow:0 0 3px #ffffff`;
      Fx.place(speck, at);
      fxEl.appendChild(speck);
      const dx = side * (10 + Math.random() * size * 0.9);
      const dy = -(6 + Math.random() * size * 1.1);
      parts.push(
        Fx.anim(speck, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${dx * 0.4}px,${dy * 0.4}px)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }
        ], { duration: 500 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 80, fill: 'backwards' }).then(() => speck.remove())
      );
    }
    return Promise.all(parts).then(() => void 0);
  }

  /**
   * Super Fang: small rodent incisors snap down into the target (a quick
   * Hyper Fang bite), then a red-pink starburst flares on it while white and
   * pink sparks fly out.
   */
  private static async playSuperFang(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { targetEl, fxEl } = refs;
    const r = Fx.rect(targetEl);
    const h = Math.max(r.height * 0.35, 28);
    const tilt = `rotate(${-v.dir * 35}deg)`;

    // 1. The bite (0-0.3 s): drops in, clamps, then fades out while the burst flares.
    const teeth = FxGlyphs.incisorGlyph(h);
    Fx.place(teeth, { x: target.x, y: target.y - r.height * 0.1 });
    fxEl.appendChild(teeth);
    await Fx.anim(teeth, [
      { transform: `${tilt} translateY(${-h * 0.8}px)`, opacity: 0 },
      { transform: `${tilt} translateY(0)`, opacity: 1 }
    ], { duration: 130, easing: 'ease-in' });
    Fx.shake(targetEl, 4);
    const teethDone = Fx.anim(teeth, [
      { transform: `${tilt} translateY(0)`, opacity: 1 },
      { transform: `${tilt} translateY(-4px)`, opacity: 1, offset: 0.3 },
      { transform: `${tilt} translateY(0)`, opacity: 1, offset: 0.55 },
      { transform: `${tilt} translateY(-8px)`, opacity: 0 }
    ], { duration: 320, easing: 'ease-out' }).then(() => teeth.remove());
    await Fx.wait(170);

    // 2. The hit (from 0.3 s): a red-pink starburst with a white core.
    const size = Math.max(r.width * 0.55, 46);
    const burst = FxGlyphs.spikyBurst(size, '#F0304A', '#FF8AA8', '#ffffff');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(10deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(14deg)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1.15) rotate(18deg)', opacity: 0 }
    ], { duration: 450, easing: 'ease-out' }).then(() => burst.remove());
    Fx.flash(targetEl, '#FF6A8A', 0.7);
    Fx.shake(targetEl, 6);

    // White and pink sparks fly out round the burst.
    const sparks: Promise<void>[] = [];
    const reach = size * 0.9;
    for (let i = 0; i < 12; i++) {
      const sz = 4 + Math.random() * 4;
      const c = i % 3 ? '#ffffff' : '#FF9AB8';
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,${c} 60%);box-shadow:0 0 6px ${c === '#ffffff' ? '#FFC0D0' : c}`;
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const d = reach * (0.6 + Math.random() * 0.5);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(.5)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.8}px,${Math.sin(ang) * d * 0.8}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(.5)`, opacity: 0 }
        ], { duration: 480 + Math.random() * 100, easing: 'ease-out', delay: 30 }).then(() => spark.remove())
      );
    }
    await Promise.all([teethDone, burstDone, ...sparks]);
  }

  /**
   * Crush Claw: two parallel black claw marks with a red glow rip down the
   * left side of the target (hit at 0.12 s), then two more down its right
   * side (hit at 0.47 s); the target flashes and shakes on each.
   */
  private static async playCrushClaw(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const len = Math.max(r.height * 0.65, 50);
    const gap = Math.max(r.width * 0.11, 9);
    const marks: Promise<void>[] = [];
    for (const side of [-1, 1]) {
      const centre: Point = { x: target.x + side * r.width * 0.2, y: target.y };
      marks.push(...[-0.5, 0.5].map((k) => FxEffects.clawMark(fxEl, { x: centre.x + k * gap, y: centre.y + k * gap * 0.4 }, len, 64, CRUSH_CLAW)));
      await Fx.wait(120);
      Fx.flash(targetEl, '#FF4A4A', 0.5);
      Fx.shake(targetEl, 5);
      await Fx.wait(230);
    }
    await Promise.all(marks);
  }

  /**
   * Slash: a bright white cut is drawn diagonally across the target with a
   * white flash where it lands, while yellow-orange sparks spray out of it.
   *
   * Cut uses the same stroke, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/6/68/Zerschneider_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/8/86/Zerschneider_Gen5.png
   * A thin golden cut sweeps across the target (0-0.36 s, hit at 0.11 s),
   * then a wider cloud of yellow-orange sparks drifts out and sinks slowly
   * (to ~1.3 s).
   */
  private static async playSlash(refs: BattleStageRefs, target: Point, v: MoveVisual, style: BladeStyle = SLASH) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const len = Math.max(r.width * 1.1, 80);
    // Top-back to bottom-front of the target, mirrored with the attack direction.
    const angle = v.dir > 0 ? 35 : 145;

    const blade = document.createElement('div');
    blade.style.cssText = `position:absolute;width:${len}px;height:${style.width}px;pointer-events:none;clip-path:polygon(0 50%,50% 0,100% 50%,50% 100%);background:linear-gradient(90deg,#ffffff00,${style.blade} 30%,${style.blade} 70%,#ffffff00);filter:drop-shadow(0 0 5px ${style.glow})`;
    // The blade turns round its left end; place that end so its middle crosses the target.
    const rad = (angle * Math.PI) / 180;
    Fx.place(blade, { x: target.x - (Math.cos(rad) * len) / 2 + len / 2, y: target.y - (Math.sin(rad) * len) / 2 });
    fxEl.appendChild(blade);
    const bladeDone = Fx.anim(blade, [
      { transform: `rotate(${angle}deg) scale(0,1)`, transformOrigin: '0 50%', opacity: 1 },
      { transform: `rotate(${angle}deg) scale(1,1.3)`, transformOrigin: '0 50%', opacity: 1, offset: 0.4 },
      { transform: `rotate(${angle}deg) scale(1,.3)`, transformOrigin: '0 50%', opacity: 0 }
    ], { duration: 360, easing: 'ease-out' }).then(() => blade.remove());

    await Fx.wait(110);
    const star = FxGlyphs.sparkStar(Math.max(r.width * 0.4, 34), style.glow);
    Fx.place(star, target);
    fxEl.appendChild(star);
    const starDone = Fx.anim(star, [
      { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(30deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(.6) rotate(45deg)', opacity: 0 }
    ], { duration: 320, easing: 'ease-out' }).then(() => star.remove());
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);

    // Yellow-orange sparks spray out, mostly upward and toward the front.
    const sparks: Promise<void>[] = [];
    const reach = Math.max(r.width * 0.55, 40);
    for (let i = 0; i < style.sparks; i++) {
      const s = 4 + Math.random() * 4;
      const spark = document.createElement('div');
      const c = i % 2 ? '#FFD040' : '#FF9A2A';
      spark.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF8D0,${c} 60%);box-shadow:0 0 5px ${c}`;
      const along = (Math.random() * 2 - 1) * 0.4;
      Fx.place(spark, { x: target.x + Math.cos(rad) * len * along, y: target.y + Math.sin(rad) * len * along });
      fxEl.appendChild(spark);
      const ang = -Math.PI / 2 + v.dir * Math.random() * 1.4 + (Math.random() - 0.5) * 0.8;
      const d = reach * style.reach * (0.4 + Math.random() * 0.7);
      sparks.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + style.sink}px) scale(.4)`, opacity: 0 }
        ], { duration: style.sparkMs + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 80 }).then(() => spark.remove())
      );
    }
    await Promise.all([bladeDone, starDone, ...sparks]);
  }

  /** Turn-1 animations of two-turn moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    skullbash: (refs, launch, _target, v) => NormalStrikeMoveAnimations.playSkullBashCharge(refs, launch, v)
  };

  /**
   * Skull Bash, turn 1 (tucks its head in): the caster rears back diagonally,
   * away from the foe, twice; then orange sparkles drift down over it.
   */
  private static async playSkullBashCharge(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fieldEl, launchEl } = refs;
    const back = `translate(${-v.dir * 14}px,-8px)`;
    for (let i = 0; i < 2; i++) {
      await Fx.anim(launchEl, [
        { transform: 'translate(0,0)' },
        { transform: back, offset: 0.4 },
        { transform: 'translate(0,0)' }
      ], { duration: 280, easing: 'ease-in-out', fill: 'none' });
    }
    const top = Fx.rect(launchEl).top - Fx.rect(fieldEl).top;
    await FxEffects.orangeSparkles(refs, launch, top);
  }

  /**
   * Skull Bash, turn 2: the scene goes dark, the caster darts forward and
   * back very fast a few times, then the target is hit by a fiery blast
   * with yellow sparks.
   */
  private static async playSkullBash(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    await Fx.anim(launchEl, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${v.dir * 30}px)`, offset: 0.17 },
      { transform: 'translateX(0)', offset: 0.33 },
      { transform: `translateX(${v.dir * 30}px)`, offset: 0.5 },
      { transform: 'translateX(0)', offset: 0.67 },
      { transform: `translateX(${v.dir * 46}px)`, offset: 0.85 },
      { transform: 'translateX(0)' }
    ], { duration: 420, easing: 'linear', fill: 'none' });

    const r = Fx.rect(targetEl);
    const blast = FxEffects.fireBlastCloud(fxEl, target, Math.max(r.width * 0.5, 42), 10, '#FFE04A');
    Fx.flash(targetEl, '#FFB13C', 0.7);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    await blast;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Giga Impact, after the Gen 4 / Gen 5 animation:
   * - Gen 4 (DPPt): https://www.pokewiki.de/images/2/20/Gigasto%C3%9F_DPPt.png
   * - Gen 4 (HGSS): https://www.pokewiki.de/images/b/ba/Gigasto%C3%9F_HGSS.png
   * - Gen 5: https://www.pokewiki.de/images/d/da/Gigasto%C3%9F_Gen5.png
   *
   * The scene goes black (0-0.2 s) and a white ring closes in on the target
   * (0.2-0.6 s), then the user lunges. On impact (0.78 s) a magenta backdrop
   * with flickering pink rays bursts behind the target, a pink impact star
   * flares and red sparks scatter while white streaks shoot across
   * (0.78-1.8 s, a second jolt at 1.08 s); black again, then the scene comes
   * back (to ~2.15 s).
   */
  private static async playGigaImpact(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);

    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

    // A white ring closes in on the target while the user lunges.
    const ringSize = Math.max(tr.width, tr.height) * 1.3;
    const ring = document.createElement('div');
    ring.style.cssText = `width:${ringSize}px;height:${ringSize}px;border-radius:50%;pointer-events:none;border:3px solid #E8E8F0;box-shadow:0 0 6px #ffffff`;
    Fx.place(ring, target);
    fxEl.appendChild(ring);
    const close = Fx.anim(ring, [
      { transform: 'scale(2.5)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 400, easing: 'ease-in' }).then(() => ring.remove());
    await close;

    // The user lunges; the burst backdrop fades in behind the black and shows on impact.
    const lunge = Fx.anim(launchEl, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${v.dir * 60}px)`, offset: 0.6 },
      { transform: 'translateX(0)' }
    ], { duration: 300, easing: 'ease-in', fill: 'none' });
    const burstIn = FxEffects.burstBackdrop(fieldEl, target, 'magenta');
    await Fx.wait(180);

    // Impact: magenta burst backdrop, pink star, red sparks, white streaks.
    black.remove();
    const star = FxGlyphs.spikyBurst(Math.max(tr.width * 0.9, 70), '#FF4A8A', '#FFB0D0', '#ffffff');
    Fx.place(star, target);
    fxEl.appendChild(star);
    const effects: Promise<void>[] = [
      Fx.anim(star, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).then(() => star.remove())
    ];
    for (let i = 0; i < 14; i++) {
      const s = 5 + Math.random() * 7;
      const spark = document.createElement('div');
      spark.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFE0E8,#FF2A4A 60%,#FF2A4A00);box-shadow:0 0 4px #FF4A6A`;
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const ang = Math.random() * Math.PI * 2;
      const d = Math.max(tr.width, 60) * (0.6 + Math.random() * 0.6);
      effects.push(
        Fx.anim(spark, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 0 }
        ], { duration: 550 + Math.random() * 250, delay: Math.random() * 200, easing: 'ease-out' }).then(() => spark.remove())
      );
    }
    for (let i = 0; i < 8; i++) {
      const len = 40 + Math.random() * 60;
      const streak = document.createElement('div');
      streak.style.cssText = `width:${len}px;height:3px;border-radius:3px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff,#ffffff00)`;
      const ang = Math.random() * Math.PI * 2;
      const deg = (ang * 180) / Math.PI;
      const from = Math.max(tr.width * 0.6, 40);
      const to = Math.max(W, H);
      Fx.place(streak, target);
      fxEl.appendChild(streak);
      effects.push(
        Fx.anim(streak, [
          { transform: `rotate(${deg}deg) translateX(${from}px)`, opacity: 1 },
          { transform: `rotate(${deg}deg) translateX(${to}px)`, opacity: 0 }
        ], { duration: 400, delay: Math.random() * 500, easing: 'ease-out' }).then(() => streak.remove())
      );
    }
    Fx.flash(targetEl, '#FF9AC4', 0.9);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 0.9);
    setTimeout(() => { Fx.flash(targetEl, '#ffffff', 0.7); Fx.shake(targetEl, 6); }, 300);
    const burst = await burstIn;
    await Promise.all([lunge, ...effects]);

    // Black again, then the scene comes back.
    const back = Fx.backdrop(fieldEl, 'background:#000');
    burst.after(back);
    await Fx.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' });
    burst.remove();
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    back.remove();
  }

  /**
   * Bind: nested dark arcs close in on both sides of the target and squeeze
   * in and out quickly while the target is pressed together.
   */
  private static async playBind(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
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
   * Constrict, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/3/32/Umklammerung_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/b/ba/Umklammerung_Gen5.png
   *
   * Green vine coils wind round the target one after another from its feet
   * up (0-0.45 s), squeeze it three times with a dull flash each (0.55,
   * 0.85, 1.15 s; the hit lands on the first), then loosen and fade
   * (1.3-1.55 s).
   */
  private static async playConstrict(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.9, 56);
    const h = Math.max(w * 0.28, 14);
    const coils = 4;
    const total = 1550;
    const squeezes = [550, 850, 1150];

    // Each coil: a flat tilted ring, dark-edged green, stacked from the feet up.
    const done: Promise<void>[] = [];
    for (let i = 0; i < coils; i++) {
      const ring = Fx.box(w, h, 'border-radius:50%;border:4px solid #58C048;box-shadow:0 0 0 1px #1E5A1A,inset 0 0 0 1px #1E5A1A,0 0 6px #8AE070');
      const y = target.y + r.height * (0.32 - i * 0.2);
      Fx.place(ring, { x: target.x, y });
      fxEl.appendChild(ring);
      const tilt = i % 2 ? -10 : 10;
      const appear = (i * 110) / total;
      const frames: Keyframe[] = [
        { transform: `rotate(${tilt}deg) scale(1.5,1.2)`, opacity: 0, offset: 0 },
        { transform: `rotate(${tilt}deg) scale(1.5,1.2)`, opacity: 0, offset: appear },
        { transform: `rotate(${tilt}deg) scale(1,1)`, opacity: 1, offset: appear + 150 / total }
      ];
      for (const at of squeezes) {
        frames.push(
          { transform: `rotate(${tilt}deg) scale(.86,.95)`, opacity: 1, offset: at / total },
          { transform: `rotate(${tilt}deg) scale(1,1)`, opacity: 1, offset: (at + 160) / total }
        );
      }
      frames.push(
        { transform: `rotate(${tilt}deg) scale(1,1)`, opacity: 1, offset: 1300 / total },
        { transform: `rotate(${tilt}deg) scale(1.25,1.1)`, opacity: 0, offset: 1 }
      );
      done.push(Fx.anim(ring, frames, { duration: total, easing: 'ease-in-out' }).then(() => ring.remove()));
    }

    // The target is squeezed in time with the coils.
    const original = targetEl.style.transform;
    const squash: Keyframe[] = [{ transform: original, offset: 0 }, { transform: original, offset: 450 / total }];
    for (const at of squeezes) {
      squash.push({ transform: `${original} scaleX(.9)`, offset: at / total }, { transform: original, offset: (at + 160) / total });
      setTimeout(() => Fx.flash(targetEl, '#6A8A5A', 0.3), at);
    }
    squash.push({ transform: original, offset: 1 });
    const squeezed = Fx.anim(targetEl, squash, { duration: total, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(squeezes[0]);
    Fx.shake(targetEl, 3);
    await Promise.all([squeezed, ...done]);
  }

  /**
   * Hyper Fang: a pair of big rodent incisors chomps diagonally down into the
   * target, while clusters of little red sparkles twinkle around it.
   */
  private static async playHyperFang(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { targetEl, fxEl } = refs;
    const r = Fx.rect(targetEl);
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

  /**
   * Chip Away, after the Gen 5 animation:
   * - Gen 5: https://www.pokewiki.de/images/b/bb/Zerm%C3%BCrben_Gen5.png
   *
   * The user goes pale and see-through as it slips forward toward the
   * target (0-0.3 s). At the hit (0.25 s) a yellow-white spiky flash pops on
   * the target while small yellow sparks fly off it (0.25-0.75 s), then a few
   * tiny orange specks drift down (to ~1.05 s).
   */
  private static async playChipAway(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.25;
    const dy = (target.y - launch.y) * 0.25;
    const slip = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)`, opacity: 1, filter: 'brightness(1)' },
      { transform: `${original} translate(${dx}px,${dy}px)`, opacity: 0.5, filter: 'brightness(1.8) saturate(.2)', offset: 0.45 },
      { transform: `${original} translate(0,0)`, opacity: 1, filter: 'brightness(1)' }
    ], { duration: 520, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(250);

    // The hit: a yellow-white flash and sparks.
    const at: Point = { x: target.x - v.dir * tr.width * 0.1, y: target.y + tr.height * 0.1 };
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.6, 48), '#FFE84A', '#FFF8C0', '#FFFFFF');
    Fx.place(burst, at);
    fxEl.appendChild(burst);
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    const effects: Promise<void>[] = [
      slip,
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.1) rotate(15deg)', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => burst.remove())
    ];
    for (let i = 0; i < 7; i++) {
      const dot = document.createElement('div');
      const s = 5 + Math.random() * 4;
      dot.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFFFF,#FFE84A 60%,#FFE84A00);box-shadow:0 0 5px #FFE84A`;
      Fx.place(dot, at);
      fxEl.appendChild(dot);
      const ang = -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI * 0.7;
      const d = Math.max(tr.width * 0.5, 36) * (0.6 + Math.random() * 0.5);
      effects.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 0 }
        ], { duration: 450 + Math.random() * 100, easing: 'ease-out' }).then(() => dot.remove())
      );
    }
    for (let i = 0; i < 5; i++) {
      const speck = document.createElement('div');
      speck.style.cssText = 'position:absolute;width:3px;height:3px;border-radius:50%;pointer-events:none;background:#FF9A3A';
      Fx.place(speck, { x: at.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: at.y - tr.height * 0.2 });
      fxEl.appendChild(speck);
      effects.push(
        Fx.anim(speck, [
          { transform: 'translateY(0)', opacity: 0 },
          { transform: 'translateY(8px)', opacity: 1, offset: 0.3 },
          { transform: `translateY(${tr.height * 0.4}px)`, opacity: 0 }
        ], { duration: 500, delay: 300 + Math.random() * 100, easing: 'ease-in' }).then(() => speck.remove())
      );
    }
    await Promise.all(effects);
  }

  /**
   * Hold Back, after the XY animation: the user darts in (0-0.26 s) and a
   * glowing yellow-white crescent sweeps across the target with a flash and
   * a scatter of little stars (0.12-0.65 s) - a gentle, holding-back swipe.
   * Reference: https://www.pokewiki.de/images/2/2c/Zur%C3%BCckhaltung_Gen6.png
   */
  private static async playHoldBack(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const dart = FxEffects.dart(launchEl, dir);
    await Fx.wait(120);
    const w = Math.max(tr.width * 1.3, 80);
    const arc = Fx.box(w, w * 0.5, `border-radius:50%;border-top:${w * 0.09}px solid #FFF6C0;filter:drop-shadow(0 0 6px #FFD83A) drop-shadow(0 0 2px #ffffff)`);
    const effects: Promise<unknown>[] = [
      dart,
      Fx.spawn(fxEl, arc, { x: target.x, y: target.y - tr.height * 0.05 }, [
        { transform: `rotate(${-dir * 50}deg) scale(.6)`, opacity: 0 },
        { transform: `rotate(${-dir * 10}deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `rotate(${dir * 20}deg) scale(1.05)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' })
    ];
    setTimeout(() => {
      Fx.flash(targetEl, '#FFF2A0', 0.6);
      Fx.shake(targetEl, 4);
    }, 140);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.4;
      const d = w * (0.35 + Math.random() * 0.25);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.fivePointStar(10, '#FFD83A', '#FFFBE0', '#FFE88A'), target, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * d * 0.6}px,${Math.sin(a) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.5)`, opacity: 0 }
        ], { duration: 450, delay: 140 + i * 25, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
