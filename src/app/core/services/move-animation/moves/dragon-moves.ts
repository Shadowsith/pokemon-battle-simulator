import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Dragon-type moves. */
export class DragonMoveAnimations {
  /** Hand-made Dragon move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    outrage: (refs, launch) => DragonMoveAnimations.playOutrage(refs, launch)
  };

  /**
   * Outrage: the scene goes dark, then a wall of purple and magenta dragon
   * fire rolls across the background from left to right, glowing hot behind
   * the raging caster, which flares with pulsing orange sparkles while the
   * target is battered.
   */
  private static async playOutrage(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1800;

    // 1. Darkness.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Magenta sky, a hot glow behind the caster and two rolling rows of flames.
    const fire = document.createElement('div');
    fire.style.cssText =
      'position:absolute;inset:0;overflow:hidden;' +
      `background:radial-gradient(circle at ${launch.x}px ${launch.y + H * 0.1}px,#FFF2A0,#FFC24A88 14%,#FFC24A00 32%),` +
      'linear-gradient(180deg,#E04E8C,#E070B0 45%,#C8A0E8)';
    dim.appendChild(fire);
    fire.appendChild(DragonMoveAnimations.flameRow(W, H, 0.95, '#8A1E62', 700));
    fire.appendChild(DragonMoveAnimations.flameRow(W, H, 0.6, '#B23A86', 520));
    await Fx.anim(fire, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The caster rages: pulsing orange sparkles; the target is battered.
    const rage = DragonMoveAnimations.rageSparkles(refs, launch, total - 300);
    for (let i = 0; i < 3; i++) setTimeout(() => { Fx.flash(targetEl, '#FF9A2A', 0.5); Fx.shake(targetEl, 5); }, 450 + i * 400);
    for (let i = 0; i < 5; i++) setTimeout(() => Fx.flash(launchEl, '#FF8A1A', 0.7), i * 300);
    await rage;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * A row of flame tongues along the bottom of the field, `reach` × field
   * height tall, scrolling endlessly left to right (`period` ms per flame)
   * and flickering. Lives until its layer is removed.
   */
  private static flameRow(W: number, H: number, reach: number, color: string, period: number): HTMLElement {
    const n = 7;
    const gap = W / n;
    const row = document.createElement('div');
    row.style.cssText = `position:absolute;left:${-gap}px;bottom:0;width:${W + gap * 2}px;height:${H}px`;
    for (let i = 0; i < n + 2; i++) {
      const h = H * reach * (0.7 + Math.random() * 0.3);
      const flame = document.createElement('div');
      flame.style.cssText = `position:absolute;left:${i * gap - gap * 0.15}px;bottom:${-H * 0.05}px;width:${gap * 1.3}px;height:${h}px;transform-origin:50% 100%`;
      flame.innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"><path d="M55 0C62 22 88 38 86 66C84 88 68 100 50 100C32 100 14 88 14 66C14 46 34 40 40 22C44 30 50 30 55 0Z" fill="${color}"/></svg>`;
      row.appendChild(flame);
      flame.animate(
        [{ transform: 'scale(1,1) skewX(0deg)' }, { transform: `scale(.92,1.12) skewX(${-6 - Math.random() * 6}deg)` }, { transform: 'scale(1,1) skewX(0deg)' }],
        { duration: 260 + Math.random() * 200, iterations: Infinity, easing: 'ease-in-out', delay: -Math.random() * 400 }
      );
    }
    // One flame gap per period: the row looks endless.
    row.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${gap}px)` }], { duration: period, iterations: Infinity, easing: 'linear' });
    return row;
  }

  /** Orange sparkles pop on and around the caster in pulses for `duration` ms. */
  private static async rageSparkles(refs: BattleStageRefs, launch: Point, duration: number): Promise<void> {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const pops: Promise<void>[] = [];
    const pulses = Math.round(duration / 300);
    for (let p = 0; p < pulses; p++) {
      for (let i = 0; i < 4; i++) {
        const star = FxGlyphs.sparkStar(12 + Math.random() * 14, i % 2 ? '#FF8A1A' : '#FFC24A');
        Fx.place(star, {
          x: launch.x + (Math.random() * 2 - 1) * r.width * 0.5,
          y: launch.y + (Math.random() * 2 - 1) * r.height * 0.5
        });
        fxEl.appendChild(star);
        pops.push(
          Fx.anim(star, [
            { transform: 'scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'scale(1.2) rotate(25deg)', opacity: 1, offset: 0.4 },
            { transform: 'scale(0) rotate(45deg)', opacity: 0 }
          ], { duration: 380, easing: 'ease-out', delay: Math.random() * 80 }).then(() => star.remove())
        );
      }
      await Fx.wait(300);
    }
    await Promise.all(pops);
  }
}
