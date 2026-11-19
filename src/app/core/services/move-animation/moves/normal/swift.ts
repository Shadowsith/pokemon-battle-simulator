import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Swift, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/da/Sternschauer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/fe/Sternschauer_Gen5.png
 *
 * The scene darkens (0-0.2 s) and a stream of eight spinning yellow-white
 * stars, trailing sparkles, flies from the user to the target (one every
 * 0.06 s, 0.4 s each, 0.2-1.02 s). Each bursts on the target in yellow ring
 * sparkles (from the hit at 0.6 s to ~1.3 s), then the dark lifts
 * (1.3-1.5 s).
 */
export class Swift {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const effects: Promise<unknown>[] = [];
    for (let i = 0; i < 8; i++) {
      const delay = i * 60;
      const wob = (Math.random() * 2 - 1) * 16;
      const size = 16 + Math.random() * 8;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        frames.push({ transform: `translate(${dx * t}px,${dy * t + Math.sin(t * Math.PI) * wob}px) rotate(${t * 540}deg) scale(${0.6 + t * 0.5})`, opacity: t === 0 ? 0 : 1 });
      }
      effects.push(Fx.spawn(fxEl, FxGlyphs.fivePointStar(size, '#FFE04A', '#ffffff', '#FFF2A0'), launch, frames, { duration: 400, delay, easing: 'linear' }));
      // A few sparkles are left behind along the path.
      for (let k = 1; k <= 2; k++) {
        const t = k / 3;
        effects.push(
          Fx.spawn(fxEl, FxGlyphs.sparkStar(8, '#FFF6B0'), { x: launch.x + dx * t, y: launch.y + dy * t + wob * 0.8 }, [
            { transform: 'scale(0)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1, offset: 0.3 },
            { transform: 'scale(.3)', opacity: 0 }
          ], { duration: 300, delay: delay + t * 400, easing: 'ease-out' })
        );
      }
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * r.width * 0.25, y: target.y + (Math.random() * 2 - 1) * r.height * 0.25 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.ringSparkle(Math.max(r.width * 0.35, 24), '#FFE04A', '#F8C020'), at, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 0 }
        ], { duration: 300, delay: delay + 400, easing: 'ease-out' })
      );
    }
    await Fx.wait(400);
    Fx.flash(targetEl, '#FFE84A', 0.5);
    Fx.shake(targetEl, 4);
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }
}
