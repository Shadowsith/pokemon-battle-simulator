import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Blue Flare, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/8/82/Blauflammen_Gen5.png
 *
 * The scene goes black (0-0.3 s). Blue flames flare up all over the target in
 * three waves (0.3-0.65 s, 0.65-1.0 s, 1.0-1.35 s, hit on the first wave)
 * while the target glows orange-red as it burns; the last flames die down
 * and the black lifts (to ~1.9 s).
 */
export class BlueFlare {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height, 60);

    const dark = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    const burn = Fx.anim(targetEl, [
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg) brightness(1)' },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(-25deg) brightness(.95)', offset: 0.2 },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(-25deg) brightness(.95)', offset: 0.8 },
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg) brightness(1)' }
    ], { duration: 1500, easing: 'ease-in-out', fill: 'none' });

    const flames: Promise<void>[] = [burn];
    for (let wave = 0; wave < 3; wave++) {
      const count = wave === 1 ? 9 : 7;
      for (let i = 0; i < count; i++) {
        const s = size * (0.25 + Math.random() * 0.25);
        const puff = FxGlyphs.firePuff(s, 'blue');
        puff.style.filter = 'drop-shadow(0 0 6px #3AB4FF)';
        const ang = Math.random() * Math.PI * 2;
        const d = size * (wave === 1 ? 0.15 : 0.3 + Math.random() * 0.4);
        Fx.place(puff, { x: target.x + Math.cos(ang) * d, y: target.y + Math.sin(ang) * d * 0.8 });
        fxEl.appendChild(puff);
        const rot = Math.random() * 180;
        flames.push(
          Fx.anim(puff, [
            { transform: `rotate(${rot}deg) scale(.2)`, opacity: 0 },
            { transform: `rotate(${rot + 60}deg) scale(1.1)`, opacity: 1, offset: 0.35 },
            { transform: `translateY(-14px) rotate(${rot + 140}deg) scale(1.3)`, opacity: 0 }
          ], { duration: 450 + Math.random() * 150, delay: Math.random() * 150, easing: 'ease-out' }).then(() => puff.remove())
        );
      }
      if (wave === 0) Fx.shake(targetEl, 5);
      if (wave === 1) Fx.flash(targetEl, '#7FE2FF', 0.6);
      await Fx.wait(350);
    }
    await Promise.all(flames);

    await Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dark.remove();
  }
}
