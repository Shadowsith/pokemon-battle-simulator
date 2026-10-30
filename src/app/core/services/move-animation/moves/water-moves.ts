import { Point, BattleStageRefs, BubbleStyle, MoveAnimRegistry, MoveVisual } from '../animation.types';
import { BUBBLE_DRIFT, BUBBLE_BEAM, DIM_BACKDROP, WATERFALL_WAVES } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Water-type moves. */
export class WaterMoveAnimations {
  /** Hand-made Water move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bubble: (refs, launch, target) => WaterMoveAnimations.playBubbles(refs, launch, target, BUBBLE_DRIFT),
    bubblebeam: (refs, launch, target) => WaterMoveAnimations.playBubbles(refs, launch, target, BUBBLE_BEAM),
    crabhammer: (refs, _launch, target) => WaterMoveAnimations.playCrabhammer(refs, target),
    hydropump: (refs, launch, target) => WaterMoveAnimations.playHydroPump(refs, launch, target),
    surf: (refs, launch, target, v) => WaterMoveAnimations.playSurf(refs, launch, target, v),
    waterfall: (refs, _launch, target) => WaterMoveAnimations.playWaterfall(refs, target)
  };

  /**
   * Surf: a curling dark blue wave - moving water inside, a white foam crest
   * throwing spray off its top - rises in front of the caster, then swells
   * huge while the field floods, rolls over to the target and crashes onto it.
   */
  private static async playSurf(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = fieldEl.getBoundingClientRect();
    const lr = launchEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();

    // 1. A wave rises in front of the caster, on its foe's side (0-0.5 s).
    const w = Math.max(lr.width * 1.3, 100);
    const h = w * 0.6;
    const wave = WaterMoveAnimations.waveGlyph(w, h, v.dir);
    const base: Point = { x: launch.x + v.dir * w * 0.45, y: lr.bottom - f.top - h / 2 };
    Fx.place(wave, base);
    fxEl.appendChild(wave);
    const spray = WaterMoveAnimations.crestSpray(fxEl, fieldEl, wave, v.dir);
    await Fx.anim(wave, [
      { transform: 'translate(0,0) scale(.7,0)', opacity: 0.7 },
      { transform: 'translate(0,0) scale(1,1.08)', opacity: 1, offset: 0.7 },
      { transform: 'translate(0,0) scale(1,1)', opacity: 1 }
    ], { duration: 450, easing: 'ease-out', fill: 'forwards' });
    await Fx.wait(120);

    // 2. The field floods while the wave swells and rolls to the target (0.57-1.3 s).
    const sea = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#081A40,#0F3274 45%,#164496 70%,#0A2458)');
    Fx.anim(sea, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    const grow = Math.max((tr.height * 1.5) / h, 1.8);
    const dx = target.x - v.dir * w * grow * 0.15 - base.x;
    const dy = tr.bottom - f.top - h / 2 - base.y;
    await Fx.anim(wave, [
      { transform: 'translate(0,0) scale(1,1)' },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45}px) scale(${grow * 0.75},${grow * 0.7})`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(${grow},${grow})` }
    ], { duration: 720, easing: 'ease-in', fill: 'forwards' });

    // 3. Crash (1.3 s): the lip falls onto the target and the wave collapses into splashes.
    spray.stop();
    Fx.anim(wave, [
      { transform: `translate(${dx}px,${dy}px) scale(${grow},${grow})`, opacity: 1 },
      { transform: `translate(${dx + v.dir * w * 0.3}px,${dy + h * 0.2}px) scale(${grow * 1.15},${grow * 0.35})`, opacity: 0 }
    ], { duration: 360, easing: 'ease-in' }).then(() => wave.remove());
    await WaterMoveAnimations.waterCrash(refs, target, SURF_SPLASH);

    await Fx.anim(sea, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    sea.remove();
  }

  /** Counter for unique SVG ids (several waves can be on screen at once). */
  private static waveId = 0;

  /**
   * A curling wave, `w` x `h` px, breaking toward `dir`: dark blue water with
   * light wave lines drifting through it and a white foam crest along its top.
   */
  private static waveGlyph(w: number, h: number, dir: 1 | -1): HTMLElement {
    const id = `surf${WaterMoveAnimations.waveId++}`;
    // Silhouette (viewBox 200 x 120, breaking to the right): a long rising back,
    // a crest curling over at the front and a hollow under the lip.
    const top = 'M0,116 C36,104 78,52 118,24 C146,10 174,8 189,25 C197,34 194,47 182,49 C172,51 168,41 159,44';
    const body = `${top} C149,48 151,74 166,120 L0,120 Z`;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;transform-origin:50% 100%;filter:drop-shadow(0 0 6px #0A245899)`;
    el.innerHTML =
      `<svg width="100%" height="100%" viewBox="0 0 200 120" preserveAspectRatio="none" style="overflow:visible;transform:scaleX(${dir})">` +
      `<defs>` +
      `<pattern id="${id}p" width="40" height="18" patternUnits="userSpaceOnUse">` +
      `<rect width="40" height="18" fill="#123A86"/>` +
      `<path d="M0,9 Q10,3 20,9 T40,9" fill="none" stroke="#3F74C8" stroke-width="2.2"/>` +
      `<path d="M0,15 Q10,11 20,15 T40,15" fill="none" stroke="#1E4FA0" stroke-width="1.6"/>` +
      `</pattern>` +
      `<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#6FA3E8" stop-opacity=".55"/><stop offset=".45" stop-color="#0A2458" stop-opacity="0"/>` +
      `<stop offset="1" stop-color="#061638" stop-opacity=".75"/></linearGradient>` +
      `<clipPath id="${id}c"><path d="${body}"/></clipPath>` +
      `</defs>` +
      `<g clip-path="url(#${id}c)"><rect class="flow" x="-40" y="0" width="280" height="120" fill="url(#${id}p)"/>` +
      `<rect width="200" height="120" fill="url(#${id}g)"/></g>` +
      `<path d="${top}" fill="none" stroke="#DDEEFF" stroke-width="9" stroke-linecap="round" opacity=".55"/>` +
      `<path d="${top}" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round"/>` +
      `</svg>`;
    // The water inside drifts forward, so the wave looks like it's rolling.
    el.querySelector<SVGElement>('.flow')?.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(40px)' }], {
      duration: 420,
      iterations: Infinity,
      easing: 'linear'
    });
    return el;
  }

  /**
   * White spray keeps flying off the top of `wave` (its crest and curling lip)
   * until stopped: droplets and short streaks thrown back and up, then falling.
   */
  private static crestSpray(fxEl: HTMLElement, fieldEl: HTMLElement, wave: HTMLElement, dir: 1 | -1): { stop: () => void } {
    const timer = setInterval(() => {
      const r = wave.getBoundingClientRect();
      const f = fieldEl.getBoundingClientRect();
      if (r.height < 4) return;
      for (let i = 0; i < 3; i++) {
        // Somewhere along the upper crest, mostly near the curling front.
        const u = 0.45 + Math.random() * 0.5;
        const x = dir > 0 ? r.left + r.width * u : r.right - r.width * u;
        const y = r.top + r.height * (0.08 + (1 - u) * 0.45) - f.top;
        const s = 3 + Math.random() * 4;
        const drop = document.createElement('div');
        const streak = Math.random() < 0.35;
        drop.style.cssText = `position:absolute;width:${s}px;height:${streak ? s * 3 : s}px;border-radius:${s}px;pointer-events:none;background:radial-gradient(circle at 35% 30%,#fff,#D8ECFF);box-shadow:0 0 4px #ffffffaa`;
        Fx.place(drop, { x: x - f.left, y });
        fxEl.appendChild(drop);
        const back = -dir * (10 + Math.random() * 30);
        const up = 14 + Math.random() * 24;
        Fx.anim(drop, [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${back * 0.6}px,${-up}px) scale(1)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${back}px,${-up * 0.3}px) scale(.5)`, opacity: 0 }
        ], { duration: 420 + Math.random() * 200, easing: 'ease-out' }).then(() => drop.remove());
      }
    }, 45);
    return { stop: () => clearInterval(timer) };
  }

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

  /**
   * Water crashing onto the target (Waterfall, Surf): blue splash bursts stack
   * up from its feet, white spray streaks shoot up and droplets fly.
   */
  private static async waterCrash(refs: BattleStageRefs, target: Point, tone: SplashTone) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const h = Math.max(r.height, 50);
    const base = { x: target.x, y: target.y + h * 0.35 };
    const blobs = 5;
    const done: Promise<void>[] = [];
    for (let i = 0; i < blobs; i++) {
      const size = Math.max(r.width * 0.55, 34) * (1 - i * 0.1);
      const blob = FxGlyphs.spikyBurst(size, tone.outer, tone.inner, '#E8F0FF');
      Fx.place(blob, { x: base.x + (Math.random() * 10 - 5), y: base.y - (i * h * 0.95) / blobs });
      fxEl.appendChild(blob);
      done.push(
        Fx.anim(blob, [
          { transform: 'translateY(20px) scale(.3) rotate(0)', opacity: 0 },
          { transform: 'translateY(0) scale(1.05) rotate(20deg)', opacity: 0.95, offset: 0.3 },
          { transform: 'translateY(-26px) scale(.8) rotate(35deg)', opacity: 0 }
        ], { duration: 560, easing: 'ease-out', delay: i * 55 }).then(() => blob.remove())
      );
      if (i % 2 === 0) setTimeout(() => Fx.shake(targetEl, 5), i * 55);
    }
    for (let i = 0; i < 9; i++) {
      const w = 3 + Math.random() * 4;
      const len = h * (0.5 + Math.random() * 0.6);
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${w}px;height:${len}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(0deg,#ffffff00,#ffffff 50%,#E8F6FF00)`;
      Fx.place(streak, { x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.5, 28), y: base.y - len / 2 });
      fxEl.appendChild(streak);
      done.push(
        Fx.anim(streak, [
          { transform: 'translateY(30px) scaleY(.3)', opacity: 0 },
          { transform: 'translateY(0) scaleY(1)', opacity: 0.95, offset: 0.35 },
          { transform: `translateY(${-h * 0.6}px) scaleY(.6)`, opacity: 0 }
        ], { duration: 520, easing: 'ease-out', delay: 40 + Math.random() * 220 }).then(() => streak.remove())
      );
    }
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 5;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${tone.outer};box-shadow:0 0 4px ${tone.inner}`;
      Fx.place(drop, { x: target.x + (Math.random() * 2 - 1) * r.width * 0.6, y: target.y + (Math.random() * 2 - 1) * h * 0.5 });
      fxEl.appendChild(drop);
      done.push(
        Fx.anim(drop, [
          { transform: 'translateY(0) scale(.4)', opacity: 0 },
          { transform: 'translateY(-10px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translateY(${-30 - Math.random() * 30}px) scale(.6)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-out', delay: Math.random() * 300 }).then(() => drop.remove())
      );
    }
    Fx.flash(targetEl, tone.flash, 0.7);
    Fx.shakeField(fieldEl, 0.4);
    await Promise.all(done);

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

    await WaterMoveAnimations.waterCrash(refs, target, WATERFALL_SPLASH);

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    black.remove();
  }
}

/** Colours of a water crash: splash burst edge / core, droplets, target flash. */
interface SplashTone {
  outer: string;
  inner: string;
  flash: string;
}

const WATERFALL_SPLASH: SplashTone = { outer: '#2F52F0', inner: '#6F8CFF', flash: '#4F7BFF' };
const SURF_SPLASH: SplashTone = { outer: '#12357A', inner: '#3F74C8', flash: '#5C8FE0' };
