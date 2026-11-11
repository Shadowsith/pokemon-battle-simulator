import { Point, BattleStageRefs, BubbleStyle, MoveAnimRegistry } from '../animation.types';
import { BUBBLE_DRIFT, BUBBLE_BEAM, DIM_BACKDROP, WATERFALL_WAVES } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { AquaTail } from './water/aqua-tail';
import { OriginPulse } from './water/origin-pulse';
import { SteamEruption } from './water/steam-eruption';
import { SurfWave } from './water/surf-wave';
import { WaterCrash } from './water/water-crash';

/** Hand-made animations for Water-type moves (the Surf wave, Steam Eruption, Origin Pulse, Aqua Tail and the shared water crash live in `water/`). */
export class WaterMoveAnimations {
  /** Hand-made Water move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    aquatail: (refs, launch, target) => AquaTail.play(refs, launch, target),
    bubble: (refs, launch, target) => WaterMoveAnimations.playBubbles(refs, launch, target, BUBBLE_DRIFT),
    bubblebeam: (refs, launch, target) => WaterMoveAnimations.playBubbles(refs, launch, target, BUBBLE_BEAM),
    crabhammer: (refs, _launch, target) => WaterMoveAnimations.playCrabhammer(refs, target),
    dive: (refs, _launch, target) => WaterMoveAnimations.playDiveHit(refs, target),
    hydrocannon: (refs, launch, target) => WaterMoveAnimations.playHydroCannon(refs, launch, target),
    hydropump: (refs, launch, target) => WaterMoveAnimations.playHydroPump(refs, launch, target),
    originpulse: (refs, launch, target) => OriginPulse.play(refs, launch, target),
    raindance: (refs) => WaterMoveAnimations.playRainDance(refs),
    muddywater: (refs, launch, target, v) => SurfWave.play(refs, launch, target, v, SurfWave.MUD),
    steameruption: (refs, launch, target) => SteamEruption.play(refs, launch, target),
    surf: (refs, launch, target, v) => SurfWave.play(refs, launch, target, v, SurfWave.SURF),
    waterfall: (refs, _launch, target) => WaterMoveAnimations.playWaterfall(refs, target),
    waterspout: (refs, launch, target) => WaterMoveAnimations.playWaterSpout(refs, launch, target)
  };

  /** Turn-1 animations of two-turn Water moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    dive: (refs) => WaterMoveAnimations.playDiveUnder(refs)
  };

  /**
   * Dive, turn 1 (sound: splash 0.02 s, surge 0.68 s): the user sinks out of
   * sight while cyan water jets shoot up from its spot with white spray; a
   * second, smaller surge follows, then the water settles. The user stays away until turn 2.
   */
  private static async playDiveUnder(refs: BattleStageRefs) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = Fx.rect(el);
    const foot = Fx.footOf(el, fieldEl);
    el.style.transformOrigin = 'center bottom';
    const sink = Fx.anim(el, [
      { transform: 'translateY(0) scale(1)', opacity: 1 },
      { transform: 'translateY(40px) scale(.75)', opacity: 0 }
    ], { duration: 320, easing: 'ease-in', fill: 'forwards' });
    const first = WaterMoveAnimations.waterJets(fxEl, foot, r, 1);
    await sink;
    el.style.opacity = '0';
    el.style.transformOrigin = '';
    await Fx.wait(330);
    await Promise.all([first, WaterMoveAnimations.waterJets(fxEl, foot, r, 0.6)]);
  }

  /**
   * Dive, turn 2 (sound: splash 0.02 s, hits 0.68 / 0.82 / 0.96 s): bubbles
   * well up under the target, then three light-blue water bursts with white
   * droplets hit it in different spots; the user rises back up into its place.
   */
  private static async playDiveHit(refs: BattleStageRefs, target: Point) {
    const { launchEl, fieldEl, fxEl, targetEl } = refs;
    // Under water until the end (also when Power Herb skipped turn 1).
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.opacity = '0';
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);

    // Bubbles well up round the target's feet (0-0.6 s).
    for (let i = 0; i < 10; i++) {
      const b = FxGlyphs.bubbleGlyph(6 + Math.random() * 8);
      Fx.place(b, { x: foot.x + (Math.random() * 2 - 1) * r.width * 0.45, y: foot.y - Math.random() * 8 });
      fxEl.appendChild(b);
      Fx.anim(b, [
        { transform: 'translateY(0) scale(.4)', opacity: 0 },
        { transform: 'translateY(-10px) scale(1)', opacity: 0.9, offset: 0.4 },
        { transform: `translateY(${-24 - Math.random() * 20}px) scale(1.1)`, opacity: 0 }
      ], { duration: 450, easing: 'ease-out', delay: 50 + Math.random() * 300 }).then(() => b.remove());
    }
    await Fx.wait(680);

    // Three water hits.
    const spots = [
      { x: -0.2, y: -0.15 },
      { x: 0.22, y: 0.05 },
      { x: -0.05, y: -0.3 }
    ];
    const hits: Promise<void>[] = [];
    for (const spot of spots) {
      const at = { x: target.x + spot.x * r.width, y: target.y + spot.y * r.height };
      const burst = FxGlyphs.spikyBurst(Math.max(r.width * 0.42, 36), '#5FB8F0', '#A8E0FF', '#F0FAFF');
      Fx.place(burst, at);
      fxEl.appendChild(burst);
      hits.push(
        Fx.anim(burst, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.05) rotate(15deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1.15) rotate(25deg)', opacity: 0 }
        ], { duration: 360, easing: 'ease-out' }).then(() => burst.remove())
      );
      WaterMoveAnimations.waterSplash(fxEl, at);
      Fx.flash(targetEl, '#A8E0FF', 0.5);
      Fx.shake(targetEl, 5);
      await Fx.wait(140);
    }
    Fx.shakeField(fieldEl, 0.3);
    await Promise.all(hits);

    // White droplets twinkle round the target as the water clears.
    for (let i = 0; i < 10; i++) {
      const s = 3 + Math.random() * 3;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#fff;box-shadow:0 0 4px #E8F6FF`;
      Fx.place(d, { x: target.x + (Math.random() * 2 - 1) * r.width * 0.6, y: target.y + (Math.random() * 2 - 1) * r.height * 0.5 });
      fxEl.appendChild(d);
      Fx.anim(d, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: 'translateY(4px)', opacity: 1, offset: 0.3 },
        { transform: 'translateY(14px)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: Math.random() * 200 }).then(() => d.remove());
    }

    // The user rises back up from below.
    launchEl.style.opacity = '1';
    launchEl.style.transformOrigin = 'center bottom';
    await Fx.anim(launchEl, [
      { transform: 'translateY(40px) scale(.75)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 300, easing: 'ease-out' });
    launchEl.style.transformOrigin = '';
    launchEl.style.transform = '';
  }

  /**
   * Three tall, soft cyan water jets shoot up from `foot` (sized to the
   * sprite `r`, scaled by `power`) with white spray, then fade upward.
   */
  private static waterJets(fxEl: HTMLElement, foot: Point, r: DOMRect, power: number): Promise<void> {
    const done: Promise<void>[] = [];
    const h = Math.max(r.height * 1.5, 90) * power;
    for (const [k, i] of [[-0.28, 0], [0.1, 1], [0.32, 2]] as const) {
      const w = Math.max(r.width * 0.3, 22) * (i === 1 ? 1.2 : 1);
      const jh = h * (i === 1 ? 1 : 0.75);
      const jet = document.createElement('div');
      jet.style.cssText = `position:absolute;left:${foot.x + k * r.width - w / 2}px;top:${foot.y - jh}px;width:${w}px;height:${jh}px;pointer-events:none;transform-origin:center bottom;border-radius:50% 50% 35% 35% / 70% 70% 30% 30%;background:linear-gradient(0deg,#E8FFFFee,#7FEAF4dd 30%,#4FD0E8aa 70%,#9CF4FF00);filter:blur(2.5px)`;
      fxEl.appendChild(jet);
      done.push(
        Fx.anim(jet, [
          { transform: 'scale(.6,0)', opacity: 0.9 },
          { transform: 'scale(1,1.05)', opacity: 0.95, offset: 0.35 },
          { transform: 'translateY(-10px) scale(.8,1)', opacity: 0.7, offset: 0.7 },
          { transform: `translateY(${-jh * 0.25}px) scale(.5,.9)`, opacity: 0 }
        ], { duration: 700, easing: 'ease-out', delay: i * 70 }).then(() => jet.remove())
      );
    }
    for (let i = 0; i < 12 * power; i++) {
      const s = 3 + Math.random() * 4;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#fff;box-shadow:0 0 4px #BFF6FF`;
      Fx.place(d, { x: foot.x + (Math.random() * 2 - 1) * r.width * 0.45, y: foot.y - Math.random() * 10 });
      fxEl.appendChild(d);
      const up = h * (0.4 + Math.random() * 0.6);
      const side = (Math.random() * 2 - 1) * 30;
      done.push(
        Fx.anim(d, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${side * 0.7}px,${-up}px)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${side}px,${-up * 0.8}px)`, opacity: 0 }
        ], { duration: 650, easing: 'ease-out', delay: Math.random() * 150 }).then(() => d.remove())
      );
    }
    return Promise.all(done).then(() => void 0);
  }

  /**
   * Rain Dance: the scene darkens under heavy clouds and slanted streaks of
   * rain pour down over the whole field, then the sky clears again.
   */
  private static async playRainDance(refs: BattleStageRefs) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const pour = 1900;

    const gloom = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#0E1A22,#1A2A26 70%);opacity:0');
    await Fx.anim(gloom, [{ opacity: 0 }, { opacity: 0.6 }], { duration: 350, easing: 'ease-out', fill: 'forwards' });

    // Rain falls in front of the sprites; each streak loops until the shower ends.
    const rain = document.createElement('div');
    rain.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(rain);
    const slant = 14; // degrees: the top leans right, so streaks fall toward the left
    const drift = Math.tan((slant * Math.PI) / 180);
    for (let i = 0; i < 80; i++) {
      const len = 16 + Math.random() * 16;
      const drop = document.createElement('div');
      const x = Math.random() * (W + H * drift);
      drop.style.cssText = `position:absolute;left:${x}px;top:${-len}px;width:1.5px;height:${len}px;border-radius:1px;background:linear-gradient(180deg,#ffffff00,#E8F2FFcc);transform-origin:50% 100%`;
      rain.appendChild(drop);
      const fall = H + len * 2;
      drop.animate([
        { transform: `translate(0,0) rotate(${slant}deg)` },
        { transform: `translate(${-fall * drift}px,${fall}px) rotate(${slant}deg)` }
      ], { duration: 420 + Math.random() * 220, iterations: Infinity, easing: 'linear', delay: -Math.random() * 600 });
    }
    await Fx.anim(rain, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    await Fx.wait(pour);

    await Promise.all([
      Fx.anim(rain, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in', fill: 'forwards' }),
      Fx.anim(gloom, [{ opacity: 0.6 }, { opacity: 0 }], { duration: 450, easing: 'ease-in', fill: 'forwards' })
    ]);
    rain.remove();
    gloom.remove();
  }

  /**
   * Bubble / Bubble Beam: see-through water bubbles travel to the target,
   * gather around it, then pop one after another. The style sets how many,
   * how fast and how loosely they fly (a slow drift or a tight beam).
   */
  private static async playBubbles(refs: BattleStageRefs, launch: Point, target: Point, style: BubbleStyle) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const spreadX = Math.max(r.width * 0.45, 28);
    const spreadY = Math.max(r.height * 0.4, 24);
    const { count, travel, stagger, wobble, jitter } = style;

    const bubbles: { el: HTMLElement; end: Point; rest: string }[] = [];
    const arrivals: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const el = FxGlyphs.bubbleGlyph(12 + Math.random() * 14);
      const start = { x: launch.x + (Math.random() * 2 - 1) * jitter, y: launch.y + (Math.random() * 2 - 1) * jitter };
      Fx.place(el, start);
      fxEl.appendChild(el);
      // Each bubble ends up at its own spot around the target.
      const end = {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (Math.random() * 2 - 1) * spreadY
      };
      const ex = end.x - start.x;
      const ey = end.y - start.y;
      bubbles.push({ el, end, rest: `translate(${ex}px,${ey}px)` });
      const wob = wobble * (0.4 + Math.random() * 0.6);
      const phase = Math.random() * Math.PI * 2;
      const frames: Keyframe[] = [];
      const steps = 10;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = 1 - (1 - t) * (1 - t); // slows down as it arrives
        frames.push({
          transform: `translate(${ex * ease}px,${ey * ease + Math.sin(phase + t * Math.PI * 3) * wob * (1 - t)}px) scale(${0.4 + t * 0.6})`,
          opacity: Math.min(1, t * 5)
        });
      }
      arrivals.push(Fx.anim(el, frames, { duration: travel, easing: 'linear', delay: i * stagger }));
    }
    await Promise.all(arrivals);
    await Fx.wait(250);

    // Pop: each bubble swells and vanishes, leaving a few droplets.
    const pops = bubbles.map(({ el, end, rest }, i) =>
      Fx.wait(i * 35 + Math.random() * 60).then(() => {
        const at = { x: end.x, y: end.y };
        Fx.anim(el, [
          { transform: `${rest} scale(1)`, opacity: 1 },
          { transform: `${rest} scale(1.6)`, opacity: 0 }
        ], { duration: 160, easing: 'ease-out' }).then(() => el.remove());
        for (let d = 0; d < 4; d++) {
          const drop = document.createElement('div');
          drop.style.cssText = 'position:absolute;width:3px;height:3px;border-radius:50%;pointer-events:none;background:#D8F0FF';
          Fx.place(drop, at);
          fxEl.appendChild(drop);
          const ang = (Math.PI * 2 * d) / 4 + Math.random();
          Fx.anim(drop, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${Math.cos(ang) * 10}px,${Math.sin(ang) * 10}px)`, opacity: 0 }
          ], { duration: 260, easing: 'ease-out' }).then(() => drop.remove());
        }
        if (i % 4 === 0) {
          Fx.flash(targetEl, '#8FD0FF', 0.35);
          Fx.shake(targetEl, 2);
        }
      })
    );
    await Promise.all(pops);
    await Fx.wait(260);
  }

  /**
   * Hydro Pump: the scene goes dark, then a deep blue backdrop with rushing
   * light streaks fades in. A water beam made of a glowing core and a stream
   * of swelling water rings blasts the target, then the backdrop fades away.
   */
  private static async playHydroPump(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const dir = target.x >= launch.x ? 1 : -1;
    const water = '#7CC8FF';

    // backdrop() inserts at the back, so the blue layer is made first and the dim one ends up behind it.
    const sea = WaterMoveAnimations.rushingSea(fieldEl, dir, WaterMoveAnimations.DEEP_SEA);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await Fx.wait(150);
    await Fx.anim(sea, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-in-out' });
    sea.style.opacity = '1';
    dim.remove();

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const nx = -dy / dist;
    const ny = dx / dist;
    const rings = 40;
    const gap = 24;
    const travel = 400;
    const streamTime = rings * gap + travel;

    // Glowing water core under the rings.
    const thick = 16;
    const core = document.createElement('div');
    core.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${dist}px;height:${thick}px;border-radius:${thick}px;pointer-events:none;transform-origin:0 50%;background:linear-gradient(180deg,transparent,${water}99 30%,#E8F6FFcc 50%,${water}99 70%,transparent);box-shadow:0 0 14px ${water}`;
    fxEl.appendChild(core);
    const rot = `rotate(${angle}deg)`;
    const coreDone = Fx.anim(core, [
      { transform: `${rot} scale(0,1)`, opacity: 0.9 },
      { transform: `${rot} scale(1,1)`, opacity: 0.9, offset: travel / streamTime },
      { transform: `${rot} scale(1,1.15)`, opacity: 0.9, offset: 0.85 },
      { transform: `${rot} scale(1,.2)`, opacity: 0 }
    ], { duration: streamTime, easing: 'linear' }).then(() => core.remove());

    // Water rings stream out, swelling and swirling slightly as they fly.
    const steps = 6;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:14px;height:40px;border-radius:50%;pointer-events:none;border:2.5px solid #E8F6FFdd;background:radial-gradient(ellipse,transparent 45%,${water}55);box-shadow:0 0 8px ${water},inset 0 0 6px ${water}`;
      Fx.place(ring, launch);
      fxEl.appendChild(ring);
      const phase = i * 0.8;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wob = Math.sin(phase + t * Math.PI * 2) * 4;
        frames.push({
          transform: `translate(${dx * t + nx * wob}px,${dy * t + ny * wob}px) rotate(${angle}deg) scale(${0.5 + t * 0.9})`,
          opacity: t === 0 ? 0 : t === 1 ? 0.15 : 0.85
        });
      }
      flights.push(
        Fx.anim(ring, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          ring.remove();
          if (i % 5 === 0) {
            Fx.flash(targetEl, water, 0.45);
            Fx.shake(targetEl, 4);
            WaterMoveAnimations.waterSplash(fxEl, target);
          }
        })
      );
    }
    await Promise.all([...flights, coreDone]);
    Fx.flash(targetEl, water, 0.6);
    await Fx.wait(250);

    await Fx.anim(sea, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-in' });
    sea.remove();
  }

  /** Hydro Pump's deep blue rushing sea. */
  private static readonly DEEP_SEA: SeaStyle = {
    background: 'linear-gradient(180deg,#0A2A5E,#14508F 35%,#1D63A8 50%,#14508F 65%,#0A2A5E)',
    streaks: ['#5FA8E0', '#9CD6FF'],
    opacity: [0.35, 0.8]
  };

  /** Hydro Cannon's bright sky-blue rushing sea. */
  private static readonly BRIGHT_SEA: SeaStyle = {
    background: 'linear-gradient(180deg,#1E78D0,#4AAAF0 35%,#7CCBFF 50%,#4AAAF0 65%,#1E78D0)',
    streaks: ['#CDEEFF', '#ffffff'],
    opacity: [0.4, 0.9]
  };

  /**
   * A blue backdrop (invisible until the caller fades it in) with light
   * streaks endlessly rushing across in direction `dir` (Hydro Pump, Hydro Cannon).
   */
  private static rushingSea(fieldEl: HTMLElement, dir: 1 | -1, style: SeaStyle): HTMLElement {
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const sea = Fx.backdrop(fieldEl, `background:${style.background};opacity:0`);
    const [lo, hi] = style.opacity;
    for (let i = 0; i < 30; i++) {
      const len = W * (0.15 + Math.random() * 0.35);
      const h = 2 + Math.random() * 5;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${h}px;border-radius:${h}px;background:linear-gradient(90deg,transparent,${style.streaks[Math.random() < 0.5 ? 0 : 1]},transparent);opacity:${lo + Math.random() * (hi - lo)}`;
      sea.appendChild(streak);
      streak.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px)` },
          { transform: `translateX(${dir > 0 ? W : -len}px)` }
        ],
        { duration: 700 + Math.random() * 700, delay: -Math.random() * 1400, iterations: Infinity, easing: 'linear' }
      );
    }
    return sea;
  }

  /**
   * Hydro Cannon: the scene goes dark while a big ball of water gathers in
   * front of the user, drops streaming into it (0-1.1 s); the scene turns
   * into a bright rushing blue sea (1.1-1.4 s) and a very fat jet of water
   * blasts from the ball into the target (1.4-2.6 s, first hit at 1.6 s);
   * the sea fades (~2.6-3.05 s).
   */
  private static async playHydroCannon(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const water = '#7CC8FF';

    // 1. Dark, and a water ball gathers in front of the user.
    const sea = WaterMoveAnimations.rushingSea(fieldEl, dir, WaterMoveAnimations.BRIGHT_SEA);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    const ballAt = { x: launch.x + dir * lr.width * 0.3, y: launch.y };
    const ballSize = Math.max(lr.width * 0.85, 60);
    const ball = document.createElement('div');
    ball.style.cssText = `position:absolute;width:${ballSize}px;height:${ballSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 38% 34%,#ffffff 0 8%,#D8F2FFdd 22%,#7CC8FFcc 55%,#2E7FD0dd 85%,#1A5AA8ee);box-shadow:0 0 16px ${water},inset 0 0 12px #ffffffaa`;
    Fx.place(ball, ballAt);
    fxEl.appendChild(ball);
    const grow = Fx.anim(ball, [
      { transform: 'scale(.1)', opacity: 0.6 },
      { transform: 'scale(.6,.55)', opacity: 1, offset: 0.4 },
      { transform: 'scale(.85,.9)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1,.97)', opacity: 1 }
    ], { duration: 800, easing: 'ease-out', fill: 'forwards' });
    for (let i = 0; i < 16; i++) {
      const s = 5 + Math.random() * 5;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,#9CD6FF);box-shadow:0 0 4px #9CD6FF`;
      Fx.place(drop, ballAt);
      fxEl.appendChild(drop);
      const ang = Math.random() * Math.PI * 2;
      const d = ballSize * (0.9 + Math.random() * 0.5);
      Fx.anim(drop, [
        { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 0 },
        { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px)`, opacity: 1, offset: 0.3 },
        { transform: 'translate(0,0) scale(.4)', opacity: 0.6 }
      ], { duration: 320, easing: 'ease-in', delay: Math.random() * 480, fill: 'backwards' }).then(() => drop.remove());
    }
    await grow;

    // 2. The bright sea replaces the dark.
    await Fx.anim(sea, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-in-out' });
    sea.style.opacity = '1';
    dim.remove();

    // 3. The fat jet, widening towards the target, with water flowing along it.
    const dx = target.x - ballAt.x;
    const dy = target.y - ballAt.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const thick = Math.max(lr.height * 0.6, 54);
    const jet = document.createElement('div');
    jet.style.cssText =
      `position:absolute;left:${ballAt.x}px;top:${ballAt.y - thick / 2}px;width:${dist + thick * 0.3}px;height:${thick}px;pointer-events:none;transform-origin:0 50%;` +
      `clip-path:polygon(0 22%,100% 0,100% 100%,0 78%);border-radius:0 ${thick / 2}px ${thick / 2}px 0;` +
      `background:repeating-linear-gradient(90deg,#ffffff00 0 26px,#ffffff55 26px 34px,#ffffff00 34px 60px),linear-gradient(180deg,#9CD6FF00,#9CD6FFaa 12%,#D8F2FFdd 35%,#ffffff 50%,#D8F2FFdd 65%,#9CD6FFaa 88%,#9CD6FF00)`;
    fxEl.insertBefore(jet, ball);
    const flow = jet.animate([{ backgroundPosition: '0 0, 0 0' }, { backgroundPosition: '60px 0, 0 0' }], { duration: 160, iterations: Infinity });
    const rot = `rotate(${angle}deg)`;
    Fx.anim(ball, [{ transform: 'scale(1,.97)' }, { transform: 'scale(.75,.7)' }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
    await Fx.anim(jet, [{ transform: `${rot} scale(0,.6)` }, { transform: `${rot} scale(1,1)` }], { duration: 200, easing: 'ease-in', fill: 'forwards' });

    const hold = 700;
    Fx.anim(jet, [
      { transform: `${rot} scale(1,1)` },
      { transform: `${rot} scale(1,1.08)` },
      { transform: `${rot} scale(1,.95)` },
      { transform: `${rot} scale(1,1.06)` },
      { transform: `${rot} scale(1,1)` }
    ], { duration: hold, easing: 'ease-in-out', fill: 'forwards' });
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, water, 0.6);
        Fx.shake(targetEl, 6);
        WaterMoveAnimations.waterSplash(fxEl, target);
      }, i * 150);
    }
    Fx.shakeField(fieldEl, 0.8);
    await Fx.wait(hold);

    // The jet thins out and the ball is spent.
    await Promise.all([
      Fx.anim(jet, [{ transform: `${rot} scale(1,1)`, opacity: 1 }, { transform: `${rot} scale(1,.1)`, opacity: 0 }], { duration: 300, easing: 'ease-in' }),
      Fx.anim(ball, [{ transform: 'scale(.75,.7)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], { duration: 300, easing: 'ease-in' })
    ]);
    flow.cancel();
    jet.remove();
    ball.remove();

    await Fx.anim(sea, [{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-in' });
    sea.remove();
  }

  /**
   * Water Spout, after the DPPt animation: a pale blue water column shoots up
   * from the user and off the top of the screen while fine spray drifts round
   * it (0-0.35 s, holds to 0.6 s); the column thins away from the bottom
   * (0.6-1.0 s); then water drops rain down round the target, blue splashes
   * hit it and a bank of white foam builds along the ground toward it
   * (0.9-2.2 s) and fades (to ~2.6 s).
   */
  private static async playWaterSpout(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. The column: revealed from the bottom up, then cut away from the bottom up.
    const cw = Math.max(lr.width * 0.22, 16);
    const baseY = launch.y - lr.height * 0.35;
    const col = document.createElement('div');
    col.style.cssText =
      `position:absolute;left:${launch.x - cw / 2}px;top:-20px;width:${cw}px;height:${baseY + 20}px;border-radius:${cw / 2}px;pointer-events:none;` +
      'background:repeating-linear-gradient(180deg,#ffffff33 0 6px,#ffffff00 6px 14px),linear-gradient(90deg,#8A9CF0aa,#E8ECFF 40%,#C8D0FF 60%,#8A9CF0aa);filter:drop-shadow(0 0 4px #9AB0FF)';
    fxEl.appendChild(col);
    col.animate([{ backgroundPosition: '0 0,0 0' }, { backgroundPosition: '0 -28px,0 0' }], { duration: 120, iterations: Infinity });
    const column = Fx.anim(col, [
      { clipPath: 'inset(100% -10px 0 -10px)' },
      { clipPath: 'inset(0 -10px 0 -10px)', offset: 0.35 },
      { clipPath: 'inset(0 -10px 0 -10px)', offset: 0.6 },
      { clipPath: 'inset(0 -10px 100% -10px)' }
    ], { duration: 1000, easing: 'ease-out' }).then(() => col.remove());
    Fx.flash(launchEl, '#9AB0FF', 0.4);
    // Fine spray drifts round the column.
    for (let i = 0; i < 30; i++) {
      const s = 1.5 + Math.random() * 2;
      const speck = document.createElement('div');
      speck.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#F0F4FF;box-shadow:0 0 2px #C8D4FF`;
      Fx.place(speck, { x: launch.x + (Math.random() * 2 - 1) * cw * 2, y: baseY - Math.random() * lr.height });
      fxEl.appendChild(speck);
      const dx = (Math.random() * 2 - 1) * 18;
      Fx.anim(speck, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: `translate(${dx * 0.4}px,-4px)`, opacity: 0.9, offset: 0.3 },
        { transform: `translate(${dx}px,6px)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 200, delay: 150 + Math.random() * 550, easing: 'ease-out', fill: 'backwards' }).then(() => speck.remove());
    }
    await Fx.wait(900);

    // 2. The water comes down on the target side.
    const parts: Promise<void>[] = [column];
    const rain = document.createElement('div');
    rain.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(rain);
    for (let i = 0; i < 26; i++) {
      const drop = document.createElement('div');
      drop.style.cssText = 'position:absolute;width:4px;height:9px;border-radius:50% 50% 50% 50% / 65% 65% 35% 35%;background:linear-gradient(180deg,#ffffff,#B8C8FF)';
      const x = target.x + (Math.random() * 2 - 1) * tr.width * 0.9;
      const land = target.y + (Math.random() * 2 - 1) * tr.height * 0.5;
      Fx.place(drop, { x, y: -10 });
      rain.appendChild(drop);
      parts.push(
        Fx.anim(drop, [
          { transform: 'translateY(0)', opacity: 1 },
          { transform: `translateY(${land + 10}px)`, opacity: 1, offset: 0.9 },
          { transform: `translateY(${land + 14}px) scale(1.4,.5)`, opacity: 0 }
        ], { duration: 400 + Math.random() * 150, delay: Math.random() * 1000, easing: 'ease-in', fill: 'backwards' }).then(() => drop.remove())
      );
    }
    // Blue splashes land on the target.
    for (let i = 0; i < 5; i++) {
      const s = Math.max(tr.width * 0.3, 20);
      const blob = document.createElement('div');
      blob.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#6A8AFFcc,#3A5AE899 50%,#3A5AE800 72%)`;
      Fx.place(blob, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3 });
      fxEl.appendChild(blob);
      const delay = 300 + i * 170;
      setTimeout(() => {
        Fx.shake(targetEl, 4);
        Fx.flash(targetEl, '#6A8AFF', 0.4);
      }, delay);
      parts.push(
        Fx.anim(blob, [
          { transform: 'scale(.4)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.3 },
          { transform: 'scale(1.25)', opacity: 0 }
        ], { duration: 450, delay, easing: 'ease-out', fill: 'backwards' }).then(() => blob.remove())
      );
    }
    // A foam bank builds along the ground from partway over toward the target, then fades.
    const lfoot = Fx.footOf(launchEl, fieldEl);
    const tfoot = Fx.footOf(targetEl, fieldEl);
    const from: Point = { x: lfoot.x + (tfoot.x - lfoot.x) * 0.45, y: lfoot.y + (tfoot.y - lfoot.y) * 0.45 };
    const to: Point = { x: tfoot.x + tr.width * 0.5, y: tfoot.y };
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const s = Math.max(tr.width * (0.35 + Math.random() * 0.2), 26);
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#ffffff,#DCDCF4cc 45%,#C8C8F000 72%)`;
      Fx.place(puff, { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t - s * 0.25 });
      fxEl.appendChild(puff);
      parts.push(
        Fx.anim(puff, [
          { transform: 'translateY(6px) scale(.4)', opacity: 0 },
          { transform: 'translateY(0) scale(1)', opacity: 0.85, offset: 0.25 },
          { transform: 'translateY(-4px) scale(1.15)', opacity: 0.8, offset: 0.65 },
          { transform: 'translateY(-8px) scale(1.3)', opacity: 0 }
        ], { duration: 1300, delay: 200 + i * 60, easing: 'ease-out', fill: 'backwards' }).then(() => puff.remove())
      );
    }
    await Promise.all(parts);
    rain.remove();
  }

  /** A handful of water droplets splashing outwards from `at`. */
  private static waterSplash(fxEl: HTMLElement, at: Point) {
    for (let i = 0; i < 6; i++) {
      const s = 4 + Math.random() * 4;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,#9CD6FF);box-shadow:0 0 4px #9CD6FF`;
      Fx.place(drop, { x: at.x + (Math.random() * 20 - 10), y: at.y + (Math.random() * 20 - 10) });
      fxEl.appendChild(drop);
      const ang = Math.random() * Math.PI * 2;
      const dist = 18 + Math.random() * 22;
      Fx.anim(drop, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 10}px) scale(.4)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => drop.remove());
    }
  }

  /**
   * Crabhammer: a large water drop plunges fast from above onto the target and
   * bursts into a splash crown, then bubbles form around the target and pop.
   */
  private static async playCrabhammer(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const hit: Point = { x: target.x, y: target.y - r.height * 0.15 };
    const fall = hit.y + 60; // starts just above the top edge of the field

    // The drop: a teardrop with its tip pointing up (a rotated square tear), stretched while it falls.
    const size = 38;
    const drop = document.createElement('div');
    drop.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 6px #7CC8FF)`;
    const tear = document.createElement('div');
    tear.style.cssText = `width:100%;height:100%;border-radius:50% 0 50% 50%;transform:rotate(-45deg);background:radial-gradient(circle at 40% 60%,#fff,#9CD6FF 35%,#3F8FD8 80%,#2A6CB5)`;
    drop.appendChild(tear);
    Fx.place(drop, hit);
    fxEl.appendChild(drop);

    // Light streaks trailing above the drop.
    for (let i = 0; i < 3; i++) {
      const streak = document.createElement('div');
      const w = 3 + (i === 1 ? 3 : 0);
      streak.style.cssText = `position:absolute;left:${hit.x - w / 2 + (i - 1) * 9}px;top:${hit.y - 90}px;width:${w}px;height:90px;border-radius:${w}px;pointer-events:none;background:linear-gradient(180deg,transparent,#E8F6FFcc);transform-origin:50% 100%`;
      fxEl.appendChild(streak);
      Fx.anim(streak, [
        { transform: `translateY(${-fall}px) scaleY(.4)`, opacity: 0 },
        { transform: 'translateY(0) scaleY(1)', opacity: 0.9, offset: 0.6 },
        { transform: 'translateY(0) scaleY(.2)', opacity: 0 }
      ], { duration: 460, easing: 'ease-in' }).then(() => streak.remove());
    }
    await Fx.anim(drop, [
      { transform: `translateY(${-fall}px) scale(.8,1.25)`, opacity: 0.6 },
      { transform: 'translateY(0) scale(.85,1.3)', opacity: 1 }
    ], { duration: 260, easing: 'ease-in' });

    // Splash: the drop flattens and bursts, a ring spreads out, droplets fly up and fall.
    Fx.anim(drop, [
      { transform: 'scale(1.1,.9)', opacity: 1 },
      { transform: 'scale(1.9,.35)', opacity: 0 }
    ], { duration: 160, easing: 'ease-out' }).then(() => drop.remove());
    const ring = document.createElement('div');
    ring.style.cssText = 'position:absolute;width:40px;height:14px;border-radius:50%;pointer-events:none;border:3px solid #E8F6FF;box-shadow:0 0 8px #7CC8FF,inset 0 0 6px #7CC8FF';
    Fx.place(ring, hit);
    fxEl.appendChild(ring);
    Fx.anim(ring, [
      { transform: 'scale(.4)', opacity: 1 },
      { transform: 'scale(2.6)', opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => ring.remove());
    for (let i = 0; i < 16; i++) {
      const s = 5 + Math.random() * 6;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s * 1.2}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,#9CD6FF 60%,#3F8FD8);box-shadow:0 0 4px #9CD6FF`;
      Fx.place(d, hit);
      fxEl.appendChild(d);
      // Thrown up and out in a crown, then pulled down again.
      const vx = (Math.random() * 2 - 1) * 60;
      const vy = 50 + Math.random() * 45;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        frames.push({
          transform: `translate(${vx * t}px,${-vy * t + 110 * t * t}px) scale(${1 - t * 0.5})`,
          opacity: t < 0.7 ? 1 : (1 - t) / 0.3
        });
      }
      Fx.anim(d, frames, { duration: 520 + Math.random() * 180, easing: 'linear' }).then(() => d.remove());
    }
    Fx.flash(targetEl, '#8FD0FF', 0.7);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.5);
    await Fx.wait(260);

    // Bubbles form around the target, float up a little and pop.
    const spreadX = Math.max(r.width * 0.55, 30);
    const spreadY = Math.max(r.height * 0.45, 26);
    const pops: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const b = FxGlyphs.bubbleGlyph(8 + Math.random() * 12);
      Fx.place(b, {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (Math.random() * 2 - 1) * spreadY
      });
      fxEl.appendChild(b);
      const rise = 14 + Math.random() * 18;
      pops.push(
        Fx.anim(b, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: `translateY(${-rise * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translateY(${-rise}px) scale(1)`, opacity: 1, offset: 0.85 },
          { transform: `translateY(${-rise}px) scale(1.5)`, opacity: 0 }
        ], { duration: 750 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 300 }).then(() => b.remove())
      );
    }
    await Promise.all(pops);
  }

  /**
   * Waterfall: the field goes black, then a wall of light blue water with
   * white wave crests rushes upward behind the battle, and the target is
   * struck by a rising column of blue splashes with white spray streaks.
   */
  private static async playWaterfall(refs: BattleStageRefs, target: Point) {
    const { fieldEl } = refs;
    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // Rising water: the wave tile scrolls upward, faded in over the black.
    const water = document.createElement('div');
    water.style.cssText = `position:absolute;inset:0;background-image:${WATERFALL_WAVES};background-size:80px 48px`;
    black.appendChild(water);
    water.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '0 -48px' }], {
      duration: 260,
      iterations: Infinity,
      easing: 'linear'
    });
    await Fx.anim(water, [
      { transform: 'translateY(100%)', opacity: 0.6 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 420, easing: 'ease-out' });
    await Fx.wait(350);

    await WaterCrash.play(refs, target, WaterCrash.WATERFALL);

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    black.remove();
  }
}

/** Look of a rushing blue sea backdrop: base gradient, the two streak colours and the streaks' opacity range. */
interface SeaStyle {
  background: string;
  streaks: [string, string];
  opacity: [number, number];
}
