import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the swipe crosses the target's middle, ms from the start. */
const HIT = 150;

/**
 * False Swipe, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/13/Trugschlag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a6/Trugschlag_Gen5.png
 *
 * A light, held-back swipe: a thin white streak sweeps diagonally down across
 * the target from the far side (0-0.3 s, crossing its middle at 0.15 s),
 * leaving small white puffs and pale violet sparkles along its trail; the
 * target blinks (0.15-0.45 s) and the puffs fade (to ~0.65 s).
 */
export class FalseSwipe {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const len = Math.hypot(w, h) * 0.8;
    // From the upper far side down towards the user.
    const angle = v.dir === 1 ? 135 : 45;
    const rad = (angle * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);

    const streak = Fx.box(len, 4, 'border-radius:2px;background:linear-gradient(90deg,#ffffff00,#ffffff 35%,#ffffff 65%,#ffffff00);box-shadow:0 0 6px #E8E0FF');
    streak.style.transformOrigin = '50% 50%';
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, streak, target, [
        { transform: `translate(${-ux * len * 0.6}px,${-uy * len * 0.6}px) rotate(${angle}deg) scaleX(.3)`, opacity: 0 },
        { transform: `translate(0,0) rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: HIT / 300 },
        { transform: `translate(${ux * len * 0.6}px,${uy * len * 0.6}px) rotate(${angle}deg) scaleX(.3)`, opacity: 0 }
      ], { duration: 300, easing: 'linear' })
    ];
    for (let i = 0; i < 6; i++) {
      const t = i / 5 - 0.5;
      const at: Point = { x: target.x + ux * len * t * 0.9, y: target.y + uy * len * t * 0.9 };
      const delay = HIT + t * 150;
      const glyph = i % 2 ? FxGlyphs.sparkStar(9, '#C8B8FF') : Fx.box(12, 12, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#ffffff00 70%)');
      effects.push(
        Fx.spawn(fxEl, glyph, at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,-3px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${-v.dir * 6}px,-10px) scale(.8)`, opacity: 0 }
        ], { duration: 420, easing: 'ease-out', delay })
      );
    }
    await Fx.wait(HIT);
    effects.push(Fx.blink(targetEl, 2, 70));
    await Promise.all(effects);
  }
}
