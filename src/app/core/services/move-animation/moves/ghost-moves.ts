import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { Fx } from '../fx';

/** Hand-made animations for Ghost-type moves. */
export class GhostMoveAnimations {
  /** Hand-made Ghost move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    nightshade: (refs, launch) => GhostMoveAnimations.playNightShade(refs, launch)
  };

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
