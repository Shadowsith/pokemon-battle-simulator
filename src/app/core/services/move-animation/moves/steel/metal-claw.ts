import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** When the two claw strokes rake the target, ms from the start. */
const RAKES = [500, 620];

/**
 * Metal Claw, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/c8/Metallklaue_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/09/Metallklaue_Gen5.png
 *
 * Silver shine bands sweep down over the user (0-0.45 s). Then two black
 * claw strokes with a silver-blue glow rake down across the target (0.5 and
 * 0.62 s) and little blue sparks fly off their tips; the target shakes (to
 * ~0.95 s).
 */
export class MetalClaw {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const h = Math.max(r.height, 50);
    const w = Math.max(r.width, 50);

    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'grayscale(.7) brightness(1.5) contrast(1.3) drop-shadow(0 0 4px #E0E8F0)', offset: 0.25 },
        { filter: 'none', offset: 0.5 },
        { filter: 'grayscale(.7) brightness(1.5) contrast(1.3) drop-shadow(0 0 4px #E0E8F0)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 450, easing: 'linear', fill: 'none' })
    ];
    const lr = Fx.rect(launchEl);
    const shine = Fx.box(Math.max(lr.width, 40), 10, 'background:linear-gradient(0deg,#ffffff00,#ffffffcc,#ffffff00);mix-blend-mode:screen');
    effects.push(
      Fx.spawn(fxEl, shine, Fx.centerOf(launchEl, refs.fieldEl), [
        { transform: `translateY(${-lr.height * 0.5}px)`, opacity: 0 },
        { transform: `translateY(${-lr.height * 0.2}px)`, opacity: 1, offset: 0.3 },
        { transform: `translateY(${lr.height * 0.5}px)`, opacity: 0 }
      ], { duration: 400, easing: 'ease-in-out', iterations: 1 })
    );

    for (const [i, t] of RAKES.entries()) {
      await Fx.wait(t - (i ? RAKES[i - 1] : 0));
      const at: Point = { x: target.x + (i ? 1 : -1) * w * 0.12 * v.dir, y: target.y };
      effects.push(FxEffects.clawMark(fxEl, at, h * 0.8, 70 + v.dir * 10, { glow: ['#B8D8F8', '#5A9AE8'] }));
      Fx.flash(targetEl, '#C8E0FF', 0.4);
      Fx.shake(targetEl, 4);
      const tip: Point = { x: at.x + Math.cos(((70 + v.dir * 10) * Math.PI) / 180) * h * 0.4, y: at.y + h * 0.38 };
      for (let k = 0; k < 3; k++) {
        effects.push(
          Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#5AB0FF'), tip, [
            { transform: 'translate(0,0) scale(.4)', opacity: 1 },
            { transform: `translate(${(k - 1) * 14}px,${-8 - k * 4}px) scale(1)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${(k - 1) * 20}px,${-4}px) scale(0)`, opacity: 0 }
          ], { duration: 320, easing: 'ease-out' })
        );
      }
    }
    await Promise.all(effects);
  }
}
