import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Fighting-type status moves (protection, setup). */
export class FightingStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    bulkup: (refs, launch) => FightingStatusMoveAnimations.playBulkUp(refs, launch),
    detect: (refs, launch) => FightingStatusMoveAnimations.playDetect(refs, launch)
  };

  /**
   * Detect: the scene goes dark, a single cyan sparkle in a glowing ring
   * flashes up at the caster's head - its eye catching the attack coming -
   * and the caster glows white for a moment.
   */
  private static async playDetect(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const head: Point = { x: launch.x + r.width * 0.08, y: r.top - Fx.rect(fieldEl).top + r.height * 0.25 };

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The sparkle flares up (0.3-0.9 s) while the caster glows white (~0.45-0.85 s).
    const sparkle = FxGlyphs.ringSparkle(Math.max(r.width * 0.45, 40), '#3FD8F0', '#C8F6FF');
    Fx.place(sparkle, head);
    fxEl.appendChild(sparkle);
    const flare = Fx.anim(sparkle, [
      { transform: 'scale(0) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.3) rotate(30deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.4) rotate(70deg)', opacity: 0 }
    ], { duration: 800, easing: 'ease-out' }).then(() => sparkle.remove());
    await Fx.wait(150);
    await Fx.anim(launchEl, [
      { filter: 'brightness(1)' },
      { filter: 'brightness(2.4) saturate(0) drop-shadow(0 0 8px #ffffff)', offset: 0.35 },
      { filter: 'brightness(1)' }
    ], { duration: 400, easing: 'ease-out', fill: 'none' });
    await flare;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Bulk Up: the user swells up, pumping on each flex beat of the sound
   * (0.03 / 0.28 / 0.53 s), shrinks back, then orange stat sparkles drift
   * down over it (from 0.8 s, with the stat-up jingle).
   */
  private static async playBulkUp(refs: BattleStageRefs, launch: Point) {
    const { launchEl } = refs;
    const r = Fx.rect(launchEl);
    launchEl.style.transformOrigin = 'center bottom';
    await Fx.anim(launchEl, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.14)', offset: 0.18 },
      { transform: 'scale(1.1)', offset: 0.3 },
      { transform: 'scale(1.17)', offset: 0.45 },
      { transform: 'scale(1.13)', offset: 0.6 },
      { transform: 'scale(1.2)', offset: 0.75 },
      { transform: 'scale(1)' }
    ], { duration: 800, easing: 'ease-in-out' });
    launchEl.style.transformOrigin = '';
    await FxEffects.orangeSparkles(refs, launch, launch.y - r.height / 2);
  }
}
