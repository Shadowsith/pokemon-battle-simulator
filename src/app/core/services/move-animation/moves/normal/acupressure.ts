import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The finger pokes the user at these moments (ms). */
const POKES = [450, 750];

/**
 * Acupressure, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f1/Akupressur_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/19/Akupressur_Gen5.png
 *
 * The user flashes white (0-0.25 s). A black hand with a pointing finger
 * appears above it (0.2-0.4 s) and jabs it twice (0.45 s and 0.75 s); each
 * jab makes the user light up yellow with a white spark. The hand fades
 * (0.9-1.1 s) while the user keeps a yellow glow, then a stat rises: orange
 * bands scroll up over it (1.1-1.9 s).
 */
export class Acupressure {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.32, 22);
    const top = launch.y - r.height * 0.15;
    const effects: Promise<void>[] = [Fx.glow(launchEl, 'brightness(2.2) saturate(0)', 250)];

    // The glyph points up; turning it over makes the finger point down at the user (only the effect turns).
    const hand = FxGlyphs.pointingHandGlyph(w, '#1E1E24', '#ffffff');
    const rise = -r.height * 0.35;
    const frames: Keyframe[] = [
      { transform: `translateY(${rise - 12}px) rotate(180deg)`, opacity: 0, offset: 0 },
      { transform: `translateY(${rise}px) rotate(180deg)`, opacity: 1, offset: 0.2 }
    ];
    const total = 1100;
    for (const at of POKES) {
      frames.push(
        { transform: `translateY(${rise}px) rotate(180deg)`, opacity: 1, offset: (at - 200) / total },
        { transform: `translateY(${rise + 14}px) rotate(180deg)`, opacity: 1, offset: at / total },
        { transform: `translateY(${rise}px) rotate(180deg)`, opacity: 1, offset: (at + 100) / total }
      );
    }
    frames.push(
      { transform: `translateY(${rise}px) rotate(180deg)`, opacity: 1, offset: 0.82 },
      { transform: `translateY(${rise - 8}px) rotate(180deg)`, opacity: 0, offset: 1 }
    );
    effects.push(Fx.spawn(fxEl, hand, { x: launch.x, y: top }, frames, { duration: total, easing: 'ease-in-out' }));

    for (const at of POKES) {
      effects.push(Fx.wait(at).then(() => Promise.all([
        Fx.glow(launchEl, 'brightness(1.5) sepia(1) saturate(4) hue-rotate(5deg)', 280),
        Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.25, 14), '#ffffff'), { x: launch.x, y: top + r.height * 0.1 }, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 260, easing: 'ease-out' })
      ]).then(() => void 0)));
    }
    effects.push(Fx.wait(POKES[1] + 280).then(() => Fx.glow(launchEl, 'brightness(1.3) sepia(1) saturate(3)', 400)));
    await Promise.all(effects);
    await FxEffects.statUpAura(refs, launch);
  }
}
