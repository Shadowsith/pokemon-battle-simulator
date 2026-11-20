import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Swagger, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/4/4d/Angeberei_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/1/1e/Angeberei_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/4/46/Angeberei_Gen5.png
 *
 * The user's taunting riles the target: an anger mark throbs on it
 * (0-0.45 s) and it flushes red (0.3-0.7 s). Its Attack rises sharply under
 * an orange stat-up aura (0.6-1.4 s), then it is confused - little birds
 * circle its head (1.4-2.3 s).
 */
export class Swagger {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    await Promise.all([
      Fx.spawn(fxEl, FxGlyphs.angerMark(Math.max(r.width * 0.3, 20)), { x: target.x + r.width * 0.25, y: target.y - r.height * 0.35 }, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.25 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.75 },
        { transform: 'scale(.6)', opacity: 0 }
      ], { duration: 450, easing: 'ease-in-out' }),
      Fx.glow(targetEl, 'sepia(1) saturate(7) hue-rotate(-45deg) brightness(.95) drop-shadow(0 0 5px #FF3020)', 400, 300)
    ]);
    await Fx.wait(150);
    await FxEffects.statUpAura({ ...refs, launchEl: targetEl }, target);
    await FxEffects.dizzyBirds(fxEl, { x: target.x, y: target.y - r.height * 0.45 }, Math.max(r.width * 0.4, 24), 8, 900);
  }
}
