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
    freezedry: (refs, _launch, target) => IceMoveAnimations.playFreezeDry(refs, target),
    icebeam: (refs, launch, target) => IceMoveAnimations.playIceBeam(refs, launch, target),
    hail: (refs) => IceMoveAnimations.playHail(refs),
    haze: (refs) => IceMoveAnimations.playHaze(refs)
  };

  /**
   * Freeze-Dry, after the XY animation: the user glows a warm orange
   * (0-0.5 s) while ice shards swirl in round the target (0.35-0.95 s). The
   * target turns white with sparkles (from 0.95 s) and a faceted ice crystal
   * closes round it (1.15-1.5 s). A white flash at 1.65 s, then the crystal
   * shatters into a ring of snowflakes and flying ice chunks as the target
   * thaws (to ~2.35 s).
   */
  private static async playFreezeDry(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const r = Fx.rect(targetEl);

    const warm = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(3) hue-rotate(-20deg) brightness(1.15)', offset: 0.5 },
      { filter: 'none' }
    ], { duration: 500, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(350);

    // Ice shards swirl in round the target.
    const rad = Math.max(r.width * 0.8, 60);
    const shards: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const shard = FxGlyphs.iceShard(8 + Math.random() * 6);
      Fx.place(shard, target);
      fxEl.appendChild(shard);
      const phase = (Math.PI * 2 * i) / 10;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const a = phase + t * Math.PI * 1.5;
        const d = rad * (1 - t * 0.7);
        frames.push({ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.7}px) rotate(${t * 360}deg)`, opacity: t === 0 ? 0 : t === 1 ? 0 : 1 });
      }
      shards.push(Fx.anim(shard, frames, { duration: 450, delay: i * 15, easing: 'ease-in' }).then(() => shard.remove()));
    }
    await Promise.all([warm, ...shards]);

    // The target turns white with sparkles.
    const white = 'grayscale(1) brightness(1.8)';
    const effects: Promise<unknown>[] = [];
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#ffffff');
      Fx.place(star, { x: target.x + (Math.random() * 2 - 1) * r.width * 0.5, y: target.y + (Math.random() * 2 - 1) * r.height * 0.5 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(0)', opacity: 0 }], {
          duration: 400,
          delay: Math.random() * 250,
          easing: 'ease-out'
        }).then(() => star.remove())
      );
    }
    const freeze = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: white, offset: 0.2 },
      { filter: white, offset: 0.8 },
      { filter: 'none' }
    ], { duration: 1400, easing: 'linear', fill: 'none' });
    await Fx.wait(200);

    // The ice crystal closes round the target.
    const size = Math.max(r.height * 1.2, 90);
    const crystal = IceMoveAnimations.iceCrystal(size);
    Fx.place(crystal, target);
    fxEl.appendChild(crystal);
    await Fx.anim(crystal, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, easing: 'ease-out', fill: 'forwards' });
    await Fx.wait(150);

    // Flash, then the crystal shatters into snowflakes and ice chunks.
    Fx.screenWash(screenFxEl, '#FFFFFFdd', 50, 120, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.shake(targetEl, 5);
    crystal.remove();
    for (let i = 0; i < 12; i++) {
      const flake = document.createElement('div');
      const s = 14 + Math.random() * 8;
      flake.textContent = '❄';
      flake.style.cssText = `width:${s}px;height:${s}px;pointer-events:none;text-align:center;font:${s}px/${s}px sans-serif;color:#ffffff;text-shadow:0 0 4px #9CD6FF`;
      Fx.place(flake, target);
      fxEl.appendChild(flake);
      const ang = (Math.PI * 2 * i) / 12;
      const d = size * 0.6;
      effects.push(
        Fx.anim(flake, [
          { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1) rotate(90deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(ang) * d * 1.2}px,${Math.sin(ang) * d * 1.2}px) scale(.8) rotate(150deg)`, opacity: 0 }
        ], { duration: 650, easing: 'ease-out' }).then(() => flake.remove())
      );
    }
    for (let i = 0; i < 8; i++) {
      const chunk = FxGlyphs.iceChunk();
      Fx.place(chunk, target);
      fxEl.appendChild(chunk);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.6 + Math.random() * 0.5);
      effects.push(
        Fx.anim(chunk, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - 20}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-out' }).then(() => chunk.remove())
      );
    }
    await Promise.all([freeze, ...effects]);
  }

  /** A faceted, see-through ice crystal `size` px tall, with light facet lines. */
  private static iceCrystal(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${size * 0.85}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 6px #CFF0FF)`;
    el.innerHTML =
      '<svg viewBox="0 0 85 100" width="100%" height="100%" style="display:block">' +
      '<polygon points="42,2 72,14 83,48 70,86 42,98 14,86 2,48 13,14" fill="#DDF3FF66" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M42 2 L42 98 M13 14 L70 86 M72 14 L14 86 M2 48 L83 48 M42 2 L2 48 L42 98 L83 48 Z" stroke="#ffffffaa" stroke-width="1" fill="none"/>' +
      '<polygon points="42,2 72,14 42,48 13,14" fill="#ffffff55"/></svg>';
    return el;
  }

  /**
   * Hail: the scene darkens to a cold grey-blue (0-0.3 s), then a storm of
   * large see-through hailstones pelts down at a slant over everything while
   * white sparkles twinkle (0.3-1.9 s); the scene clears (~1.9-2.25 s).
   */
  private static async playHail(refs: BattleStageRefs) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const dim = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 40%,#46525E,#1C2430 60%,#0C1018)');
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    const storm = 1600;
    const done: Promise<void>[] = [];
    for (let i = 0; i < 44; i++) {
      const size = 10 + Math.random() * 16;
      const stone = IceMoveAnimations.hailstone(size);
      const x0 = Math.random() * (W + H * 0.4) - H * 0.2;
      const y1 = H * (0.35 + Math.random() * 0.65);
      const drift = -(y1 + size) * 0.35;
      stone.style.left = `${x0}px`;
      stone.style.top = `${-size * 2}px`;
      fxEl.appendChild(stone);
      const dur = 380 + Math.random() * 220;
      done.push(
        Fx.anim(stone, [
          { transform: 'translate(0,0)', opacity: 0.85 },
          { transform: `translate(${drift}px,${y1 + size}px)`, opacity: 0.85, offset: 0.9 },
          { transform: `translate(${drift * 1.05}px,${y1 + size * 1.1}px) scale(.6)`, opacity: 0 }
        ], { duration: dur, easing: 'linear', delay: Math.random() * (storm - dur), fill: 'backwards' }).then(() => stone.remove())
      );
    }
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#ffffff');
      Fx.place(star, { x: Math.random() * W, y: Math.random() * H });
      fxEl.appendChild(star);
      done.push(
        Fx.anim(star, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 400, easing: 'ease-in-out', delay: Math.random() * (storm - 400), fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all(done);

    await Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /** A large see-through hailstone: a pale blue-white ball with a bright highlight and a frosty rim. */
  private static hailstone(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 32% 30%,#ffffff 0 14%,#EAF6FFaa 30%,#B8DCF455 62%,#DDF0FFcc 88%,#ffffff00 100%);box-shadow:0 0 3px #ffffff99`;
    return el;
  }

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
    const r = Fx.rect(targetEl);
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
    const r = Fx.rect(targetEl);
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
