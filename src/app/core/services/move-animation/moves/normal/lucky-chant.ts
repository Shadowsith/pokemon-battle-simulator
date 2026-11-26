import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The stars gather until `GATHER` (ms); the pink ring flares at `GATHER`. */
const GATHER = 650;
const STARS = 10;

/**
 * Lucky Chant, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/56/Beschw%C3%B6rung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e6/Beschw%C3%B6rung_Gen5.png
 *
 * Pink and white sparkle stars twinkle in round the user and swirl in
 * towards it (0-0.65 s). A pink ring of light swells round it and the user
 * glows a soft pale pink (0.65-1.25 s) while a last few stars twinkle.
 */
export class LuckyChant {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const reach = Math.max(r.width, r.height, 60) * 0.6;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < STARS; i++) {
      const a = (i / STARS) * Math.PI * 2;
      const b = a + 1.2;
      const s = Math.max(r.width * 0.15, 10) * (0.8 + (i % 3) * 0.2);
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(s, i % 3 ? '#FF7AD0' : '#ffffff'), launch, [
        { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach * 0.8}px) scale(0) rotate(0deg)`, opacity: 0 },
        { transform: `translate(${Math.cos(a + 0.6) * reach * 0.8}px,${Math.sin(a + 0.6) * reach * 0.65}px) scale(1) rotate(45deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${Math.cos(b) * reach * 0.35}px,${Math.sin(b) * reach * 0.3}px) scale(.6) rotate(90deg)`, opacity: 0 }
      ], { duration: 550, delay: (i * 43) % 150, easing: 'ease-in-out' }));
    }
    effects.push(Fx.wait(GATHER).then(() => {
      const s = Math.max(r.width, r.height, 60) * 0.9;
      const parts: Promise<void>[] = [
        Fx.glow(launchEl, 'brightness(1.4) sepia(.4) hue-rotate(290deg) saturate(2)', 600),
        Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;border:4px solid #FF8AD8;box-shadow:0 0 10px #FF6AC8,inset 0 0 8px #FF9AE0'), launch, [
          { transform: 'scale(.5)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.2)', opacity: 0 }
        ], { duration: 550, easing: 'ease-out' })
      ];
      for (let i = 0; i < 4; i++) {
        parts.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(10, '#FFB0E8'), { x: launch.x + (i - 1.5) * r.width * 0.3, y: launch.y - r.height * 0.3 + (i % 2) * r.height * 0.4 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 300, delay: 150 + i * 70, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
