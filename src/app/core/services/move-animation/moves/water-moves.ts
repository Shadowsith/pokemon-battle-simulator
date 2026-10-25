import { Point, BattleStageRefs, BubbleStyle, MoveAnimRegistry } from '../animation.types';
import { BUBBLE_DRIFT, BUBBLE_BEAM, DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Water-type moves. */
export class WaterMoveAnimations {
  /** Hand-made Water move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bubble: (refs, launch, target) => WaterMoveAnimations.playBubbles(refs, launch, target, BUBBLE_DRIFT),
    bubblebeam: (refs, launch, target) => WaterMoveAnimations.playBubbles(refs, launch, target, BUBBLE_BEAM),
    crabhammer: (refs, _launch, target) => WaterMoveAnimations.playCrabhammer(refs, target),
    hydropump: (refs, launch, target) => WaterMoveAnimations.playHydroPump(refs, launch, target)
  };

  /**
   * Bubble / Bubble Beam: see-through water bubbles travel to the target,
   * gather around it, then pop one after another. The style sets how many,
   * how fast and how loosely they fly (a slow drift or a tight beam).
   */
  private static async playBubbles(refs: BattleStageRefs, launch: Point, target: Point, style: BubbleStyle) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
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
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const water = '#7CC8FF';

    // backdrop() inserts at the back, so the blue layer is made first and the dim one ends up behind it.
    const sea = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#0A2A5E,#14508F 35%,#1D63A8 50%,#14508F 65%,#0A2A5E);opacity:0');
    for (let i = 0; i < 30; i++) {
      const len = W * (0.15 + Math.random() * 0.35);
      const h = 2 + Math.random() * 5;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${h}px;border-radius:${h}px;background:linear-gradient(90deg,transparent,${Math.random() < 0.5 ? '#5FA8E0' : '#9CD6FF'},transparent);opacity:${0.35 + Math.random() * 0.45}`;
      sea.appendChild(streak);
      streak.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px)` },
          { transform: `translateX(${dir > 0 ? W : -len}px)` }
        ],
        { duration: 700 + Math.random() * 700, delay: -Math.random() * 1400, iterations: Infinity, easing: 'linear' }
      );
    }
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
    const r = targetEl.getBoundingClientRect();
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
}
