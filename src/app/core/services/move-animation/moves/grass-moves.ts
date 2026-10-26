import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { FLECK_COLOR } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Grass-type moves. */
export class GrassMoveAnimations {
  /** Hand-made Grass move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    absorb: (refs, launch, target) => GrassMoveAnimations.playAbsorb(refs, launch, target),
    leechseed: (refs, launch, target) => GrassMoveAnimations.playLeechSeed(refs, launch, target),
    petaldance: (refs, launch, target) => GrassMoveAnimations.playPetalDance(refs, launch, target)
  };

  /**
   * Absorb: no projectile. Green energy stars are pulled out of the target and
   * drift back to the caster along wavy arcs, then sparkle around the caster
   * to show the HP it gained. The drained stars' colours can be changed
   * (Leech Life drains blood-red ones).
   */
  static async playAbsorb(
    refs: BattleStageRefs,
    launch: Point,
    target: Point,
    [main, light]: [string, string] = [FLECK_COLOR.statUp, '#E6FFB0']
  ) {
    const { fxEl, targetEl } = refs;
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;

    Fx.flash(targetEl, main, 0.4);
    Fx.shake(targetEl, 3);

    // Stream: stars leave the target in a steady trickle and float to the caster.
    const count = 22;
    const travel = 900;
    const spread = 1100;
    for (let i = 0; i < count; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 7, i % 3 ? main : light);
      Fx.place(star, { x: target.x + (Math.random() * 40 - 20), y: target.y + (Math.random() * 40 - 20) });
      fxEl.appendChild(star);
      const bend = (Math.random() * 2 - 1) * 45;
      const frames: Keyframe[] = [];
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const ease = t * t * (3 - 2 * t);
        frames.push({
          transform: `translate(${dx * ease}px,${dy * ease + Math.sin(t * Math.PI) * bend}px) rotate(${t * 240}deg) scale(${0.4 + Math.sin(t * Math.PI) * 0.8})`,
          opacity: Math.min(1, t * 5, (1 - t) * 4 + 0.2)
        });
      }
      Fx.anim(star, frames, { duration: travel, easing: 'linear', delay: (i / count) * spread }).then(() => star.remove());
    }
    await Fx.wait(travel + spread * 0.8);
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Leech Seed: three seeds are tossed in a high arc onto the target, then
   * little green sprouts grow where they landed and sway on the Pokémon.
   */
  private static async playLeechSeed(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const spreadX = Math.max(r.width * 0.3, 18);
    const lowY = target.y + Math.max(r.height * 0.2, 10);
    const seeds = 3;
    const gap = 130;
    const travel = 700;
    const steps = 12;

    const grown: Promise<void>[] = [];
    for (let i = 0; i < seeds; i++) {
      // Land spread across the lower half of the target.
      const land = { x: target.x + ((i - 1) + (Math.random() * 0.4 - 0.2)) * spreadX, y: lowY + Math.random() * 8 };
      const seed = GrassMoveAnimations.seedGlyph(9);
      Fx.place(seed, launch);
      fxEl.appendChild(seed);
      const dx = land.x - launch.x;
      const dy = land.y - launch.y;
      const lift = 90 + Math.abs(dx) * 0.25;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        frames.push({
          transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * lift}px) rotate(${t * 540}deg)`,
          opacity: t === 0 ? 0 : 1
        });
      }
      grown.push(
        Fx.anim(seed, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(async () => {
          seed.remove();
          if (i === 0) Fx.shake(targetEl, 2);
          await GrassMoveAnimations.sprout(fxEl, land, Math.max(r.width * 0.2, 16));
        })
      );
    }
    await Promise.all(grown);
  }

  /** A small beige-grey seed with a highlight, `s` px wide. */
  private static seedGlyph(s: number): HTMLElement {
    const seed = document.createElement('div');
    seed.style.cssText = `position:absolute;width:${s * 1.3}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#FFFFF0,#CFCBB8 45%,#8E8A78);box-shadow:0 0 2px #00000066`;
    return seed;
  }

  /** A little green sprout (stem + two leaves) grows at `at`, sways, then fades. */
  private static async sprout(fxEl: HTMLElement, at: Point, w: number): Promise<void> {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('style', `position:absolute;overflow:visible;pointer-events:none;width:${w}px;height:${w}px;transform-origin:50% 100%;filter:drop-shadow(0 0 2px #6CE04A)`);
    svg.innerHTML =
      '<path d="M10,20 C10,15 10,12 10,9" stroke="#2E8B1E" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M10,10 C6,4 1,5 1,8 C3,12 8,12 10,10 Z" fill="#5CD43A" stroke="#2E8B1E" stroke-width=".8"/>' +
      '<path d="M10,9 C14,3 19,4 19,7 C17,11 12,11 10,9 Z" fill="#7CE85A" stroke="#2E8B1E" stroke-width=".8"/>';
    // Anchor the stem's base on the landing spot.
    Fx.place(svg, { x: at.x, y: at.y - w / 2 });
    fxEl.appendChild(svg);
    await Fx.anim(svg, [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(1.15,1.2)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1) rotate(-8deg)', opacity: 1, offset: 0.45 },
      { transform: 'scale(1) rotate(7deg)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1) rotate(-4deg)', opacity: 1, offset: 0.85 },
      { transform: 'scale(1) rotate(0)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-out' });
    svg.remove();
  }

  /**
   * Petal Dance: the caster dances round in circles and whirls up pink petals in a
   * rising spiral around itself; the petals then sweep over to the target and
   * swirl around it while it is buffeted, before scattering.
   */
  private static async playPetalDance(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const pink = '#F27A9A';
    const lr = launchEl.getBoundingClientRect();
    const tr = targetEl.getBoundingClientRect();
    const casterRx = Math.max(lr.width * 0.6, 36);
    const casterH = Math.max(lr.height, 50);
    const targetRx = Math.max(tr.width * 0.65, 38);
    const targetH = Math.max(tr.height, 50);
    const count = 22;
    const total = 2600;
    const steps = 52;
    // Share of the timeline: whirl around the caster, fly over, swirl around the target.
    const whirlEnd = 0.38;
    const flyEnd = 0.52;

    // The caster dances round in small circles on the spot, still facing the target.
    const loopR = Math.max(lr.width * 0.15, 12);
    const loops = 2;
    const circle: Keyframe[] = [];
    for (let k = 0; k <= 24; k++) {
      const a = (k / 24) * loops * Math.PI * 2;
      circle.push({ transform: `translate(${(Math.sin(a) * loopR).toFixed(1)}px,${((1 - Math.cos(a)) * -loopR * 0.6).toFixed(1)}px)` });
    }
    Fx.anim(launchEl, circle, { duration: total * whirlEnd, easing: 'ease-in-out', fill: 'none' });

    const done: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const petal = GrassMoveAnimations.petalGlyph(9 + Math.random() * 7, pink);
      Fx.place(petal, launch);
      fxEl.appendChild(petal);
      const a0 = Math.random() * Math.PI * 2;
      const b0 = Math.random() * Math.PI * 2;
      const lift = Math.random();
      const height = Math.random() * 2 - 1;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360);
      // Rising spiral around the caster.
      const whirl = (u: number): Point => {
        const ang = a0 + u * Math.PI * 3;
        const rx = casterRx * (0.5 + u * 0.7);
        return {
          x: launch.x + Math.cos(ang) * rx,
          y: launch.y + casterH * 0.4 - u * casterH * (0.6 + lift * 0.5) + Math.sin(ang) * rx * 0.3
        };
      };
      // Swirl around the target at the petal's own height.
      const swirl = (u: number): Point => {
        const ang = b0 + u * Math.PI * 4;
        return {
          x: target.x + Math.cos(ang) * targetRx * (0.8 + lift * 0.4),
          y: target.y + height * targetH * 0.45 + Math.sin(ang) * targetRx * 0.3
        };
      };
      const from = whirl(1);
      const to = swirl(0);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        let p: Point;
        if (t <= whirlEnd) p = whirl(t / whirlEnd);
        else if (t <= flyEnd) {
          const u = (t - whirlEnd) / (flyEnd - whirlEnd);
          p = { x: from.x + (to.x - from.x) * u, y: from.y + (to.y - from.y) * u - Math.sin(u * Math.PI) * 30 };
        } else p = swirl((t - flyEnd) / (1 - flyEnd));
        // Flutter: the petal tumbles, its width flickering as it turns.
        const flutter = 0.35 + Math.abs(Math.cos(t * Math.PI * 6 + i)) * 0.65;
        frames.push({
          transform: `translate(${p.x - launch.x}px,${p.y - launch.y}px) rotate(${t * spin}deg) scale(${flutter.toFixed(2)},1)`,
          opacity: t < 0.04 ? t / 0.04 : t > 0.92 ? (1 - t) / 0.08 : 1
        });
      }
      done.push(Fx.anim(petal, frames, { duration: total, easing: 'linear', delay: i * 18 }).then(() => petal.remove()));
    }

    // The target is buffeted while the petals swirl around it.
    for (let k = 0; k < 5; k++) {
      setTimeout(() => {
        Fx.shake(targetEl, 4);
        if (k % 2 === 0) Fx.flash(targetEl, pink, 0.4);
      }, total * flyEnd + k * 260);
    }
    await Promise.all(done);
  }

  /** A pink flower petal: a soft oval with pointed ends and a lighter centre line. */
  private static petalGlyph(s: number, color: string): HTMLElement {
    const petal = document.createElement('div');
    petal.style.cssText = `position:absolute;width:${s}px;height:${s * 0.7}px;pointer-events:none;border-radius:80% 10% 80% 10%;background:linear-gradient(135deg,#FFD0DE,${color} 55%,#D84A72);box-shadow:0 0 2px #00000033`;
    return petal;
  }
}
