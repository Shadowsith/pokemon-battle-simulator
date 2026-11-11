import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { ClawStyle, FxEffects } from '../fx-effects';
import { RoarOfTime } from './dragon/roar-of-time';
import { SpacialRend } from './dragon/spacial-rend';

/** Dragon Claw's marks: black with a white edge and a blue light on the tip. */
const DRAGON_CLAW: ClawStyle = { glow: ['#ffffff', '#ffffffaa'], tip: '#3FA8FF' };

/** Sprite filter that turns a Pokémon magenta red, with a pink glow (Dragon Claw, Dragon Dance). */
const DRAGON_RED = 'grayscale(1) brightness(.55) sepia(1) saturate(12) hue-rotate(-40deg) drop-shadow(0 0 6px #FF3C8C)';

/** Hand-made animations for Dragon-type moves (Roar of Time and Spacial Rend live in `dragon/`). */
export class DragonMoveAnimations {
  /** Hand-made Dragon move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    dracometeor: (refs, launch, target) => DragonMoveAnimations.playDracoMeteor(refs, launch, target),
    dragonclaw: (refs, launch, target) => DragonMoveAnimations.playDragonClaw(refs, launch, target),
    dragondance: (refs, launch) => DragonMoveAnimations.playDragonDance(refs, launch),
    dragonpulse: (refs, launch, target) => DragonMoveAnimations.playDragonPulse(refs, launch, target),
    dragonrush: (refs, _launch, target) => DragonMoveAnimations.playDragonRush(refs, target),
    outrage: (refs, launch) => DragonMoveAnimations.playOutrage(refs, launch),
    roaroftime: (refs, launch, target) => RoarOfTime.play(refs, launch, target),
    spacialrend: (refs, launch, target) => SpacialRend.play(refs, launch, target)
  };

  /**
   * Draco Meteor, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/a/af/Draco_Meteor_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/b/b1/Draco_Meteor_Gen5.png
   *
   * The sky turns night blue (0-0.3 s) and thin white streaks rain across it
   * (0.3-0.8 s). Then five glowing blue and red meteors plunge onto the
   * target one after another, each bursting in a blue cloud (hits at ~1.06,
   * 1.24, 1.42, 1.6, 1.78 s). The sky clears (to ~2.35 s); last, blue
   * stat-down bubbles drift over the user (its Sp. Atk falls, to ~3.25 s).
   */
  private static async playDracoMeteor(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);

    const night = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#040A2E,#0E1E66 55%,#1A2E86)');
    await Fx.anim(night, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Falling white streaks, slanted the same way as the meteors.
    const slant = 25;
    for (let i = 0; i < 26; i++) {
      const len = 30 + Math.random() * 40;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:${Math.random() * W}px;top:${-len}px;width:1.5px;height:${len}px;pointer-events:none;background:linear-gradient(180deg,#ffffff00,#ffffff);transform:rotate(${slant}deg)`;
      fxEl.appendChild(streak);
      const fall = H + len * 2;
      Fx.anim(streak, [
        { transform: `rotate(${slant}deg) translateY(0)`, opacity: 0.9 },
        { transform: `rotate(${slant}deg) translateY(${fall}px)`, opacity: 0.9 }
      ], { duration: 380 + Math.random() * 160, delay: Math.random() * 450, easing: 'linear' }).then(() => streak.remove());
    }
    await Fx.wait(500);

    // The meteors: blue and red balls of light with a tail, each bursting on the target.
    const size = Math.max(tr.width * 0.45, 34);
    const angle = 90 + slant;
    const rad = (angle * Math.PI) / 180;
    const meteors: Promise<void>[] = [];
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const hit: Point = {
        x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3,
        y: target.y + (Math.random() * 2 - 1) * tr.height * 0.25
      };
      const reach = hit.y + size * 2;
      const dx = -Math.cos(rad) * reach;
      const dy = -Math.sin(rad) * reach;
      const meteor = DragonMoveAnimations.meteor(size, i % 2 ? '#FF4A6A' : '#5AB0FF', angle);
      Fx.place(meteor, { x: hit.x + dx, y: hit.y + dy });
      fxEl.appendChild(meteor);
      meteors.push(
        Fx.anim(meteor, [
          { transform: `rotate(${angle}deg)`, opacity: 0.6 },
          { transform: `translate(${-dx}px,${-dy}px) rotate(${angle}deg)`, opacity: 1 }
        ], { duration: 260, easing: 'ease-in' }).then(() => {
          meteor.remove();
          Fx.flash(targetEl, '#9CD0FF', 0.7);
          Fx.shake(targetEl, 6);
          Fx.shakeField(fieldEl, 0.5);
          puffs.push(FxEffects.smokePuff(fxEl, hit, size * 1.6, ['#5AA8FF', '#2A5AE0']));
        })
      );
      await Fx.wait(180);
    }
    await Promise.all(meteors);

    await Promise.all([Fx.anim(night, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' }), ...puffs]);
    night.remove();

    // The user's Sp. Atk falls sharply.
    await FxEffects.statDownBubbles(refs, launch);
  }

  /**
   * A meteor `size` px wide: a glowing ball in `color` with a white core and
   * a fading tail behind it, pointing along `angle` (degrees, its direction of travel).
   */
  private static meteor(size: number, color: string, angle: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;transform:rotate(${angle}deg)`;
    const tail = document.createElement('div');
    tail.style.cssText = `position:absolute;right:50%;top:25%;width:${size * 2.2}px;height:50%;border-radius:50%;background:linear-gradient(90deg,${color}00,${color}aa);filter:blur(2px)`;
    const ball = document.createElement('div');
    ball.style.cssText = `position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,#ffffff 0 22%,${color} 50%,${color}00 72%);box-shadow:0 0 ${size * 0.4}px ${color}`;
    el.append(tail, ball);
    return el;
  }

  /**
   * Dragon Pulse, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/8/8f/Drachenpuls_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/a/a1/Drachenpuls_Gen5.png
   *
   * The scene goes dark (0-0.25 s) and a purple orb ringed with violet light
   * swells in front of the user (0.25-0.75 s). It fires a widening stream of
   * white, blue-rimmed shock puffs at the target (0.75-1.6 s, hits at ~1.09
   * and 1.31 s), which glows white in the haze; then the scene clears (to ~1.9 s).
   */
  private static async playDragonPulse(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const at: Point = { x: launch.x + dir * lr.width * 0.2, y: launch.y };

    const dark = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The orb and its violet ring.
    const size = Math.max(Math.max(lr.width, lr.height) * 0.6, 50);
    const orb = document.createElement('div');
    orb.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 40%,#ffffff 0 14%,#9A8AFF 38%,#4A2AC8 66%,#4A2AC800 74%);box-shadow:0 0 14px #8A6AF0`;
    Fx.place(orb, at);
    const ring = document.createElement('div');
    ring.style.cssText = `width:${size * 1.5}px;height:${size * 1.5}px;border-radius:50%;pointer-events:none;border:3px solid #D08AFF;box-shadow:0 0 8px #C07AF0,inset 0 0 8px #C07AF0`;
    Fx.place(ring, at);
    fxEl.append(ring, orb);
    Fx.anim(ring, [
      { transform: 'scale(.3,.3)', opacity: 0 },
      { transform: 'scale(.55,1)', opacity: 1, offset: 0.5 },
      { transform: 'scale(.4,1.1)', opacity: 1, offset: 0.8 },
      { transform: 'scale(.3,1.2)', opacity: 0 }
    ], { duration: 1000, easing: 'ease-in-out' }).then(() => ring.remove());
    await Fx.anim(orb, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, easing: 'ease-out' });

    // The pulse: shock puffs stream out, growing as they go.
    const dx = target.x - at.x;
    const dy = target.y - at.y;
    const puffs: Promise<void>[] = [];
    const puffSize = size * 0.8;
    const grow = Math.max(tr.width, tr.height) / puffSize;
    for (let i = 0; i < 9; i++) {
      const puff = document.createElement('div');
      puff.style.cssText = `width:${puffSize}px;height:${puffSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 30%,#D8DCF0cc 55%,#D8DCF000 70%);border:2px solid #6A8AFFaa;box-shadow:0 0 6px #5A7AFF`;
      Fx.place(puff, at);
      fxEl.insertBefore(puff, orb);
      puffs.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0.9 },
          { transform: `translate(${dx}px,${dy}px) scale(${grow})`, opacity: 0.8, offset: 0.85 },
          { transform: `translate(${dx * 1.08}px,${dy * 1.08}px) scale(${grow * 1.1})`, opacity: 0 }
        ], { duration: 400, easing: 'ease-in', delay: i * 55 }).then(() => puff.remove())
      );
    }
    Fx.anim(orb, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4)', opacity: 0 }], { duration: 600, easing: 'ease-in' }).then(() => orb.remove());
    await Fx.wait(340);
    Fx.flash(targetEl, '#ffffff', 0.9);
    Fx.shake(targetEl, 6);
    setTimeout(() => Fx.flash(targetEl, '#B8A8FF', 0.6), 220);
    await Promise.all(puffs);

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }

  /**
   * Dragon Rush, after the Gen 4 / Gen 5 animation:
   * - Gen 4: https://www.pokewiki.de/images/4/40/Drachensto%C3%9F_Gen4.png
   * - Gen 5: https://www.pokewiki.de/images/6/6e/Drachensto%C3%9F_Gen5.png
   *
   * A pale pink crescent swipes across the target (0-0.3 s, hit at 0.15 s),
   * then a yellow dust cloud bursts up round it while dark rocks fly out and
   * tumble down (tremors at 0.3, 0.52, 0.74 s), and the dust drifts off (to ~1.45 s).
   */
  private static async playDragonRush(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);

    // The crescent swipe.
    const w = Math.max(tr.width * 1.1, 70);
    const crescent = document.createElement('div');
    crescent.style.cssText =
      `width:${w}px;height:${w * 0.5}px;pointer-events:none;border-radius:0 0 50% 50% / 0 0 100% 100%;` +
      'box-shadow:0 6px 0 -1px #FFE4F0,0 7px 6px -1px #FF9AC8;filter:drop-shadow(0 0 3px #FFC0DC)';
    Fx.place(crescent, { x: target.x, y: target.y - w * 0.2 });
    fxEl.appendChild(crescent);
    const swipe = Fx.anim(crescent, [
      { transform: 'rotate(-60deg) scale(.6)', opacity: 0 },
      { transform: 'rotate(-20deg) scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'rotate(20deg) scale(1.05)', opacity: 0 }
    ], { duration: 300, easing: 'ease-out' }).then(() => crescent.remove());
    await Fx.wait(150);
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    await swipe;

    // Dust cloud and flying rocks.
    const foot = Fx.footOf(targetEl, fieldEl);
    const dustAt: Point = { x: target.x, y: (target.y + foot.y) / 2 };
    const effects: Promise<void>[] = [];
    for (let k = 0; k < 3; k++) {
      effects.push(
        Fx.wait(k * 220).then(() => {
          Fx.shake(targetEl, 6);
          Fx.shakeField(fieldEl, 0.5);
          return FxEffects.smokePuff(fxEl, { x: dustAt.x + (k - 1) * tr.width * 0.2, y: dustAt.y }, Math.max(tr.width * 1.2, 80), ['#E8C04A', '#B08A2A']);
        })
      );
    }
    for (let i = 0; i < 7; i++) {
      const rock = FxGlyphs.rockChunk(12 + Math.random() * 10);
      rock.style.filter = 'brightness(.45) saturate(.4)';
      Fx.place(rock, { x: dustAt.x + (Math.random() * 2 - 1) * tr.width * 0.3, y: dustAt.y });
      fxEl.appendChild(rock);
      const side = Math.random() * 2 - 1;
      const up = tr.height * (0.6 + Math.random() * 0.5);
      const out = side * tr.width * 0.7;
      effects.push(
        Fx.anim(rock, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          { transform: `translate(${out * 0.5}px,${-up}px) rotate(${side * 120}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${out}px,${-up * 0.3}px) rotate(${side * 260}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'cubic-bezier(.2,.7,.5,1)', delay: Math.random() * 300 }).then(() => rock.remove())
      );
    }
    await Promise.all(effects);
  }

  /**
   * Dragon Dance: the user turns magenta red inside a swirling dark red storm
   * while small cyan lightning sparks flicker all over it (0-1.5 s); then
   * orange stat sparkles drift down (from ~1.55 s).
   */
  private static async playDragonDance(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const total = 1500;
    const tint = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: DRAGON_RED, offset: 0.15 },
      { filter: DRAGON_RED, offset: 0.85 },
      { filter: 'none' }
    ], { duration: total, easing: 'ease-in-out' });

    // The storm: dark red clouds on a turning wheel, stretched tall round the sprite.
    const reach = Math.max(r.width, r.height) * 0.42;
    const storm = document.createElement('div');
    storm.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y}px;width:0;height:0;pointer-events:none;transform:scale(1,1.2)`;
    const wheel = document.createElement('div');
    wheel.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0';
    storm.appendChild(wheel);
    for (let i = 0; i < 10; i++) {
      const size = Math.max(r.width, 50) * (0.35 + Math.random() * 0.25);
      const ang = (i / 10) * Math.PI * 2;
      const dist = reach * (0.55 + Math.random() * 0.5);
      const cloud = document.createElement('div');
      cloud.style.cssText = `position:absolute;left:${Math.cos(ang) * dist - size / 2}px;top:${Math.sin(ang) * dist - size / 2}px;width:${size}px;height:${size * 0.7}px;border-radius:50%;background:radial-gradient(ellipse,#D8182Cdd,#9A0A18aa 50%,#9A0A1800 72%);filter:blur(4px)`;
      wheel.appendChild(cloud);
    }
    fxEl.appendChild(storm);
    const spin = Fx.anim(wheel, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-540deg)' }], { duration: total, easing: 'linear' });
    const fade = Fx.anim(storm, [
      { opacity: 0, transform: 'scale(.6,.72)' },
      { opacity: 1, transform: 'scale(1,1.2)', offset: 0.15 },
      { opacity: 1, transform: 'scale(1,1.2)', offset: 0.85 },
      { opacity: 0, transform: 'scale(1.15,1.38)' }
    ], { duration: total, easing: 'ease-in-out' });

    // Small cyan lightning scribbles flicker on and off all over the user.
    for (let i = 0; i < 22; i++) {
      const w = 18 + Math.random() * 18;
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
      svg.setAttribute('width', `${w}`);
      svg.setAttribute('height', `${w}`);
      svg.setAttribute('style', 'position:absolute;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 3px #3FD8F0)');
      const line = document.createElementNS(ns, 'polyline');
      const pts: string[] = [];
      for (let k = 0; k <= 5; k++) pts.push(`${((k / 5) * w).toFixed(1)},${(w / 2 + (Math.random() * 2 - 1) * w * 0.3).toFixed(1)}`);
      line.setAttribute('points', pts.join(' '));
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#8CF2FF');
      line.setAttribute('stroke-width', '1.6');
      line.setAttribute('stroke-linejoin', 'bevel');
      svg.appendChild(line);
      svg.style.left = `${launch.x + (Math.random() * 2 - 1) * r.width * 0.55 - w / 2}px`;
      svg.style.top = `${launch.y + (Math.random() * 2 - 1) * r.height * 0.55 - w / 2}px`;
      svg.style.transform = `rotate(${Math.random() * 360}deg)`;
      svg.style.opacity = '0';
      fxEl.appendChild(svg);
      // Two quick hard flickers.
      Fx.anim(svg, [
        { opacity: 1, easing: 'step-end' },
        { opacity: 0, offset: 0.35, easing: 'step-end' },
        { opacity: 1, offset: 0.55, easing: 'step-end' },
        { opacity: 0 }
      ], { duration: 200, delay: 200 + Math.random() * (total - 500) }).then(() => svg.remove());
    }

    await Promise.all([tint, spin, fade]);
    storm.remove();
    await FxEffects.orangeSparkles(refs, launch, launch.y - r.height / 2);
  }

  /**
   * Dragon Claw: the user glows magenta red while pink light streaks and
   * white sparkles rise from its feet (0-0.75 s); then three black claw marks
   * with white edges and blue tips rip down the left side of the target (hit
   * at 0.92 s) and three more down its right side (hit at 1.27 s).
   */
  private static async playDragonClaw(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);

    // 1. Power up: magenta red tint + rising pink streaks and white sparkles.
    const tint = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: DRAGON_RED, offset: 0.2 },
      { filter: DRAGON_RED, offset: 0.8 },
      { filter: 'none' }
    ], { duration: 750, easing: 'ease-in-out' });
    const rise = Math.max(lr.height * 1.4, 90);
    for (let i = 0; i < 18; i++) {
      const pink = i % 3 !== 2;
      const w = pink ? 6 + Math.random() * 5 : 2 + Math.random() * 2;
      const h = pink ? w * (2.2 + Math.random()) : 20 + Math.random() * 30;
      const p = document.createElement('div');
      p.style.cssText = pink
        ? `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFD0E4,#FF6EB0 55%,#FF3C8C00 80%)`
        : `position:absolute;width:${w}px;height:${h}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(0deg,#ffffff00,#ffffff 50%,#ffffff00)`;
      Fx.place(p, { x: foot.x + (Math.random() * 2 - 1) * lr.width * 0.55, y: foot.y - Math.random() * lr.height * 0.4 });
      fxEl.appendChild(p);
      const up = rise * (0.6 + Math.random() * 0.4);
      Fx.anim(p, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: `translateY(${-up * 0.25}px)`, opacity: 1, offset: 0.25 },
        { transform: `translateY(${-up}px)`, opacity: 0 }
      ], { duration: 550 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 250 }).then(() => p.remove());
    }
    await tint;
    await Fx.wait(50);

    // 2. Two rakes of three claw marks: left side, then right side.
    const r = Fx.rect(targetEl);
    const len = Math.max(r.height * 0.6, 48);
    const gap = Math.max(r.width * 0.1, 9);
    const marks: Promise<void>[] = [];
    for (const side of [-1, 1]) {
      const centre: Point = { x: target.x + side * r.width * 0.2, y: target.y };
      for (const k of [-1, 0, 1]) {
        marks.push(FxEffects.clawMark(fxEl, { x: centre.x + k * gap, y: centre.y + k * gap * 0.4 }, len, 64, DRAGON_CLAW));
      }
      await Fx.wait(120);
      Fx.flash(targetEl, '#ffffff', 0.5);
      Fx.shake(targetEl, 5);
      await Fx.wait(230);
    }
    await Promise.all(marks);
  }

  /**
   * Outrage: the scene goes dark, then a wall of purple and magenta dragon
   * fire rolls across the background from left to right, glowing hot behind
   * the raging caster, which flares with pulsing orange sparkles while the
   * target is battered.
   */
  private static async playOutrage(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1800;

    // 1. Darkness.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Magenta sky, a hot glow behind the caster and two rolling rows of flames.
    const fire = document.createElement('div');
    fire.style.cssText =
      'position:absolute;inset:0;overflow:hidden;' +
      `background:radial-gradient(circle at ${launch.x}px ${launch.y + H * 0.1}px,#FFF2A0,#FFC24A88 14%,#FFC24A00 32%),` +
      'linear-gradient(180deg,#E04E8C,#E070B0 45%,#C8A0E8)';
    dim.appendChild(fire);
    fire.appendChild(DragonMoveAnimations.flameRow(W, H, 0.95, '#8A1E62', 700));
    fire.appendChild(DragonMoveAnimations.flameRow(W, H, 0.6, '#B23A86', 520));
    await Fx.anim(fire, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The caster rages: pulsing orange sparkles; the target is battered.
    const rage = DragonMoveAnimations.rageSparkles(refs, launch, total - 300);
    for (let i = 0; i < 3; i++) setTimeout(() => { Fx.flash(targetEl, '#FF9A2A', 0.5); Fx.shake(targetEl, 5); }, 450 + i * 400);
    for (let i = 0; i < 5; i++) setTimeout(() => Fx.flash(launchEl, '#FF8A1A', 0.7), i * 300);
    await rage;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * A row of flame tongues along the bottom of the field, `reach` × field
   * height tall, scrolling endlessly left to right (`period` ms per flame)
   * and flickering. Lives until its layer is removed.
   */
  private static flameRow(W: number, H: number, reach: number, color: string, period: number): HTMLElement {
    const n = 7;
    const gap = W / n;
    const row = document.createElement('div');
    row.style.cssText = `position:absolute;left:${-gap}px;bottom:0;width:${W + gap * 2}px;height:${H}px`;
    for (let i = 0; i < n + 2; i++) {
      const h = H * reach * (0.7 + Math.random() * 0.3);
      const flame = document.createElement('div');
      flame.style.cssText = `position:absolute;left:${i * gap - gap * 0.15}px;bottom:${-H * 0.05}px;width:${gap * 1.3}px;height:${h}px;transform-origin:50% 100%`;
      flame.innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"><path d="M55 0C62 22 88 38 86 66C84 88 68 100 50 100C32 100 14 88 14 66C14 46 34 40 40 22C44 30 50 30 55 0Z" fill="${color}"/></svg>`;
      row.appendChild(flame);
      flame.animate(
        [{ transform: 'scale(1,1) skewX(0deg)' }, { transform: `scale(.92,1.12) skewX(${-6 - Math.random() * 6}deg)` }, { transform: 'scale(1,1) skewX(0deg)' }],
        { duration: 260 + Math.random() * 200, iterations: Infinity, easing: 'ease-in-out', delay: -Math.random() * 400 }
      );
    }
    // One flame gap per period: the row looks endless.
    row.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${gap}px)` }], { duration: period, iterations: Infinity, easing: 'linear' });
    return row;
  }

  /** Orange sparkles pop on and around the caster in pulses for `duration` ms. */
  private static async rageSparkles(refs: BattleStageRefs, launch: Point, duration: number): Promise<void> {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const pops: Promise<void>[] = [];
    const pulses = Math.round(duration / 300);
    for (let p = 0; p < pulses; p++) {
      for (let i = 0; i < 4; i++) {
        const star = FxGlyphs.sparkStar(12 + Math.random() * 14, i % 2 ? '#FF8A1A' : '#FFC24A');
        Fx.place(star, {
          x: launch.x + (Math.random() * 2 - 1) * r.width * 0.5,
          y: launch.y + (Math.random() * 2 - 1) * r.height * 0.5
        });
        fxEl.appendChild(star);
        pops.push(
          Fx.anim(star, [
            { transform: 'scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'scale(1.2) rotate(25deg)', opacity: 1, offset: 0.4 },
            { transform: 'scale(0) rotate(45deg)', opacity: 0 }
          ], { duration: 380, easing: 'ease-out', delay: Math.random() * 80 }).then(() => star.remove())
        );
      }
      await Fx.wait(300);
    }
    await Promise.all(pops);
  }
}
