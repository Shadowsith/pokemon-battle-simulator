import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Rock Polish, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5e/Steinpolitur_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/9/96/Steinpolitur_Gen5.png
 *
 * The scene darkens (0-0.25 s). Three white shine streaks sweep across the
 * user while pink sparkles twinkle on it (0.25-1.13 s). The scene clears
 * (1.13-1.38 s) and orange stat sparkles drift down over the user (1.38-2.6 s).
 */
export class RockPolish {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const len = Math.max(r.width * 1.3, 80);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' });

    const parts: Promise<void>[] = [];
    // Shine streaks: thin white lines that cross the user diagonally, each a little lower.
    for (let i = 0; i < 3; i++) {
      const line = document.createElement('div');
      line.style.cssText = `position:absolute;width:${len}px;height:3px;pointer-events:none;border-radius:2px;background:linear-gradient(90deg,#ffffff00,#ffffff 50%,#ffffff00);box-shadow:0 0 6px #ffffff`;
      Fx.place(line, { x: launch.x, y: launch.y + (i - 1) * r.height * 0.2 });
      fxEl.appendChild(line);
      const deg = -25 + i * 8;
      parts.push(
        Fx.anim(line, [
          { transform: `rotate(${deg}deg) translateX(${-len * 0.6}px) scaleX(.3)`, opacity: 0 },
          { transform: `rotate(${deg}deg) translateX(0) scaleX(1)`, opacity: 1, offset: 0.5 },
          { transform: `rotate(${deg}deg) translateX(${len * 0.6}px) scaleX(.3)`, opacity: 0 }
        ], { duration: 280, delay: i * 240, easing: 'ease-in-out' }).then(() => line.remove())
      );
      setTimeout(() => Fx.flash(launchEl, '#ffffff', 0.35), i * 240 + 140);
    }
    // Pink sparkles twinkle on the polished surface.
    for (let i = 0; i < 7; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 8, '#FF9AD8');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * r.width * 0.4, y: launch.y + (Math.random() * 2 - 1) * r.height * 0.35 });
      fxEl.appendChild(star);
      parts.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(45deg)', opacity: 0 }
        ], { duration: 300, delay: 100 + i * 80, easing: 'ease-out', fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all(parts);

    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();

    await FxEffects.orangeSparkles(refs, launch, r.top - f.top + r.height * 0.15);
  }
}
