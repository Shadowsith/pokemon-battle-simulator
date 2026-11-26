import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The fist lands on the target at `HIT` (ms). */
const HIT = 550;

/**
 * Feint, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b2/Offenlegung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8e/Offenlegung_Gen5.png
 *
 * A big grey-white fist looms in close from the user's side and swings
 * round onto the target, shrinking as it goes and leaving faint afterimages
 * (0-0.55 s). On impact the target flashes and shakes and little pink
 * sparkles scatter round it (0.55-1.0 s).
 */
export class Feint {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.55, 34);
    const from = -v.dir * Math.max(r.width * 1.2, 80);
    const frames = (o: number): Keyframe[] => [
      { transform: `translate(${from}px,${r.height * 0.3}px) scale(2.6)`, opacity: 0 },
      { transform: `translate(${from * 0.6}px,${r.height * 0.2}px) scale(2.2)`, opacity: o, offset: 0.3 },
      { transform: 'translate(0,0) scale(1)', opacity: o, offset: 0.9 },
      { transform: 'translate(0,0) scale(.9)', opacity: 0 }
    ];
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, FxGlyphs.fistGlyph(w, 'steel'), target, frames(1), { duration: HIT + 60, easing: 'ease-in' }),
      Fx.spawn(fxEl, FxGlyphs.fistGlyph(w, 'steel'), target, frames(0.35), { duration: HIT + 60, delay: 60, easing: 'ease-in' })
    ];
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#ffffff', 0.6);
      Fx.shake(targetEl, 5);
      const parts: Promise<void>[] = [];
      for (let i = 0; i < 12; i++) {
        const at: Point = { x: target.x + (((i * 5) % 7) / 6 - 0.5) * r.width * 0.9, y: target.y + (((i * 3) % 5) / 4 - 0.5) * r.height * 0.7 };
        parts.push(Fx.spawn(fxEl, Fx.box(4, 4, 'border-radius:50%;background:#FF8AC8;box-shadow:0 0 3px #FF5AA8'), at, [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { transform: 'translateY(-4px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: 'translateY(-12px) scale(.6)', opacity: 0 }
        ], { duration: 400, delay: (i * 31) % 120, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
