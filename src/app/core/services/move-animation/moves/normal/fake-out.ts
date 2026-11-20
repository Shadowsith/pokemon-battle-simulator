import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The hands clap together in front of the target at `CLAP` (ms). */
const CLAP = 250;

/**
 * Fake Out, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/bb/Mogelhieb_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/33/Mogelhieb_Gen5.png
 *
 * The scene flashes white (0-0.1 s); two white hands swing in from either
 * side and clap together right in front of the target (0.25 s) with a white
 * vertical flash, and the target flinches, flickering (0.25-0.6 s).
 */
export class FakeOut {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const hw = Math.max(w * 0.4, 28);
    const wash = Fx.box(0, 0, 'inset:0;width:auto;height:auto;background:#ffffff;opacity:0');
    fxEl.appendChild(wash);
    const effects: Promise<void>[] = [
      Fx.anim(wash, [{ opacity: 0 }, { opacity: 0.7, offset: 0.4 }, { opacity: 0 }], { duration: 120, easing: 'linear' }).then(() => wash.remove())
    ];
    for (const side of [-1, 1]) {
      const hand = FxGlyphs.gloveGlyph(hw);
      effects.push(Fx.spawn(fxEl, hand, { x: target.x + side * hw * 0.3, y: target.y - r.height * 0.1 }, [
        { transform: `translateX(${side * w * 0.6}px) rotate(${side * 40}deg)`, opacity: 0 },
        { transform: `translateX(${side * w * 0.4}px) rotate(${side * 30}deg)`, opacity: 1, offset: 0.25 },
        { transform: `translateX(0) rotate(${side * 8}deg)`, opacity: 1, offset: CLAP / 450 },
        { transform: `translateX(${side * 4}px) rotate(${side * 8}deg)`, opacity: 1, offset: (CLAP + 100) / 450 },
        { transform: `translateX(${side * 10}px) rotate(${side * 8}deg)`, opacity: 0 }
      ], { duration: 450, easing: 'ease-in', delay: 0 }));
    }
    const bar = Fx.box(10, r.height * 1.3, 'border-radius:5px;background:linear-gradient(90deg,#ffffff00,#ffffff,#ffffff00);box-shadow:0 0 12px #ffffff');
    effects.push(Fx.spawn(fxEl, bar, { x: target.x, y: target.y - r.height * 0.1 }, [
      { transform: 'scaleY(.2)', opacity: 1 },
      { transform: 'scaleY(1)', opacity: 1, offset: 0.4 },
      { transform: 'scaleY(1) scaleX(.3)', opacity: 0 }
    ], { duration: 200, easing: 'ease-out', delay: CLAP }));
    effects.push(Fx.wait(CLAP).then(() => {
      Fx.shake(targetEl, 4);
      return Fx.blink(targetEl, 3, 60);
    }));
    await Promise.all(effects);
  }
}
