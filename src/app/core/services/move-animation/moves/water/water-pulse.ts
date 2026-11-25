import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The ring of water sets off at `SEND` (ms) and reaches the target at `HIT` (ms). */
const SEND = 450;
const HIT = 900;

/**
 * Water Pulse, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/7/71/Aquawelle_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/4/41/Aquawelle_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/8/83/Aquawelle_Gen5.png
 *
 * The scene turns deep underwater blue (0-0.25 s) and bubbles rise all over
 * it (0.15-1.3 s). A glowing blue ring of water leaves the user and swells
 * as it travels to the target (0.45-0.9 s), then spreads round it in a wide
 * ring (0.9-1.3 s) while the target flickers pale blue and shakes. The
 * scene clears (1.3-1.55 s).
 */
export class WaterPulse {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const tr = Fx.rect(targetEl);
    const sea = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#1A3A9A,#12287A 55%,#0A1A5A)');
    const effects: Promise<void>[] = [Fx.anim(sea, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 250, easing: 'ease-out' })];
    for (let i = 0; i < 18; i++) {
      const s = 7 + (i % 4) * 4;
      const at: Point = { x: f.width * ((i * 0.41 + 0.05) % 1), y: f.height * (0.55 + ((i * 0.23) % 0.45)) };
      effects.push(Fx.spawn(fxEl, FxGlyphs.bubbleGlyph(s), at, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: 'translate(4px,-30px)', opacity: 0.9, offset: 0.3 },
        { transform: `translate(-4px,${-f.height * 0.45}px)`, opacity: 0 }
      ], { duration: 800, delay: 150 + (i * 53) % 350, easing: 'ease-out' }));
    }
    const size = Math.max(tr.width, 50) * 0.5;
    const ring = (s: number) => Fx.box(s, s, 'border-radius:50%;border:4px solid #5AB8FF;box-shadow:0 0 8px #7AD0FF,inset 0 0 8px #7AD0FF');
    effects.push(Fx.spawn(fxEl, ring(size), launch, [
      { transform: 'translate(0,0) scale(.3)', opacity: 0 },
      { transform: `translate(${(target.x - launch.x) * 0.15}px,${(target.y - launch.y) * 0.15}px) scale(.6)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${target.x - launch.x}px,${target.y - launch.y}px) scale(1)`, opacity: 1 }
    ], { duration: HIT - SEND, delay: SEND, easing: 'ease-in' }));
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 5);
      return Promise.all([
        Fx.glow(targetEl, 'brightness(1.4) sepia(.5) hue-rotate(170deg) saturate(2)', 400),
        Fx.spawn(fxEl, ring(size), target, [
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(3)', opacity: 0 }
        ], { duration: 400, easing: 'ease-out' })
      ]).then(() => void 0);
    }));
    await Promise.all(effects);
    await Fx.anim(sea, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    sea.remove();
  }
}
