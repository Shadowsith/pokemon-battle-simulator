import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Ghost-type moves. */
export class GhostMoveAnimations {
  /** Hand-made Ghost move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    curse: (refs, launch) => GhostMoveAnimations.playCurse(refs, launch),
    destinybond: (refs, launch, target) => GhostMoveAnimations.playDestinyBond(refs, launch, target),
    nightshade: (refs, launch) => GhostMoveAnimations.playNightShade(refs, launch)
  };

  /**
   * Destiny Bond: the scene turns into a ghostly, blotchy red and purple haze;
   * a pale white disc glides along the ground from the caster to the foe, and
   * when it arrives the foe glows white for a moment.
   */
  private static async playDestinyBond(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = fieldEl.getBoundingClientRect();
    const lr = launchEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();

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
    const r = launchEl.getBoundingClientRect();
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
    const r = launchEl.getBoundingClientRect();
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
