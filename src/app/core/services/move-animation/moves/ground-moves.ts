import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Ground-type moves. */
export class GroundMoveAnimations {
  /** Hand-made Ground move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    boneclub: (refs, launch, target, v) => GroundMoveAnimations.playBoneClub(refs, launch, target, v),
    bonemerang: (refs, launch, target, v) => GroundMoveAnimations.playBonemerang(refs, launch, target, v),
    dig: (refs, _launch, target) => GroundMoveAnimations.playDigUp(refs, target),
    earthquake: (refs) => GroundMoveAnimations.playEarthquake(refs),
    landswrath: (refs, launch, target) => GroundMoveAnimations.playLandsWrath(refs, launch, target),
    precipiceblades: (refs, _launch, target) => GroundMoveAnimations.playPrecipiceBlades(refs, target),
    spikes: (refs, launch) => GroundMoveAnimations.playSpikes(refs, launch)
  };

  /** Turn-1 animations of two-turn Ground moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    dig: (refs) => GroundMoveAnimations.playDigDown(refs)
  };

  /**
   * Land's Wrath, after the XY animation: the scene goes black (0-0.25 s) and
   * golden rings swirl out over the ground round the user while golden light
   * rises from it (0.25-1.25 s). Then the ground glows gold across the whole
   * field and a curtain of golden light streaks shoots up over the target's
   * side, battering it (1.25-2.35 s), before everything fades (to ~2.7 s).
   */
  private static async playLandsWrath(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const lFoot = Fx.footOf(launchEl, fieldEl);
    const tFoot = Fx.footOf(targetEl, fieldEl);

    const dark = Fx.backdrop(fieldEl, 'background:#050402');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);

    // Golden rings swirl over the ground round the user; golden light rises off it.
    const charge: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(1.2) drop-shadow(0 0 8px #FFD030)', offset: 0.5 },
        { filter: 'none' }
      ], { duration: 750, easing: 'ease-in-out', fill: 'none' })
    ];
    const ringW = Math.max(lr.width * 1.6, 110);
    for (const [delay, k] of [[0, 0.6], [150, 0.85], [300, 1.1]] as const) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${ringW * k}px;height:${ringW * k * 0.32}px;border-radius:50%;pointer-events:none;border:3px solid #FFD640;border-right-color:#FFD64000;box-shadow:0 0 10px #FFB020,inset 0 0 8px #FFB020`;
      Fx.place(ring, lFoot);
      layer.appendChild(ring);
      charge.push(
        Fx.anim(ring, [
          { transform: 'scale(.4)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.35)', opacity: 0 }
        ], { duration: 600, delay, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    for (let i = 0; i < 10; i++) {
      const h = lr.height * (0.8 + Math.random() * 0.8);
      const ray = GroundMoveAnimations.goldRay(h, 3 + Math.random() * 3);
      ray.style.left = `${lFoot.x + (Math.random() * 2 - 1) * ringW * 0.35}px`;
      ray.style.top = `${lFoot.y - h}px`;
      layer.appendChild(ray);
      charge.push(GroundMoveAnimations.riseRay(ray, 450, 150 + Math.random() * 400));
    }
    await Promise.all(charge);

    // The ground glows gold across the field and a curtain of light streaks shoots up on the target's side.
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;left:0;right:0;top:${tFoot.y - H * 0.35}px;bottom:0;background:linear-gradient(180deg,#FFB02000,#C8800A88 45%,#FFC83Acc)`;
    dark.appendChild(glow);
    const curtain = 1100;
    const effects: Promise<void>[] = [
      Fx.anim(glow, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: curtain, easing: 'linear' }),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(.7) sepia(.6) drop-shadow(0 0 6px #FFC030)', offset: 0.2 },
        { filter: 'brightness(.7) sepia(.6) drop-shadow(0 0 6px #FFC030)', offset: 0.7 },
        { filter: 'none' }
      ], { duration: curtain, easing: 'linear', fill: 'none' })
    ];
    const span = Math.max(tr.width * 4, W * 0.6);
    for (let i = 0; i < 44; i++) {
      const x = target.x + (Math.random() * 2 - 1) * span * 0.5;
      const base = tFoot.y + (Math.random() * 2 - 1) * 14;
      const h = Math.max(tr.height, 60) * (1 + Math.random() * 1.8);
      const ray = GroundMoveAnimations.goldRay(h, 3 + Math.random() * 5);
      ray.style.left = `${x}px`;
      ray.style.top = `${base - h}px`;
      layer.appendChild(ray);
      effects.push(GroundMoveAnimations.riseRay(ray, 380 + Math.random() * 200, Math.random() * (curtain - 500)));
    }
    for (const at of [0, 300, 600]) setTimeout(() => Fx.shake(targetEl, 6), at);
    Fx.shakeField(fieldEl, 0.6);
    await Promise.all(effects);

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dark.remove();
    layer.remove();
  }

  /** A thin vertical golden light streak `h` px tall, brightest at its foot. */
  private static goldRay(h: number, w: number): HTMLElement {
    const ray = document.createElement('div');
    ray.style.cssText = `position:absolute;width:${w}px;height:${h}px;margin-left:${-w / 2}px;transform-origin:50% 100%;pointer-events:none;border-radius:${w}px;background:linear-gradient(0deg,#FFF6C0,#FFD040 35%,#FFB02000);box-shadow:0 0 6px #FFB020`;
    return ray;
  }

  /** A light streak shoots up from the ground, flickers and fades, then is removed. */
  private static riseRay(ray: HTMLElement, duration: number, delay: number): Promise<void> {
    return Fx.anim(ray, [
      { transform: 'scaleY(0)', opacity: 1 },
      { transform: 'scaleY(1)', opacity: 1, offset: 0.35 },
      { transform: 'scaleY(1.05)', opacity: 0.6, offset: 0.6 },
      { transform: 'scaleY(1.1)', opacity: 0 }
    ], { duration, delay, easing: 'ease-out' }).then(() => ray.remove());
  }

  /**
   * Precipice Blades, after the ORAS animation: the scene goes dark and a
   * glowing lava floor wells up (0-0.5 s). Jagged orange rock blades thrust up
   * out of the ground across the target's side (0.4-1.0 s). The target
   * erupts in a fiery blast with flying rocks while a red crystal blade spears
   * up through it (1.0-1.5 s), then grey smoke rolls over everything and the
   * scene clears (to ~2.6 s).
   */
  private static async playPrecipiceBlades(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);

    // Dark scene with a lava glow welling up from the ground line.
    const dark = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const lava = document.createElement('div');
    lava.style.cssText =
      `position:absolute;left:0;right:0;top:${foot.y - H * 0.25}px;bottom:0;` +
      'background:linear-gradient(180deg,#FF902000,#FF9A28aa 25%,#FFC040 55%,#FFE070)';
    dark.appendChild(lava);
    Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    Fx.anim(lava, [{ opacity: 0, transform: 'translateY(30%)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 450, easing: 'ease-out' });
    await Fx.wait(400);

    // Rock blades thrust up across the target's side, the nearest ones tallest.
    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);
    const blades: HTMLElement[] = [];
    const rises: Promise<void>[] = [];
    const count = 9;
    const span = Math.max(r.width * 3, W * 0.45);
    for (let i = 0; i < count; i++) {
      const x = foot.x + ((i / (count - 1)) * 2 - 1) * span * 0.5 + (Math.random() * 2 - 1) * 10;
      // Skip the target's own spot so it stays in view.
      if (Math.abs(x - foot.x) < r.width * 0.3) continue;
      const near = Math.random() < 0.4;
      const h = Math.max(r.height, 60) * (near ? 1.4 + Math.random() * 0.5 : 0.7 + Math.random() * 0.5);
      const w = h * (0.28 + Math.random() * 0.12);
      const blade = GroundMoveAnimations.rockBlade(w, h);
      const y = foot.y + (near ? 18 + Math.random() * 14 : -6 + Math.random() * 10);
      blade.style.left = `${x - w / 2}px`;
      blade.style.top = `${y - h}px`;
      blade.style.zIndex = near ? '2' : '0';
      layer.appendChild(blade);
      blades.push(blade);
      rises.push(
        Fx.anim(blade, [
          { transform: 'translateY(40%) scaleY(0)' },
          { transform: 'translateY(-4%) scaleY(1.04)', offset: 0.7 },
          { transform: 'translateY(0) scaleY(1)' }
        ], { duration: 260, delay: Math.random() * 300, easing: 'ease-out' })
      );
    }
    Fx.shakeField(fieldEl, 0.5);
    await Promise.all(rises);
    await Fx.wait(150);

    // The blast: fire, flying rocks and a red crystal spearing up through the target.
    const size = Math.max(r.width * 1.4, 100);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const fire = FxGlyphs.firePuff(size * (0.5 + Math.random() * 0.4));
      Fx.place(fire, { x: target.x + (Math.random() * 2 - 1) * size * 0.35, y: foot.y - Math.random() * r.height * 0.6 });
      fire.style.zIndex = '1';
      layer.appendChild(fire);
      effects.push(
        Fx.anim(fire, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.3 },
          { transform: 'translateY(-14px) scale(1.25)', opacity: 0 }
        ], { duration: 600, delay: i * 40, easing: 'ease-out' }).then(() => fire.remove())
      );
    }
    for (let i = 0; i < 8; i++) {
      const rock = FxGlyphs.rockChunk(8 + Math.random() * 10);
      rock.style.filter = 'brightness(.55) saturate(.6)';
      rock.style.zIndex = '2';
      Fx.place(rock, { x: target.x, y: foot.y - r.height * 0.3 });
      layer.appendChild(rock);
      const ang = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.2;
      const d = size * (0.6 + Math.random() * 0.5);
      effects.push(
        Fx.anim(rock, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d * 1.2}px,${Math.sin(ang) * d + 30}px) rotate(${Math.random() * 540}deg)`, opacity: 0 }
        ], { duration: 650, easing: 'ease-out' }).then(() => rock.remove())
      );
    }
    const crystalH = Math.max(r.height * 1.6, 110);
    const crystal = GroundMoveAnimations.crystalBlade(crystalH * 0.3, crystalH);
    crystal.style.left = `${target.x + r.width * 0.15 - crystalH * 0.15}px`;
    crystal.style.top = `${foot.y + 10 - crystalH}px`;
    crystal.style.zIndex = '3';
    layer.appendChild(crystal);
    const crystalDone = Fx.anim(crystal, [
      { transform: 'translateY(60%) scaleY(0)', opacity: 1 },
      { transform: 'translateY(0) scaleY(1)', opacity: 1, offset: 0.12 },
      { transform: 'translateY(0) scaleY(1)', opacity: 1, offset: 0.75 },
      { transform: 'translateY(0) scaleY(1)', opacity: 0 }
    ], { duration: 1300, easing: 'ease-out' }).then(() => crystal.remove());
    Fx.flash(targetEl, '#FFB040', 0.9);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.9);
    await Fx.wait(400);

    // Grey smoke rolls over the scene; the blades and the darkness clear away.
    const smoke: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const at: Point = { x: foot.x + ((i / 4) * 2 - 1) * span * 0.5, y: foot.y - r.height * (0.2 + Math.random() * 0.3) };
      smoke.push(Fx.wait(i * 60).then(() => FxEffects.smokePuff(layer, at, Math.max(r.width * 1.6, 130), ['#8A8A90', '#5A5A62'])));
    }
    const clear = Promise.all(blades.map((b) => Fx.anim(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 500, delay: 250, easing: 'ease-in' })));
    const fadeDark = Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 300, easing: 'ease-in' });
    await Promise.all([...effects, ...smoke, crystalDone, clear, fadeDark]);
    dark.remove();
    layer.remove();
  }

  /** A tall jagged rock blade `w` × `h` px, orange-brown with dark cracks, its tip leaning a little. */
  private static rockBlade(w: number, h: number): HTMLElement {
    const lean = (Math.random() * 2 - 1) * 12;
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;transform-origin:50% 100%;filter:drop-shadow(0 0 4px #FF902088)`;
    el.innerHTML =
      '<svg viewBox="0 0 40 100" width="100%" height="100%" preserveAspectRatio="none" style="display:block;overflow:visible">' +
      `<path d="M2 100 L8 46 L${20 + lean} 0 L30 38 L38 100 Z" fill="#C8783C" stroke="#4A2410" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<path d="M${20 + lean} 0 L30 38 L38 100 L24 100 Z" fill="#8E4E22"/>` +
      `<path d="M14 60 L20 48 L17 34 M26 80 L30 66" stroke="#4A2410" stroke-width="1.2" fill="none"/>` +
      '<path d="M2 100 L38 100" stroke="#FFD060" stroke-width="3"/></svg>';
    return el;
  }

  /** A slim glowing red crystal spike `w` × `h` px, its point upward. */
  private static crystalBlade(w: number, h: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;transform-origin:50% 100%;filter:drop-shadow(0 0 8px #FF3060)`;
    el.innerHTML =
      '<svg viewBox="0 0 30 100" width="100%" height="100%" preserveAspectRatio="none" style="display:block">' +
      '<path d="M2 100 L15 0 L28 100 Z" fill="#E0204A"/>' +
      '<path d="M15 0 L28 100 L17 100 Z" fill="#9A0A2A"/>' +
      '<path d="M15 0 L8 100" stroke="#FF8AA8" stroke-width="1.5"/></svg>';
    return el;
  }

  /**
   * Spikes: small metal caltrops are tossed one after another in high arcs
   * onto the ground round the target, land with a little bounce, lie there
   * for a moment and fade.
   */
  private static async playSpikes(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const size = Math.min(Math.max(r.width * 0.22, 16), 26);
    const flight = 260;
    const count = 5;
    const lastLanding = 20 + (count - 1) * 100 + flight;

    const spikes: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const spike = GroundMoveAnimations.caltrop(size);
      Fx.place(spike, launch);
      fxEl.appendChild(spike);
      // Spread over the ground in front of and beside the target, left to right.
      const land: Point = {
        x: foot.x + ((i / (count - 1)) * 2 - 1) * Math.max(r.width * 0.6, 40) + (Math.random() * 2 - 1) * 6,
        y: foot.y + (Math.random() * 2 - 1) * 6
      };
      const dx = land.x - launch.x;
      const dy = land.y - launch.y;
      const peak = Math.max(60, Math.abs(dx) * 0.3);
      const spin = (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 180);
      const arc: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        arc.push({
          transform: `translate(${dx * t}px,${dy * t - 4 * peak * t * (1 - t)}px) rotate(${spin * t}deg)`,
          opacity: t === 0 ? 0 : 1
        });
      }
      const delay = 20 + i * 100;
      spikes.push(
        Fx.anim(spike, arc, { duration: flight, delay, easing: 'linear' })
          .then(() =>
            // Small bounce on landing, a short rest, then fade away.
            Fx.anim(spike, [
              { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg)`, opacity: 1 },
              { transform: `translate(${dx}px,${dy - 6}px) rotate(${spin}deg)`, opacity: 1, offset: 0.12 },
              { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg)`, opacity: 1, offset: 0.24 },
              { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg)`, opacity: 1, offset: 0.75 },
              { transform: `translate(${dx}px,${dy}px) rotate(${spin}deg)`, opacity: 0 }
            ], { duration: lastLanding - delay - flight + 750, easing: 'ease-out' })
          )
          .then(() => spike.remove())
      );
    }
    await Promise.all(spikes);
  }

  /** A small grey metal caltrop: three sharp prongs round a hub, seen from the side. */
  private static caltrop(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(1px 2px 1px #00000055)`;
    el.innerHTML =
      '<svg viewBox="0 0 20 20" width="100%" height="100%" style="display:block;overflow:visible">' +
      '<path d="M10 1 L12 10 L8 10 Z" fill="#B8BCC6" stroke="#4E525C" stroke-width=".7"/>' +
      '<path d="M1.5 17 L9 9 L11 12 Z" fill="#8E929C" stroke="#4E525C" stroke-width=".7"/>' +
      '<path d="M18.5 17 L11 9 L9 12 Z" fill="#A4A8B2" stroke="#4E525C" stroke-width=".7"/>' +
      '<circle cx="10" cy="10.5" r="2.2" fill="#D8DCE4" stroke="#4E525C" stroke-width=".7"/></svg>';
    return el;
  }

  /**
   * Bone Club: a spinning bone is thrown high and drops onto the target from
   * above, lands with a hit, then bounces off.
   */
  private static async playBoneClub(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl } = refs;
    const bone = FxGlyphs.boneGlyph(46);
    Fx.place(bone, launch);
    fxEl.appendChild(bone);

    // Quadratic arc: up past the target, then straight down onto its head.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const apex = { x: dx * 0.85, y: Math.min(0, dy) - 130 };
    const spin = v.dir * 360 * 3;
    const steps = 14;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      const x = 2 * u * t * apex.x + t * t * dx;
      const y = 2 * u * t * apex.y + t * t * (dy - 10);
      frames.push({ transform: `translate(${x}px,${y}px) rotate(${spin * t}deg)`, opacity: t === 0 ? 0 : 1 });
    }
    // The last quarter-turn settles upright, as it falls onto the target.
    frames[steps] = { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin + 90 * v.dir}deg)`, opacity: 1 };
    await Fx.anim(bone, frames, { duration: 760, easing: 'ease-in' });

    FxEffects.meleeGlyph(fxEl, target, { ...v, meleeStyle: 'hit', color: '#ffffff' });
    const hit = FxEffects.impact(refs, target, v, 0);
    // Bounce off and fade.
    Fx.anim(bone, [
      { transform: `translate(${dx}px,${dy - 10}px) rotate(${spin + 90 * v.dir}deg)`, opacity: 1 },
      { transform: `translate(${dx - v.dir * 30}px,${dy - 50}px) rotate(${spin + 90 * v.dir - 200 * v.dir}deg)`, opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => bone.remove());
    await hit;
    await Fx.wait(300);
  }

  /**
   * Bonemerang: like Bone Club, but the spinning bone flies out on a curve,
   * hits the target and curves back to the caster on the other side, like a
   * boomerang.
   */
  private static async playBonemerang(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const bone = FxGlyphs.boneGlyph(46);
    Fx.place(bone, launch);
    fxEl.appendChild(bone);

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy) || 1;
    // Perpendicular bulge: out along one side of the line, back along the other.
    const bulge = Math.min(90, len * 0.35);
    const nx = (-dy / len) * bulge;
    const ny = (dx / len) * bulge;
    const out = { x: dx * 0.5 - nx, y: dy * 0.5 - ny };
    const back = { x: dx * 0.5 + nx, y: dy * 0.5 + ny };
    const turnsPerLeg = 3;

    // Quadratic Bezier from a to b through control point c, spinning as it goes.
    const leg = (a: Point, c: Point, b: Point, rot0: number, fadeIn: boolean): Keyframe[] => {
      const frames: Keyframe[] = [];
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const u = 1 - t;
        const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
        const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
        frames.push({
          transform: `translate(${x}px,${y}px) rotate(${rot0 + v.dir * 360 * turnsPerLeg * t}deg)`,
          opacity: fadeIn && t === 0 ? 0 : 1
        });
      }
      return frames;
    };
    const origin = { x: 0, y: 0 };
    const hitAt = { x: dx, y: dy };
    const midRot = v.dir * 360 * turnsPerLeg;

    await Fx.anim(bone, leg(origin, out, hitAt, 0, true), { duration: 560, easing: 'ease-in' });
    FxEffects.meleeGlyph(fxEl, target, { ...v, meleeStyle: 'hit', color: '#ffffff' });
    const hit = FxEffects.impact(refs, target, v, 0);
    await Fx.anim(bone, leg(hitAt, back, origin, midRot, false), { duration: 620, easing: 'ease-out' });
    await hit;

    // Caught: the bone disappears into the caster with a small flash.
    Fx.flash(launchEl, '#F6F3EA', 0.35);
    await Fx.anim(bone, [
      { transform: `rotate(${midRot * 2}deg) scale(1)`, opacity: 1 },
      { transform: `rotate(${midRot * 2 + v.dir * 90}deg) scale(.5)`, opacity: 0 }
    ], { duration: 160, easing: 'ease-out' });
    bone.remove();
  }

  /**
   * Earthquake: the whole field shakes fast left and right (and a little up
   * and down) while small rocks keep jumping up on both sides of the target.
   */
  private static async playEarthquake(refs: BattleStageRefs) {
    const { fieldEl, fxEl, targetEl } = refs;
    const total = 1500;

    // Field shake: quick alternating offsets, strongest in the middle.
    const beats = 30;
    const shake: Keyframe[] = [];
    for (let k = 0; k <= beats; k++) {
      const t = k / beats;
      const amp = k === 0 || k === beats ? 0 : 3 + Math.sin(t * Math.PI) * 5;
      shake.push({ transform: `translate(${k % 2 ? -amp : amp}px,${k % 3 === 0 ? amp * 0.3 : -amp * 0.25}px)` });
    }
    const quake = Fx.anim(fieldEl, shake, { duration: total, easing: 'linear', fill: 'none' });

    // Rocks pop out of the ground left and right of the target.
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const side = Math.max(r.width * 0.5, 30);
    const rocks = 16;
    for (let i = 0; i < rocks; i++) {
      const dirX = i % 2 ? 1 : -1;
      const s = 6 + Math.random() * 7;
      const rock = document.createElement('div');
      rock.style.cssText = `position:absolute;width:${s}px;height:${s * 0.85}px;pointer-events:none;clip-path:polygon(20% 0,75% 8%,100% 45%,85% 100%,15% 95%,0 40%);background:linear-gradient(135deg,#B08A5A,#6E5232 70%,#4A3622)`;
      Fx.place(rock, { x: foot.x + dirX * (side + Math.random() * side * 0.6), y: foot.y - Math.random() * 8 });
      fxEl.appendChild(rock);
      const up = 18 + Math.random() * 26;
      const drift = dirX * (4 + Math.random() * 10);
      const spin = (Math.random() * 2 - 1) * 240;
      Fx.anim(rock, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${drift * 0.5}px,${-up}px) rotate(${spin * 0.5}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${drift}px,0) rotate(${spin}deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${drift}px,0) rotate(${spin}deg)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-in-out', delay: 80 + (i / rocks) * (total - 600) }).then(() => rock.remove());
    }

    for (let i = 0; i < 4; i++) {
      setTimeout(() => Fx.flash(targetEl, '#C9A24B', 0.4), 200 + i * 320);
    }
    await quake;
  }

  /**
   * Dig, turn 1: the user wriggles down into the ground. The part below the
   * ground line is clipped away, so it sinks through the platform, while dust
   * clouds billow around it and clods of dirt are thrown up.
   */
  static async playDigDown(refs: BattleStageRefs) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = Fx.rect(el);
    const foot = Fx.footOf(el, fieldEl);
    const dur = 1000;

    GroundMoveAnimations.kickUpDirt(fxEl, foot, Math.max(r.width * 0.6, 34), dur, '#B89A5E');

    const steps = 12;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const depth = r.height * t;
      const wiggle = k === 0 || k === steps ? 0 : (k % 2 ? 1 : -1) * 4;
      frames.push({ transform: `translate(${wiggle}px,${depth}px)`, clipPath: `inset(0 0 ${depth}px 0)` });
    }
    await Fx.anim(el, frames, { duration: dur, easing: 'ease-in', fill: 'forwards' });
    el.style.opacity = '0';
  }

  /**
   * Dig, turn 2: the user bursts back up out of the ground in a cloud of dust
   * and dirt, then the target is hit and white dust specks rise around it.
   */
  private static async playDigUp(refs: BattleStageRefs, target: Point) {
    const { launchEl: el, fieldEl, fxEl, targetEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    const r = Fx.rect(el);
    const foot = Fx.footOf(el, fieldEl);

    GroundMoveAnimations.kickUpDirt(fxEl, foot, Math.max(r.width * 0.6, 34), 700, '#D8CBB0');
    await Fx.anim(el, [
      { transform: `translateY(${r.height}px)`, clipPath: `inset(0 0 ${r.height}px 0)` },
      { transform: 'translateY(-16px)', clipPath: 'inset(0 0 -40px 0)', offset: 0.6 },
      { transform: 'translateY(0)', clipPath: 'inset(0 0 -40px 0)' }
    ], { duration: 520, easing: 'ease-out', fill: 'none' });

    // Hit: the target shakes and white dust specks rise up around it.
    const tr = Fx.rect(targetEl);
    Fx.flash(targetEl, '#F6F3EA', 0.6);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.4);
    const specks: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const s = 4 + Math.random() * 6;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,#E8E4DA 60%,#C9C2B0);box-shadow:0 0 3px #ffffffaa`;
      Fx.place(d, {
        x: target.x + (Math.random() * 2 - 1) * Math.max(tr.width * 0.35, 20),
        y: target.y + Math.random() * tr.height * 0.2
      });
      fxEl.appendChild(d);
      const rise = 30 + Math.random() * 40;
      specks.push(
        Fx.anim(d, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(0,${-rise * 0.3}px) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${(Math.random() * 2 - 1) * 8}px,${-rise}px) scale(.8)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 200 }).then(() => d.remove())
      );
    }
    await Promise.all(specks);
  }

  /** Dust clouds swelling around a spot on the ground, plus clods of dirt thrown up and falling back. */
  private static kickUpDirt(fxEl: HTMLElement, foot: Point, spread: number, dur: number, dust: string) {
    for (let i = 0; i < 9; i++) {
      const s = 22 + Math.random() * 18;
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s * 0.8}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 45% 40%,${dust},${dust}cc 45%,${dust}00 72%)`;
      const side = i % 2 ? 1 : -1;
      Fx.place(puff, { x: foot.x + side * Math.random() * spread, y: foot.y - Math.random() * 10 });
      fxEl.appendChild(puff);
      Fx.anim(puff, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${side * 6}px,-6px) scale(1)`, opacity: 0.95, offset: 0.3 },
        { transform: `translate(${side * 16}px,-18px) scale(1.5)`, opacity: 0 }
      ], { duration: dur * 0.7, easing: 'ease-out', delay: Math.random() * dur * 0.4 }).then(() => puff.remove());
    }
    for (let i = 0; i < 12; i++) {
      const s = 8 + Math.random() * 8;
      const clod = document.createElement('div');
      clod.style.cssText = `position:absolute;width:${s}px;height:${s * 0.9}px;border-radius:45% 55% 50% 40%;pointer-events:none;background:radial-gradient(circle at 30% 70%,#3E3A16 0 18%,transparent 22%),radial-gradient(circle at 65% 35%,#9A9A4A,#6E6A2A 55%,#4A4618)`;
      Fx.place(clod, { x: foot.x + (Math.random() * 2 - 1) * spread * 0.6, y: foot.y - 6 });
      fxEl.appendChild(clod);
      const vx = (Math.random() * 2 - 1) * 50;
      const up = 70 + Math.random() * 70;
      const spin = (Math.random() * 2 - 1) * 300;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        // Thrown up, then pulled back down a little below where it started.
        frames.push({
          transform: `translate(${vx * t}px,${-up * 4 * t * (1 - t) + 20 * t}px) rotate(${spin * t}deg)`,
          opacity: t < 0.8 ? 1 : (1 - t) / 0.2
        });
      }
      Fx.anim(clod, frames, { duration: 700 + Math.random() * 200, easing: 'linear', delay: Math.random() * dur * 0.5 }).then(() => clod.remove());
    }
  }
}
