import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Ice-type moves. */
export class IceMoveAnimations {
  /** Hand-made Ice move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    aurorabeam: (refs, launch, target) => IceMoveAnimations.playAuroraBeam(refs, launch, target),
    icepunch: (refs, _launch, target) => FxEffects.playElementalPunch(refs, target, 'ice', '#9CD6FF', () => FxGlyphs.iceChunk()),
    blizzard: (refs, launch, target) => IceMoveAnimations.playBlizzard(refs, launch, target),
    icebeam: (refs, launch, target) => IceMoveAnimations.playIceBeam(refs, launch, target),
    haze: (refs) => IceMoveAnimations.playHaze(refs)
  };

  /**
   * Haze: a murky dark green haze rolls in over the whole scene, drifts
   * slowly for a moment, then clears.
   */
  private static async playHaze(refs: BattleStageRefs) {
    const { fieldEl } = refs;
    const haze = Fx.backdrop(fieldEl, 'background:radial-gradient(ellipse at 50% 55%,#2F4A3A,#16241C 60%,#0A120E)');
    // Soft, darker and lighter cloud banks drift across on top of the base tint.
    const clouds = document.createElement('div');
    clouds.style.cssText =
      'position:absolute;inset:-20% -40%;background:' +
      'radial-gradient(ellipse 30% 22% at 20% 30%,#5C7A5Acc,#5C7A5A00),' +
      'radial-gradient(ellipse 35% 25% at 60% 70%,#0A1410dd,#0A141000),' +
      'radial-gradient(ellipse 28% 20% at 80% 25%,#4A6A50bb,#4A6A5000),' +
      'radial-gradient(ellipse 32% 24% at 40% 85%,#3E5A46aa,#3E5A4600)';
    haze.appendChild(clouds);
    const total = 2000;
    Fx.anim(clouds, [{ transform: 'translateX(-6%)' }, { transform: 'translateX(6%)' }], { duration: total, easing: 'ease-in-out' });
    await Fx.anim(haze, [
      { opacity: 0 },
      { opacity: 0.95, offset: 0.2 },
      { opacity: 0.95, offset: 0.75 },
      { opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' });
    haze.remove();
  }

  /**
   * Blizzard: the scene whites out under a snowy backdrop and a light fog,
   * dense snow and wind gusts blow towards the target, and ice crystals form
   * on it while it shakes.
   */
  private static async playBlizzard(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dir = target.x >= launch.x ? 1 : -1;
    const total = 2200;
    const fade: Keyframe[] = [
      { opacity: 0 },
      { opacity: 1, offset: 0.12 },
      { opacity: 1, offset: 0.85 },
      { opacity: 0 }
    ];

    const bg = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#C9CCD6,#E9EBF1 45%,#D4D7E0)');
    const bgDone = Fx.anim(bg, fade, { duration: total, easing: 'linear' }).then(() => bg.remove());

    // Fog over sprites too, so the whole scene looks snowed in. Snow and gusts live inside it.
    const storm = document.createElement('div');
    storm.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    const fog = document.createElement('div');
    fog.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,#F4F6FA55,#DADDE699)';
    storm.appendChild(fog);
    fxEl.appendChild(storm);

    // Snowflakes blow across the field at an angle, wobbling as they go.
    for (let i = 0; i < 80; i++) {
      const s = 2 + Math.random() * 6;
      const flake = document.createElement('div');
      flake.style.cssText = `position:absolute;left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:#fff;box-shadow:0 0 ${s}px #ffffffcc;opacity:${0.6 + Math.random() * 0.4}`;
      storm.appendChild(flake);
      const y0 = Math.random() * H * 1.2 - H * 0.3;
      const drop = H * (0.25 + Math.random() * 0.3);
      const wob = 6 + Math.random() * 12;
      const xs = dir > 0 ? [-20, W + 20] : [W + 20, -20];
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        frames.push({
          transform: `translate(${xs[0] + (xs[1] - xs[0]) * t}px,${y0 + drop * t + Math.sin(t * Math.PI * 3) * wob}px)`
        });
      }
      flake.animate(frames, {
        duration: 700 + Math.random() * 700,
        delay: -Math.random() * 1400,
        iterations: Infinity,
        easing: 'linear'
      });
    }
    // Long faint wind gusts.
    for (let i = 0; i < 10; i++) {
      const len = W * (0.25 + Math.random() * 0.35);
      const gust = document.createElement('div');
      gust.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${2 + Math.random() * 3}px;border-radius:3px;background:linear-gradient(90deg,transparent,#ffffffcc,transparent);transform-origin:left center`;
      storm.appendChild(gust);
      gust.animate(
        [
          { transform: `translateX(${dir > 0 ? -len : W}px) rotate(${dir * 12}deg)` },
          { transform: `translateX(${dir > 0 ? W : -len}px) rotate(${dir * 12}deg)` }
        ],
        { duration: 450 + Math.random() * 350, delay: -Math.random() * 800, iterations: Infinity, easing: 'linear' }
      );
    }
    const stormDone = Fx.anim(storm, fade, { duration: total, easing: 'linear' }).then(() => storm.remove());

    // Ice crystals build up on the target while it is battered.
    const r = targetEl.getBoundingClientRect();
    const spread = Math.max(r.width * 0.5, 30);
    for (let i = 0; i < 12; i++) {
      const shard = FxGlyphs.iceShard(10 + Math.random() * 10);
      Fx.place(shard, {
        x: target.x + (Math.random() * 2 - 1) * spread,
        y: target.y + (Math.random() * 2 - 1) * spread * 0.8
      });
      fxEl.appendChild(shard);
      Fx.anim(shard, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 1, offset: 0.3 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 0.9, offset: 0.8 },
        { transform: 'scale(.6)', opacity: 0 }
      ], { duration: 900, easing: 'ease-out', delay: 500 + Math.random() * 700 }).then(() => shard.remove());
    }
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, '#9CD6FF', 0.5);
        Fx.shake(targetEl, 4);
      }, 450 + i * 300);
    }

    await Promise.all([bgDone, stormDone]);
  }

  /**
   * Ice Beam: a light blue beam with a white core shoots from the caster to
   * the target and flickers while frosty sparkles break off along it. Ice
   * crystals burst on the target, which turns icy blue.
   */
  private static async playIceBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const ice = '#9CD6FF';
    const deep = '#5FA8E0';
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Unit vector across the beam, to scatter sparkles off its sides.
    const nx = -dy / dist;
    const ny = dx / dist;
    const thick = 14;
    const grow = 240;
    const hold = 950;
    const fadeOut = 260;
    const total = grow + hold + fadeOut;

    // Beam: soft light-blue glow around a white core, shooting out from the caster.
    const beam = document.createElement('div');
    beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - thick / 2}px;width:${dist}px;height:${thick}px;pointer-events:none;transform-origin:0 50%;border-radius:${thick}px;background:linear-gradient(180deg,transparent,${ice}bb 22%,#fff 42%,#fff 58%,${ice}bb 78%,transparent);box-shadow:0 0 10px ${ice},0 0 22px ${deep}aa`;
    fxEl.appendChild(beam);
    const rot = `rotate(${angle}deg)`;
    const frames: Keyframe[] = [{ transform: `${rot} scale(0,1)`, opacity: 1, offset: 0 }];
    const flickers = 10;
    for (let k = 0; k <= flickers; k++) {
      frames.push({
        transform: `${rot} scale(1,${k % 2 ? 0.75 : 1.2})`,
        opacity: 1,
        offset: (grow + (k / flickers) * hold) / total
      });
    }
    frames.push({ transform: `${rot} scale(1,.1)`, opacity: 0, offset: 1 });
    const beamDone = Fx.anim(beam, frames, { duration: total, easing: 'linear' }).then(() => beam.remove());

    // Glowing flare where the beam hits.
    const flare = document.createElement('div');
    flare.style.cssText = `position:absolute;width:44px;height:44px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,${ice} 45%,transparent 72%)`;
    Fx.place(flare, target);
    fxEl.appendChild(flare);
    Fx.anim(flare, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.25 },
      { transform: 'scale(.9)', opacity: 0.9, offset: 0.5 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.75 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: hold + fadeOut, easing: 'ease-in-out', delay: grow }).then(() => flare.remove());

    // Frosty sparkles and little crystals break off along the beam and drift away from it.
    for (let i = 0; i < 28; i++) {
      const t = Math.random();
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = side * (4 + Math.random() * 8);
      const drift = side * (10 + Math.random() * 18);
      const p = i % 3 ? FxGlyphs.sparkStar(6 + Math.random() * 7, i % 2 ? '#fff' : ice) : FxGlyphs.iceShard(5 + Math.random() * 5);
      Fx.place(p, { x: launch.x + dx * t + nx * off, y: launch.y + dy * t + ny * off });
      fxEl.appendChild(p);
      Fx.anim(p, [
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${nx * drift * 0.4}px,${ny * drift * 0.4}px) scale(1.1) rotate(60deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${nx * drift}px,${ny * drift}px) scale(.2) rotate(140deg)`, opacity: 0 }
      ], { duration: 480 + Math.random() * 220, easing: 'ease-out', delay: grow * t + Math.random() * hold * 0.8 }).then(() => p.remove());
    }

    // Impact: the target turns icy blue and ice crystals form on it while it shakes.
    await Fx.wait(grow);
    targetEl.style.filter = `sepia(1) saturate(2.5) hue-rotate(165deg) brightness(1.2) drop-shadow(0 0 6px ${ice})`;
    const r = targetEl.getBoundingClientRect();
    const spread = Math.max(r.width * 0.45, 26);
    for (let i = 0; i < 10; i++) {
      const shard = FxGlyphs.iceShard(9 + Math.random() * 9);
      Fx.place(shard, {
        x: target.x + (Math.random() * 2 - 1) * spread,
        y: target.y + (Math.random() * 2 - 1) * spread * 0.8
      });
      fxEl.appendChild(shard);
      Fx.anim(shard, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 1, offset: 0.3 },
        { transform: `scale(1) rotate(${Math.random() * 60 - 30}deg)`, opacity: 0.9, offset: 0.8 },
        { transform: 'scale(.6)', opacity: 0 }
      ], { duration: 800, easing: 'ease-out', delay: Math.random() * (hold - 300) }).then(() => shard.remove());
    }
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.shake(targetEl, 4), i * 240);
    await beamDone;
    targetEl.style.filter = '';
    Fx.flash(targetEl, ice, 0.5);
    await Fx.wait(220);
  }

  /**
   * Aurora Beam: over a darkened backdrop, a tight stream of rainbow rings
   * flies from the caster to the target, each ring facing along the beam.
   */
  private static async playAuroraBeam(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Unit vector across the beam, for a slight corkscrew wobble.
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const rings = 34;
    const gap = 24;
    const travel = 420;
    const steps = 6;
    const flights: Promise<void>[] = [];
    for (let i = 0; i < rings; i++) {
      const hue = (i * 37) % 360;
      const color = `hsl(${hue},100%,62%)`;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;width:12px;height:38px;border-radius:50%;pointer-events:none;border:3px solid ${color};box-shadow:0 0 6px ${color},inset 0 0 4px ${color}`;
      Fx.place(ring, launch);
      fxEl.appendChild(ring);
      const phase = i * 0.9;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wob = Math.sin(phase + t * Math.PI * 2) * 5;
        frames.push({
          transform: `translate(${dx * t + nx * wob}px,${dy * t + ny * wob}px) rotate(${angle}deg) scale(${0.5 + t * 0.7})`,
          opacity: t === 0 ? 0 : t === 1 ? 0.2 : 1
        });
      }
      flights.push(
        Fx.anim(ring, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          ring.remove();
          if (i % 4 === 0) Fx.flash(targetEl, color, 0.45);
          if (i % 8 === 0) Fx.shake(targetEl, 3);
        })
      );
    }
    await Promise.all(flights);
    Fx.flash(targetEl, '#9CD6FF', 0.6);
    await Fx.wait(200);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    dim.remove();
  }
}
