import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The kiss lands at `KISS` (ms); hearts pop until ~0.9 s, then the target is confused. */
const KISS = 500;

/**
 * Sweet Kiss, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/b/bb/Bitterkuss_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/3/3a/Bitterkuss_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/2/29/Bitterkuss_Gen5.png
 *
 * A little pale blue cherub puff with pursed pink lips floats down beside the
 * target's head and leans in for a kiss (0-0.5 s), then fades. Three red
 * hearts pop up over the target (0.5-0.95 s), and it is confused - little
 * birds circle its head (1.0-1.9 s).
 */
export class SweetKiss {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const head: Point = { x: target.x, y: target.y - r.height * 0.3 };
    const s = Math.max(r.width * 0.35, 24);

    const cherub = Fx.box(s, s, 'border-radius:50% 50% 45% 45%;background:radial-gradient(circle at 40% 35%,#ffffff,#CFE8FF 55%,#9AC8F0);box-shadow:0 0 8px #CFE8FF');
    cherub.appendChild(Fx.box(s * 0.28, s * 0.18, `left:${s * 0.36}px;top:${s * 0.6}px;border-radius:50%;background:#FF6AA0`));
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, cherub, { x: head.x - r.width * 0.3, y: head.y - r.height * 0.2 }, [
        { transform: 'translate(0,-20px) scale(.6)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.4 },
        { transform: `translate(${r.width * 0.15}px,4px) scale(1)`, opacity: 1, offset: KISS / 750 },
        { transform: `translate(${r.width * 0.1}px,-6px) scale(.9)`, opacity: 0 }
      ], { duration: 750, easing: 'ease-in-out' })
    ];
    for (let i = 0; i < 3; i++) {
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.heartGlyph(14, '#F0303A', '#FF9AA0'), { x: head.x + (i - 1) * r.width * 0.3, y: head.y - r.height * 0.15 }, [
          { transform: 'translateY(0) scale(.2)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1.15)', opacity: 1, offset: 0.35 },
          { transform: 'translateY(-14px) scale(1)', opacity: 1, offset: 0.7 },
          { transform: 'translateY(-20px) scale(.9)', opacity: 0 }
        ], { duration: 400, easing: 'ease-out', delay: KISS + i * 50 })
      );
    }
    setTimeout(() => Fx.flash(targetEl, '#FF9AC8', 0.4), KISS);
    await Promise.all(effects);
    await FxEffects.dizzyBirds(fxEl, { x: target.x, y: target.y - r.height * 0.45 }, Math.max(r.width * 0.4, 24), 8, 900);
  }
}
