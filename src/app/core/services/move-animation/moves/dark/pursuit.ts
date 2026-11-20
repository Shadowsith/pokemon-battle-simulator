import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the blow lands, ms from the start. */
const HIT = 600;
const TOTAL = 1100;

/**
 * Pursuit, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/03/Verfolgung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8d/Verfolgung_Gen5.png
 *
 * The scene darkens (0-0.25 s). A jagged grey-white ring closes in round the
 * target, shrinking (0.2-0.6 s); at 0.6 s it snaps shut in a white-violet
 * starburst and the target shakes, purple specks scatter and the scene
 * clears (to ~1.1 s).
 */
export class Pursuit {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width, r.height, 50) * 1.2;
    const at = (ms: number) => ms / TOTAL;

    const dim = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 60% 40%,#2A1E14,#0E0A06);opacity:0');
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.8, offset: at(250) },
        { opacity: 0.8, offset: at(850) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' }),
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(size, '#C8C0D8', '#0000', '#0000'), target, [
        { transform: 'scale(1.4) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.1) rotate(20deg)', opacity: 0.9, offset: 0.4 },
        { transform: 'scale(.35) rotate(60deg)', opacity: 1 }
      ], { duration: HIT - 200, easing: 'ease-in', delay: 200 })
    ];
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#D8C8FF', 0.6);
    Fx.shake(targetEl, 5);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.5, 30), '#B890FF'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.3) rotate(30deg)', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' })
    );
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = size * (0.3 + Math.random() * 0.25);
      effects.push(
        Fx.spawn(fxEl, Fx.box(4, 4, 'background:#9A6AE0;box-shadow:0 0 4px #C8A8FF'), target, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px)`, opacity: 0 }
        ], { duration: 400, easing: 'ease-out', delay: 40 })
      );
    }
    await Promise.all(effects);
    dim.remove();
  }
}
