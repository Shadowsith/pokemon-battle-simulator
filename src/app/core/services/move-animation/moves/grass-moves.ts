import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP, FLECK_COLOR } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Grass-type moves. */
export class GrassMoveAnimations {
  /** Hand-made Grass move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    absorb: (refs, launch, target) => GrassMoveAnimations.playAbsorb(refs, launch, target),
    leechseed: (refs, launch, target) => GrassMoveAnimations.playLeechSeed(refs, launch, target),
    petaldance: (refs, launch, target) => GrassMoveAnimations.playPetalDance(refs, launch, target),
    sleeppowder: (refs, _launch, target, v) => GrassMoveAnimations.playSleepPowder(refs, target, v),
    solarbeam: (refs, _launch, target) => GrassMoveAnimations.playSolarBeam(refs, target),
    spore: (refs, _launch, target, v) => GrassMoveAnimations.playSpore(refs, target, v)
  };

  /** Turn-1 animations of two-turn Grass moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    solarbeam: (refs, launch) => GrassMoveAnimations.playSolarBeamCharge(refs, launch)
  };

  /** A soft, glowing yellow ball of sunlight. */
  private static sunMote(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFDE0,#F4F07A 40%,#E8E04A00 72%);box-shadow:0 0 ${s}px #F4F07A88`;
    return el;
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

    const r = launchEl.getBoundingClientRect();
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
    const r = targetEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
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
    const r = targetEl.getBoundingClientRect();
    const top = r.top - fieldEl.getBoundingClientRect().top;
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
    const r = refs.targetEl.getBoundingClientRect();
    const top = r.top - refs.fieldEl.getBoundingClientRect().top;
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
    const { fxEl, targetEl } = refs;
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;

    Fx.flash(targetEl, main, 0.4);
    Fx.shake(targetEl, 3);

    // Stream: stars leave the target in a steady trickle and float to the caster.
    const count = 22;
    const travel = 900;
    const spread = 1100;
    for (let i = 0; i < count; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 7, i % 3 ? main : light);
      Fx.place(star, { x: target.x + (Math.random() * 40 - 20), y: target.y + (Math.random() * 40 - 20) });
      fxEl.appendChild(star);
      const bend = (Math.random() * 2 - 1) * 45;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = t * t * (3 - 2 * t);
        frames.push({
          transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px) rotate(${t * 240}deg) scale(${0.4 + Math.sin(t * Math.PI) * 0.8})`,
          opacity: Math.min(1, t * 5, (1 - t) * 4 + 0.2)
        });
      }
      Fx.anim(star, frames, { duration: travel, easing: 'linear', delay: (i / count) * spread }).then(() => star.remove());
    }
    await Fx.wait(travel + spread * 0.8);
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Leech Seed: three seeds are tossed in a high arc onto the target, then
   * little green sprouts grow where they landed and sway on the Pokémon.
   */
  private static async playLeechSeed(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
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
    const lr = launchEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();
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
      const petal = GrassMoveAnimations.petalGlyph(9 + Math.random() * 7, pink);
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

  /** A pink flower petal: a soft oval with pointed ends and a lighter centre line. */
  private static petalGlyph(s: number, color: string): HTMLElement {
    const petal = document.createElement('div');
    petal.style.cssText = `position:absolute;width:${s}px;height:${s * 0.7}px;pointer-events:none;border-radius:80% 10% 80% 10%;background:linear-gradient(135deg,#FFD0DE,${color} 55%,#D84A72);box-shadow:0 0 2px #00000033`;
    return petal;
  }
}

/** Powder grain colours: [bright core, body, glow]. */
type GrainColors = readonly [string, string, string];
