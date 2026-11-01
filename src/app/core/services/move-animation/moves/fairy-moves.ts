import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Fairy-type moves. */
export class FairyMoveAnimations {
  /** Hand-made Fairy move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    moonlight: (refs, launch) => FairyMoveAnimations.playMoonlight(refs, launch)
  };

  /**
   * Moonlight: the scene goes dark, then a dark-grey night sky fades in with a
   * full moon slowly rising while yellow stars twinkle down; the night clears
   * and green HP sparkles show the heal.
   */
  private static async playMoonlight(refs: BattleStageRefs, launch: Point) {
    const { fieldEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;

    // 1. Darkness.
    const dark = Fx.backdrop(fieldEl, 'background:#050508');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Dark-grey night sky with the moon rising and stars falling.
    const sky = document.createElement('div');
    sky.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 40% 40%,#55555C,#3A3A40 70%)';
    dark.appendChild(sky);
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const rise = 1700;
    const size = Math.min(W, H) * 0.42;
    const moon = FairyMoveAnimations.moonGlyph(size);
    Fx.place(moon, { x: W * 0.42, y: H * 0.42 });
    sky.appendChild(moon);
    const moonDone = Fx.anim(moon, [
      { transform: `translateY(${H * 0.22}px)`, opacity: 0 },
      { transform: `translateY(${H * 0.12}px)`, opacity: 1, offset: 0.25 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: rise, easing: 'ease-out', fill: 'forwards' });

    const stars: Promise<void>[] = [];
    for (let i = 0; i < 22; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 12, '#F6E04A');
      Fx.place(star, { x: Math.random() * W, y: Math.random() * H * 0.7 });
      sky.appendChild(star);
      const fall = H * (0.15 + Math.random() * 0.2);
      stars.push(
        Fx.anim(star, [
          { transform: 'translateY(0) scale(.3)', opacity: 0 },
          { transform: `translateY(${fall * 0.3}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translateY(${fall * 0.7}px) scale(.8)`, opacity: 1, offset: 0.7 },
          { transform: `translateY(${fall}px) scale(.3)`, opacity: 0 }
        ], { duration: 900 + Math.random() * 400, easing: 'linear', delay: Math.random() * (rise - 900) }).then(() => star.remove())
      );
    }
    await Promise.all([moonDone, ...stars]);

    // 3. The night clears, then the heal.
    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' });
    dark.remove();
    await FxEffects.healSparkles(refs, launch);
  }

  /** A pale, glowing full moon `size` px across with soft grey craters. */
  private static moonGlyph(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle at 32% 38%,#B9B7A4 0 9%,#B9B7A400 11%),' +
      'radial-gradient(circle at 58% 62%,#BFBDAA 0 13%,#BFBDAA00 15%),' +
      'radial-gradient(circle at 68% 30%,#C6C4B0 0 7%,#C6C4B000 9%),' +
      'radial-gradient(circle at 40% 75%,#C8C6B2 0 6%,#C8C6B200 8%),' +
      'radial-gradient(circle at 45% 40%,#F6F4E8,#DEDCCA 60%,#C2C0AC);' +
      `box-shadow:0 0 ${size * 0.25}px #FFFBD8aa,0 0 ${size * 0.6}px #FFFBD844`;
    return el;
  }
}
