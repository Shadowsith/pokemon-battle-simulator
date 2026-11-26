import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The bees swarm in until `WALL` (ms); the red shield flashes at `WALL`. */
const WALL = 800;
const BEES = 16;

/**
 * Defend Order, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/cd/Blockbefehl_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/01/Blockbefehl_Gen5.png
 *
 * A swarm of little bees buzzes in from off-field and gathers round the
 * user in a beige cloud, forming a living wall (0-0.8 s). The user flashes
 * red inside a red ring of light (0.8-1.1 s); then its Defense and Sp. Def
 * rise: orange bands scroll up over it (1.15-1.95 s).
 */
export class DefendOrder {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const f = Fx.rect(fieldEl);
    const r = Fx.rect(launchEl);
    const effects: Promise<void>[] = [];
    effects.push(Fx.wait(300).then(() => FxEffects.smokeCloud(fxEl, launch, r.width * 0.9, r.height * 0.8, ['#E8D4B0', '#C8A878'], 8, 500, 250)));
    for (let i = 0; i < BEES; i++) {
      const a = (i / BEES) * Math.PI * 2;
      const from: Point = { x: f.width * (i % 2 ? 1.05 : -0.05), y: f.height * (0.1 + ((i * 7) % 10) / 14) };
      const rest: Point = { x: launch.x + Math.cos(a) * r.width * 0.45, y: launch.y + Math.sin(a) * r.height * 0.4 };
      const bee = FxGlyphs.beeGlyph(10 + (i % 3) * 2);
      effects.push(Fx.spawn(fxEl, bee, rest, [
        { transform: `translate(${from.x - rest.x}px,${from.y - rest.y}px)`, opacity: 0 },
        { transform: `translate(${(from.x - rest.x) * 0.4}px,${(from.y - rest.y) * 0.4 - 15}px)`, opacity: 1, offset: 0.35 },
        { transform: 'translate(0,0)', opacity: 1, offset: 0.7 },
        { transform: 'translate(3px,-2px)', opacity: 1, offset: 0.8 },
        { transform: 'translate(-3px,1px)', opacity: 1, offset: 0.9 },
        { transform: 'translate(0,0)', opacity: 0 }
      ], { duration: WALL + 300, delay: (i * 37) % 200, easing: 'ease-out' }));
    }
    effects.push(Fx.wait(WALL).then(() => {
      const s = Math.max(r.width, r.height, 60) * 0.9;
      return Promise.all([
        Fx.glow(launchEl, 'brightness(.9) sepia(1) saturate(6) hue-rotate(-50deg)', 300),
        Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;border:4px solid #FF3A3A;box-shadow:0 0 10px #FF3A3A,inset 0 0 10px #FF3A3A'), launch, [
          { transform: 'scale(.6)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1)', opacity: 0 }
        ], { duration: 300, easing: 'ease-out' })
      ]).then(() => void 0);
    }));
    await Promise.all(effects);
    await FxEffects.statUpAura(refs, launch);
  }
}
