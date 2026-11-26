import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The bees arrive by `SWARM` (ms); the green cloud billows from then on. */
const SWARM = 550;
const BEES = 12;

/**
 * Heal Order, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/d8/Heilbefehl_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/bb/Heilbefehl_Gen5.png
 *
 * Little bees buzz in from off-field and settle round the user
 * (0-0.55 s). A soft green cloud billows up over it (0.55-1.3 s) and cyan
 * sparkles twinkle round it as the bees leave (0.9-1.35 s); then it
 * recovers HP with green heal sparkles (1.35-2.25 s).
 */
export class HealOrder {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const f = Fx.rect(fieldEl);
    const r = Fx.rect(launchEl);
    const effects: Promise<void>[] = [
      Fx.wait(SWARM).then(() => FxEffects.smokeCloud(fxEl, launch, r.width * 0.9, r.height * 0.8, ['#A8F0A8', '#5AC85A'], 10, 550, 250)),
      Fx.glow(launchEl, 'brightness(1.1) sepia(.6) hue-rotate(60deg) saturate(2)', 600, SWARM + 150)
    ];
    for (let i = 0; i < BEES; i++) {
      const a = (i / BEES) * Math.PI * 2;
      const from: Point = { x: f.width * (i % 2 ? 1.05 : -0.05), y: f.height * (0.1 + ((i * 7) % 10) / 14) };
      const rest: Point = { x: launch.x + Math.cos(a) * r.width * 0.45, y: launch.y + Math.sin(a) * r.height * 0.4 };
      effects.push(Fx.spawn(fxEl, FxGlyphs.beeGlyph(10 + (i % 3) * 2), rest, [
        { transform: `translate(${from.x - rest.x}px,${from.y - rest.y}px)`, opacity: 0 },
        { transform: `translate(${(from.x - rest.x) * 0.4}px,${(from.y - rest.y) * 0.4 - 15}px)`, opacity: 1, offset: 0.3 },
        { transform: 'translate(0,0)', opacity: 1, offset: 0.55 },
        { transform: 'translate(2px,-3px)', opacity: 1, offset: 0.75 },
        { transform: `translate(${(from.x - rest.x) * 0.3}px,-30px)`, opacity: 0 }
      ], { duration: 1200, delay: (i * 37) % 150, easing: 'ease-in-out' }));
    }
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: launch.x + (((i * 5) % 7) / 6 - 0.5) * r.width * 0.8, y: launch.y + (((i * 3) % 5) / 4 - 0.5) * r.height * 0.7 };
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.15, 10), '#9AF4FF'), at, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 350, delay: 900 + i * 50, easing: 'ease-out' }));
    }
    await Promise.all(effects);
    await FxEffects.healSparkles(refs, launch);
  }
}
