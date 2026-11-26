import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The scene darkens from `DARK` (ms); the target goes dark until `END` (ms). */
const DARK = 450;
const END = 1350;

/**
 * Heal Block, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/15/Heilblockade_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/56/Heilblockade_Gen5.png
 *
 * Golden sparkles twinkle all over the target (0-0.9 s). The scene turns
 * dim grey (0.45-0.7 s) and the target darkens to a shadow as the sparkles
 * fade out over it (0.5-1.35 s), its healing sealed; the scene clears
 * (1.35-1.6 s).
 */
export class HealBlock {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.wait(DARK).then(() => Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.6 }], { duration: 250, easing: 'ease-out', fill: 'forwards' })),
      Fx.glow(targetEl, 'brightness(.25) saturate(.3)', END - DARK - 50, DARK + 50)
    ];
    for (let i = 0; i < 12; i++) {
      const at: Point = { x: target.x + (((i * 5) % 7) / 6 - 0.5) * r.width * 0.9, y: target.y + (((i * 3) % 5) / 4 - 0.6) * r.height * 0.8 };
      const s = Math.max(r.width * 0.16, 10) * (0.8 + (i % 3) * 0.2);
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(s, '#FFE88A'), at, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.8) rotate(60deg)', opacity: 0.8, offset: 0.65 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 550, delay: (i * 67) % 450 + (i > 7 ? 350 : 0), easing: 'ease-out' }));
    }
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.6 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }
}
