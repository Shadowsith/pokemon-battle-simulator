import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { HEAT_BACKDROP, DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { DeliveryAnimations } from '../delivery-animations';

/** Hand-made animations for Fire-type moves. */
export class FireMoveAnimations {
  /** Hand-made Fire move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    firepunch: (refs, _launch, target) => FireMoveAnimations.playFirePunch(refs, target),
    ember: (refs, _launch, _target, v) => FireMoveAnimations.playGroundFlame(refs, v),
    fireblast: (refs, launch, target, v) => FireMoveAnimations.playFireBlast(refs, launch, target, v),
    flareblitz: (refs, launch, target, v) => FireMoveAnimations.playFlareBlitz(refs, launch, target, v),
    flamethrower: (refs, launch, target, v) => FireMoveAnimations.playFlamethrower(refs, launch, target, v),
    firespin: async (refs, launch, target, v) => {
      await DeliveryAnimations.playDelivery(refs, launch, target, v);
      await FireMoveAnimations.playVortex(refs, v);
    }
  };

  /** A single small flame that flares up at the target's feet and flickers out (Ember). */
  private static async playGroundFlame(refs: BattleStageRefs, v: MoveVisual) {
    const { fxEl, fieldEl, targetEl } = refs;
    const w = Math.min(Math.max(targetEl.getBoundingClientRect().width * 0.28, 22), 36);
    const done = FireMoveAnimations.burnFlame(fxEl, Fx.footOf(targetEl, fieldEl), w, v.color, 900);
    await Fx.wait(200);
    Fx.flash(targetEl, v.color, 0.35);
    Fx.shake(targetEl, 3);
    await done;
  }

  /**
   * One flickering flame standing on `base` (its bottom-centre): flares up,
   * flickers, then floats up a little and goes out. Shared by Ember and the
   * burning target of Flamethrower.
   */
  private static burnFlame(fxEl: HTMLElement, base: Point, w: number, color: string, duration: number, delay = 0): Promise<void> {
    // Outer flame with a yellow-white core; the square tear is rotated so its tip points up.
    const flame = document.createElement('div');
    flame.style.cssText = `position:absolute;left:${base.x - w / 2}px;top:${base.y - w * 1.5}px;width:${w}px;height:${w * 1.5}px;pointer-events:none;transform-origin:50% 100%`;
    for (const [scale, from, to] of [
      [1, '#FFB13C', color],
      [0.55, '#fff', '#FFD25A']
    ] as const) {
      const s = w * 0.8 * scale;
      const tear = document.createElement('div');
      tear.style.cssText = `position:absolute;left:${(w - s) / 2}px;bottom:${s * 0.15}px;width:${s}px;height:${s}px;border-radius:50% 0 50% 50%;transform:rotate(-45deg);background:radial-gradient(circle at 40% 60%,${from},${to} 70%);filter:drop-shadow(0 0 5px ${color})`;
      flame.appendChild(tear);
    }
    fxEl.appendChild(flame);

    const flicker: Keyframe[] = [{ transform: 'scale(.2,.1)', opacity: 0 }];
    const n = 8;
    for (let k = 1; k <= n; k++) {
      flicker.push({
        transform: `scale(${1 + (k % 2 ? 0.08 : -0.06)},${1 + (k % 2 ? -0.1 : 0.14)}) skewX(${k % 2 ? 4 : -4}deg)`,
        opacity: 1,
        offset: 0.12 + (k / n) * 0.7
      });
    }
    flicker.push({ transform: 'translateY(-10px) scale(.4,.6)', opacity: 0 });
    return Fx.anim(flame, flicker, { duration, delay, easing: 'ease-in-out' }).then(() => flame.remove());
  }

  /**
   * Flamethrower: the backdrop glows red-hot, a stream of fire pours from the
   * caster into the target, then the target turns red and burns briefly.
   */
  private static async playFlamethrower(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    await Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    // Heat shimmer: the red glow pulses gently.
    heat.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.15)' }, { filter: 'brightness(1)' }], {
      duration: 500,
      iterations: Infinity
    });

    // Fire stream: puffs leave the caster in quick succession and swell as they fly.
    const puffs = 42;
    const gap = 24;
    const travel = 380;
    const stream = FireMoveAnimations.fireStream(fxEl, launch, target, { count: puffs, gap, travel });
    // The target shakes under the stream.
    for (let t = travel * 0.8; t < puffs * gap + travel; t += 260) setTimeout(() => Fx.shake(targetEl, 4), t);
    await Fx.wait(travel * 0.8);
    targetEl.style.filter = `sepia(1) saturate(5) hue-rotate(-25deg) brightness(.95) drop-shadow(0 0 8px ${v.color})`;
    await stream;

    // Burning: a few flames flicker over the reddened target.
    const r = targetEl.getBoundingClientRect();
    const foot = Fx.footOf(targetEl, fieldEl);
    const fw = Math.min(Math.max(r.width * 0.26, 20), 34);
    const burns: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const base = {
        x: target.x + (Math.random() * 2 - 1) * r.width * 0.32,
        y: foot.y - Math.random() * r.height * 0.5
      };
      burns.push(FireMoveAnimations.burnFlame(fxEl, base, fw * (0.8 + Math.random() * 0.4), v.color, 750, i * 110));
    }
    await Promise.all(burns);
    targetEl.style.filter = '';

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Fire Punch: the backdrop turns red-hot, then a red fist slams onto the
   * target and a cloud of little flickering flames bursts up around it.
   */
  private static async playFirePunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    // 1. Red-hot backdrop.
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    await Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. The fist slams in, flames burst around it.
    const fist = FxGlyphs.fistGlyph(Math.max(r.width * 0.45, 36), 'red');
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 150, easing: 'ease-in' });
    Fx.flash(targetEl, '#FF8A3C', 0.7);
    Fx.shake(targetEl, 5);

    const spreadX = Math.max(r.width * 0.55, 34);
    const spreadY = Math.max(r.height * 0.5, 30);
    const flames: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      // Denser near the middle, with a few further out. burnFlame stands on this point.
      const ang = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const base = { x: target.x + Math.cos(ang) * spreadX * d, y: target.y + 10 + Math.sin(ang) * spreadY * d };
      flames.push(FireMoveAnimations.burnFlame(fxEl, base, 12 + Math.random() * 10, '#E8401C', 600 + Math.random() * 200, Math.random() * 350));
    }
    Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all(flames);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Fire Blast, in three phases, all built from flowing fire streams (like
   * Flamethrower) so the fire keeps moving instead of sitting as orbs:
   * 1. flames stream in from around the caster and gather in it,
   * 2. a burning fireball flies to the target over a red-hot backdrop,
   * 3. it bursts into the five-armed blast shape over a yellow sunburst.
   */
  private static async playFireBlast(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = launchEl.getBoundingClientRect();

    // --- phase 1: gather -------------------------------------------------
    const ringR = Math.max(lr.width * 0.65, 46);
    const gather: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
      const from = { x: launch.x + Math.cos(ang) * ringR, y: launch.y + Math.sin(ang) * ringR * 0.8 };
      gather.push(
        FireMoveAnimations.fireStream(fxEl, from, launch, {
          count: 7,
          gap: 45,
          travel: 420,
          grow: [1.1, 0.4],
          jitter: 4,
          wave: 4,
          delay: i * 35
        })
      );
    }
    Fx.flash(launchEl, v.color, 0.4);
    setTimeout(() => Fx.flash(launchEl, '#FFC53C', 0.5), 500);
    await Promise.all(gather);

    // --- phase 2: a burning fireball flies over a red-hot backdrop ------------
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    const heatIn = Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const flight = 480;
    // The ball: a few puffs churning around a shared centre.
    const ball = document.createElement('div');
    ball.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    Fx.place(ball, launch);
    for (const [size, ox, oy, turn] of [
      [42, 0, 0, 1],
      [30, -9, -6, -1.4],
      [28, 8, 5, 1.8],
      [24, 3, -10, -2.2]
    ]) {
      const puff = FxGlyphs.firePuff(size);
      puff.style.left = `${ox - size / 2}px`;
      puff.style.top = `${oy - size / 2}px`;
      ball.appendChild(puff);
      puff.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: `rotate(${turn * 180}deg) scale(1.15)` }, { transform: `rotate(${turn * 360}deg) scale(1)` }], {
        duration: 300,
        iterations: Infinity
      });
    }
    fxEl.appendChild(ball);
    // Flames shed behind the ball as it flies.
    for (let i = 0; i < 22; i++) {
      const t = i / 22;
      const trail = FxGlyphs.firePuff(16 + Math.random() * 10);
      Fx.place(trail, { x: launch.x + dx * t, y: launch.y + dy * t });
      fxEl.appendChild(trail);
      const rot = Math.random() * 180;
      Fx.anim(trail, [
        { transform: `rotate(${rot}deg) scale(.9)`, opacity: 0.95 },
        { transform: `translate(${-v.dir * 10}px,-10px) rotate(${rot + 120}deg) scale(.3)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out', delay: t * flight }).then(() => trail.remove());
    }
    await Fx.anim(ball, [
      { transform: 'translate(0,0) scale(.6)' },
      { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) scale(1)`, offset: 0.2 },
      { transform: `translate(${dx}px,${dy}px) scale(1.2)` }
    ], { duration: flight, easing: 'ease-in' });
    await heatIn;
    ball.remove();

    // --- phase 3: five-armed blast over a sunburst -----------------------------
    const cx = `${target.x}px ${target.y}px`;
    const burst = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${cx},#FFFDE8 0,#FFF6A0 12%,transparent 34%),` +
        `radial-gradient(circle at ${cx},transparent 30%,#F0602Acc 85%,#C8301A),` +
        `repeating-conic-gradient(from 0deg at ${cx},#FFE95A 0deg 5deg,#FFC23C 5deg 10deg)`
    );
    // Sunburst goes above the heat layer (both stay behind platforms and sprites).
    heat.after(burst);
    Fx.anim(burst, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: 1500,
      easing: 'linear'
    }).then(() => burst.remove());
    Fx.flash(targetEl, '#FFF6A0', 0.9);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.9);

    // Arms: up, left, right, down-left, down-right (screen angles, y points down).
    const armLen = Math.max(Math.min(W, H) * 0.32, 70);
    const blasts: Promise<void>[] = [];
    for (const deg of [-90, 180, 0, 135, 45]) {
      const a = (deg * Math.PI) / 180;
      const end = { x: target.x + Math.cos(a) * armLen, y: target.y + Math.sin(a) * armLen };
      blasts.push(
        FireMoveAnimations.fireStream(fxEl, target, end, {
          count: 16,
          gap: 40,
          travel: 460,
          size: [18, 30],
          grow: [0.6, 1.6],
          jitter: 6,
          wave: 4
        })
      );
    }
    // The core keeps burning on the target while the arms stream out.
    blasts.push(FireMoveAnimations.fireStream(fxEl, target, target, { count: 14, gap: 45, travel: 420, size: [24, 36], grow: [0.7, 1.5], jitter: 12, wave: 0 }));
    setTimeout(() => Fx.shake(targetEl, 5), 450);
    await Promise.all(blasts);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Flare Blitz, in three phases:
   * 1. lots of small flames rise straight up off the caster,
   * 2. the backdrop goes dark,
   * 3. the caster lunges and the target is hit by a big red flame blast with
   *    sparks over a bright blue backdrop; the caster takes recoil.
   */
  private static async playFlareBlitz(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();

    // --- phase 1: flames rise off the caster ------------------------------
    const rise: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const x = lr.left - f.left + lr.width * (0.15 + Math.random() * 0.7);
      const y = lr.top - f.top + lr.height * (0.25 + Math.random() * 0.65);
      const up = 70 + Math.random() * 60;
      rise.push(
        FireMoveAnimations.fireStream(fxEl, { x, y }, { x, y: y - up }, {
          count: 5,
          gap: 90,
          travel: 520,
          size: [8, 14],
          grow: [1, 0.3],
          jitter: 3,
          wave: 2,
          delay: Math.random() * 250
        })
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, v.color, 0.45), i * 320);
    await Promise.all(rise);

    // --- phase 2: darkness -----------------------------------------------
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
    await Fx.wait(150);

    // --- phase 3: lunge and flame blast ------------------------------------
    const original = launchEl.style.transform;
    const lunge = v.dir * 46;
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(${-v.dir * 8}px)` },
      { transform: `${original} translateX(${lunge}px)` }
    ], { duration: 170, easing: 'ease-in' });

    const blue = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${target.x}px ${target.y}px,#C8ECFF 0,#5AA8EE 25%,#2463C2 60%,#123A86)`
    );
    dim.after(blue);
    const blueDone = Fx.anim(blue, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: 1300,
      easing: 'linear'
    }).then(() => blue.remove());
    Fx.flash(targetEl, '#FF5A3C', 0.9);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.9);

    // The blast: red flame bursting outward in every direction, plus a burning core.
    const tr = targetEl.getBoundingClientRect();
    const reach = Math.max(tr.width * 0.75, 55);
    const blast: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
      const d = reach * (0.7 + Math.random() * 0.4);
      blast.push(
        FireMoveAnimations.fireStream(fxEl, target, { x: target.x + Math.cos(a) * d, y: target.y + Math.sin(a) * d }, {
          count: 4,
          gap: 55,
          travel: 420,
          size: [22, 34],
          grow: [0.6, 1.9],
          jitter: 8,
          wave: 3,
          tone: 'red'
        })
      );
    }
    blast.push(FireMoveAnimations.fireStream(fxEl, target, target, { count: 8, gap: 60, travel: 420, size: [40, 56], grow: [0.7, 1.6], jitter: 6, wave: 0, tone: 'red' }));
    // Sparkling flames fly out past the blast; dark embers speckle it.
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const spark = i % 3 ? FxGlyphs.firePuff(7 + Math.random() * 5) : FxGlyphs.sparkStar(9, '#FFE38A');
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const d = reach * (1.1 + Math.random() * 0.7);
      Fx.anim(spark, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * 0.5}px,${Math.sin(a) * d * 0.5}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.4)`, opacity: 0 }
      ], { duration: 650, easing: 'ease-out', delay: 60 + Math.random() * 250 }).then(() => spark.remove());
    }
    for (let i = 0; i < 14; i++) {
      const ember = document.createElement('div');
      const sz = 3 + Math.random() * 3;
      ember.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:#7A0E0E`;
      Fx.place(ember, { x: target.x + (Math.random() * 2 - 1) * reach * 0.8, y: target.y + (Math.random() * 2 - 1) * reach * 0.7 });
      fxEl.appendChild(ember);
      Fx.anim(ember, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0 }], {
        duration: 600,
        delay: 120 + Math.random() * 300
      }).then(() => ember.remove());
    }

    // Back to the start spot, then recoil.
    await Fx.anim(launchEl, [{ transform: `${original} translateX(${lunge}px)` }, { transform: original }], {
      duration: 220,
      easing: 'ease-out'
    });
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;
    setTimeout(() => {
      Fx.flash(launchEl, '#E06666', 0.5);
      Fx.shake(launchEl, 4);
    }, 300);
    await Promise.all(blast);
    await blueDone;
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * A flowing stream of fire from `from` to `to`: puffs leave one after
   * another, swirl, change size and fade. Overlapping, ever-moving puffs are
   * what make it read as flame rather than as orbs.
   */
  private static fireStream(
    fxEl: HTMLElement,
    from: Point,
    to: Point,
    opts: {
      count: number;
      gap: number;
      travel: number;
      /** puff size range in px */
      size?: [number, number];
      /** scale at the start and at the end of the flight */
      grow?: [number, number];
      /** max px of random scatter at the end */
      jitter?: number;
      /** max px of sideways wave */
      wave?: number;
      delay?: number;
      tone?: 'hot' | 'red';
    }
  ): Promise<void> {
    const { count, gap, travel, size = [14, 24], grow = [0.4, 1.5], jitter = 8, wave = 8, delay = 0, tone = 'hot' } = opts;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const sc = (f: number) => grow[0] + (grow[1] - grow[0]) * f;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const puff = FxGlyphs.firePuff(size[0] + Math.random() * (size[1] - size[0]), tone);
      Fx.place(puff, from);
      fxEl.appendChild(puff);
      const jx = (Math.random() * 2 - 1) * jitter;
      const jy = (Math.random() * 2 - 1) * jitter;
      const wav = Math.sin(i * 0.7) * wave;
      const rot = Math.random() * 180;
      flights.push(
        Fx.anim(puff, [
          { transform: `translate(0,0) rotate(${rot}deg) scale(${sc(0)})`, opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15 + wav * 0.3}px) rotate(${rot + 40}deg) scale(${sc(0.27)})`, opacity: 1, offset: 0.12 },
          { transform: `translate(${dx * 0.6 + jx * 0.5}px,${dy * 0.6 + wav + jy * 0.5}px) rotate(${rot + 120}deg) scale(${sc(0.73)})`, opacity: 1, offset: 0.6 },
          { transform: `translate(${dx + jx}px,${dy + jy}px) rotate(${rot + 200}deg) scale(${sc(1)})`, opacity: 0 }
        ], { duration: travel, easing: 'linear', delay: delay + i * gap }).then(() => puff.remove())
      );
    }
    return Promise.all(flights).then(() => void 0);
  }

  /**
   * A ring of flames that ignites at the target's feet and spirals up around
   * it. Flames on the back half of the ring are smaller and dimmer, so the
   * ring reads as circling the sprite rather than sitting on top of it.
   */
  private static async playVortex(refs: BattleStageRefs, v: MoveVisual) {
    const { fxEl, fieldEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const ground = Fx.footOf(targetEl, fieldEl);
    const rx = Math.max(r.width * 0.55, 34);
    const ry = rx * 0.3;
    const rise = Math.max(r.height * 1.1, 70);
    const spin = v.dir * Math.PI * 2.5;
    const colors = [v.color, '#FFD25A', '#FF5A1F'];

    // Glowing scorch ring on the ground where the vortex starts.
    const base = document.createElement('div');
    base.style.cssText = `position:absolute;width:${rx * 2}px;height:${ry * 2}px;border-radius:50%;border:3px solid ${v.color};box-shadow:0 0 14px ${v.color},inset 0 0 12px ${v.color};background:radial-gradient(ellipse,${v.color}55,transparent 70%)`;
    Fx.place(base, ground);
    fxEl.appendChild(base);
    Fx.anim(base, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.05)', opacity: 0.8, offset: 0.75 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 1500, easing: 'ease-out' }).then(() => base.remove());

    // Three stacked rings of flames, each spinning upwards a little later.
    const waves = 3;
    const perWave = 14;
    const dur = 1100;
    const steps = 12;
    for (let w = 0; w < waves; w++) {
      for (let i = 0; i < perWave; i++) {
        const a0 = (Math.PI * 2 * i) / perWave + w * 0.4;
        const size = 14 + v.power * 10 + Math.random() * 6;
        const flame = document.createElement('div');
        const c = colors[(i + w) % colors.length];
        flame.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:50% 0 50% 50%;background:radial-gradient(circle at 60% 40%,#fff,${c} 45%,${c}00 80%);filter:drop-shadow(0 0 4px ${c})`;
        Fx.place(flame, ground);
        fxEl.appendChild(flame);
        const frames: Keyframe[] = [];
        for (let k = 0; k <= steps; k++) {
          const t = k / steps;
          const a = a0 + spin * t;
          const front = Math.sin(a) > 0;
          const x = Math.cos(a) * rx * (1 - t * 0.25);
          const y = Math.sin(a) * ry - t * rise;
          const scale = (1 - t * 0.55) * (front ? 1 : 0.7);
          const fade = Math.min(1, t * 6, (1 - t) * 3);
          frames.push({
            transform: `translate(${x}px,${y}px) rotate(-45deg) scale(${scale})`,
            opacity: fade * (front ? 1 : 0.55)
          });
        }
        Fx.anim(flame, frames, { duration: dur, easing: 'linear', delay: w * 180 }).then(() => flame.remove());
      }
    }

    // The target flickers while it is engulfed.
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.flash(targetEl, v.color, 0.45), 200 + i * 280);
    await Fx.wait(dur + (waves - 1) * 180);
  }
}
