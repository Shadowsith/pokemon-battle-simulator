import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { HealingWish } from './healing-wish';
import { PsychicFx } from './psychic-fx';

/** Hand-made animations for Psychic-type status moves (setup, screens, healing, tricks; Healing Wish lives in `healing-wish.ts`). */
export class PsychicStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    agility: (refs, launch) => PsychicStatusMoveAnimations.playAgility(refs, launch),
    amnesia: (refs, launch) => PsychicStatusMoveAnimations.playAmnesia(refs, launch),
    barrier: (refs, launch) => PsychicStatusMoveAnimations.playBarrier(refs, launch),
    calmmind: (refs, launch) => PsychicStatusMoveAnimations.playCalmMind(refs, launch),
    cosmicpower: (refs, launch) => PsychicStatusMoveAnimations.playCosmicPower(refs, launch),
    healingwish: (refs, launch) => HealingWish.play(refs, launch),
    lightscreen: (refs, launch, _target, v) => PsychicStatusMoveAnimations.playScreen(refs, launch, v, PsychicStatusMoveAnimations.LIGHT_SCREEN),
    magiccoat: (refs, launch) => PsychicStatusMoveAnimations.playMagicCoat(refs, launch),
    reflect: (refs, launch, _target, v) => PsychicStatusMoveAnimations.playScreen(refs, launch, v, PsychicStatusMoveAnimations.REFLECT),
    rest: (refs, launch, _target, v) => PsychicStatusMoveAnimations.playRest(refs, launch, v),
    trick: (refs, launch, target) => PsychicStatusMoveAnimations.playTrick(refs, launch, target)
  };

  /**
   * Trick, after the DPPt animation: the scene dims to a dark grey (0-0.3 s);
   * a cream bag pops up at the user and one at the target (0.3-0.45 s), and
   * they swap places three times round an oval - one passing high, the other
   * low (0.45-2.05 s); they settle swapped, fade (2.25-2.6 s) and the scene
   * clears (to ~2.9 s).
   */
  private static async playTrick(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const size = Math.max(Math.min(Fx.rect(launchEl).width, Fx.rect(targetEl).width) * 0.3, 22);

    const grey = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#4A4A48,#2E302E 55%,#1E2A28)');
    await Fx.anim(grey, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 300, easing: 'ease-out' });

    // The oval through both Pokémon: angle 0 is the target, PI the user; positive angles bulge upward.
    const c: Point = { x: (launch.x + target.x) / 2, y: (launch.y + target.y) / 2 };
    const hx = (target.x - launch.x) / 2;
    const hy = (target.y - launch.y) / 2;
    const half = Math.max(Math.hypot(hx, hy), 1);
    let nx = -hy / half;
    let ny = hx / half;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const bulge = half * 0.45;
    const at = (a: number) => ({ x: Math.cos(a) * hx + Math.sin(a) * bulge * nx, y: Math.cos(a) * hy + Math.sin(a) * bulge * ny });

    const swaps = 3;
    const travel = 1600;
    const steps = 36;
    const bags = [0, Math.PI].map(async (a0) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
      const bag = PsychicStatusMoveAnimations.trickBag(size);
      bag.style.left = `${-size / 2}px`;
      bag.style.top = `${-size * 0.55}px`;
      wrap.appendChild(bag);
      Fx.place(wrap, c);
      fxEl.appendChild(wrap);
      // Pop up in place, then run round the oval; the low pass is nearer the viewer, so a little bigger.
      const p0 = at(a0);
      wrap.style.transform = `translate(${p0.x}px,${p0.y}px)`;
      await Fx.anim(bag, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 150, easing: 'ease-out' });
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const a = a0 + (Math.PI * swaps * k) / steps;
        const p = at(a);
        frames.push({ transform: `translate(${p.x}px,${p.y}px) scale(${1 - 0.12 * Math.sin(a)})` });
      }
      await Fx.anim(wrap, frames, { duration: travel, easing: 'ease-in-out' });
      await Fx.wait(200);
      await Fx.anim(bag, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
      wrap.remove();
    });
    await Promise.all(bags);

    await Fx.anim(grey, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    grey.remove();
  }

  /** A cream sack, `size` px wide: domed top, wider at the bottom, shaded round its sides (Trick). */
  private static trickBag(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size * 1.05}px;pointer-events:none;filter:drop-shadow(0 1px 2px #00000088)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 24 25"><defs><linearGradient id="trickBag" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#C8C098"/><stop offset=".35" stop-color="#FFFBE6"/><stop offset=".7" stop-color="#ECE4C0"/><stop offset="1" stop-color="#B8B088"/></linearGradient></defs>' +
      '<path d="M2,23 L5,6 Q6,1 12,1 Q18,1 19,6 L22,23 Q12,25 2,23 Z" fill="url(#trickBag)" stroke="#8A8466" stroke-width=".8" stroke-linejoin="round"/>' +
      '</svg>';
    return el;
  }

  /**
   * Agility: the battle backdrop turns into rushing blue speed lines while the
   * caster zips around a small circle. Only its position moves, so it keeps
   * facing the opponent.
   */
  private static async playAgility(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1400;
    // Agility targets the caster itself, so derive facing from its side of the field.
    const facing: 1 | -1 = launch.x < W / 2 ? 1 : -1;

    const bg = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#0B3E9E,#1E8BE8 30%,#57C8FF 50%,#1E8BE8 70%,#0B3E9E)');
    // Lines rush past opposite to the way the caster faces, as if it is dashing forward.
    FxEffects.speedLines(bg, W, H, facing > 0 ? -1 : 1, ['#FFFFFF', '#9BE7FF']);
    const bgDone = Fx.anim(bg, [
      { opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.85 },
      { opacity: 0 }
    ], { duration: total, easing: 'linear' }).then(() => bg.remove());

    // Two quick laps around a small circle that starts and ends at the sprite's spot.
    await Fx.wait(180);
    await FxEffects.orbit(launchEl, 14, 2, 900, facing);
    await bgDone;
  }

  /**
   * Amnesia: the backdrop dims while a cloud with a "?" forms over the
   * caster. The cloud puffs away, the backdrop clears, and orange
   * sparkles drift over the caster.
   */
  private static async playAmnesia(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const head: Point = { x: launch.x, y: r.top - f.top + r.height * 0.15 };

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const dimIn = Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const cw = Math.max(r.width * 0.8, 72);
    const cloud = FxGlyphs.questionCloud(cw);
    const mark = cloud.lastElementChild as HTMLElement;
    Fx.place(cloud, head);
    fxEl.appendChild(cloud);

    Fx.anim(cloud, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.12)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 380, easing: 'ease-out', delay: 150 });
    // The question mark wobbles while the cloud hangs there.
    Fx.anim(mark, [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-12deg)', offset: 0.25 },
      { transform: 'rotate(10deg)', offset: 0.75 },
      { transform: 'rotate(0deg)' }
    ], { duration: 700, easing: 'ease-in-out', delay: 650 });
    await dimIn;
    await Fx.wait(1200);

    // Puff away: the cloud swells, blurs and fades; the backdrop clears.
    Fx.anim(cloud, [
      { transform: 'scale(1)', opacity: 1, filter: 'drop-shadow(0 0 6px #ffffffaa) blur(0px)' },
      { transform: 'translateY(-10px) scale(1.6)', opacity: 0, filter: 'drop-shadow(0 0 6px #ffffffaa) blur(6px)' }
    ], { duration: 450, easing: 'ease-out' }).then(() => cloud.remove());
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, easing: 'ease-in' });
    dim.remove();

    await FxEffects.orangeSparkles(refs, launch, head.y);
  }

  /**
   * Calm Mind: the scene goes dark (0-0.28 s); a white starburst glows on the
   * user while three pale red rings shrink in onto it one after another
   * (0.3-1.3 s); the scene clears and orange stat sparkles drift down (from ~1.5 s).
   */
  private static async playCalmMind(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const dim = await PsychicFx.dimIn(fieldEl);

    // White starburst: thin rays fading outward, turning slowly.
    const size = Math.max(Math.max(r.width, r.height) * 1.1, 70);
    const burst = document.createElement('div');
    const mask = 'radial-gradient(circle,#000 0 18%,#0008 45%,#0000 70%)';
    burst.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 10%,#ffffffaa 22%,#fff0 40%),repeating-conic-gradient(#ffffffdd 0 3deg,#fff0 3deg 14deg);-webkit-mask-image:${mask};mask-image:${mask}`;
    Fx.place(burst, launch);
    fxEl.appendChild(burst);
    const glow = Fx.anim(burst, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(12deg)', opacity: 1, offset: 0.2 },
      { transform: 'scale(.92) rotate(36deg)', opacity: 0.85, offset: 0.6 },
      { transform: 'scale(1.05) rotate(60deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(.4) rotate(72deg)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-in-out' }).then(() => burst.remove());

    // Pale red rings close in on the user, one every 0.25 s.
    const reach = Math.max(r.width, r.height) * 1.5 + 40;
    const rings: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      const bw = Math.max(reach * 0.05, 6);
      ring.style.cssText = `position:absolute;width:${reach}px;height:${reach}px;border-radius:50%;pointer-events:none;box-sizing:border-box;border:${bw}px solid #E8787Ccc;box-shadow:0 0 10px #E8787C99,inset 0 0 10px #E8787C99`;
      Fx.place(ring, launch);
      fxEl.appendChild(ring);
      rings.push(
        Fx.anim(ring, [
          { transform: 'scale(1)', opacity: 0 },
          { transform: 'scale(.85)', opacity: 0.9, offset: 0.2 },
          { transform: 'scale(.3)', opacity: 0.9, offset: 0.85 },
          { transform: 'scale(.15)', opacity: 0 }
        ], { duration: 650, easing: 'ease-in', delay: 100 + i * 250, fill: 'backwards' }).then(() => ring.remove())
      );
    }
    await Promise.all([glow, ...rings]);

    Fx.flash(launchEl, '#ffffff', 0.4);
    await PsychicFx.dimOut(dim);
    await FxEffects.orangeSparkles(refs, launch, launch.y - r.height / 2);
  }

  /**
   * Cosmic Power: the scene turns into a deep purple starry sky with
   * twinkling specks and violet light streaks (0-0.35 s); white five-point
   * stars and coloured specks stream up from the user to the top of the
   * screen (0.35-1.75 s); the sky clears and orange stat sparkles drift down (from ~2.1 s).
   */
  private static async playCosmicPower(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const specks = ['#ffffff', '#FF8AD8', '#7FE8FF', '#FFE27A', '#B89CFF'];

    // 1. Starry sky.
    const sky = Fx.backdrop(fieldEl, 'overflow:hidden;background:radial-gradient(ellipse at 45% 40%,#4A2490,#26105A 55%,#0E0626)');
    for (let i = 0; i < 6; i++) {
      const beam = document.createElement('div');
      const bw = 18 + Math.random() * 30;
      beam.style.cssText = `position:absolute;left:${Math.random() * W}px;top:-10%;width:${bw}px;height:120%;pointer-events:none;background:linear-gradient(180deg,#9A6CFF00,#9A6CFF66 40%,#C8A8FF55 60%,#9A6CFF00);filter:blur(6px);transform:rotate(${(Math.random() * 2 - 1) * 12}deg)`;
      sky.appendChild(beam);
      beam.animate([{ opacity: 0.4 }, { opacity: 1 }, { opacity: 0.4 }], { duration: 900 + Math.random() * 600, iterations: Infinity, delay: -Math.random() * 900 });
    }
    for (let i = 0; i < 46; i++) {
      const s = 1.5 + Math.random() * 2.5;
      const c = specks[i % specks.length];
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;left:${Math.random() * W}px;top:${Math.random() * H}px;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${c};box-shadow:0 0 4px ${c}`;
      sky.appendChild(dot);
      const dur = 500 + Math.random() * 700;
      dot.animate([{ opacity: 0.2 }, { opacity: 1 }, { opacity: 0.2 }], { duration: dur, iterations: Infinity, delay: -Math.random() * dur });
    }
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });

    // 2. Stars and specks stream up from the user.
    const spread = Math.max(r.width * 0.6, 40);
    const base = launch.y + r.height * 0.3;
    const rising: Promise<void>[] = [];
    for (let i = 0; i < 40; i++) {
      const isStar = i % 3 !== 2;
      const el = isStar
        ? FxGlyphs.fivePointStar(10 + Math.random() * 16, '#C8B4FF')
        : FxGlyphs.sparkStar(6 + Math.random() * 6, specks[1 + (i % (specks.length - 1))]);
      Fx.place(el, { x: launch.x + (Math.random() * 2 - 1) * spread, y: base - Math.random() * r.height * 0.4 });
      fxEl.appendChild(el);
      const rise = base + 30;
      const drift = (Math.random() * 2 - 1) * 30;
      const spin = (Math.random() * 2 - 1) * 180;
      rising.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 0 },
          { transform: `translate(${drift * 0.2}px,${-rise * 0.15}px) scale(1) rotate(${spin * 0.2}deg)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${drift * 0.8}px,${-rise * 0.8}px) scale(.9) rotate(${spin * 0.8}deg)`, opacity: 1, offset: 0.8 },
          { transform: `translate(${drift}px,${-rise}px) scale(.6) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 350, easing: 'ease-in', delay: (i / 40) * 750 + Math.random() * 60, fill: 'backwards' }).then(() => el.remove())
      );
    }
    Fx.flash(launchEl, '#C8B4FF', 0.35);
    await Promise.all(rising);

    // 3. The sky clears, then the stat boost.
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    sky.remove();
    await FxEffects.orangeSparkles(refs, launch, launch.y - r.height / 2);
  }

  /**
   * Barrier: a flat, glassy panel opens in front of the caster, a sheen of
   * light sweeps over it, it glows brighter with twinkling sparkles, then fades.
   */
  private static async playBarrier(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.9, 60);
    const h = Math.max(r.height * 1.0, 70);

    const panel = document.createElement('div');
    panel.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;overflow:hidden;border:2px solid #ffffffcc;border-radius:3px;background:linear-gradient(160deg,#E8FFFB66,#9FE9E255 45%,#7FD8D04d);box-shadow:0 0 10px #B8FFF6aa,inset 0 0 14px #ffffff66`;
    // Diagonal band of light that sweeps across the glass.
    const sheen = document.createElement('div');
    sheen.style.cssText = `position:absolute;top:-20%;left:0;width:${w * 0.35}px;height:140%;background:linear-gradient(90deg,transparent,#ffffffcc,transparent);transform:skewX(-20deg)`;
    panel.appendChild(sheen);
    Fx.place(panel, launch);
    fxEl.appendChild(panel);

    const total = 1700;
    const done = Fx.anim(panel, [
      { transform: 'scale(1,0.05)', opacity: 0, background: 'linear-gradient(160deg,#E8FFFB66,#9FE9E255 45%,#7FD8D04d)' },
      { transform: 'scale(1,1)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1,1)', opacity: 0.85, offset: 0.4, background: 'linear-gradient(160deg,#E8FFFB66,#9FE9E255 45%,#7FD8D04d)' },
      { transform: 'scale(1.02,1.02)', opacity: 1, offset: 0.6, background: 'linear-gradient(160deg,#D6FFF8bb,#7FE6DCaa 45%,#5CCFC699)' },
      { transform: 'scale(1,1)', opacity: 0.9, offset: 0.85 },
      { transform: 'scale(1,1)', opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' }).then(() => panel.remove());
    Fx.anim(sheen, [
      { transform: `translateX(${-w * 0.5}px) skewX(-20deg)` },
      { transform: `translateX(${w * 1.2}px) skewX(-20deg)` }
    ], { duration: 650, easing: 'ease-in-out', delay: 280 });

    // Sparkles twinkle on the glass, mostly near its upper edge and corners.
    const left = launch.x - w / 2;
    const top = launch.y - h / 2;
    for (let i = 0; i < 9; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 10, i % 3 ? '#ffffff' : '#C9FFF8');
      const corner = i < 4;
      Fx.place(star, {
        x: left + (corner ? (i % 2 ? w * 0.1 : w * 0.9) : Math.random() * w),
        y: top + (corner ? (i < 2 ? h * 0.1 : h * 0.9) : Math.random() * h * 0.6)
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: 300 + Math.random() * 900 }).then(() => star.remove());
    }
    Fx.flash(launchEl, '#B8FFF6', 0.3);
    await done;
  }

  /**
   * Rest: the caster falls asleep. A sleep bubble swells and shrinks at its
   * head while pink "Z"s float up and away, growing as they rise; then green
   * HP sparkles show it regaining health.
   */
  private static async playRest(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    // The bubble and the Zs sit at the head, drifting away from the foe.
    const away = -v.dir;
    const head: Point = { x: launch.x + away * r.width * 0.15, y: r.top - f.top + r.height * 0.2 };

    // Sleep bubble: breathes in and out twice, then pops.
    const size = Math.max(r.width * 0.28, 24);
    const bubble = document.createElement('div');
    bubble.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 32% 28%,#ffffffee 0 10%,#ffffff33 30%,#E6F4FF22 60%,#CFE6FF55);border:1.5px solid #ffffffcc;box-shadow:0 0 6px #ffffff88`;
    Fx.place(bubble, { x: head.x + away * size * 0.6, y: head.y - size * 0.3 });
    fxEl.appendChild(bubble);
    const bubbleDone = Fx.anim(bubble, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.2 },
      { transform: 'scale(.55)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.65 },
      { transform: 'scale(.6)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1.5)', opacity: 0 }
    ], { duration: 1700, easing: 'ease-in-out' }).then(() => bubble.remove());

    // Pink Zs float up and away one after another.
    const zs = FxEffects.sleepZs(fxEl, head, away, ['#F08CD8', '#D79BF0']);
    await Promise.all([bubbleDone, zs]);

    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Magic Coat: a glowing magenta sphere swells round the user (0-0.3 s) and
   * a see-through white card appears in front of it (0.2-0.45 s); a sheen
   * sweeps over the card while purple sparkles twinkle round the sphere,
   * then everything fades (~1.4-1.7 s).
   */
  private static async playMagicCoat(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(Math.max(r.width, r.height) * 1.25, 80);
    const total = 1700;

    const sphere = document.createElement('div');
    sphere.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 50% 50%,#FF70F000 42%,#E040E033 62%,#F070FFaa 86%,#FFC0FFee 94%,#F070FF00 100%);box-shadow:0 0 18px #E040E0aa`;
    Fx.place(sphere, launch);
    fxEl.appendChild(sphere);
    const sphereDone = Fx.anim(sphere, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1.06)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1)', opacity: 0.9, offset: 0.3 },
      { transform: 'scale(1.03)', opacity: 1, offset: 0.6 },
      { transform: 'scale(1)', opacity: 0.85, offset: 0.82 },
      { transform: 'scale(1.08)', opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' }).then(() => sphere.remove());

    const cw = size * 0.45;
    const ch = size * 0.6;
    const card = document.createElement('div');
    card.style.cssText = `position:absolute;width:${cw}px;height:${ch}px;border-radius:${cw * 0.06}px;pointer-events:none;overflow:hidden;box-sizing:border-box;border:${Math.max(cw * 0.05, 3)}px solid #ffffff;background:linear-gradient(160deg,#ffffff66,#ffffff22 60%,#ffffff55);box-shadow:0 0 8px #ffffffcc,inset 0 0 6px #ffffffaa`;
    const sheen = document.createElement('div');
    sheen.style.cssText = `position:absolute;left:-30%;top:0;width:160%;height:${ch * 0.22}px;background:linear-gradient(180deg,transparent,#ffffffcc,transparent);transform:rotate(-12deg)`;
    card.appendChild(sheen);
    Fx.place(card, launch);
    fxEl.appendChild(card);
    const cardDone = Fx.anim(card, [
      { transform: 'scale(1,0)', opacity: 0 },
      { transform: 'scale(1,0)', opacity: 0, offset: 0.12 },
      { transform: 'scale(1,1.05)', opacity: 1, offset: 0.24 },
      { transform: 'scale(1,1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1,1)', opacity: 1, offset: 0.82 },
      { transform: 'scale(.9,.9)', opacity: 0 }
    ], { duration: total, easing: 'ease-out' }).then(() => card.remove());
    Fx.anim(sheen, [{ transform: `translateY(${-ch * 0.3}px) rotate(-12deg)` }, { transform: `translateY(${ch * 1.1}px) rotate(-12deg)` }], {
      duration: 650,
      easing: 'ease-in-out',
      delay: 500
    });

    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const d = (size / 2) * (0.85 + Math.random() * 0.35);
      const star = FxGlyphs.sparkStar(9 + Math.random() * 9, i % 2 ? '#B060FF' : '#F0A0FF');
      Fx.place(star, { x: launch.x + Math.cos(ang) * d, y: launch.y + Math.sin(ang) * d });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: 300 + Math.random() * 900, fill: 'backwards' }).then(() => star.remove());
    }
    Fx.flash(launchEl, '#F070FF', 0.3);
    await Promise.all([sphereDone, cardDone]);
  }

  /** Light Screen: bluish-pink, sparkles twinkle around the rim. */
  private static readonly LIGHT_SCREEN: ScreenStyle = {
    rim: '#FF8FE0',
    glow: '#7FB8FF',
    sparkColors: ['#7FB8FF', '#FF8FE0'],
    sparkles: 14,
    rimOnly: true
  };

  /** Reflect: purple-blue, more sparkles, also white ones scattered over the face. */
  private static readonly REFLECT: ScreenStyle = {
    rim: '#B07CFF',
    glow: '#7F9CFF',
    sparkColors: ['#B07CFF', '#ffffff', '#8FA8FF'],
    sparkles: 18,
    rimOnly: false
  };

  /**
   * Light Screen / Reflect: a round screen of light opens on the foe's side
   * of the caster, seen at an angle; a sheen sweeps over it while sparkles
   * twinkle on it, then it fades. `style` sets the colours and sparkles.
   */
  private static async playScreen(refs: BattleStageRefs, launch: Point, v: MoveVisual, style: ScreenStyle) {
    const { fxEl, launchEl } = refs;
    const { rim, glow } = style;
    const r = Fx.rect(launchEl);
    const h = Math.max(r.height * 1.15, 80);
    const w = h * 0.5;
    const at = { x: launch.x + v.dir * Math.max(r.width * 0.5, 34), y: launch.y - h * 0.05 };
    const tilt = v.dir * 12;

    const screen = document.createElement('div');
    screen.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;overflow:hidden;border:3px solid ${rim};background:radial-gradient(ellipse at 50% 50%,#FFFFFFcc 0%,#E6E4FFaa 30%,${glow}88 60%,${rim}aa 90%);box-shadow:0 0 14px ${rim},0 0 26px ${glow}aa,inset 0 0 16px #ffffffaa`;
    const sheen = document.createElement('div');
    sheen.style.cssText = `position:absolute;left:-20%;top:0;width:140%;height:${h * 0.25}px;background:linear-gradient(180deg,transparent,#ffffffdd,transparent)`;
    screen.appendChild(sheen);
    Fx.place(screen, at);
    fxEl.appendChild(screen);

    const total = 1700;
    const done = Fx.anim(screen, [
      { transform: `rotate(${tilt}deg) scale(.05,.3)`, opacity: 0 },
      { transform: `rotate(${tilt}deg) scale(1.08,1.05)`, opacity: 1, offset: 0.15 },
      { transform: `rotate(${tilt}deg) scale(1,1)`, opacity: 0.9, offset: 0.3 },
      { transform: `rotate(${tilt}deg) scale(1.03,1.03)`, opacity: 1, offset: 0.6 },
      { transform: `rotate(${tilt}deg) scale(1,1)`, opacity: 0.85, offset: 0.85 },
      { transform: `rotate(${tilt}deg) scale(.95,1)`, opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' }).then(() => screen.remove());
    Fx.anim(sheen, [
      { transform: `translateY(${-h * 0.3}px)` },
      { transform: `translateY(${h * 1.05}px)` }
    ], { duration: 700, easing: 'ease-in-out', delay: 280 });

    // Sparkles twinkle around the rim (and, unless rimOnly, every third one on the face).
    const rad = (tilt * Math.PI) / 180;
    for (let i = 0; i < style.sparkles; i++) {
      const ang = Math.random() * Math.PI * 2;
      const onFace = !style.rimOnly && i % 3 === 0;
      const dist = onFace ? Math.random() * 0.7 : 0.9 + Math.random() * 0.3;
      const ex = Math.cos(ang) * (w / 2) * dist;
      const ey = Math.sin(ang) * (h / 2) * dist;
      const star = FxGlyphs.sparkStar(9 + Math.random() * 10, style.sparkColors[i % style.sparkColors.length]);
      Fx.place(star, {
        x: at.x + ex * Math.cos(rad) - ey * Math.sin(rad),
        y: at.y + ex * Math.sin(rad) + ey * Math.cos(rad)
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: 200 + Math.random() * 1000 }).then(() => star.remove());
    }
    Fx.flash(launchEl, glow, 0.3);
    await done;
  }
}

/** Colours and sparkle layout of a protective screen (Light Screen, Reflect). */
interface ScreenStyle {
  /** Rim and outer-edge colour. */
  rim: string;
  /** Inner glow colour. */
  glow: string;
  sparkColors: string[];
  sparkles: number;
  /** Sparkles only on the rim; otherwise some also twinkle on the face. */
  rimOnly: boolean;
}
