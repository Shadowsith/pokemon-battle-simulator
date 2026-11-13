import { Point, BattleStageRefs } from '../../animation.types';
import { HEAT_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Fiery Dance, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/5/5d/Feuerreigen_Gen5.png
 *
 * The scene turns red-hot (0-0.3 s) while the user dances, swaying from side
 * to side with embers swirling up round it (0.1-0.7 s). Then fire bursts pop
 * up all over the target in two waves (0.7-1.05 s, 1.05-1.4 s, hit on the
 * first) while it glows red and tiny sparks rise; the heat fades (to ~1.95 s).
 */
export class FieryDance {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height, 60);
    const original = launchEl.style.transform;

    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    await Fx.wait(100);

    // The dance: a sway left and right, embers swirling up round the user.
    const sway = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)` },
      { transform: `${original} translate(-10px,-4px)`, offset: 0.25 },
      { transform: `${original} translate(10px,-4px)`, offset: 0.6 },
      { transform: `${original} translate(0,0)` }
    ], { duration: 600, easing: 'ease-in-out', fill: 'none' });
    const embers: Promise<void>[] = [sway];
    const rx = Math.max(lr.width * 0.5, 30);
    for (let i = 0; i < 10; i++) {
      const e = FxGlyphs.firePuff(8 + Math.random() * 6);
      Fx.place(e, { x: launch.x, y: launch.y + lr.height * 0.35 });
      fxEl.appendChild(e);
      const phase = (i / 10) * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const a = phase + (k / 6) * Math.PI * 1.5;
        frames.push({
          transform: `translate(${Math.sin(a) * rx}px,${-(k / 6) * lr.height * 0.8}px) scale(${1 - k / 9})`,
          opacity: k === 0 || k === 6 ? 0 : 1
        });
      }
      embers.push(Fx.anim(e, frames, { duration: 550, delay: i * 25, easing: 'linear' }).then(() => e.remove()));
    }
    await Promise.all(embers);

    // Fire bursts pop up all over the target.
    const burn = Fx.anim(targetEl, [
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg)' },
      { filter: 'sepia(.9) saturate(3) hue-rotate(-30deg)', offset: 0.2 },
      { filter: 'sepia(.9) saturate(3) hue-rotate(-30deg)', offset: 0.8 },
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg)' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });
    const bursts: Promise<void>[] = [burn];
    for (let wave = 0; wave < 2; wave++) {
      for (let i = 0; i < 6; i++) {
        const ang = Math.random() * Math.PI * 2;
        const d = size * (0.2 + Math.random() * 0.3);
        const at: Point = { x: target.x + Math.cos(ang) * d, y: target.y + Math.sin(ang) * d * 0.8 };
        const puff = FxGlyphs.firePuff(size * (0.22 + Math.random() * 0.15), i % 3 === 0 ? 'red' : 'hot');
        Fx.place(puff, at);
        fxEl.appendChild(puff);
        bursts.push(
          Fx.anim(puff, [
            { transform: 'scale(.2)', opacity: 0 },
            { transform: 'scale(1.15)', opacity: 1, offset: 0.35 },
            { transform: 'translateY(-10px) scale(1.3)', opacity: 0 }
          ], { duration: 380, delay: i * 40, easing: 'ease-out' }).then(() => puff.remove())
        );
        const spark = document.createElement('div');
        spark.style.cssText = 'position:absolute;width:4px;height:4px;border-radius:50%;pointer-events:none;background:#FFE07A;box-shadow:0 0 4px #FFB03A';
        Fx.place(spark, at);
        fxEl.appendChild(spark);
        bursts.push(
          Fx.anim(spark, [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: `translate(${(Math.random() * 2 - 1) * 10}px,-30px)`, opacity: 0 }
          ], { duration: 500, delay: 100 + i * 40, easing: 'ease-out' }).then(() => spark.remove())
        );
      }
      Fx.shake(targetEl, wave ? 3 : 5);
      await Fx.wait(350);
    }
    await Promise.all(bursts);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    heat.remove();
  }
}
