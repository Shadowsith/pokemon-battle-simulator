import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * How many blows land. The battle engine resolves Beat Up as a single hit, so
 * the party piling in is shown with a fixed number of blows.
 */
const BLOWS = 3;
/** When each blow lands, ms apart (the first at `BLOW_GAP / 2`). */
const BLOW_GAP = 300;

/**
 * Beat Up, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/cb/Pr%C3%BCgler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8d/Pr%C3%BCgler_Gen5.png
 *
 * The party piles in: three blows land 0.3 s apart (0.15, 0.45 and 0.75 s).
 * For each a shadowy dark shape dashes in from the user's side, a black spiky
 * burst with a purple rim pops on a different spot of the target, and the
 * target flashes dark purple and is knocked back a little (to ~1.0 s).
 */
export class BeatUp {
  static async play(refs: BattleStageRefs, target: Point, dir: 1 | -1) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const base = targetEl.style.transform;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < BLOWS; i++) {
      const land = BLOW_GAP / 2 + i * BLOW_GAP;
      const at: Point = { x: target.x + (i - 1) * w * 0.2, y: target.y + (i % 2 ? -1 : 0.4) * h * 0.2 };
      // A dark shadow streaks in from the user's side.
      const shadow = Fx.box(w * 0.35, h * 0.35, 'border-radius:50%;background:radial-gradient(circle,#2A1838,#2A183800 70%)');
      effects.push(
        Fx.spawn(fxEl, shadow, at, [
          { transform: `translateX(${-dir * w * 0.9}px) scale(.6)`, opacity: 0 },
          { transform: 'translateX(0) scale(1)', opacity: 0.9, offset: 0.7 },
          { transform: 'translateX(0) scale(1.3)', opacity: 0 }
        ], { duration: 170, easing: 'ease-in', delay: land - 120 }),
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(w * 0.5, 34), '#120A18', '#6A3088', '#2A1838'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 280, easing: 'ease-out', delay: land }),
        Fx.anim(targetEl, [
          { transform: base },
          { transform: `${base} translateX(${dir * 6}px)`, offset: 0.3 },
          { transform: base }
        ], { duration: 220, easing: 'ease-out', delay: land, fill: 'none' })
      );
      setTimeout(() => Fx.flash(targetEl, '#7A3AA8', 0.55), land);
    }
    await Promise.all(effects);
  }
}
