import { BattleStageRefs, MoveAnimRegistry, MoveVisual, Point } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Ghost-type moves. */
export class GhostMoveAnimations {
  /** Hand-made Ghost move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    curse: (refs, launch) => GhostMoveAnimations.playCurse(refs, launch),
    destinybond: (refs, launch, target) => GhostMoveAnimations.playDestinyBond(refs, launch, target),
    nightshade: (refs, launch) => GhostMoveAnimations.playNightShade(refs, launch),
    phantomforce: (refs, launch, target, v) => GhostMoveAnimations.playPhantomForceStrike(refs, launch, target, v),
    shadowball: (refs, launch, target, v) => GhostMoveAnimations.playShadowBall(refs, launch, target, v)
  };

  /** Turn-1 animations of two-turn Ghost moves, by @pkmn/sim move id. */
  static readonly chargeAnims: MoveAnimRegistry = {
    phantomforce: (refs) => GhostMoveAnimations.playPhantomForceVanish(refs)
  };

  /**
   * Phantom Force, turn 1 (XY): the scene goes black, a glowing purple portal
   * opens under the user (0.25-0.5 s) and the user sinks into it (to 0.95 s);
   * the portal closes and the scene clears (to ~1.2 s). The user stays away until turn 2.
   */
  private static async playPhantomForceVanish(refs: BattleStageRefs) {
    const { launchEl: el, fieldEl, fxEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const r = Fx.rect(el);
    const foot = Fx.footOf(el, fieldEl);

    const dark = Fx.backdrop(fieldEl, 'background:#050008');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const portal = GhostMoveAnimations.portal(Math.max(r.width * 1.2, 80));
    Fx.place(portal, foot);
    fxEl.appendChild(portal);
    await Fx.anim(portal, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The user sinks into the portal: it slides down while its lower part is cut off at the ground line.
    await Fx.anim(el, [
      { transform: 'translateY(0)', clipPath: 'inset(0 0 -40px 0)', filter: 'none' },
      { transform: `translateY(${r.height}px)`, clipPath: `inset(0 0 ${r.height}px 0)`, filter: 'brightness(.6) sepia(1) hue-rotate(230deg) saturate(3)' }
    ], { duration: 450, easing: 'ease-in', fill: 'none' });
    el.style.opacity = '0';

    await Fx.anim(portal, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 220, easing: 'ease-in' });
    portal.remove();
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dark.remove();
  }

  /**
   * Phantom Force, turn 2 (XY): the scene goes black, a purple portal opens
   * above the target with ghostly purple wisp rings beside it (0.2-0.6 s). The
   * user drops out of the portal next to the target (to 0.85 s) and strikes:
   * a white-purple burst with a spreading ring and streaks (0.85-1.25 s).
   * Purple flames rise off the target while the user fades back to its own
   * place and the scene clears (to ~1.8 s).
   */
  private static async playPhantomForceStrike(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { launchEl: el, fieldEl, fxEl, targetEl } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const tr = Fx.rect(targetEl);
    const tFoot = Fx.footOf(targetEl, fieldEl);
    const lFoot = Fx.footOf(el, fieldEl);

    const dark = Fx.backdrop(fieldEl, 'background:#050008');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

    // Portal overhead and two flickering wisp rings.
    const portalAt: Point = { x: target.x, y: target.y - Math.max(tr.height * 0.9, 60) };
    const portal = GhostMoveAnimations.portal(Math.max(tr.width * 1.3, 90));
    Fx.place(portal, portalAt);
    fxEl.appendChild(portal);
    Fx.anim(portal, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const wisps: Promise<void>[] = [];
    for (const side of [-1, 1]) {
      const s = Math.max(tr.width * 0.28, 22);
      const wisp = document.createElement('div');
      wisp.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:3px solid #D050FF;box-shadow:0 0 8px #B020FF,inset 0 0 6px #B020FF`;
      Fx.place(wisp, { x: target.x + side * tr.width * 0.75, y: target.y - tr.height * 0.1 });
      fxEl.appendChild(wisp);
      wisps.push(
        Fx.anim(wisp, [
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.2 },
          { transform: 'scale(.85)', opacity: 0.6, offset: 0.4 },
          { transform: 'scale(1.05)', opacity: 1, offset: 0.6 },
          { transform: 'translateY(-14px) scale(.6)', opacity: 0 }
        ], { duration: 800, easing: 'ease-in-out' }).then(() => wisp.remove())
      );
    }
    await Fx.wait(400);

    // The user drops out of the portal right in front of the target (no turning).
    const dx = target.x - v.dir * tr.width * 0.45 - launch.x;
    const dy = tFoot.y - lFoot.y;
    el.style.opacity = '1';
    const drop = Math.max(tr.height * 0.9, 60);
    await Fx.anim(el, [
      { transform: `translate(${dx}px,${dy - drop}px) scale(.6)`, opacity: 0 },
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 1 }
    ], { duration: 250, easing: 'ease-in', fill: 'forwards' });
    Fx.anim(portal, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], { duration: 250, easing: 'ease-in' })
      .then(() => portal.remove());

    // The strike: a white-purple burst, a ring and streaks.
    const size = Math.max(tr.width * 1.3, 100);
    const burst = document.createElement('div');
    burst.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 25%,#F8D8FFee 40%,#D060FF88 58%,#9020E000 72%)`;
    const ring = document.createElement('div');
    ring.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:4px solid #E070FF;box-shadow:0 0 12px #C030FF`;
    Fx.place(burst, target);
    Fx.place(ring, target);
    fxEl.append(burst, ring);
    const effects: Promise<void>[] = [
      ...wisps,
      Fx.anim(burst, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }).then(() => burst.remove()),
      Fx.anim(ring, [{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 500, easing: 'ease-out' }).then(() => ring.remove())
    ];
    for (let i = 0; i < 6; i++) {
      const len = size * (0.6 + Math.random() * 0.5);
      const ang = (v.dir > 0 ? 0 : 180) + (Math.random() * 2 - 1) * 25;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:3px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#ffffff,#E070FF 60%,#E070FF00);box-shadow:0 0 4px #C030FF`;
      Fx.place(streak, target);
      fxEl.appendChild(streak);
      effects.push(
        Fx.anim(streak, [
          { transform: `rotate(${ang}deg) translateX(0) scaleX(.2)`, opacity: 1 },
          { transform: `rotate(${ang}deg) translateX(${len * 0.6}px) scaleX(1)`, opacity: 0 }
        ], { duration: 380, delay: Math.random() * 80, easing: 'ease-out' }).then(() => streak.remove())
      );
    }
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    await Fx.wait(250);

    // Purple flames rise off the target, which glows purple.
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(1.15) drop-shadow(0 0 8px #C030FF)', offset: 0.2 },
        { filter: 'none' }
      ], { duration: 650, easing: 'ease-out', fill: 'none' })
    );
    for (let i = 0; i < 9; i++) {
      const s = 14 + Math.random() * 14;
      const flame = document.createElement('div');
      flame.style.cssText = `width:${s}px;height:${s * 1.5}px;border-radius:50% 50% 45% 45% / 65% 65% 35% 35%;pointer-events:none;background:radial-gradient(circle at 50% 70%,#FFE0FF,#E060FF 40%,#9020E000 75%)`;
      Fx.place(flame, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: target.y + tr.height * 0.1 });
      fxEl.appendChild(flame);
      const rise = tr.height * (0.5 + Math.random() * 0.4);
      effects.push(
        Fx.anim(flame, [
          { transform: 'translateY(0) scale(.4)', opacity: 0 },
          { transform: `translateY(${-rise * 0.4}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translateY(${-rise}px) scale(.5)`, opacity: 0 }
        ], { duration: 550, delay: i * 40, easing: 'ease-out' }).then(() => flame.remove())
      );
    }

    // The user fades out at the target and back in at its own place.
    await Fx.anim(el, [
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(.8)`, opacity: 0 }
    ], { duration: 200, easing: 'ease-in', fill: 'forwards' });
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    effects.push(Fx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'none' }));
    effects.push(Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, delay: 150, easing: 'ease-in' }));
    await Promise.all(effects);
    dark.remove();
  }

  /** A glowing flat purple portal (an ellipse seen from the side), `w` px wide. */
  private static portal(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${w}px;height:${w * 0.3}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFB0FF 0 15%,#E040FF 45%,#A010E0aa 65%,#6000A000 75%);box-shadow:0 0 18px 4px #C020FF88`;
    return el;
  }

  /**
   * Shadow Ball: a dark purple ball of shadow with a wispy, flickering edge
   * gathers in front of the caster (0 - 0.25 s) and is hurled at the target,
   * trailing wisps; on impact (0.52 s) the target is swallowed by dark purple
   * shadow puffs that drift off it while it darkens.
   */
  private static async playShadowBall(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(lr.width * 0.5, 40);
    const from: Point = { x: launch.x + v.dir * Math.max(lr.width * 0.55, 36), y: launch.y - lr.height * 0.05 };

    // Phase 1: the ball gathers before the caster ...
    const ball = document.createElement('div');
    ball.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 6px #6A1E9A) blur(.5px)`;
    const pts: string[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28;
      const rad = i % 2 ? 40 + Math.random() * 4 : 47 + Math.random() * 3;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)}% ${(50 + Math.sin(a) * rad).toFixed(1)}%`);
    }
    const core = document.createElement('div');
    core.style.cssText = `width:100%;height:100%;clip-path:polygon(${pts.join(',')});background:radial-gradient(circle,#2A0838 0 30%,#4A1266 55%,#8A3AC0 78%,#B070E0 90%)`;
    ball.appendChild(core);
    core.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(180deg)' }], { duration: 520, iterations: 2 });
    Fx.place(ball, from);
    fxEl.appendChild(ball);
    await Fx.anim(ball, [
      { transform: 'scale(.1)', opacity: 0 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 250, easing: 'ease-out' });

    // ... and is hurled at the target, shedding wisps on the way.
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const travel = 270;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const t = i / 6;
        GhostMoveAnimations.shadowPuff(fxEl, { x: from.x + dx * t, y: from.y + dy * t }, size * 0.45, 380, 8);
      }, (i / 6) * travel);
    }
    await Fx.anim(ball, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx}px,${dy}px) scale(1.15)` }
    ], { duration: travel, easing: 'ease-in' });
    ball.remove();

    // Phase 2: dark purple hit.
    Fx.flash(targetEl, '#6A1E9A', 0.6);
    Fx.shake(targetEl, 6);
    const effects: Promise<void>[] = [
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(3) hue-rotate(230deg) brightness(.55)', offset: 0.15 },
        { filter: 'sepia(1) saturate(3) hue-rotate(230deg) brightness(.6)', offset: 0.6 },
        { filter: 'none' }
      ], { duration: 750, easing: 'ease-in-out', fill: 'none' })
    ];
    const burst = Math.max(tr.width * 0.75, 56);
    for (let i = 0; i < 12; i++) {
      const ang = Math.random() * Math.PI * 2;
      const d = burst * (0.1 + Math.random() * 0.3);
      effects.push(
        GhostMoveAnimations.shadowPuff(
          fxEl,
          { x: target.x + Math.cos(ang) * d, y: target.y + Math.sin(ang) * d * 0.8 },
          burst * (0.3 + Math.random() * 0.3),
          600 + Math.random() * 250,
          burst * (0.35 + Math.random() * 0.4),
          ang,
          i * 25
        )
      );
    }
    await Promise.all(effects);
  }

  /**
   * A soft, blurred dark purple puff of shadow at `at` that swells, drifts
   * `drift` px in direction `ang` (radians, default random) and fades.
   */
  private static shadowPuff(fxEl: HTMLElement, at: Point, size: number, duration: number, drift: number, ang = Math.random() * Math.PI * 2, delay = 0): Promise<void> {
    const puff = document.createElement('div');
    puff.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#5A1680,#6E2A9Acc 45%,#8A3AC000 72%);filter:blur(1.5px)`;
    Fx.place(puff, at);
    fxEl.appendChild(puff);
    const x = Math.cos(ang) * drift;
    const y = Math.sin(ang) * drift - drift * 0.3;
    return Fx.anim(puff, [
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: `translate(${x * 0.3}px,${y * 0.3}px) scale(1)`, opacity: 0.95, offset: 0.25 },
      { transform: `translate(${x}px,${y}px) scale(1.3)`, opacity: 0 }
    ], { duration, delay, easing: 'ease-out' }).then(() => puff.remove());
  }

  /**
   * Destiny Bond: the scene turns into a ghostly, blotchy red and purple haze;
   * a pale white disc glides along the ground from the caster to the foe, and
   * when it arrives the foe glows white for a moment.
   */
  private static async playDestinyBond(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // 1. Ghostly red-purple haze, drifting slowly (0-0.35 s).
    const haze = Fx.backdrop(
      fieldEl,
      'background:' +
        'radial-gradient(ellipse 30% 22% at 25% 30%,#E85A8Acc,#E85A8A00),' +
        'radial-gradient(ellipse 28% 24% at 70% 65%,#8A2A9Acc,#8A2A9A00),' +
        'radial-gradient(ellipse 32% 20% at 80% 20%,#F07090aa,#F0709000),' +
        'radial-gradient(ellipse 26% 22% at 35% 80%,#6A1E7Acc,#6A1E7A00),' +
        'linear-gradient(160deg,#C03A6A,#9A2A78 55%,#B23A6E)'
    );
    haze.style.backgroundSize = '140% 140%';
    haze.animate([{ backgroundPosition: '0% 0%' }, { backgroundPosition: '30% 20%' }], { duration: 2000, easing: 'ease-in-out' });
    await Fx.anim(haze, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out', fill: 'forwards' });

    // 2. A white ground disc glides from the caster's feet to the foe's (0.45-1.15 s).
    const w = Math.max(lr.width * 1.1, 80);
    const disc = document.createElement('div');
    disc.style.cssText = `position:absolute;width:${w}px;height:${w * 0.35}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#ffffffee 0 35%,#F4E8F8aa 60%,#ffffff00 72%);box-shadow:0 0 16px #ffffff88`;
    const from: Point = { x: launch.x, y: lr.bottom - f.top - w * 0.1 };
    const to: Point = { x: target.x, y: tr.bottom - f.top - w * 0.1 };
    Fx.place(disc, from);
    fxEl.appendChild(disc);
    await Fx.wait(100);
    await Fx.anim(disc, [
      { transform: 'translate(0,0) scale(.4)', opacity: 0 },
      { transform: 'translate(0,0) scale(1)', opacity: 0.9, offset: 0.2 },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(1.15)`, opacity: 0.9 }
    ], { duration: 700, easing: 'ease-in-out', fill: 'forwards' });

    // 3. "Hit" (1.15 s): the foe glows white while the disc flares and fades.
    Fx.anim(disc, [
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(1.15)`, opacity: 0.9 },
      { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(1.5)`, opacity: 0 }
    ], { duration: 400, easing: 'ease-out' }).then(() => disc.remove());
    await Fx.anim(targetEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(2.6) saturate(0) drop-shadow(0 0 10px #ffffff)', offset: 0.35 },
      { filter: 'brightness(1)' }
    ], { duration: 500, easing: 'ease-out', fill: 'none' });

    await Fx.anim(haze, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    haze.remove();
  }

  /**
   * Curse: a dark purple ghostly circle spreads behind the caster, a nail
   * flies in and is hammered into it - two blows, each with a yellow spark -
   * then the circle pulses and fades.
   */
  private static async playCurse(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height) * 1.05;

    // 1. The circle, behind the sprites (0-0.35 s).
    const layer = Fx.backdrop(fieldEl, 'background:transparent');
    const circle = document.createElement('div');
    circle.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#3A1450 0 45%,#2A0C3Cee 62%,#5A2A78aa 72%,#3A145000 78%);box-shadow:0 0 18px #6A2A8A88`;
    Fx.place(circle, launch);
    layer.appendChild(circle);
    await Fx.anim(circle, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.95 }], {
      duration: 350,
      easing: 'ease-out',
      fill: 'forwards'
    });

    // 2. The nail flies in from the upper left and sticks into the circle's lower left (0.35-0.6 s).
    const len = Math.max(size * 0.32, 28);
    const angle = 35; // pointing down-right, into the circle
    const rad = (angle * Math.PI) / 180;
    const tip: Point = { x: launch.x - size * 0.28, y: launch.y + size * 0.28 };
    const stuck: Point = { x: tip.x - (Math.cos(rad) * len) / 2, y: tip.y - (Math.sin(rad) * len) / 2 };
    const nail = FxGlyphs.nailGlyph(len);
    Fx.place(nail, stuck);
    fxEl.appendChild(nail);
    const along = (d: number) => `translate(${-Math.cos(rad) * d}px,${-Math.sin(rad) * d}px) rotate(${angle}deg)`;
    await Fx.anim(nail, [
      { transform: along(size * 0.8), opacity: 0 },
      { transform: along(len * 0.3), opacity: 1 }
    ], { duration: 250, easing: 'ease-in', fill: 'forwards' });

    // 3. Two hammer blows (0.75 / 0.95 s): the nail is driven in, a yellow spark at its head.
    const head: Point = { x: stuck.x - (Math.cos(rad) * len) / 2, y: stuck.y - (Math.sin(rad) * len) / 2 };
    for (const [i, depth] of [[0, len * 0.15], [1, 0]] as const) {
      await Fx.wait(i ? 120 : 150);
      Fx.anim(nail, [{ transform: along(depth + len * 0.15) }, { transform: along(depth) }], {
        duration: 70,
        easing: 'ease-in',
        fill: 'forwards'
      });
      const spark = FxGlyphs.sparkStar(16, '#FFD83A');
      Fx.place(spark, head);
      fxEl.appendChild(spark);
      Fx.anim(spark, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.5) rotate(90deg)', opacity: 0 }
      ], { duration: 260, easing: 'ease-out' }).then(() => spark.remove());
      Fx.shake(launchEl, 3);
      await Fx.wait(80);
    }

    // 4. The circle pulses dark, then everything fades (1.2-1.5 s).
    await Fx.anim(circle, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], {
      duration: 220,
      easing: 'ease-in-out'
    });
    await Promise.all(
      [circle, nail].map((el) =>
        Fx.anim(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' }).then(() => el.remove())
      )
    );
    layer.remove();
  }

  /**
   * Night Shade: the screen goes almost black, the caster lights up with a
   * pale pink glow, then the target turns dark and trembles.
   */
  private static async playNightShade(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const dark = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#121218,#000)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });

    // 1. The caster brightens inside a soft, fuzzy pink-white halo.
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 60) * 1.25;
    const halo = document.createElement('div');
    halo.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0FF55 0%,#F2C8EE66 45%,#E8B0E433 62%,#E8B0E400 72%);filter:blur(3px)`;
    Fx.place(halo, launch);
    fxEl.appendChild(halo);
    const haloDone = Fx.anim(halo, [
      { transform: 'scale(.6)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.05)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 1000, easing: 'ease-in-out' }).then(() => halo.remove());
    await Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: 'brightness(1.9) drop-shadow(0 0 8px #F6D6F2)', offset: 0.3 },
      { filter: 'brightness(1.9) drop-shadow(0 0 8px #F6D6F2)', offset: 0.75 },
      { filter: 'none' }
    ], { duration: 1000, easing: 'ease-in-out', fill: 'none' });
    await haloDone;

    // 2. The target turns dark and trembles.
    const frames: Keyframe[] = [];
    const steps = 20;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const dim = t < 0.15 ? 1 - (t / 0.15) * 0.8 : t > 0.85 ? 0.2 + ((t - 0.85) / 0.15) * 0.8 : 0.2;
      const amp = k === 0 || k === steps ? 0 : 3;
      frames.push({
        transform: `translate(${(k % 2 ? -1 : 1) * amp}px,${(Math.random() * 2 - 1) * amp * 0.5}px)`,
        filter: `brightness(${dim.toFixed(2)}) saturate(${(0.4 + dim * 0.6).toFixed(2)})`
      });
    }
    await Fx.anim(targetEl, frames, { duration: 1000, easing: 'linear', fill: 'none' });

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }
}
