import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Retaliate, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/5/5f/Heimzahlung_Gen5.png
 *
 * The user glows yellow while yellow dust swirls up round its feet
 * (0-0.5 s), then darts at the target (0.5-0.76 s). At the hit (0.62 s)
 * yellow spiky bursts pop round the target one after another (to ~1.2 s)
 * while the dust settles behind the user.
 */
export class Retaliate {
  private static readonly DUST: [string, string] = ['#F4DC6A', '#C8A83A'];

  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const foot: Point = { x: launch.x, y: launch.y + lr.height * 0.35 };
    const dustSize = Math.max(lr.width, 60);

    // Yellow glow and dust round the user.
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'sepia(.6) saturate(2.5) brightness(1.15) drop-shadow(0 0 8px #F4D84A)', offset: 0.35 },
        { filter: 'sepia(.6) saturate(2.5) brightness(1.15) drop-shadow(0 0 8px #F4D84A)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 800, fill: 'none' }),
      FxEffects.smokePuff(fxEl, foot, dustSize, Retaliate.DUST),
      Fx.wait(220).then(() => FxEffects.smokePuff(fxEl, { x: foot.x - v.dir * 14, y: foot.y - 10 }, dustSize * 0.9, Retaliate.DUST))
    ];
    await Fx.wait(500);

    // The user darts in; spiky bursts pop round the target.
    effects.push(FxEffects.dart(launchEl, v.dir), FxEffects.smokePuff(fxEl, foot, dustSize * 1.2, Retaliate.DUST));
    await Fx.wait(120);
    Fx.flash(targetEl, '#FFE84A', 0.6);
    Fx.shake(targetEl, 6);
    for (let i = 0; i < 5; i++) {
      const s = Math.max(tr.width * 0.38, 26) * (0.8 + Math.random() * 0.4);
      const burst = FxGlyphs.spikyBurst(s, '#F8D020', '#FFF27A');
      Fx.place(burst, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.35 });
      fxEl.appendChild(burst);
      effects.push(
        Fx.anim(burst, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.6) rotate(35deg)', opacity: 0 }
        ], { duration: 320, delay: i * 70, easing: 'ease-out', fill: 'backwards' }).then(() => burst.remove())
      );
    }
    await Promise.all(effects);
  }
}
