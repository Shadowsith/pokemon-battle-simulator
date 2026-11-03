import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Fire-type status and weather moves. */
export class FireStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    sunnyday: (refs) => FireStatusMoveAnimations.playSunnyDay(refs)
  };

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
