import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Healing Wish's pale cyan glow and its white-cyan sparkles. */
const GLOW = '#9AF0FF';

/**
 * Healing Wish, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/2f/Heilopfer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/18/Heilopfer_Gen5.png
 *
 * The scene goes dark (0-0.3 s). A pale cyan glowing sphere with a swirling
 * ring wraps the user while cross-shaped sparkles twinkle above it
 * (0.3-1.1 s). The user flares white and the sphere shrinks into a single
 * sparkle that rises out of sight (1.1-1.85 s); the scene clears
 * (to ~2.15 s). The user faints right after (the wish heals the next one).
 */
export class HealingWish {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const size = Math.max(lr.width, lr.height) * 1.2;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The sphere and its swirling ring wrap the user; sparkles twinkle above.
    const sphere = document.createElement('div');
    sphere.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff00 0 35%,${GLOW}55 60%,#E8FCFF99 72%,${GLOW}00 76%)`;
    Fx.place(sphere, launch);
    fxEl.appendChild(sphere);
    const swirl = document.createElement('div');
    swirl.style.cssText = `position:absolute;width:${size * 0.85}px;height:${size * 0.85}px;border-radius:50%;pointer-events:none;background:conic-gradient(from 0deg,#ffffff00,${GLOW}aa 25%,#ffffff00 50%,${GLOW}aa 75%,#ffffff00);-webkit-mask:radial-gradient(circle,#0000 0 45%,#000 55%,#000 68%,#0000 72%);mask:radial-gradient(circle,#0000 0 45%,#000 55%,#000 68%,#0000 72%)`;
    Fx.place(swirl, launch);
    fxEl.appendChild(swirl);
    const glowIn = Promise.all([
      Fx.anim(sphere, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 400, easing: 'ease-out', fill: 'forwards' }),
      Fx.anim(swirl, [{ transform: 'rotate(0deg)', opacity: 0 }, { transform: 'rotate(120deg)', opacity: 1 }], { duration: 400, easing: 'ease-out', fill: 'forwards' })
    ]);
    const spin = swirl.animate([{ transform: 'rotate(120deg)' }, { transform: 'rotate(480deg)' }], { duration: 900, delay: 400, iterations: Infinity });
    const twinkles: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const star = FxGlyphs.ringSparkle(14 + Math.random() * 8, GLOW, '#ffffff');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * size * 0.4, y: launch.y - size * (0.25 + Math.random() * 0.35) });
      fxEl.appendChild(star);
      twinkles.push(
        Fx.anim(star, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1.1)', opacity: 1, offset: 0.4 },
          { transform: 'translateY(-16px) scale(.3)', opacity: 0 }
        ], { duration: 500, delay: 100 + i * 80, easing: 'ease-in-out', fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all([glowIn, ...twinkles]);

    // The user glows white; the sphere shrinks into one sparkle that rises away.
    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1)', opacity: 1 },
      { filter: 'brightness(3) drop-shadow(0 0 10px #ffffff)', opacity: 0.6, offset: 0.35 },
      { filter: 'brightness(3) drop-shadow(0 0 10px #ffffff)', opacity: 0.6, offset: 0.7 },
      { filter: 'brightness(1)', opacity: 1 }
    ], { duration: 750, easing: 'ease-in-out', fill: 'none' });
    await Promise.all([
      Fx.anim(sphere, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.15)', opacity: 0.6 }], { duration: 350, easing: 'ease-in' }),
      Fx.anim(swirl, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' })
    ]);
    spin.cancel();
    sphere.remove();
    swirl.remove();
    const soul = FxGlyphs.sparkStar(22, GLOW);
    Fx.place(soul, launch);
    fxEl.appendChild(soul);
    await Promise.all([
      glow,
      Fx.anim(soul, [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: `translateY(${-launch.y - 30}px) scale(.6)`, opacity: 0.8 }
      ], { duration: 400, easing: 'ease-in' }).then(() => soul.remove())
    ]);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }
}
