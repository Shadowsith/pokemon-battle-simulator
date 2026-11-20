import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** When the coils squeeze tight, ms from the start. */
const SQUEEZES = [400, 700, 1000];

/**
 * Wrap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b6/Wickel_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/cc/Wickel_Gen5.png
 *
 * A pale cloudy band swirls in above the target (0-0.3 s) and three teal
 * coils drop down round its body (0.1-0.35 s). They squeeze tight three times
 * (0.4, 0.7 and 1.0 s; hit at 0.4 s): the target is squashed and flashes
 * yellow each time. Then the coils loosen and fade (1.15-1.35 s).
 */
export class Wrap {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.05, 64);
    const h = Math.max(r.height, 56);
    const total = 1350;

    const cloud = FxEffects.smokePuff(fxEl, { x: target.x, y: target.y - h * 0.5 }, w * 0.9, ['#F4F2EA', '#D8D4C4']);

    const coils = [-0.28, 0, 0.28].map((rel, i) => {
      const cw = w * (1 - Math.abs(rel) * 0.45);
      const coil = Fx.box(cw, cw * 0.26, 'border-radius:50%;border:4px solid #5ED8D0;box-shadow:0 0 8px #A8FFF6,inset 0 0 6px #A8FFF6');
      Fx.place(coil, { x: target.x, y: target.y + rel * h });
      fxEl.appendChild(coil);
      const frames: Keyframe[] = [
        { transform: `translateY(${-h * 0.45}px) scale(1.4)`, opacity: 0 },
        { transform: 'translateY(0) scale(1.1)', opacity: 1, offset: (100 + 250) / total }
      ];
      for (const t of SQUEEZES) {
        frames.push({ transform: 'scale(1.05)', opacity: 1, offset: (t - 60) / total });
        frames.push({ transform: 'scaleX(.8) scaleY(.9)', opacity: 1, offset: t / total });
        frames.push({ transform: 'scale(1)', opacity: 1, offset: (t + 140) / total });
      }
      frames.push({ transform: 'scale(1.05)', opacity: 1, offset: 1150 / total });
      frames.push({ transform: 'translateY(6px) scale(1.35)', opacity: 0 });
      return Fx.anim(coil, frames, { duration: total, easing: 'ease-in-out', delay: i * 30 }).then(() => coil.remove());
    });

    const original = targetEl.style.transform;
    const squash: Keyframe[] = [{ transform: original }];
    for (const t of SQUEEZES) {
      squash.push({ transform: original, offset: (t - 60) / total });
      squash.push({ transform: `${original} scaleX(.88)`, offset: t / total });
      squash.push({ transform: original, offset: (t + 160) / total });
    }
    squash.push({ transform: original });
    for (const t of SQUEEZES) setTimeout(() => Fx.flash(targetEl, '#FFE860', 0.45), t);
    const squeeze = Fx.anim(targetEl, squash, { duration: total, easing: 'ease-in-out', fill: 'none' });

    await Promise.all([cloud, squeeze, ...coils]);
  }
}
