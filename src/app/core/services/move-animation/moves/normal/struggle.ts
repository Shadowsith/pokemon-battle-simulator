import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Struggle, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/11/Verzweifler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/34/Verzweifler_Gen5.png
 *
 * The user lunges at the target (0-0.26 s; hit at 0.12 s) and a cluster of
 * yellow stars pops and twinkles all over it (0.12-0.6 s). Then the recoil
 * hurts the user: it flashes red and shudders (0.65-0.95 s).
 */
export class Struggle {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dart = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);

    Fx.shake(targetEl, 4);
    const effects: Promise<unknown>[] = [dart];
    for (let i = 0; i < 7; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * r.width * 0.32, y: target.y + (Math.random() * 2 - 1) * r.height * 0.3 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(12 + Math.random() * 8, '#FFE04A'), at, [
          { transform: 'scale(0) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(.7) rotate(40deg)', opacity: 0.8, offset: 0.65 },
          { transform: 'scale(1) rotate(55deg)', opacity: 0 }
        ], { duration: 360, delay: i * 18, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);

    // Recoil: the user is hurt by its own blow.
    await Fx.wait(50);
    Fx.flash(launchEl, '#FF5A4A', 0.55);
    Fx.shake(launchEl, 4);
    await Fx.wait(300);
  }
}
