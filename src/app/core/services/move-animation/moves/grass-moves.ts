import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { FLECK_COLOR } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Grass-type moves. */
export class GrassMoveAnimations {
  /** Hand-made Grass move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    absorb: (refs, launch, target) => GrassMoveAnimations.playAbsorb(refs, launch, target)
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
}
