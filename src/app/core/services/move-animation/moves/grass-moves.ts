import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP, FLECK_COLOR } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';
import { EnergyBall } from './grass/energy-ball';
import { GrassKnot } from './grass/grass-knot';
import { LeafStorm } from './grass/leaf-storm';
import { PetalBlizzard } from './grass/petal-blizzard';
import { PowerWhip } from './grass/power-whip';
import { SeedBomb } from './grass/seed-bomb';
import { SeedFlare } from './grass/seed-flare';
import { SpikyShield } from './grass/spiky-shield';

/** Hand-made animations for Grass-type moves (Energy Ball, Grass Knot, Leaf Storm, Petal Blizzard, Power Whip, Seed Bomb, Seed Flare and Spiky Shield live in `grass/`). */
export class GrassMoveAnimations {
  /** Hand-made Grass move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    absorb: (refs, launch, target) => GrassMoveAnimations.playAbsorb(refs, launch, target),
    aromatherapy: (refs, launch) => GrassMoveAnimations.playAromatherapy(refs, launch),
    energyball: (refs, launch, target) => EnergyBall.play(refs, launch, target),
    frenzyplant: (refs, launch, target) => GrassMoveAnimations.playFrenzyPlant(refs, launch, target),
    gigadrain: (refs, launch, target) => GrassMoveAnimations.playGigaDrain(refs, launch, target),
    grassknot: (refs, _launch, target) => GrassKnot.play(refs, target),
    leafblade: (refs, _launch, target) => GrassMoveAnimations.playLeafBlade(refs, target),
    leafstorm: (refs, launch, target) => LeafStorm.play(refs, launch, target),
    leechseed: (refs, launch, target) => GrassMoveAnimations.playLeechSeed(refs, launch, target),
    petalblizzard: (refs, _launch, target, v) => PetalBlizzard.play(refs, target, v),
    petaldance: (refs, launch, target) => GrassMoveAnimations.playPetalDance(refs, launch, target),
    powerwhip: (refs, _launch, target) => PowerWhip.play(refs, target),
    seedbomb: (refs, launch, target) => SeedBomb.play(refs, launch, target),
    seedflare: (refs, launch, target, v) => SeedFlare.play(refs, launch, target, v),
    sleeppowder: (refs, _launch, target, v) => GrassMoveAnimations.playSleepPowder(refs, target, v),
    solarbeam: (refs, _launch, target) => GrassMoveAnimations.playSolarBeam(refs, target),
    spikyshield: (refs, launch, _target, v) => SpikyShield.play(refs, launch, v),
    spore: (refs, _launch, target, v) => GrassMoveAnimations.playSpore(refs, target, v),
    synthesis: (refs, launch) => GrassMoveAnimations.playSynthesis(refs, launch)
  };

  /** Turn-1 animations of two-turn Grass moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    solarbeam: (refs, launch) => GrassMoveAnimations.playSolarBeamCharge(refs, launch)
  };

  /**
   * Frenzy Plant: the scene goes dark (0-0.28 s) and turns into a bright
   * green glade with light rays, where leaves and white motes drift upward
   * (from 0.28 s); three twisted roots grow from the user to the target
   * (0.9-1.45 s) and strike it with a green burst (1.45 s); then all clears (~2.0-2.35 s).
   */
  private static async playFrenzyPlant(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. Dark, then the green glade fades in over it.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out', fill: 'forwards' });
    const glade = document.createElement('div');
    glade.style.cssText =
      'position:absolute;inset:0;background:' +
      'repeating-linear-gradient(100deg,#ffffff00 0 34px,#ffffff2a 34px 52px,#ffffff00 52px 90px),' +
      'linear-gradient(170deg,#EFFFD8,#A8E486 40%,#52B84C)';
    dim.appendChild(glade);
    Fx.anim(glade, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    GrassMoveAnimations.risingLeaves(glade, W, H, 2000);

    // 2. Roots grow from the user's lower body to the target.
    await Fx.wait(620);
    const from = { x: launch.x, y: launch.y + lr.height * 0.25 };
    const roots = GrassMoveAnimations.rootStrands(W, H, from, target);
    fxEl.appendChild(roots.svg);
    await roots.grow(550);

    // 3. Green hit on the target.
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.9, 60), '#3FCB4A', '#B8F08A', '#F4FFE0');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const burstDone = Fx.anim(burst, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(12deg)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.25) rotate(20deg)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out' }).then(() => burst.remove());
    Fx.flash(targetEl, '#6AE05A', 0.8);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    await Promise.all([burstDone, Fx.blink(targetEl, 3)]);

    // 4. Roots and glade fade together.
    await Promise.all([
      Fx.anim(roots.svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' }),
      Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' })
    ]);
    roots.svg.remove();
    dim.remove();
  }

  /**
   * Leaf Blade: four glowing green blade cuts slash across the target from
   * different angles in quick succession (0-0.55 s), then a flurry of green
   * leaves flies in from all round and lands on it (0.7-1.15 s).
   */
  private static async playLeafBlade(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const len = Math.max(r.width * 1.1, 80);

    // 1. Four cuts, each a green blade drawn out round its left end.
    const cuts: Promise<void>[] = [];
    [35, 145, 80, 10].forEach((angle, i) => {
      const blade = document.createElement('div');
      blade.style.cssText = `position:absolute;width:${len}px;height:9px;pointer-events:none;clip-path:polygon(0 50%,50% 0,100% 50%,50% 100%);background:linear-gradient(90deg,#7AE05A00,#C8FFB0 30%,#F4FFE8 50%,#C8FFB0 70%,#7AE05A00);filter:drop-shadow(0 0 5px #3FCB4A)`;
      const rad = (angle * Math.PI) / 180;
      Fx.place(blade, { x: target.x - (Math.cos(rad) * len) / 2 + len / 2, y: target.y - (Math.sin(rad) * len) / 2 });
      fxEl.appendChild(blade);
      const delay = i * 140;
      cuts.push(
        Fx.anim(blade, [
          { transform: `rotate(${angle}deg) scale(0,1)`, transformOrigin: '0 50%', opacity: 1 },
          { transform: `rotate(${angle}deg) scale(1,1.3)`, transformOrigin: '0 50%', opacity: 1, offset: 0.4 },
          { transform: `rotate(${angle}deg) scale(1,.3)`, transformOrigin: '0 50%', opacity: 0 }
        ], { duration: 280, easing: 'ease-out', delay, fill: 'backwards' }).then(() => blade.remove())
      );
      setTimeout(() => {
        Fx.flash(targetEl, '#7AE05A', 0.5);
        Fx.shake(targetEl, 4);
      }, delay + 100);
    });
    await Promise.all(cuts);
    await Fx.wait(150);

    // 2. Leaves fly in from all round onto the target.
    const leaves: Promise<void>[] = [];
    const reach = Math.max(r.width * 1.1, 80);
    for (let i = 0; i < 12; i++) {
      const leaf = FxGlyphs.leafGlyph(12 + Math.random() * 8);
      Fx.place(leaf, target);
      fxEl.appendChild(leaf);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
      const x = Math.cos(ang) * reach;
      const y = Math.sin(ang) * reach * 0.8;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 180);
      leaves.push(
        Fx.anim(leaf, [
          { transform: `translate(${x}px,${y}px) rotate(0deg) scale(1)`, opacity: 0 },
          { transform: `translate(${x * 0.7}px,${y * 0.7}px) rotate(${spin * 0.3}deg) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${(Math.random() * 2 - 1) * r.width * 0.2}px,${(Math.random() * 2 - 1) * r.height * 0.2}px) rotate(${spin}deg) scale(.6)`, opacity: 0 }
        ], { duration: 360, easing: 'ease-in', delay: Math.random() * 120, fill: 'backwards' }).then(() => leaf.remove())
      );
    }
    setTimeout(() => {
      Fx.flash(targetEl, '#7AE05A', 0.6);
      Fx.shake(targetEl, 5);
    }, 380);
    await Promise.all(leaves);
    await Fx.wait(150);
  }

  /** Green leaves and white motes drifting up across `layer` (`W` x `H` px) for about `total` ms. */
  private static risingLeaves(layer: HTMLElement, W: number, H: number, total: number) {
    for (let i = 0; i < 26; i++) {
      const isLeaf = i % 3 !== 2;
      const s = isLeaf ? 12 + Math.random() * 12 : 3 + Math.random() * 4;
      const el = isLeaf ? FxGlyphs.leafGlyph(s) : document.createElement('div');
      if (!isLeaf) el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:#fff;box-shadow:0 0 6px #fff`;
      el.style.left = `${Math.random() * W}px`;
      el.style.top = `${H}px`;
      layer.appendChild(el);
      const sway = (Math.random() * 2 - 1) * 40;
      const spin = (Math.random() * 2 - 1) * 360;
      const dur = isLeaf ? 1100 + Math.random() * 600 : 800 + Math.random() * 400;
      Fx.anim(el, [
        { transform: 'translate(0,0) rotate(0deg)' },
        { transform: `translate(${sway}px,${-(H + 30) * 0.5}px) rotate(${spin * 0.5}deg)`, offset: 0.5 },
        { transform: `translate(${-sway * 0.5}px,${-(H + 30)}px) rotate(${spin}deg)` }
      ], { duration: dur, easing: 'linear', delay: Math.random() * (total - dur), fill: 'backwards' }).then(() => el.remove());
    }
  }

  /**
   * Three twisted brown roots from `from` to `to` on a full-field SVG, arched
   * up a little; `grow` draws them out along their length.
   */
  private static rootStrands(W: number, H: number, from: Point, to: Point) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${W}`);
    svg.setAttribute('height', `${H}`);
    svg.setAttribute('style', 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;filter:drop-shadow(0 2px 2px #00000066)');
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const ctrl = { x: from.x + dx / 2, y: from.y + dy / 2 - len * 0.18 };
    const paths: SVGPathElement[] = [];
    for (let k = 0; k < 3; k++) {
      const phase = (k * Math.PI * 2) / 3;
      const pts: string[] = [];
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const bx = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * ctrl.x + t * t * to.x;
        const by = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * ctrl.y + t * t * to.y;
        const amp = 7 * Math.sin(Math.PI * Math.min(1, t * 1.15));
        const off = amp * Math.sin(t * Math.PI * 5 + phase);
        pts.push(`${(bx + nx * off).toFixed(1)},${(by + ny * off).toFixed(1)}`);
      }
      const d = `M${pts.join(' L')}`;
      for (const [color, width] of [['#3A2410', 9], ['#8A5A2A', 6], ['#C89A5A', 2]] as const) {
        const path = document.createElementNS(ns, 'path');
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', color);
        path.setAttribute('stroke-width', `${width}`);
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('pathLength', '1');
        path.setAttribute('stroke-dasharray', '1 1');
        path.setAttribute('stroke-dashoffset', '1');
        svg.appendChild(path);
        paths.push(path);
      }
    }
    const grow = (ms: number) =>
      Promise.all(
        paths.map((p) => Fx.anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' }))
      ).then(() => void 0);
    return { svg, grow };
  }

  /** A soft, glowing yellow ball of sunlight. */
  private static sunMote(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFDE0,#F4F07A 40%,#E8E04A00 72%);box-shadow:0 0 ${s}px #F4F07A88`;
    return el;
  }

  /**
   * Aromatherapy: the backdrop turns a soft green while pink petals and
   * glowing green motes drift and tumble across the field; then glowing green
   * rings pulse out round the caster amid twinkling sparkles.
   */
  private static async playAromatherapy(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1600;

    const bg = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 55%,#5AA048,#2E6A2A 55%,#163E18)');
    const effects: Promise<void>[] = [
      Fx.anim(bg, [
        { opacity: 0 },
        { opacity: 1, offset: 0.18 },
        { opacity: 1, offset: 0.8 },
        { opacity: 0 }
      ], { duration: total, easing: 'ease-in-out' }).then(() => bg.remove())
    ];

    // Pink petals and green motes drift across the field on a gentle breeze.
    for (let i = 0; i < 34; i++) {
      const petal = i % 2 === 0;
      const el = petal ? FxGlyphs.petalGlyph(8 + Math.random() * 6, '#F27A9C') : document.createElement('div');
      if (!petal) {
        const sz = 4 + Math.random() * 4;
        el.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#F0FFE8,#8CE85A 50%,#5ACB3A00 75%);box-shadow:0 0 6px #8CE85A`;
      }
      const from: Point = { x: Math.random() * W, y: Math.random() * H };
      Fx.place(el, from);
      fxEl.appendChild(el);
      const dx = 40 + Math.random() * 60;
      const dy = (Math.random() * 2 - 1) * 30 + (petal ? 20 : -15);
      const spin = petal ? (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 200) : 0;
      effects.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) rotate(0deg) scaleX(1)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${dy * 0.3 - 8}px) rotate(${spin * 0.3}deg) scaleX(.4)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${dx * 0.65}px,${dy * 0.65 + 6}px) rotate(${spin * 0.65}deg) scaleX(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg) scaleX(.5)`, opacity: 0 }
        ], { duration: 900 + Math.random() * 400, delay: 100 + Math.random() * 300, easing: 'ease-in-out' }).then(() => el.remove())
      );
    }

    // Glowing green rings pulse out round the caster (from ~0.55 s), with sparkles.
    await Fx.wait(550);
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height) * 1.1;
    const rings = document.createElement('div');
    rings.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#E8FFD8cc 0 8%,#E8FFD800 30%),repeating-radial-gradient(circle,#7CF05A00 0 6%,#7CF05Acc 9%,#7CF05A00 13%),radial-gradient(circle,#5ADC3A88,#5ADC3A00 70%);' +
      'box-shadow:0 0 20px #7CF05A;filter:blur(.5px)';
    Fx.place(rings, launch);
    fxEl.appendChild(rings);
    effects.push(
      Fx.anim(rings, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1)', opacity: 0.85, offset: 0.55 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1.25)', opacity: 0 }
      ], { duration: 850, easing: 'ease-out' }).then(() => rings.remove())
    );
    for (let i = 0; i < 12; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 9, i % 2 ? '#B8FF9A' : '#ffffff');
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * size * 0.65,
        y: launch.y + (Math.random() * 2 - 1) * size * 0.55
      });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 450, easing: 'ease-in-out', delay: Math.random() * 500 }).then(() => star.remove())
      );
    }
    Fx.flash(launchEl, '#8CE85A', 0.5);
    setTimeout(() => Fx.flash(launchEl, '#8CE85A', 0.35), 350);
    await Promise.all(effects);
  }

  /**
   * Synthesis: a blazing sun-like orb lights up on the caster, white rays of
   * light fanning out from it, then the caster regains HP in green sparkles.
   */
  private static async playSynthesis(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(Math.max(r.width, r.height) * 0.8, 60);

    // Rays: a slowly turning fan of white light streaks, fading out with distance.
    const rays = document.createElement('div');
    const rs = size * 4;
    rays.style.cssText =
      `position:absolute;width:${rs}px;height:${rs}px;pointer-events:none;` +
      'background:repeating-conic-gradient(from 0deg,#FFFFF000 0 9deg,#FFFFF0cc 11deg 14deg,#FFFFF000 16deg 30deg);' +
      '-webkit-mask-image:radial-gradient(circle,#000 12%,transparent 62%);mask-image:radial-gradient(circle,#000 12%,transparent 62%)';
    Fx.place(rays, launch);
    fxEl.appendChild(rays);
    const raysDone = Fx.anim(rays, [
      { transform: 'scale(.4) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(8deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.05) rotate(20deg)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.1) rotate(26deg)', opacity: 0 }
    ], { duration: 700, easing: 'ease-out' }).then(() => rays.remove());

    // The sun orb: white-hot core with a yellow-green glow, pulsing once.
    const orb = document.createElement('div');
    orb.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#fff 0 28%,#FFFDE0 40%,#E8F47A 58%,#C8E84A00 72%);box-shadow:0 0 30px #F4F8A0';
    Fx.place(orb, launch);
    fxEl.appendChild(orb);
    const orbDone = Fx.anim(orb, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(.9)', opacity: 0.9, offset: 0.55 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in-out' }).then(() => orb.remove());
    setTimeout(() => Fx.flash(launchEl, '#F4F8A0', 0.7), 200);

    // HP gain starts with the sound's chime (~0.6 s), while the orb fades.
    await Fx.wait(600);
    await Promise.all([raysDone, orbDone, FxEffects.healSparkles(refs, launch)]);
  }

  /**
   * Solar Beam, turn 1 (absorbs sunlight): the scene goes dark, soft yellow
   * lights of sunshine float in toward the caster, which blinks light yellow
   * as it soaks them up.
   */
  private static async playSolarBeamCharge(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const r = Fx.rect(launchEl);
    const reach = Math.max(r.width, r.height) * 1.1;
    const motes: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      const mote = GrassMoveAnimations.sunMote(10 + Math.random() * 10);
      const ang = Math.random() * Math.PI * 2;
      const d = reach * (0.5 + Math.random() * 0.6);
      const off = { x: Math.cos(ang) * d, y: Math.sin(ang) * d * 0.7 };
      Fx.place(mote, { x: launch.x + off.x, y: launch.y + off.y });
      fxEl.appendChild(mote);
      motes.push(
        Fx.anim(mote, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${-off.x * 0.85}px,${-off.y * 0.85}px) scale(.5)`, opacity: 0 }
        ], { duration: 1000, easing: 'ease-in', delay: Math.random() * 700 }).then(() => mote.remove())
      );
    }
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.flash(launchEl, '#FFF59A', 0.6), 450 + i * 300);
    await Promise.all(motes);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Solar Beam, turn 2: a blazing column of sunlight strikes the target from
   * the sky, flaring a bright glow on the ground around it.
   */
  private static async playSolarBeam(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const f = Fx.rect(fieldEl);
    const foot = r.bottom - f.top - r.height * 0.08;
    const w = Math.max(r.width * 0.16, 16);

    // The beam runs from the top of the field down to the target's feet.
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${target.x - w / 2}px;top:0;width:${w}px;height:${foot}px;pointer-events:none;transform-origin:50% 0;border-radius:0 0 ${w}px ${w}px;background:linear-gradient(90deg,#F4E83A00,#F4E83A 20%,#FFFBD0 40%,#fff 50%,#FFFBD0 60%,#F4E83A 80%,#F4E83A00);box-shadow:0 0 18px #F4E83A,0 0 36px #F4E83Aaa`;
    fxEl.appendChild(beam);

    const glowW = Math.max(r.width * 1.2, 90);
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;width:${glowW}px;height:${glowW * 0.35}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFFBD0,#F4E83Acc 40%,#F4E83A00 72%)`;
    Fx.place(glow, { x: target.x, y: foot });
    fxEl.appendChild(glow);

    await Fx.anim(beam, [
      { transform: 'scale(.4,0)', opacity: 0.6 },
      { transform: 'scale(1,1)', opacity: 1 }
    ], { duration: 180, easing: 'ease-in' });

    const glowDone = Fx.anim(glow, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.1)', opacity: 0.8, offset: 0.7 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 900, easing: 'ease-out' }).then(() => glow.remove());
    Fx.shakeField(fieldEl, 0.5);
    Fx.flash(targetEl, '#FFF59A', 0.8);
    const hit = Fx.blink(targetEl);

    // The beam pulses a little wider, then thins out and fades.
    await Fx.anim(beam, [
      { transform: 'scale(1,1)', opacity: 1 },
      { transform: 'scale(1.35,1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1,1)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.1,1)', opacity: 0 }
    ], { duration: 750, easing: 'ease-in-out' });
    beam.remove();
    await Promise.all([glowDone, hit]);
  }

  /**
   * Sleep Powder: glowing dark green powder drifts down from above onto the
   * target, then purple "Z"s float up from it as it falls asleep.
   */
  private static async playSleepPowder(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    await GrassMoveAnimations.powderFall(refs, target, [GrassMoveAnimations.GREEN_GRAIN]);
    await GrassMoveAnimations.sleepOnTarget(refs, target, v);
  }

  /** Spore: like Sleep Powder, but the spores are a mix of orange and green. */
  private static async playSpore(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    await GrassMoveAnimations.powderFall(refs, target, [GrassMoveAnimations.GREEN_GRAIN, GrassMoveAnimations.ORANGE_GRAIN]);
    await GrassMoveAnimations.sleepOnTarget(refs, target, v);
  }

  /** Powder grain colours: bright core, body, glow. */
  private static readonly GREEN_GRAIN: GrainColors = ['#C8FFD8', '#3FCB78', '#2FB868'];
  private static readonly ORANGE_GRAIN: GrainColors = ['#FFE6C0', '#FF8A2A', '#F07020'];

  /** Glowing powder drifts down from above onto the target, swaying; grains cycle through `colors`. */
  private static async powderFall(refs: BattleStageRefs, target: Point, colors: GrainColors[]) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const top = r.top - Fx.rect(fieldEl).top;
    const spread = Math.max(r.width * 0.6, 40);

    const grains: Promise<void>[] = [];
    for (let i = 0; i < 28; i++) {
      const s = 6 + Math.random() * 7;
      const [core, body, glow] = colors[i % colors.length];
      const grain = document.createElement('div');
      grain.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,${core},${body} 45%,${body}00 75%);box-shadow:0 0 ${s}px ${glow}`;
      Fx.place(grain, { x: target.x + (Math.random() * 2 - 1) * spread, y: top - 20 - Math.random() * 30 });
      fxEl.appendChild(grain);
      const fall = r.height * (0.6 + Math.random() * 0.4) + 20;
      const sway = (Math.random() * 2 - 1) * 14;
      grains.push(
        Fx.anim(grain, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${sway}px,${fall * 0.3}px) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${-sway}px,${fall * 0.7}px) scale(1)`, opacity: 0.9, offset: 0.65 },
          { transform: `translate(${sway * 0.5}px,${fall}px) scale(.6)`, opacity: 0 }
        ], { duration: 900 + Math.random() * 300, easing: 'ease-in-out', delay: Math.random() * 700 }).then(() => grain.remove())
      );
    }
    setTimeout(() => Fx.flash(targetEl, colors[0][1], 0.3), 700);
    await Promise.all(grains);
  }

  /** Purple "Z"s float up from the target's head as it falls asleep. */
  private static sleepOnTarget(refs: BattleStageRefs, target: Point, v: MoveVisual): Promise<void> {
    const r = Fx.rect(refs.targetEl);
    const top = r.top - Fx.rect(refs.fieldEl).top;
    return FxEffects.sleepZs(refs.fxEl, { x: target.x, y: top + r.height * 0.15 }, -v.dir, ['#9C7CE8', '#B59CF2']);
  }

  /**
   * Absorb: no projectile. Green energy stars are pulled out of the target and
   * drift back to the caster along wavy arcs, then sparkle around the caster
   * to show the HP it gained. The drained stars' colours can be changed
   * (Leech Life drains blood-red ones).
   */
  static async playAbsorb(
    refs: BattleStageRefs,
    launch: Point,
    target: Point,
    [main, light]: [string, string] = [FLECK_COLOR.statUp, '#E6FFB0']
  ) {
    Fx.flash(refs.targetEl, main, 0.4);
    Fx.shake(refs.targetEl, 3);
    await GrassMoveAnimations.drainStream(refs, launch, target, {
      count: 22,
      travel: 900,
      spread: 1100,
      bend: 45,
      scatter: 20,
      spin: 240,
      make: (i) => FxGlyphs.sparkStar(8 + Math.random() * 7, i % 3 ? main : light)
    });
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Giga Drain: a mightier Absorb. The target flares green and trembles while
   * big glowing green energy orbs swarm out of it on wide arcs to the caster,
   * which then sparkles with the HP it gained.
   */
  private static async playGigaDrain(refs: BattleStageRefs, launch: Point, target: Point) {
    const { targetEl } = refs;
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.flash(targetEl, FLECK_COLOR.statUp, 0.7), i * 260);
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.shake(targetEl, 4), i * 320);
    await GrassMoveAnimations.drainStream(refs, launch, target, {
      count: 26,
      travel: 1050,
      spread: 1200,
      bend: 85,
      scatter: 34,
      spin: 0,
      make: () => GrassMoveAnimations.energyOrb(14 + Math.random() * 14)
    });
    await FxEffects.healSparkles(refs, launch);
  }

  /** A big, soft, glowing green ball of drained energy with a bright core. */
  private static energyOrb(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#F4FFE8,#B8F58A 30%,#5FD84A 58%,#3FC03A00 74%);box-shadow:0 0 ${s * 0.8}px #7CF0607A`;
    return el;
  }

  /**
   * The drain stream shared by Absorb and Giga Drain: `count` particles leave
   * the target in a steady trickle over `spread` ms and float to the caster
   * on wavy arcs (up to `bend` px off the straight line), each in `travel` ms.
   * Resolves once nearly all of them have arrived.
   */
  private static async drainStream(
    refs: BattleStageRefs,
    launch: Point,
    target: Point,
    o: { count: number; travel: number; spread: number; bend: number; scatter: number; spin: number; make: (i: number) => HTMLElement }
  ) {
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    for (let i = 0; i < o.count; i++) {
      const p = o.make(i);
      Fx.place(p, { x: target.x + (Math.random() * 2 - 1) * o.scatter, y: target.y + (Math.random() * 2 - 1) * o.scatter });
      refs.fxEl.appendChild(p);
      const bend = (Math.random() * 2 - 1) * o.bend;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = t * t * (3 - 2 * t);
        frames.push({
          transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px) rotate(${t * o.spin}deg) scale(${0.4 + Math.sin(t * Math.PI) * 0.8})`,
          opacity: Math.min(1, t * 5, (1 - t) * 4 + 0.2)
        });
      }
      Fx.anim(p, frames, { duration: o.travel, easing: 'linear', delay: (i / o.count) * o.spread }).then(() => p.remove());
    }
    await Fx.wait(o.travel + o.spread * 0.8);
  }

  /**
   * Leech Seed: three seeds are tossed in a high arc onto the target, then
   * little green sprouts grow where they landed and sway on the Pokémon.
   */
  private static async playLeechSeed(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const spreadX = Math.max(r.width * 0.3, 18);
    const lowY = target.y + Math.max(r.height * 0.2, 10);
    const seeds = 3;
    const gap = 130;
    const travel = 700;
    const steps = 12;

    const grown: Promise<void>[] = [];
    for (let i = 0; i < seeds; i++) {
      // Land spread across the lower half of the target.
      const land = { x: target.x + ((i - 1) + (Math.random() * 0.4 - 0.2)) * spreadX, y: lowY + Math.random() * 8 };
      const seed = GrassMoveAnimations.seedGlyph(9);
      Fx.place(seed, launch);
      fxEl.appendChild(seed);
      const dx = land.x - launch.x;
      const dy = land.y - launch.y;
      const lift = 90 + Math.abs(dx) * 0.25;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        frames.push({
          transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * lift}px) rotate(${t * 540}deg)`,
          opacity: t === 0 ? 0 : 1
        });
      }
      grown.push(
        Fx.anim(seed, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(async () => {
          seed.remove();
          if (i === 0) Fx.shake(targetEl, 2);
          await GrassMoveAnimations.sprout(fxEl, land, Math.max(r.width * 0.2, 16));
        })
      );
    }
    await Promise.all(grown);
  }

  /** A small beige-grey seed with a highlight, `s` px wide. */
  private static seedGlyph(s: number): HTMLElement {
    const seed = document.createElement('div');
    seed.style.cssText = `position:absolute;width:${s * 1.3}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#FFFFF0,#CFCBB8 45%,#8E8A78);box-shadow:0 0 2px #00000066`;
    return seed;
  }

  /** A little green sprout (stem + two leaves) grows at `at`, sways, then fades. */
  private static async sprout(fxEl: HTMLElement, at: Point, w: number): Promise<void> {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w}px;transform-origin:50% 100%;filter:drop-shadow(0 0 2px #6CE04A)`);
    svg.innerHTML =
      '<path d="M10,20 C10,15 10,12 10,9" stroke="#2E8B1E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M10,10 C6,4 1,5 1,8 C3,12 8,12 10,10 Z" fill="#5CD43A" stroke="#2E8B1E" stroke-width=".8"/>' +
      '<path d="M10,9 C14,3 19,4 19,7 C17,11 12,11 10,9 Z" fill="#7CE85A" stroke="#2E8B1E" stroke-width=".8"/>';
    // Anchor the stem's base on the landing spot.
    Fx.place(svg, { x: at.x, y: at.y - w / 2 });
    fxEl.appendChild(svg);
    await Fx.anim(svg, [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(1.15,1.2)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: 0.45 },
      { transform: 'scale(1) rotate(7deg)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1) rotate(-4deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1) rotate(0)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-out' });
    svg.remove();
  }

  /**
   * Petal Dance: the caster dances round in circles and whirls up pink petals in a
   * rising spiral around itself; the petals then sweep over to the target and
   * swirl around it while it is buffeted, before scattering.
   */
  private static async playPetalDance(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const pink = '#F27A9A';
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const casterRx = Math.max(lr.width * 0.6, 36);
    const casterH = Math.max(lr.height, 50);
    const targetRx = Math.max(tr.width * 0.65, 38);
    const targetH = Math.max(tr.height, 50);
    const count = 22;
    const total = 2600;
    const steps = 52;
    // Share of the timeline: whirl around the caster, fly over, swirl around the target.
    const whirlEnd = 0.38;
    const flyEnd = 0.52;

    // The caster dances round in small circles on the spot, still facing the target.
    const loopR = Math.max(lr.width * 0.15, 12);
    const loops = 2;
    const circle: Keyframe[] = [];
    for (let k = 0; k <= 24; k++) {
      const a = (k / 24) * loops * Math.PI * 2;
      circle.push({ transform: `translate(${(Math.sin(a) * loopR).toFixed(1)}px,${((1 - Math.cos(a)) * -loopR * 0.6).toFixed(1)}px)` });
    }
    Fx.anim(launchEl, circle, { duration: total * whirlEnd, easing: 'ease-in-out', fill: 'none' });

    const done: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const petal = FxGlyphs.petalGlyph(9 + Math.random() * 7, pink);
      Fx.place(petal, launch);
      fxEl.appendChild(petal);
      const a0 = Math.random() * Math.PI * 2;
      const b0 = Math.random() * Math.PI * 2;
      const lift = Math.random();
      const height = Math.random() * 2 - 1;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360);
      // Rising spiral around the caster.
      const whirl = (u: number): Point => {
        const ang = a0 + u * Math.PI * 3;
        const rx = casterRx * (0.5 + u * 0.7);
        return {
          x: launch.x + Math.cos(ang) * rx,
          y: launch.y + casterH * 0.4 - u * casterH * (0.6 + lift * 0.5) + Math.sin(ang) * rx * 0.3
        };
      };
      // Swirl around the target at the petal's own height.
      const swirl = (u: number): Point => {
        const ang = b0 + u * Math.PI * 4;
        return {
          x: target.x + Math.cos(ang) * targetRx * (0.8 + lift * 0.4),
          y: target.y + height * targetH * 0.45 + Math.sin(ang) * targetRx * 0.3
        };
      };
      const from = whirl(1);
      const to = swirl(0);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        let p: Point;
        if (t <= whirlEnd) p = whirl(t / whirlEnd);
        else if (t <= flyEnd) {
          const u = (t - whirlEnd) / (flyEnd - whirlEnd);
          p = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * 30 };
        } else p = swirl((t - flyEnd) / (1 - flyEnd));
        // Flutter: the petal tumbles, its width flickering as it turns.
        const flutter = 0.35 + Math.abs(Math.cos(t * Math.PI * 6 + i)) * 0.65;
        frames.push({
          transform: `translate(${p.x - launch.x}px,${p.y - launch.y}px) rotate(${t * spin}deg) scale(${flutter.toFixed(2)},1)`,
          opacity: t < 0.04 ? t / 0.04 : t > 0.92 ? (1 - t) / 0.08 : 1
        });
      }
      done.push(Fx.anim(petal, frames, { duration: total, easing: 'linear', delay: i * 18 }).then(() => petal.remove()));
    }

    // The target is buffeted while the petals swirl around it.
    for (let k = 0; k < 5; k++) {
      setTimeout(() => {
        Fx.shake(targetEl, 4);
        if (k % 2 === 0) Fx.flash(targetEl, pink, 0.4);
      }, total * flyEnd + k * 260);
    }
    await Promise.all(done);
  }
}

/** Powder grain colours: [bright core, body, glow]. */
type GrainColors = readonly [string, string, string];
