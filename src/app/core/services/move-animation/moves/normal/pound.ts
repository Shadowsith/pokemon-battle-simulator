import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Pound, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/30/Klaps_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/eb/Klaps_Gen5.png
 *
 * The user darts in (0-0.26 s) and smacks the target (hit at 0.12 s): a yellow
 * spiky burst flares on it, yellow stars fly out round it and turn into
 * orange specks that drift down and fade (to ~0.75 s).
 */
export class Pound {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const at: Point = { x: target.x - v.dir * r.width * 0.08, y: target.y - r.height * 0.1 };
    const size = Math.max(r.width * 0.55, 38);
    const dart = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);

    Fx.flash(targetEl, '#FFE84A', 0.45);
    Fx.shake(targetEl, 4);
    const effects: Promise<unknown>[] = [
      dart,
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(size, '#F8C820', '#FFEA5A', '#ffffff'), at, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' })
    ];
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7 + Math.random() * 0.4;
      const d = size * (0.6 + Math.random() * 0.4);
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d * 0.8;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 4, '#FFE04A'), at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1 }
        ], { duration: 220, easing: 'ease-out' }).then(() =>
          Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#FF9A30;box-shadow:0 0 4px #FF7A10'), { x: at.x + x, y: at.y + y }, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${x * 0.2}px,18px)`, opacity: 0 }
          ], { duration: 400, easing: 'ease-in' })
        )
      );
    }
    await Promise.all(effects);
  }
}
