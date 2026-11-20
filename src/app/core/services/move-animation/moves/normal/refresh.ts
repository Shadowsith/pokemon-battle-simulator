import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many green sparkles twinkle round the user. */
const SPARKLES = 10;
/** The green ring of light flares round the user at `RING` (ms). */
const RING = 400;

/**
 * Refresh, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/05/Heilung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/d0/Heilung_Gen5.png
 *
 * A pale pink-white wash brightens the scene (0-1.15 s). Green sparkles
 * twinkle all round the user (0-0.9 s), a glowing green ring of light
 * swells round it and fades (0.4-0.95 s), and the user shines white for a
 * moment as its status is cleansed (0.95-1.15 s).
 */
export class Refresh {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl, screenFxEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    Fx.screenWash(screenFxEl, '#FFE8F0aa', 250, 900, `${(launch.x / Fx.rect(refs.fieldEl).width) * 100}%`);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < SPARKLES; i++) {
      const a = (Math.PI * 2 * i) / SPARKLES + (i % 2) * 0.3;
      const d = w * (0.45 + (i % 3) * 0.15);
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + (i % 3) * 4, '#7AF07A'), { x: launch.x + Math.cos(a) * d, y: launch.y + Math.sin(a) * d * 0.8 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 380, delay: (i * 53) % 520, easing: 'ease-out' }));
    }
    const ring = Fx.box(w * 1.3, w * 1.3, 'border-radius:50%;background:radial-gradient(circle,#B8FF9A00 40%,#7AF05Acc 55%,#3AC83A88 65%,#3AC83A00 75%)');
    effects.push(Fx.spawn(fxEl, ring, launch, [
      { transform: 'scale(.4)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.25)', opacity: 0 }
    ], { duration: 550, delay: RING, easing: 'ease-out' }));
    effects.push(Fx.glow(launchEl, 'brightness(1.8)', 200, RING + 550));
    await Promise.all(effects);
  }
}
