import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The hand lands on the target at `HIT` (ms). */
const HIT = 700;

/**
 * Assurance, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/66/Gewissheit_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/cf/Gewissheit_Gen5.png
 *
 * A huge pink open hand appears over the target (0-0.25 s) and shrinks down
 * onto it, two fading afterimages trailing behind (0.25-0.7 s). On contact a
 * white star flares in a pink burst while pink orbs scatter round the
 * target and fade (0.7-1.25 s); the target flashes and shakes.
 */
export class Assurance {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.9, 56);
    const above: Point = { x: target.x, y: target.y - r.height * 0.15 };
    const glove = () => FxGlyphs.gloveGlyph(w, '#FF8AD8', '#B03A90');
    const frames = (o: number): Keyframe[] => [
      { transform: 'translateY(-20px) scale(2)', opacity: 0, offset: 0 },
      { transform: 'translateY(-10px) scale(1.8)', opacity: o, offset: 0.35 },
      { transform: 'translateY(10px) scale(.55)', opacity: o, offset: 0.95 },
      { transform: 'translateY(10px) scale(.5)', opacity: 0, offset: 1 }
    ];
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, glove(), above, frames(1), { duration: HIT + 40, easing: 'ease-in' }),
      Fx.spawn(fxEl, glove(), above, frames(0.45), { duration: HIT + 40, delay: 80, easing: 'ease-in' }),
      Fx.spawn(fxEl, glove(), above, frames(0.25), { duration: HIT + 40, delay: 160, easing: 'ease-in' })
    ];
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#FFB0E8', 0.6);
      Fx.shake(targetEl, 5);
      const parts: Promise<void>[] = [
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(r.width * 0.6, 40), '#FF8AD8', '#FFD0F0', '#ffffff'), target, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(1.1)', opacity: 0 }
        ], { duration: 400, easing: 'ease-out' }),
        Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.35, 22), '#ffffff'), target, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 350, easing: 'ease-out' })
      ];
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const orb = Fx.box(9, 9, 'border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff,#FF7AB8 55%,#E8408A);box-shadow:0 0 5px #FF7AB8');
        const reach = Math.max(r.width * 0.6, 40) * (0.8 + (i % 3) * 0.15);
        parts.push(Fx.spawn(fxEl, orb, target, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * reach * 0.7}px,${Math.sin(a) * reach * 0.5}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach * 0.7 - 10}px) scale(.7)`, opacity: 0 }
        ], { duration: 550, delay: (i * 29) % 90, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
