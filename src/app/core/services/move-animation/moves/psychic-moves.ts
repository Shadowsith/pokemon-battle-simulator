import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP, PSYCHIC_WAVES } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Psychic-type moves. */
export class PsychicMoveAnimations {
  /** Hand-made Psychic move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    agility: (refs, launch) => PsychicMoveAnimations.playAgility(refs, launch),
    amnesia: (refs, launch) => PsychicMoveAnimations.playAmnesia(refs, launch),
    barrier: (refs, launch) => PsychicMoveAnimations.playBarrier(refs, launch),
    dreameater: (refs, launch, target, v) => PsychicMoveAnimations.playDreamEater(refs, launch, target, v),
    lightscreen: (refs, launch, _target, v) => PsychicMoveAnimations.playScreen(refs, launch, v, PsychicMoveAnimations.LIGHT_SCREEN),
    rest: (refs, launch, _target, v) => PsychicMoveAnimations.playRest(refs, launch, v),
    reflect: (refs, launch, _target, v) => PsychicMoveAnimations.playScreen(refs, launch, v, PsychicMoveAnimations.REFLECT),
    psychic: (refs) => PsychicMoveAnimations.playPsychic(refs)
  };

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
    const r = launchEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    const head: Point = { x: launch.x, y: r.top - f.top + r.height * 0.15 };

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const dimIn = Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // One cloud: overlapping bumps share a fill and a single glow (on the
    // wrapper), so they read as one shape with the "?" inside it.
    const cw = Math.max(r.width * 0.8, 72);
    const ch = cw * 0.62;
    const cloud = document.createElement('div');
    cloud.style.cssText = `position:absolute;width:${cw}px;height:${ch}px;pointer-events:none;filter:drop-shadow(0 0 6px #ffffffaa)`;
    const fill = 'background:radial-gradient(circle at 40% 30%,#fff,#E8ECF5 70%,#D2D8E6)';
    // [left, top, size] in % of the cloud width / height.
    for (const [x, y, size] of [
      [4, 38, 42],
      [22, 8, 52],
      [50, 14, 46],
      [58, 40, 38]
    ]) {
      const bump = document.createElement('div');
      bump.style.cssText = `position:absolute;left:${x}%;top:${y}%;width:${size}%;aspect-ratio:1;border-radius:50%;${fill}`;
      cloud.appendChild(bump);
    }
    const base = document.createElement('div');
    base.style.cssText = `position:absolute;left:12%;right:12%;bottom:4%;height:42%;border-radius:${ch}px;${fill}`;
    cloud.appendChild(base);
    const mark = document.createElement('div');
    mark.textContent = '?';
    mark.style.cssText = `position:absolute;left:0;right:0;top:50%;margin-top:-${ch * 0.3}px;height:${ch * 0.6}px;text-align:center;font:bold ${ch * 0.6}px/${ch * 0.6}px sans-serif;color:#6F7894`;
    cloud.appendChild(mark);
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
   * Barrier: a flat, glassy panel opens in front of the caster, a sheen of
   * light sweeps over it, it glows brighter with twinkling sparkles, then fades.
   */
  private static async playBarrier(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
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
