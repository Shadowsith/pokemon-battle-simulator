import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The palm strikes at `HIT` (ms) and pushes the shock wave through until `PUSH` (ms). */
const HIT = 350;
const PUSH = 750;

/**
 * Force Palm, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/98/Kraftwelle_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/c6/Kraftwelle_Gen5.png
 *
 * A white open palm swings in from the user's side and presses flat onto
 * the target (0-0.35 s). A magenta shock wave bursts through it as a
 * glowing orb flaring into rays (0.35-0.75 s) while the target flashes and
 * shakes; the palm draws back out past the target and fades with a few
 * pink sparkles (0.75-1.1 s).
 */
export class ForcePalm {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.55, 34);
    const side = -v.dir * r.width * 0.5;
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, FxGlyphs.gloveGlyph(w), target, [
        { transform: `translateX(${side * 1.6}px) scale(.8)`, opacity: 0 },
        { transform: 'translateX(0) scale(1.05)', opacity: 1, offset: HIT / 1100 },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: PUSH / 1100 },
        { transform: `translateX(${-side * 1.3}px) scale(1)`, opacity: 1, offset: 0.9 },
        { transform: `translateX(${-side * 1.4}px) scale(1)`, opacity: 0 }
      ], { duration: 1100, easing: 'ease-out' })
    ];
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#FF6AD0', 0.7);
      Fx.shake(targetEl, 6);
      const s = Math.max(r.width * 0.9, 56);
      const parts: Promise<void>[] = [
        Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 12%,#FF5AD0 35%,#E8209A88 55%,#E8209A00 70%)'), target, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1.4)', opacity: 0 }
        ], { duration: PUSH - HIT, easing: 'ease-out' }),
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(s * 1.2, '#FF5AD0', '#FFB0E8', '#ffffff'), target, [
          { transform: 'scale(.4) rotate(0deg)', opacity: 0.8 },
          { transform: 'scale(1.2) rotate(20deg)', opacity: 0 }
        ], { duration: 380, delay: 60, easing: 'ease-out' })
      ];
      for (let i = 0; i < 6; i++) {
        parts.push(Fx.spawn(fxEl, Fx.box(4, 4, 'border-radius:50%;background:#FF9AD8;box-shadow:0 0 3px #FF5AC0'), { x: target.x + (i - 2.5) * r.width * 0.14, y: target.y - r.height * 0.3 }, [
          { transform: 'translateY(0)', opacity: 0 },
          { transform: 'translateY(-6px)', opacity: 1, offset: 0.3 },
          { transform: 'translateY(-20px)', opacity: 0 }
        ], { duration: 450, delay: PUSH - HIT + i * 30, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
