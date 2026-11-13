import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';
import { Autotomize } from './steel/autotomize';
import { GyroBall } from './steel/gyro-ball';
import { HeavySlam } from './steel/heavy-slam';
import { IronHead } from './steel/iron-head';

/** Silver tones of Steel moves: sparkle, dust light, dust shade. */
const SILVER = '#DDE2EC';
const DUST: [string, string] = ['#E4E8F0', '#A9B0BE'];

/** Hand-made animations for Steel-type moves (Autotomize, Gyro Ball, Heavy Slam and Iron Head live in `steel/`). */
export class SteelMoveAnimations {
  /** Hand-made Steel move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    autotomize: (refs, launch) => Autotomize.play(refs, launch),
    doomdesire: (refs) => SteelMoveAnimations.playDoomDesireHit(refs),
    flashcannon: (refs, launch, target) => SteelMoveAnimations.playFlashCannon(refs, launch, target),
    gyroball: (refs, launch, target, v) => GyroBall.play(refs, launch, target, v),
    heavyslam: (refs, launch, target) => HeavySlam.play(refs, launch, target),
    irondefense: (refs, launch) => SteelMoveAnimations.playIronDefense(refs, launch),
    ironhead: (refs, launch, target, v) => IronHead.play(refs, launch, target, v),
    irontail: (refs, launch, target, v) => SteelMoveAnimations.playIronTail(refs, launch, target, v),
    kingsshield: (refs, launch, _target, v) => SteelMoveAnimations.playKingsShield(refs, launch, v),
    meteormash: (refs, _launch, target) => SteelMoveAnimations.playMeteorMash(refs, target),
    steelwing: (refs, launch, target, v) => SteelMoveAnimations.playSteelWing(refs, launch, target, v)
  };

  /**
   * Flash Cannon, after the Gen 4 / Gen 5 animation:
   * - Gen 4 (DPPt): https://www.pokewiki.de/images/8/86/Lichtkanone_DPPt.png
   * - Gen 4 (HGSS): https://www.pokewiki.de/images/2/28/Lichtkanone_HGSS.png
   * - Gen 5: https://www.pokewiki.de/images/5/53/Lichtkanone_Gen5.png
   *
   * The scene goes dark (0-0.25 s) and streaks of white light rush in to the
   * user while sparkles twinkle on it (0.25-0.75 s). A white orb with a
   * magenta core and ring forms in front of it (0.6-0.95 s) and fires a
   * white beam at the target (0.95-1.35 s, hit at 1.1 s), where red light
   * puffs and white rings burst out (to ~2.0 s); the scene clears (to ~2.3 s).
   */
  private static async playFlashCannon(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const at: Point = { x: launch.x + dir * lr.width * 0.25, y: launch.y };

    const dark = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // Light gathers: white streaks rush in, sparkles twinkle on the user.
    const reach = Math.max(lr.width, lr.height) * 1.4;
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 20 + Math.random() * 25;
      const streak = document.createElement('div');
      streak.style.cssText = `width:${len}px;height:2px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#ffffff,#ffffff00)`;
      Fx.place(streak, at);
      fxEl.appendChild(streak);
      const deg = (ang * 180) / Math.PI;
      const from = `translate(${Math.cos(ang) * reach}px,${Math.sin(ang) * reach}px) rotate(${deg}deg)`;
      Fx.anim(streak, [
        { transform: from, opacity: 0 },
        { transform: from, opacity: 1, offset: 0.2 },
        { transform: `translate(0,0) rotate(${deg}deg)`, opacity: 0.6 }
      ], { duration: 380, delay: Math.random() * 250, easing: 'ease-in' }).then(() => streak.remove());
    }
    for (let i = 0; i < 6; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, '#ffffff');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.4, y: launch.y + (Math.random() * 2 - 1) * lr.height * 0.4 });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0)', opacity: 0 }
      ], { duration: 350, delay: Math.random() * 300, easing: 'ease-in-out' }).then(() => star.remove());
    }
    await Fx.wait(350);

    // The orb: magenta core and ring, turning white.
    const size = Math.max(Math.max(lr.width, lr.height) * 0.5, 44);
    const orb = document.createElement('div');
    orb.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 30%,#FF4AD0 52%,#FF4AD000 70%);border:3px solid #F07AF0;box-shadow:0 0 12px #FF6AE0`;
    Fx.place(orb, at);
    fxEl.appendChild(orb);
    await Fx.anim(orb, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, easing: 'ease-out' });

    // The beam.
    const dx = target.x - at.x;
    const dy = target.y - at.y;
    const len = Math.hypot(dx, dy);
    const beamH = size * 0.45;
    const beam = document.createElement('div');
    beam.style.cssText =
      `position:absolute;left:${at.x}px;top:${at.y - beamH / 2}px;width:${len}px;height:${beamH}px;transform-origin:0 50%;pointer-events:none;` +
      'border-radius:0 50% 50% 0 / 0 50% 50% 0;background:linear-gradient(180deg,#D0F0FF00,#E8F8FF 25%,#ffffff 50%,#E8F8FF 75%,#D0F0FF00);filter:drop-shadow(0 0 4px #9CE0FF)';
    fxEl.insertBefore(beam, orb);
    const rot = `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`;
    const shot = Fx.anim(beam, [
      { transform: `${rot} scaleX(0)`, opacity: 1 },
      { transform: `${rot} scaleX(1)`, opacity: 1, offset: 0.4 },
      { transform: `${rot} scaleX(1) scaleY(.2)`, opacity: 0 }
    ], { duration: 400, easing: 'ease-out' }).then(() => beam.remove());
    Fx.anim(orb, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.3)', opacity: 0 }], { duration: 400, easing: 'ease-in' }).then(() => orb.remove());
    await Fx.wait(160);

    // The hit: red light puffs and white rings.
    Fx.flash(targetEl, '#ffffff', 0.9);
    Fx.shake(targetEl, 6);
    const effects: Promise<void>[] = [shot, FxEffects.smokePuff(fxEl, target, Math.max(tr.width, 70), ['#FF5A6A', '#E0203A'])];
    for (let i = 0; i < 10; i++) {
      const s = 8 + Math.random() * 10;
      const ring = document.createElement('div');
      ring.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:1.5px solid #ffffff;box-shadow:0 0 3px #ffffff`;
      Fx.place(ring, target);
      fxEl.appendChild(ring);
      const ang = Math.random() * Math.PI * 2;
      const d = Math.max(tr.width, 60) * (0.4 + Math.random() * 0.4);
      effects.push(
        Fx.anim(ring, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - 10}px) scale(1.1)`, opacity: 0 }
        ], { duration: 650, delay: 100 + Math.random() * 150, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    await Promise.all(effects);

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }

  /**
   * King's Shield, after the XY animation: magenta sparks crackle round the
   * user while a small grey orb forms in front of it, facing the foe
   * (0-0.4 s). The orb opens into a glowing white-lilac honeycomb shield
   * (0.35-0.6 s) that shimmers (to 1.3 s) and fades (to ~1.6 s).
   */
  private static async playKingsShield(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const front: Point = { x: launch.x + v.dir * r.width * 0.3, y: launch.y - r.height * 0.1 };

    // Magenta sparks crackle round the user.
    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const d = Math.max(r.width, 60) * (0.35 + Math.random() * 0.2);
      const x0 = launch.x + Math.cos(ang) * d;
      const y0 = launch.y + Math.sin(ang) * d;
      const len = 14 + Math.random() * 12;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 3px #FF40E0)');
      const bolt = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      bolt.setAttribute('points', Fx.zigzagPoints(x0, y0 - len / 2, x0 + (Math.random() * 2 - 1) * 6, y0 + len / 2, 5));
      bolt.setAttribute('fill', 'none');
      bolt.setAttribute('stroke', '#FF70F0');
      bolt.setAttribute('stroke-width', '2');
      svg.appendChild(bolt);
      fxEl.appendChild(svg);
      sparks.push(
        Fx.anim(svg, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.2, offset: 0.5 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], {
          duration: 260,
          delay: i * 50,
          easing: 'linear'
        }).then(() => svg.remove())
      );
    }

    // The orb forms in front of the user, then opens into the shield.
    const h = Math.max(r.height * 1.05, 80);
    const orbSize = h * 0.3;
    const orb = document.createElement('div');
    orb.style.cssText = `width:${orbSize}px;height:${orbSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#E8E8F0aa,#8A8A98aa 60%,#5A5A6888);border:1px solid #C8C8D8`;
    Fx.place(orb, front);
    fxEl.appendChild(orb);
    await Fx.anim(orb, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, easing: 'ease-out' });

    const glow = document.createElement('div');
    glow.style.cssText = `width:${h * 1.1}px;height:${h * 1.3}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#ffffff 0 18%,#F0E0FFcc 35%,#C8A0FF55 55%,#A070FF00 70%)`;
    const shield = SteelMoveAnimations.honeycomb(h * 0.8, h);
    Fx.place(glow, front);
    Fx.place(shield, front);
    fxEl.append(glow, shield);
    orb.remove();
    const total = 1250;
    await Promise.all([
      ...sparks,
      Fx.anim(glow, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(.95)', opacity: 0.8, offset: 0.45 },
        { transform: 'scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.05)', opacity: 0 }
      ], { duration: total, easing: 'ease-out' }).then(() => glow.remove()),
      Fx.anim(shield, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.2 },
        { transform: 'scale(1)', opacity: 0.75, offset: 0.4 },
        { transform: 'scale(1)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1)', opacity: 0.85, offset: 0.78 },
        { transform: 'scale(1.03)', opacity: 0 }
      ], { duration: total, easing: 'ease-out' }).then(() => shield.remove())
    ]);
  }

  /** An oval shield of lilac-outlined hexagon cells, `w` × `h` px, brightest in the middle. */
  private static honeycomb(w: number, h: number): HTMLElement {
    const hex = (cx: number, cy: number, rad: number) => {
      const pts: string[] = [];
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k + Math.PI / 6;
        pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}"/>`;
    };
    const rad = 8;
    const dx = rad * Math.sqrt(3);
    let cells = '';
    for (let row = -7; row <= 7; row++) {
      const cy = row * rad * 1.5;
      for (let col = -4; col <= 4; col++) cells += hex(col * dx + (row % 2 ? dx / 2 : 0), cy, rad - 0.6);
    }
    const id = `kingsShield${SteelMoveAnimations.shieldId++}`;
    const el = document.createElement('div');
    el.style.cssText = `width:${w}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 4px #C080FF)`;
    el.innerHTML =
      `<svg viewBox="-40 -50 80 100" width="100%" height="100%" style="display:block">` +
      `<defs><clipPath id="${id}c"><ellipse cx="0" cy="0" rx="38" ry="48"/></clipPath>` +
      `<radialGradient id="${id}g"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".6" stop-color="#E8D0FF" stop-opacity=".35"/><stop offset="1" stop-color="#B080FF" stop-opacity=".2"/></radialGradient></defs>` +
      `<g clip-path="url(#${id}c)" fill="url(#${id}g)" stroke="#C890FF" stroke-width="1.2">${cells}</g></svg>`;
    return el;
  }

  private static shieldId = 0;

  /** Animations of the turn a delayed Steel attack is used, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    doomdesire: (refs) => SteelMoveAnimations.playDoomDesireWish(refs)
  };

  /**
   * Meteor Mash: the scene goes black (0-0.25 s) and yellow shooting stars
   * streak past the target one after another (0.25-1.0 s); then a yellow fist
   * slams into it (1.15 s) and stars burst out of the fist in all directions.
   */
  private static async playMeteorMash(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const black = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#1A1A20,#000)');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // 1. Shooting stars streak past the target, falling at a slant.
    const reach = Math.max(r.width * 1.4, 110);
    const streaks: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = 25 + Math.random() * 25;
      const rad = (angle * Math.PI) / 180;
      const side = (i % 2 ? 1 : -1) * (0.15 + Math.random() * 0.4) * r.width;
      const c = { x: target.x - Math.sin(rad) * side, y: target.y + Math.cos(rad) * side };
      const star = SteelMoveAnimations.shootingStar(12 + Math.random() * 6, reach * 0.5, angle);
      Fx.place(star, c);
      fxEl.appendChild(star);
      const dx = Math.cos(rad) * reach;
      const dy = Math.sin(rad) * reach;
      streaks.push(
        Fx.anim(star, [
          { transform: `translate(${-dx}px,${-dy}px) rotate(${angle}deg)`, opacity: 0 },
          { transform: `translate(${-dx * 0.6}px,${-dy * 0.6}px) rotate(${angle}deg)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx * 0.6}px,${dy * 0.6}px) rotate(${angle}deg)`, opacity: 1, offset: 0.8 },
          { transform: `translate(${dx}px,${dy}px) rotate(${angle}deg)`, opacity: 0 }
        ], { duration: 380, easing: 'linear', delay: i * 75, fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all(streaks);
    await Fx.wait(150);

    // 2. The yellow fist slams in; stars burst out of it.
    const fistW = Math.max(r.width * 0.55, 44);
    const fist = FxGlyphs.fistGlyph(fistW, 'yellow');
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [{ transform: 'scale(2.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], {
      duration: 150,
      easing: 'ease-in',
      fill: 'forwards'
    });
    Fx.flash(targetEl, '#FFE04A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.6);
    const burst: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const star = FxGlyphs.fivePointStar(10 + Math.random() * 8, '#FFD83A', '#FFFBE0', '#FFD83A');
      Fx.place(star, target);
      fxEl.insertBefore(star, fist);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const d = Math.max(r.width * 0.8, 60) * (0.7 + Math.random() * 0.4);
      burst.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px) scale(1) rotate(120deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(.6) rotate(180deg)`, opacity: 0 }
        ], { duration: 550, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    const fistDone = Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 550, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all([fistDone, ...burst]);

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    black.remove();
  }

  /**
   * A yellow five-point star with a fading yellow tail of `tail` px behind it,
   * pointing right (rotate it to the flight direction; the star stays upright
   * inside by counter-rotating by `angle`).
   */
  private static shootingStar(size: number, tail: number, angle: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none`;
    const trail = document.createElement('div');
    trail.style.cssText = `position:absolute;right:${size / 2}px;top:${size * 0.3}px;width:${tail}px;height:${size * 0.4}px;border-radius:${size}px;background:linear-gradient(90deg,#FFD83A00,#FFD83A88 60%,#FFF3A0);filter:blur(1px)`;
    const star = FxGlyphs.fivePointStar(size, '#FFD83A', '#FFFBE0', '#FFD83A');
    star.style.left = '0';
    star.style.top = '0';
    star.style.transform = `rotate(${-angle}deg)`;
    el.append(trail, star);
    return el;
  }

  /**
   * Iron Defense: the background blinks white twice (0-0.4 s); the user turns
   * shiny metallic silver, gleaming twice while glints twinkle on it
   * (0.45-1.25 s); then an orange-red stat-up aura rises over it (1.3-2.1 s).
   */
  private static async playIronDefense(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);

    // 1. Two quick white blinks of the background.
    const white = Fx.backdrop(fieldEl, 'background:#ffffff');
    await Fx.anim(white, [
      { opacity: 0, easing: 'step-end' }, { opacity: 1, offset: 0.2, easing: 'step-end' },
      { opacity: 0, offset: 0.45, easing: 'step-end' }, { opacity: 1, offset: 0.65, easing: 'step-end' },
      { opacity: 0, offset: 0.9 }, { opacity: 0 }
    ], { duration: 400, easing: 'linear' });
    white.remove();
    await Fx.wait(50);

    // 2. Metallic silver, gleaming twice, with glints.
    const metal = 'grayscale(1) brightness(1.15) contrast(1.25)';
    const shine = `grayscale(1) brightness(1.7) contrast(1.1) drop-shadow(0 0 8px ${SILVER})`;
    const base = `${metal} drop-shadow(0 0 3px ${SILVER})`;
    const steel = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: base, offset: 0.15 },
      { filter: shine, offset: 0.3 },
      { filter: base, offset: 0.45 },
      { filter: shine, offset: 0.65 },
      { filter: base, offset: 0.85 },
      { filter: 'none' }
    ], { duration: 800, easing: 'ease-in-out', fill: 'none' });
    const glints: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, '#ffffff');
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * r.width * 0.4,
        y: launch.y + (Math.random() * 2 - 1) * r.height * 0.4
      });
      fxEl.appendChild(star);
      glints.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 320, easing: 'ease-in-out', delay: 120 + i * 120, fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all([steel, ...glints]);

    // 3. Orange-red stat-up aura.
    await Fx.wait(50);
    await FxEffects.statUpAura(refs, launch);
  }

  /**
   * Doom Desire, the turn it's used (sound: hum from 0 s, glints 0.35 / 0.8 s):
   * the scene goes dark, then the user swells up twice, glowing white each time.
   */
  private static async playDoomDesireWish(refs: BattleStageRefs) {
    const { fieldEl, launchEl } = refs;
    const dim = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#1E1E2A,#050508)');
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    launchEl.style.transformOrigin = 'center bottom';
    for (let i = 0; i < 2; i++) {
      await Fx.anim(launchEl, [
        { transform: 'scale(1)', filter: 'brightness(1) drop-shadow(0 0 0 #fff0)' },
        { transform: 'scale(1.15)', filter: 'brightness(2.2) drop-shadow(0 0 10px #ffffff)', offset: 0.4 },
        { transform: 'scale(1)', filter: 'brightness(1) drop-shadow(0 0 0 #fff0)' }
      ], { duration: 420, easing: 'ease-in-out' });
      await Fx.wait(30);
    }
    launchEl.style.transformOrigin = '';
    await Fx.wait(150);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Doom Desire, two turns later: a pale violet scene with magenta and purple
   * light streaks raining down from above; dark purple orbs fall onto the
   * target, then it is rocked by dark purple blasts with glowing yellow cores.
   */
  private static async playDoomDesireHit(refs: BattleStageRefs) {
    const { fieldEl, fxEl, targetEl } = refs;
    const target = Fx.centerOf(targetEl, fieldEl);
    const r = Fx.rect(targetEl);
    const sky = Fx.backdrop(fieldEl, 'overflow:hidden;background:linear-gradient(160deg,#B8A8C4,#DCD2E2 50%,#C4B6CE)');
    const tilt = 25;
    const rain = document.createElement('div');
    rain.style.cssText = `position:absolute;inset:-50%;transform:rotate(${-tilt}deg)`;
    sky.appendChild(rain);
    const { width: rw, height: rh } = Fx.rect(fieldEl);
    for (let i = 0; i < 16; i++) {
      const w = 14 + Math.random() * 40;
      const len = rh * (0.6 + Math.random() * 0.8);
      const c = i % 2 ? '#D048B8' : '#7A3CB8';
      const bar = document.createElement('div');
      bar.style.cssText = `position:absolute;top:0;width:${w}px;height:${len}px;pointer-events:none;background:linear-gradient(180deg,${c}00,${c}aa 40%,${c}88 70%,${c}00);filter:blur(3px)`;
      bar.style.left = `${(Math.random() * 2 * rw).toFixed(0)}px`;
      rain.appendChild(bar);
      const dur = 380 + Math.random() * 320;
      bar.animate([{ transform: `translateY(${-len}px)` }, { transform: `translateY(${rh * 2}px)` }], {
        duration: dur, iterations: Infinity, delay: -Math.random() * dur, easing: 'linear'
      });
    }
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Dark purple orbs fall onto the target along the streaks.
    const rad = (tilt * Math.PI) / 180;
    const drop = target.y + 60;
    const orbs: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const size = Math.max(r.width * 0.22, 18);
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#7A3A90,#3A0E4E 60%,#2A0838);box-shadow:0 0 8px #5A1A70`;
      const at = { x: target.x + (i - 1) * r.width * 0.25, y: target.y + (i % 2 ? -0.1 : 0.15) * r.height };
      Fx.place(orb, at);
      fxEl.appendChild(orb);
      orbs.push(
        Fx.anim(orb, [
          { transform: `translate(${Math.tan(rad) * drop}px,${-drop}px)`, opacity: 0 },
          { transform: `translate(${Math.tan(rad) * drop * 0.7}px,${-drop * 0.7}px)`, opacity: 1, offset: 0.3 },
          { transform: 'translate(0,0)', opacity: 1 }
        ], { duration: 380, easing: 'ease-in', delay: i * 140, fill: 'backwards' }).then(() => orb.remove())
      );
    }
    await Promise.all(orbs);

    // Dark purple blasts with yellow cores, one after another round the target.
    const blasts: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const size = Math.max(r.width * 0.7, 56) * (0.75 + Math.random() * 0.4);
      const blast = document.createElement('div');
      blast.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF8C8 0 10%,#F2D84A 20%,#6A2A80 34%,#3A0E4A 58%,#2A083800 72%);filter:blur(2px)`;
      Fx.place(blast, {
        x: target.x + (Math.random() * 2 - 1) * r.width * 0.55,
        y: target.y + r.height * (0.05 + Math.random() * 0.35)
      });
      fxEl.appendChild(blast);
      blasts.push(
        Fx.anim(blast, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.3 },
          { transform: 'scale(1.25)', opacity: 0 }
        ], { duration: 560, easing: 'ease-out', delay: i * 110, fill: 'backwards' }).then(() => blast.remove())
      );
      setTimeout(() => {
        Fx.flash(targetEl, '#C060E0', 0.5);
        Fx.shake(targetEl, 6);
      }, i * 110);
    }
    Fx.shakeField(fieldEl, 0.7);
    await Promise.all(blasts);
    await Fx.blink(targetEl, 3);

    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    sky.remove();
  }

  /**
   * Iron Tail: the caster glints with silver sparkles, then a wide silver
   * swipe sweeps across the target in the attack direction (left to right
   * for the player), kicking up glittering iron dust clouds along its path.
   */
  private static async playIronTail(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    await SteelMoveAnimations.silverGlint(refs, launch);
    await SteelMoveAnimations.ironSwipe(refs, target, v.dir);
  }

  /**
   * Steel Wing: three gleaming steel feathers appear around the caster,
   * pointing at the target, then fly at it one after another; each lands
   * with a silver slash streak and sparkles.
   */
  private static async playSteelWing(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const len = Math.max(lr.width * 0.5, 44);
    const count = 3;

    // Phase 1: the feathers fade in around the caster with a silver glint.
    const feathers = Array.from({ length: count }, (_, i) => {
      const at: Point = {
        x: launch.x + v.dir * lr.width * 0.15,
        y: launch.y + (i - (count - 1) / 2) * Math.max(lr.height * 0.3, 20)
      };
      const angle = (Math.atan2(target.y - at.y, target.x - at.x) * 180) / Math.PI;
      const el = SteelMoveAnimations.steelFeather(len);
      Fx.place(el, at);
      fxEl.appendChild(el);
      return { el, at, angle };
    });
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, '#F0F3FA', 0.5), 60 + i * 130);
    await Promise.all(feathers.map(({ el, angle }, i) =>
      Fx.anim(el, [
        { transform: `rotate(${angle}deg) scale(.2)`, opacity: 0 },
        { transform: `rotate(${angle}deg) scale(1.1)`, opacity: 1, offset: 0.6 },
        { transform: `rotate(${angle}deg) scale(1)`, opacity: 1 }
      ], { duration: 300, delay: i * 50, easing: 'ease-out' })
    ));

    // Phase 2: one after another they shoot at the target and strike it.
    const strikes = feathers.map(({ el, at, angle }, i) => {
      const hit: Point = {
        x: target.x + (Math.random() * 2 - 1) * tr.width * 0.15,
        y: target.y + (i - 1) * tr.height * 0.18
      };
      return Fx.anim(el, [
        { transform: `translate(0,0) rotate(${angle}deg)`, opacity: 1 },
        { transform: `translate(${hit.x - at.x}px,${hit.y - at.y}px) rotate(${angle}deg)`, opacity: 1 }
      ], { duration: 240, delay: i * 90, easing: 'ease-in' }).then(() => {
        el.remove();
        return SteelMoveAnimations.silverSlash(fxEl, targetEl, hit, angle + (i % 2 ? 20 : -20), tr.width);
      });
    });
    await Promise.all(strikes);
  }

  /** Counter for unique SVG gradient ids, so feathers on screen at once don't share one. */
  private static featherId = 0;

  /** A long, gleaming steel feather pointing right (rotate it to aim), `len` px long. */
  private static steelFeather(len: number): HTMLElement {
    const id = `steelFeather${SteelMoveAnimations.featherId++}`;
    const el = document.createElement('div');
    const h = len * 0.28;
    el.style.cssText = `width:${len}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 3px #ffffffcc)`;
    el.innerHTML =
      '<svg viewBox="0 0 60 16" width="100%" height="100%" preserveAspectRatio="none" style="display:block;overflow:visible">' +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".5" stop-color="#DDE2EC"/><stop offset="1" stop-color="#8E96A6"/></linearGradient></defs>` +
      `<path d="M2 8 Q14 1 34 2 L38 4.5 L42 2.5 Q54 3 60 8 Q54 13 42 13.5 L38 11.5 L34 14 Q14 15 2 8 Z" fill="url(#${id})" stroke="#6E7686" stroke-width=".8"/>` +
      '<line x1="0" y1="8" x2="58" y2="8" stroke="#F8FAFF" stroke-width="1.2"/></svg>';
    return el;
  }

  /** A feather lands: a thin silver slash streak at `angle` across `at`, with sparkles; the target flashes and shakes. */
  private static silverSlash(fxEl: HTMLElement, targetEl: HTMLElement, at: Point, angle: number, width: number): Promise<void> {
    const w = Math.max(width * 0.9, 60);
    const streak = document.createElement('div');
    streak.style.cssText = `width:${w}px;height:4px;border-radius:4px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff 45%,#DDE2EC 70%,#ffffff00);filter:drop-shadow(0 0 4px #ffffff)`;
    Fx.place(streak, at);
    fxEl.appendChild(streak);
    const effects: Promise<void>[] = [
      Fx.anim(streak, [
        { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
        { transform: `rotate(${angle}deg) scaleX(1.1)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => streak.remove())
    ];
    for (let i = 0; i < 2; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 10, SILVER);
      Fx.place(star, { x: at.x + (Math.random() * 2 - 1) * w * 0.3, y: at.y + (Math.random() * 2 - 1) * 12 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(30deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(50deg)', opacity: 0 }
        ], { duration: 380, easing: 'ease-out', delay: i * 60 }).then(() => star.remove())
      );
    }
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 4);
    return Promise.all(effects).then(() => void 0);
  }

  /** Silver four-point sparkles twinkle around the caster while it flashes silver. */
  private static async silverGlint(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 14, SILVER);
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * r.width * 0.5,
        y: launch.y + (Math.random() * 2 - 1) * r.height * 0.45
      });
      fxEl.appendChild(star);
      sparkles.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(45deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-in-out', delay: i * 70 }).then(() => star.remove())
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, '#F0F3FA', 0.6), 80 + i * 220);
    await Promise.all(sparkles);
  }

  /**
   * A wide, flat silver arc is drawn across the target from the attack side
   * to the far side; dust clouds and sparkles follow the blade's tip.
   */
  private static async ironSwipe(refs: BattleStageRefs, target: Point, dir: 1 | -1) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.9, 120);
    const h = Math.max(r.height * 0.55, 34);
    const sweep = 380;

    const arc = document.createElement('div');
    arc.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;border:6px solid #F2F4F8;border-top-color:#ffffff;border-bottom-color:#B8BFCC;background:radial-gradient(ellipse at 50% 50%,#ffffff00 55%,#DDE2EC55 70%,#ffffff00 74%);filter:drop-shadow(0 0 6px #ffffffcc)`;
    Fx.place(arc, target);
    fxEl.appendChild(arc);
    // Reveal from the attack side (left for the player) to the far side.
    const from = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    const arcDone = Fx.anim(arc, [
      { clipPath: from, opacity: 1 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.6 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0 }
    ], { duration: sweep / 0.6, easing: 'ease-out' }).then(() => arc.remove());

    // Dust clouds and glints trail the blade's tip along the arc.
    const steps = 5;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = target.x + dir * (t - 0.5) * w * 0.85;
      const y = target.y + Math.sin(t * Math.PI) * h * 0.35;
      effects.push(
        Fx.wait(t * sweep).then(async () => {
          const star = FxGlyphs.sparkStar(14 + Math.random() * 10, SILVER);
          Fx.place(star, { x, y: y - h * 0.3 });
          fxEl.appendChild(star);
          Fx.anim(star, [
            { transform: 'scale(.2)', opacity: 1 },
            { transform: 'scale(1) rotate(30deg)', opacity: 0 }
          ], { duration: 420, easing: 'ease-out' }).then(() => star.remove());
          await FxEffects.smokePuff(fxEl, { x, y }, Math.max(r.width * 0.45, 36), DUST);
        })
      );
    }
    await Fx.wait(sweep * 0.45);
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    await Promise.all([arcDone, ...effects]);
  }
}
