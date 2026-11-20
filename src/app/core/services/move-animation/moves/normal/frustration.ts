import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the angry blows land, ms from the start. */
const BLOWS = [550, 700, 850];

/**
 * Frustration, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/98/Frustration_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/da/Frustration_Gen5.png
 *
 * The user seethes: it flushes red twice and an anger mark throbs over its
 * head (0-0.5 s). Then three grudging blows land on the target (0.55, 0.7
 * and 0.85 s): a red-white burst each, red sparks fly off, and the target
 * shakes (to ~1.1 s).
 */
export class Frustration {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const red = 'sepia(1) saturate(7) hue-rotate(-45deg) brightness(.95) drop-shadow(0 0 5px #FF3020)';

    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: red, offset: 0.2 },
        { filter: 'none', offset: 0.45 },
        { filter: red, offset: 0.7 },
        { filter: 'none' }
      ], { duration: 520, easing: 'ease-in-out', fill: 'none' }),
      Fx.spawn(fxEl, FxGlyphs.angerMark(Math.max(lr.width * 0.3, 20)), { x: launch.x + v.dir * lr.width * 0.25, y: launch.y - lr.height * 0.4 }, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.2 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1)', opacity: 1, offset: 0.8 },
        { transform: 'scale(.6)', opacity: 0 }
      ], { duration: 520, easing: 'ease-in-out' })
    ];
    for (const [i, t] of BLOWS.entries()) {
      const at: Point = { x: target.x + (i - 1) * tr.width * 0.15, y: target.y + (i % 2 ? -1 : 0.5) * tr.height * 0.15 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.35, 26), '#E02A20', '#FFB0A0', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 220, easing: 'ease-out', delay: t })
      );
      for (let k = 0; k < 3; k++) {
        const a = Math.random() * Math.PI * 2;
        const d = 20 + Math.random() * 20;
        effects.push(
          Fx.spawn(fxEl, Fx.box(4, 4, 'border-radius:50%;background:#FF5A3A;box-shadow:0 0 4px #FF8A60'), at, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 0 }
          ], { duration: 300, easing: 'ease-out', delay: t })
        );
      }
      setTimeout(() => {
        Fx.flash(targetEl, '#FF6A5A', 0.5);
        Fx.shake(targetEl, 4);
      }, t);
    }
    await Promise.all(effects);
  }
}
