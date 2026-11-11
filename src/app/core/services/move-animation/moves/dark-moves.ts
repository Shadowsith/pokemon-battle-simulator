import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';
import { NastyPlot } from './dark/nasty-plot';
import { NightSlash } from './dark/night-slash';
import { SuckerPunch } from './dark/sucker-punch';
import { Switcheroo } from './dark/switcheroo';

/** Hand-made animations for Dark-type moves (Nasty Plot, Night Slash, Sucker Punch and Switcheroo live in `dark/`). */
export class DarkMoveAnimations {
  /** Hand-made Dark move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bite: (refs, _launch, target) => DarkMoveAnimations.playBite(refs, target),
    crunch: (refs, _launch, target) => DarkMoveAnimations.playCrunch(refs, target),
    darkpulse: (refs, launch, target) => DarkMoveAnimations.playDarkPulse(refs, launch, target),
    hyperspacefury: (refs, launch, target) => DarkMoveAnimations.playHyperspaceFury(refs, launch, target),
    nastyplot: (refs, launch) => NastyPlot.play(refs, launch),
    nightslash: (refs, _launch, target, v) => NightSlash.play(refs, target, v),
    partingshot: (refs, launch, target, v) => DarkMoveAnimations.playPartingShot(refs, launch, target, v),
    suckerpunch: (refs, launch, target, v) => SuckerPunch.play(refs, launch, target, v),
    switcheroo: (refs, launch, target, v) => Switcheroo.play(refs, launch, target, v),
    taunt: (refs, launch, target, v) => DarkMoveAnimations.playTaunt(refs, launch, target, v)
  };

  /**
   * Hyperspace Fury, after the ORAS animation: the scene turns magenta and
   * golden portal rings circle the user with pink swirls (0.3-1.0 s). The
   * background melts into a swirling psychedelic pink round the target, then
   * portals pop open all round it one after another and from each a white
   * glove punches in, landing six dark purple hits in smoke (hits at
   * 1.48-2.33 s, 0.17 s apart). The scene clears and the user's Defense drops
   * (2.95 s to ~3.8 s).
   */
  private static async playHyperspaceFury(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const magenta = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${launch.x}px ${launch.y}px,#D02870,#7A0E3A 50%,#30061A)`);
    await Fx.anim(magenta, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Golden portal rings circle the user, with pink swirls.
    const orbit: Promise<void>[] = [];
    const rx = Math.max(lr.width * 0.75, 55);
    const ry = rx * 0.45;
    for (let i = 0; i < 5; i++) {
      const ring = DarkMoveAnimations.portalRing(Math.max(lr.width * 0.35, 26));
      Fx.place(ring, launch);
      fxEl.appendChild(ring);
      const phase = (Math.PI * 2 * i) / 5;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 12; k++) {
        const a = phase + (k / 12) * Math.PI * 2;
        frames.push({ transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * ry}px) scale(${0.75 + 0.25 * Math.sin(a)})`, opacity: k === 12 ? 0 : 1 });
      }
      orbit.push(Fx.anim(ring, frames, { duration: 700, easing: 'linear' }).then(() => ring.remove()));
    }
    for (const delay of [0, 200]) {
      const swirl = document.createElement('div');
      swirl.style.cssText = `width:${rx * 2.4}px;height:${ry * 2.4}px;border-radius:50%;pointer-events:none;border:4px solid #FF8AC8;border-left-color:#FF8AC800;border-bottom-color:#FF8AC800;box-shadow:0 0 8px #FF60B0`;
      Fx.place(swirl, launch);
      fxEl.appendChild(swirl);
      orbit.push(
        Fx.anim(swirl, [
          { transform: 'scale(.5) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(160deg)', opacity: 1, offset: 0.5 },
          { transform: 'scale(1.2) rotate(320deg)', opacity: 0 }
        ], { duration: 500, delay, easing: 'ease-out' }).then(() => swirl.remove())
      );
    }
    await Promise.all(orbit);

    // The psychedelic swirl round the target.
    const c = `${target.x}px ${target.y}px`;
    const psy = Fx.backdrop(
      fieldEl,
      `background:repeating-radial-gradient(circle at ${c},#E86AA0 0 18px,#F0A070 26px,#B05AC8 38px,#E86AA0 50px)`
    );
    const warp = psy.animate([{ filter: 'hue-rotate(0deg)' }, { filter: 'hue-rotate(40deg)' }, { filter: 'hue-rotate(0deg)' }], { duration: 600, iterations: Infinity });
    await Promise.all([
      Fx.anim(psy, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }),
      Fx.anim(magenta, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' })
    ]);
    magenta.remove();

    // Portals pop open round the target; a glove punches out of each.
    const hits: Promise<unknown>[] = [];
    const reach = Math.max(tr.width * 0.9, 70);
    const count = 6;
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI / 2 + (i % 2 ? 1 : -1) * (0.4 + (i / count) * 1.6);
      const at: Point = { x: target.x + Math.cos(ang) * reach, y: target.y + Math.sin(ang) * reach * 0.8 };
      hits.push(Fx.wait(i * 170).then(() => DarkMoveAnimations.portalPunch(refs, at, target)));
    }
    await Promise.all(hits);
    warp.cancel();
    await Fx.anim(psy, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    psy.remove();

    // The user's Defense drops.
    await FxEffects.statDownBubbles(refs, launch);
  }

  /** A portal opens at `at`, a white glove punches out of it into the target, and a dark hit lands in smoke. */
  private static async portalPunch(refs: BattleStageRefs, at: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const ring = DarkMoveAnimations.portalRing(Math.max(tr.width * 0.4, 30));
    Fx.place(ring, at);
    fxEl.appendChild(ring);
    await Fx.anim(ring, [{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 150, easing: 'ease-out', fill: 'forwards' });

    const glove = FxGlyphs.gloveGlyph(Math.max(tr.width * 0.3, 22));
    Fx.place(glove, at);
    fxEl.appendChild(glove);
    const dx = (target.x - at.x) * 0.8;
    const dy = (target.y - at.y) * 0.8;
    await Fx.anim(glove, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 }
    ], { duration: 130, easing: 'ease-in' });

    // The hit: purple sparks and grey smoke.
    Fx.shake(targetEl, 5);
    const hit: Point = { x: at.x + dx, y: at.y + dy };
    const sparks: Promise<unknown>[] = [FxEffects.smokePuff(fxEl, hit, Math.max(tr.width * 0.7, 50), ['#6A6A74', '#3A3A44'])];
    for (let i = 0; i < 4; i++) {
      const len = 14 + Math.random() * 14;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${len}px;height:4px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#8A40FF00,#A060FF,#E8D0FF);box-shadow:0 0 5px #8A40FF`;
      Fx.place(spark, hit);
      fxEl.appendChild(spark);
      const ang = Math.random() * 360;
      sparks.push(
        Fx.anim(spark, [
          { transform: `rotate(${ang}deg) translateX(0) scaleX(.3)`, opacity: 1 },
          { transform: `rotate(${ang}deg) translateX(${len}px) scaleX(1)`, opacity: 0 }
        ], { duration: 250, easing: 'ease-out' }).then(() => spark.remove())
      );
    }
    sparks.push(
      Fx.anim(glove, [
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 },
        { transform: 'translate(0,0) scale(.5)', opacity: 0 }
      ], { duration: 200, easing: 'ease-out' }).then(() => glove.remove()),
      Fx.anim(ring, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 200, delay: 120, easing: 'ease-in' }).then(() => ring.remove())
    );
    await Promise.all(sparks);
  }

  /** A gold-rimmed black portal ring `s` px across. */
  private static portalRing(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#050005 0 52%,#FFE070 56%,#E0A820 64%,#8A5A08 69%,#8A5A0800 72%);box-shadow:0 0 6px #FFD04088`;
    return el;
  }

  /**
   * Parting Shot, after the XY animation: black letterbox bars slide in over a
   * dark scene with speed lines while the user rears back (0-0.3 s) and yells:
   * a white jagged shout bursts from it and blasts toward the foe, flickering
   * (0.3-0.9 s). The bars and darkness clear, then a dark purple cloud gathers
   * over the target and rains violet streaks onto it (1.0-2.0 s).
   */
  private static async playPartingShot(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);

    // Dark scene with speed lines rushing toward the foe, and letterbox bars.
    const dark = Fx.backdrop(fieldEl, 'background:#0C0C10');
    FxEffects.speedLines(dark, W, H, v.dir, ['#3A3A44', '#5A6A70']);
    const bars: HTMLElement[] = [];
    for (const edge of ['top', 'bottom']) {
      const bar = document.createElement('div');
      bar.style.cssText = `position:absolute;left:0;right:0;${edge}:0;height:${H * 0.16}px;background:#000;pointer-events:none;z-index:5`;
      fxEl.appendChild(bar);
      bars.push(bar);
      Fx.anim(bar, [{ transform: `translateY(${edge === 'top' ? -100 : 100}%)` }, { transform: 'translateY(0)' }], { duration: 250, easing: 'ease-out' });
    }
    Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The user rears back for the yell (no turning).
    const original = launchEl.style.transform;
    const rear = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0) scale(1,1)` },
      { transform: `${original} translate(${-v.dir * 10}px,-6px) scale(.97,1.05)`, offset: 0.35 },
      { transform: `${original} translate(${v.dir * 6}px,0) scale(1.02,.98)`, offset: 0.55 },
      { transform: `${original} translate(0,0) scale(1,1)` }
    ], { duration: 900, easing: 'ease-out', fill: 'none' });
    await Fx.wait(300);

    // The shout: a white jagged burst grows out of the user's mouth toward the foe, flickering.
    const mouth: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y - lr.height * 0.2 };
    const size = Math.max(lr.height * 1.1, 90);
    const shout = DarkMoveAnimations.shoutBurst(size);
    Fx.place(shout, mouth);
    fxEl.appendChild(shout);
    const dx = (target.x - mouth.x) * 0.55;
    const dy = (target.y - mouth.y) * 0.55;
    const flick: Keyframe[] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      flick.push({
        transform: `translate(${dx * t}px,${dy * t}px) scale(${0.3 + t * 0.9}) rotate(${k % 2 ? 4 : -4}deg)`,
        opacity: k === 8 ? 0 : k % 2 ? 0.85 : 1
      });
    }
    await Fx.anim(shout, flick, { duration: 600, easing: 'ease-out' });
    shout.remove();
    Fx.shake(targetEl, 4);

    // The bars and darkness clear.
    await Promise.all([
      rear,
      ...bars.map((bar, i) => Fx.anim(bar, [{ transform: 'translateY(0)' }, { transform: `translateY(${i ? 100 : -100}%)` }], { duration: 220, easing: 'ease-in' })),
      Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in' })
    ]);
    bars.forEach((b) => b.remove());
    dark.remove();

    // A dark purple cloud gathers over the target and rains violet streaks onto it.
    await FxEffects.statDropCloud(refs, target);
  }

  /** A white jagged shout burst `size` px across with a thin dark outline (a comic yell). */
  private static shoutBurst(size: number): HTMLElement {
    const pts: string[] = [];
    const spikes = 14;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const rad = i % 2 ? 30 + Math.random() * 6 : 46 + Math.random() * 4;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)},${(50 + Math.sin(a) * rad * 0.8).toFixed(1)}`);
    }
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 4px #ffffffaa)`;
    el.innerHTML =
      `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block"><polygon points="${pts.join(' ')}" fill="#ffffff" stroke="#2A2A30" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
    return el;
  }

  /**
   * Taunt, after the DPPt animation: a white smoke puff billows up in front of
   * the user and turns lilac (0-0.65 s); out of it a white glove beckons the
   * foe twice with its index finger (0.15-1.0 s) and fades (1.0-1.4 s); then a
   * red anger mark pops on the target's head and pulses, hops to the other
   * side and pulses again (1.4-2.4 s).
   */
  private static async playTaunt(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. Smoke billows up in front of the user's head: white, then lilac.
    const spot: Point = {
      x: launch.x + (target.x - launch.x) * 0.3,
      y: launch.y - lr.height * 0.2 + (target.y - launch.y) * 0.15
    };
    const cloud = Math.max(lr.width * 0.7, 50);
    const smoke = [
      FxEffects.smokePuff(fxEl, spot, cloud),
      Fx.wait(200).then(() => FxEffects.smokePuff(fxEl, spot, cloud * 1.1, ['#D8C8F0', '#B8A8D8']))
    ];

    // 2. The glove beckons out of the smoke: the finger tips toward the user and back, twice.
    const w = Math.max(lr.width * 0.28, 24);
    const hand = FxGlyphs.pointingHandGlyph(w);
    const pose = (deg: number) => `${v.dir < 0 ? 'scaleX(-1) ' : ''}rotate(${deg}deg)`;
    hand.style.transformOrigin = '50% 100%';
    Fx.place(hand, spot);
    fxEl.appendChild(hand);
    const curl = -18;
    const beckon = Fx.anim(hand, [
      { transform: `${pose(0)} scale(.6)`, opacity: 0 },
      { transform: `${pose(0)} scale(1)`, opacity: 1, offset: 0.12 },
      { transform: `${pose(curl)} scale(1)`, opacity: 1, offset: 0.27 },
      { transform: `${pose(6)} scale(1)`, opacity: 1, offset: 0.42 },
      { transform: `${pose(curl)} scale(1)`, opacity: 1, offset: 0.57 },
      { transform: `${pose(0)} scale(1)`, opacity: 1, offset: 0.68 },
      { transform: `${pose(0)} scale(1)`, opacity: 0, filter: 'brightness(.6)' }
    ], { duration: 1250, delay: 150, easing: 'ease-in-out', fill: 'backwards' }).then(() => hand.remove());
    await Promise.all([...smoke, beckon]);

    // 3. The anger mark pops on one side of the target's head, then hops to the other.
    const size = Math.max(tr.width * 0.28, 20);
    for (const side of [1, -1]) {
      const mark = FxGlyphs.angerMark(size);
      Fx.place(mark, { x: target.x + side * tr.width * 0.25, y: target.y - tr.height * (side > 0 ? 0.3 : 0.36) });
      fxEl.appendChild(mark);
      Fx.shake(targetEl, 2);
      await Fx.anim(mark, [
        { transform: 'scale(0)', opacity: 1 },
        { transform: 'scale(1.25)', opacity: 1, offset: 0.15 },
        { transform: 'scale(.95)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.55 },
        { transform: 'scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' });
      mark.remove();
    }
  }

  /**
   * Bite: a white jaw with sharp teeth opens above and below the target and
   * snaps shut on it, stopping just before the teeth touch.
   */
  private static async playBite(refs: BattleStageRefs, target: Point) {
    const r = Fx.rect(refs.targetEl);
    await DarkMoveAnimations.chomp(refs, target, { w: Math.max(r.width * 1.1, 72), tilt: 0, grinds: 0, rays: false });
  }

  /**
   * Crunch: the scene goes black, then a dark purple and magenta swirl fades
   * in; a big tilted jaw snaps shut on the target with white impact rays and
   * grinds down twice more before letting go.
   */
  private static async playCrunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, targetEl } = refs;
    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // Dark purple swirl over the black, still behind platforms and sprites.
    const field = Fx.rect(fieldEl);
    const reach = Math.hypot(field.width, field.height);
    const purple = document.createElement('div');
    purple.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 50% 45%,#7A1E6E,#3E0E4A 55%,#1A0622)';
    const swirl = document.createElement('div');
    swirl.style.cssText = `position:absolute;left:${target.x - reach}px;top:${target.y - reach}px;width:${reach * 2}px;height:${reach * 2}px;opacity:.55;background:repeating-conic-gradient(from 0deg,#C2307A00 0 12deg,#C2307A 12deg 18deg,#5A1460 18deg 30deg)`;
    purple.appendChild(swirl);
    black.appendChild(purple);
    swirl.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(60deg)' }], { duration: 1800, easing: 'linear' });
    await Fx.anim(purple, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const r = Fx.rect(targetEl);
    await DarkMoveAnimations.chomp(refs, target, { w: Math.max(r.width * 1.35, 90), tilt: -22, grinds: 2, rays: true });

    await Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    black.remove();
  }

  /**
   * A white jaw (`w` px wide, turned by `tilt` degrees) opens above and below
   * the target and snaps shut, stopping just before the teeth touch: a flash,
   * a shake and white sparks - plus white impact rays when `rays` is set.
   * `grinds` extra small bites follow before the jaw lets go.
   */
  private static async chomp(refs: BattleStageRefs, target: Point, o: { w: number; tilt: number; grinds: number; rays: boolean }) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const { w } = o;
    const h = w * 0.46;
    // Tooth tips sit at 45/46 of the glyph height; stop them a few px apart so the halves never touch.
    const gap = 3;
    const shut = h * (45 / 46 - 0.5) + gap;
    const open = shut + Math.max(r.height * 0.22, 16);
    const turn = `rotate(${o.tilt}deg)`;

    const upper = FxGlyphs.jawGlyph(w, h, false);
    const lower = FxGlyphs.jawGlyph(w, h, true);
    Fx.place(upper, target);
    Fx.place(lower, target);
    fxEl.append(upper, lower);
    const at = (sign: number, flip: string, d: number) => `${turn} translateY(${sign * d}px) ${flip}`;

    const move = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      Fx.anim(el, [
        { transform: at(sign, flip, open + 8), opacity: 0, offset: 0 },
        { transform: at(sign, flip, open), opacity: 1, offset: 0.43 },
        { transform: at(sign, flip, open + 4), opacity: 1, offset: 0.79 },
        // Must end at offset 1: otherwise the browser adds a final frame at the untransformed spot.
        { transform: at(sign, flip, shut), opacity: 1, offset: 1 }
      ], { duration: 450, easing: 'ease-in', fill: 'forwards' });
    await Promise.all([move(upper, -1, ''), move(lower, 1, 'scaleY(-1)')]);

    // Snap: flash, shake and a burst of white sparks where the teeth meet.
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#FFF6C8');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 8;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * w * 0.55}px,${Math.sin(ang) * h * 0.6}px) scale(1)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => star.remove());
    }
    if (o.rays) DarkMoveAnimations.impactRays(fxEl, target, w * 0.75);

    // Grinding: the jaw eases open a little and bites down again.
    for (let g = 0; g < o.grinds; g++) {
      await Fx.wait(90);
      const grind = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
        Fx.anim(el, [
          { transform: at(sign, flip, shut) },
          { transform: at(sign, flip, shut + 8), offset: 0.45 },
          { transform: at(sign, flip, shut) }
        ], { duration: 160, easing: 'ease-in-out', fill: 'forwards' });
      await Promise.all([grind(upper, -1, ''), grind(lower, 1, 'scaleY(-1)')]);
      Fx.flash(targetEl, '#ffffff', 0.45);
      Fx.shake(targetEl, 4);
      if (o.rays) DarkMoveAnimations.impactRays(fxEl, target, w * 0.55);
    }

    await Fx.wait(220);
    const release = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      Fx.anim(el, [
        { transform: at(sign, flip, shut), opacity: 1 },
        { transform: at(sign, flip, shut + 10), opacity: 0 }
      ], { duration: 220, easing: 'ease-out' }).then(() => el.remove());
    await Promise.all([release(upper, -1, ''), release(lower, 1, 'scaleY(-1)')]);
  }

  /** Thin white impact rays shooting out from `at` and fading. */
  private static impactRays(fxEl: HTMLElement, at: Point, reach: number): void {
    for (let i = 0; i < 10; i++) {
      const len = reach * (0.35 + Math.random() * 0.35);
      const ray = document.createElement('div');
      ray.style.cssText = `position:absolute;width:${len}px;height:3px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff);box-shadow:0 0 4px #ffffff`;
      Fx.place(ray, at);
      fxEl.appendChild(ray);
      const deg = (360 * i) / 10 + Math.random() * 20;
      Fx.anim(ray, [
        { transform: `rotate(${deg}deg) translateX(${reach * 0.15}px) scaleX(.3)`, opacity: 1 },
        { transform: `rotate(${deg}deg) translateX(${reach * 0.6}px) scaleX(1)`, opacity: 0 }
      ], { duration: 280, easing: 'ease-out' }).then(() => ray.remove());
    }
  }

  /**
   * Dark Pulse: the backdrop turns grey, dark purple rings ripple out over
   * the ground from the caster's feet while dark sparks fly out around it;
   * the target is hit as the waves reach it.
   */
  private static async playDarkPulse(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const purple = '#4B1A63';
    const grey = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#7C7A80,#A5A3A8 45%,#8A888E)');
    await Fx.anim(grey, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });

    // Ground layer: above the platforms, below HUD and sprites.
    const ground = document.createElement('div');
    ground.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fieldEl.insertBefore(ground, fieldEl.querySelector('.hud') ?? fieldEl.querySelector('.sprite'));

    const foot = Fx.footOf(launchEl, fieldEl);
    const reach = Math.hypot(target.x - foot.x, target.y - foot.y) * 1.25;
    const rings = 5;
    const ringDur = 1000;
    const ringGap = 170;
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('div');
      const w = reach * 2;
      ring.style.cssText = `position:absolute;width:${w}px;height:${w * 0.3}px;border-radius:50%;border:${5 - i * 0.6}px solid ${purple};box-shadow:0 0 8px ${purple},inset 0 0 8px ${purple}`;
      Fx.place(ring, foot);
      ground.appendChild(ring);
      Fx.anim(ring, [
        { transform: 'scale(.08)', opacity: 0 },
        { transform: 'scale(.25)', opacity: 0.9, offset: 0.15 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: ringDur, easing: 'ease-out', delay: i * ringGap }).then(() => ring.remove());
    }

    // Dark sparks: short smoky streaks flying out around the caster.
    const r = Fx.rect(launchEl);
    const rad = Math.max(r.width * 0.4, 28);
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 10 + Math.random() * 16;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${len}px;height:${3 + Math.random() * 3}px;border-radius:3px;pointer-events:none;background:linear-gradient(90deg,transparent,${purple},#8E3FB0);filter:blur(.6px);box-shadow:0 0 6px ${purple}`;
      const from = { x: launch.x + Math.cos(ang) * rad * 0.6, y: launch.y + Math.sin(ang) * rad * 0.6 };
      Fx.place(spark, from);
      fxEl.appendChild(spark);
      const dist = rad * (0.8 + Math.random() * 1.2);
      const deg = (ang * 180) / Math.PI;
      Fx.anim(spark, [
        { transform: `rotate(${deg}deg) translateX(0) scaleX(.3)`, opacity: 0 },
        { transform: `rotate(${deg}deg) translateX(${dist * 0.4}px) scaleX(1)`, opacity: 1, offset: 0.3 },
        { transform: `rotate(${deg}deg) translateX(${dist}px) scaleX(.6)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * (rings * ringGap + 300) }).then(() => spark.remove());
    }
    Fx.flash(launchEl, purple, 0.5);

    // The target is hit when the first wave reaches it, and again as later waves pass.
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, purple, 0.55);
        Fx.shake(targetEl, 4);
      }, ringDur * 0.45 + i * ringGap * 1.6);
    }

    await Fx.wait(ringDur + (rings - 1) * ringGap);
    ground.remove();
    await Fx.anim(grey, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    grey.remove();
  }
}
