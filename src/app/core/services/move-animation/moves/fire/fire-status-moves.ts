import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FireFlames } from './fire-flames';

/** Hand-made animations for Fire-type status and weather moves. */
export class FireStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    sunnyday: (refs) => FireStatusMoveAnimations.playSunnyDay(refs),
    willowisp: (refs, launch, target) => FireStatusMoveAnimations.playWillOWisp(refs, launch, target)
  };

  /**
   * Will-O-Wisp, after the DPPt animation: seven pink-magenta wisps with dark
   * cores float from the user to the target in a wobbly chain, circle round it
   * once and spiral up and away (0-1.8 s); a smoke cloud billows over the
   * target, black, then deep purple, flaring magenta and fading as a red haze
   * (1.6-2.7 s); last the target burns - it turns red-hot while small flames
   * flicker over it (2.6-3.5 s).
   */
  private static async playWillOWisp(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const rx = Math.max(tr.width * 0.5, 30);
    const ry = Math.max(tr.height * 0.32, 20);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.max(Math.hypot(dx, dy), 1);
    // Sideways unit vector for the wobble on the way over.
    const sx = -dy / len;
    const sy = dx / len;

    // 1. The wisps: over to the target with a wobble, once round it, then up and away.
    const count = 7;
    const steps = 30;
    const wisps = Array.from({ length: count }, (_, i) => {
      const size = 16 + Math.random() * 6;
      const wisp = FireStatusMoveAnimations.wispGlyph(size);
      Fx.place(wisp, launch);
      fxEl.appendChild(wisp);
      const a0 = (Math.PI * 2 * i) / count;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        let x: number;
        let y: number;
        if (t < 0.4) {
          // Over to the orbit's start point, weaving side to side.
          const u = t / 0.4;
          const wob = Math.sin(u * Math.PI * 3 + i) * 14 * (1 - u);
          const ox = Math.cos(a0) * rx;
          const oy = Math.sin(a0) * ry;
          x = (dx + ox) * u + sx * wob;
          y = (dy + oy) * u + sy * wob;
        } else if (t < 0.8) {
          const a = a0 + ((t - 0.4) / 0.4) * Math.PI * 2;
          x = dx + Math.cos(a) * rx;
          y = dy + Math.sin(a) * ry;
        } else {
          // Spiral up and away, widening.
          const u = (t - 0.8) / 0.2;
          const a = a0 + Math.PI * 2 + u * Math.PI;
          x = dx + Math.cos(a) * rx * (1 + u * 0.6);
          y = dy + Math.sin(a) * ry - u * tr.height * 1.2;
        }
        const fade = t < 0.06 ? t / 0.06 : t > 0.88 ? (1 - t) / 0.12 : 1;
        frames.push({ transform: `translate(${x}px,${y}px)`, opacity: fade });
      }
      return Fx.anim(wisp, frames, { duration: 1400, delay: i * 70, easing: 'linear', fill: 'backwards' }).then(() => wisp.remove());
    });
    await Fx.wait(1600);

    // 2. The smoke cloud over the target shifts black -> purple -> magenta -> red haze.
    const smoke: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const s = Math.max(tr.width * (0.4 + Math.random() * 0.25), 26);
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;filter:blur(3px)`;
      Fx.place(puff, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.4, y: target.y + (Math.random() * 2 - 0.6) * tr.height * 0.4 });
      fxEl.appendChild(puff);
      smoke.push(
        Fx.anim(puff, [
          { transform: 'scale(.3)', opacity: 0, backgroundColor: '#140812' },
          { transform: 'scale(1)', opacity: 0.95, backgroundColor: '#140812', offset: 0.2 },
          { transform: 'scale(1.05)', opacity: 0.95, backgroundColor: '#5A1A5A', offset: 0.4 },
          { transform: 'scale(1.1)', opacity: 0.85, backgroundColor: '#E040D0', offset: 0.6 },
          { transform: 'scale(1.25)', opacity: 0, backgroundColor: '#C0304A' }
        ], { duration: 1100, delay: Math.random() * 120, easing: 'ease-out', fill: 'backwards' }).then(() => puff.remove())
      );
    }
    await Promise.all([...wisps, ...smoke]);

    // 3. The target burns.
    const hot = 'sepia(1) saturate(5) hue-rotate(-30deg) brightness(.95)';
    const tint = Fx.anim(targetEl, [{ filter: 'none' }, { filter: hot, offset: 0.2 }, { filter: hot, offset: 0.75 }, { filter: 'none' }], {
      duration: 900,
      easing: 'ease-in-out',
      fill: 'none'
    });
    const foot = target.y + tr.height * 0.3;
    const flames = Array.from({ length: 6 }, (_, i) =>
      FireFlames.burnFlame(
        fxEl,
        { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: foot - Math.random() * tr.height * 0.5 },
        Math.min(Math.max(tr.width * 0.18, 12), 24),
        '#FF6A2A',
        650,
        i * 80
      )
    );
    await Promise.all([tint, ...flames]);
  }

  /** A pink-magenta ghost flame, `size` px wide, with a dark purple core; the tip points up (Will-O-Wisp). */
  private static wispGlyph(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none`;
    const tear = document.createElement('div');
    tear.style.cssText =
      'width:100%;height:100%;border-radius:50% 0 50% 50%;transform:rotate(-45deg);' +
      'background:radial-gradient(circle at 40% 60%,#1A0018 0 22%,#6A1A6A 34%,#E060E0 55%,#F8A0F0 72%);filter:drop-shadow(0 0 5px #E060E0)';
    el.appendChild(tear);
    return el;
  }

  /**
   * Sunny Day: the backdrop turns bright and warm yellow, a sun glows and
   * sparkles in the top-left corner and broad soft shafts of sunlight slant
   * down from it across the field.
   */
  private static async playSunnyDay(refs: BattleStageRefs) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const sun: Point = { x: W * 0.03, y: H * 0.04 };
    const total = 1500;

    // Warm, bright sky, lightest at the sun's corner; the field still shows through a little.
    const bg = Fx.backdrop(
      fieldEl,
      'background:radial-gradient(circle at 3% 4%,#FFFFF0,#FFF4B0 25%,#F8DC6A00 60%),linear-gradient(160deg,#FFF0A0,#F6D45A 45%,#E8B848)'
    );
    const effects: Promise<void>[] = [
      Fx.anim(bg, [
        { opacity: 0 },
        { opacity: 0.85, offset: 0.2 },
        { opacity: 0.85, offset: 0.8 },
        { opacity: 0 }
      ], { duration: total, easing: 'ease-in-out' }).then(() => bg.remove()),
      FxEffects.cornerSun(fxEl, sun, H * 0.7, total)
    ];

    // Broad, soft sun shafts fanning down-right from the corner, slowly sweeping.
    const reach = Math.hypot(W, H) * 0.8;
    for (let i = 0; i < 5; i++) {
      const ang = 20 + i * 9 + Math.random() * 4;
      const thick = 14 + Math.random() * 18;
      const shaft = document.createElement('div');
      shaft.style.cssText = `position:absolute;left:${sun.x}px;top:${sun.y - thick / 2}px;width:${reach}px;height:${thick}px;transform-origin:0 50%;pointer-events:none;border-radius:${thick}px;background:linear-gradient(90deg,#FFFFF4ee,#FFF6C099 35%,#FFF6C000);filter:blur(3px)`;
      fxEl.appendChild(shaft);
      effects.push(
        Fx.anim(shaft, [
          { transform: `rotate(${ang}deg) scaleX(.2)`, opacity: 0 },
          { transform: `rotate(${ang + 2}deg) scaleX(1)`, opacity: 0.9, offset: 0.3 },
          { transform: `rotate(${ang + 5}deg) scaleX(1)`, opacity: 0.7, offset: 0.75 },
          { transform: `rotate(${ang + 6}deg) scaleX(1)`, opacity: 0 }
        ], { duration: 1100, easing: 'ease-out', delay: 100 + i * 70 }).then(() => shaft.remove())
      );
    }
    await Promise.all(effects);
  }
}
