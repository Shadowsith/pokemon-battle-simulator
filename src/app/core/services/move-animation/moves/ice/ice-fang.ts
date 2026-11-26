import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';
import { ChompFx } from '../../chomp-fx';

/** The jaw snaps shut at `SNAP` (ms) (see `ChompFx.chomp`). */
const SNAP = 450;

/**
 * Ice Fang, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/26/Eiszahn_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/af/Eiszahn_Gen5.png
 *
 * A white jaw opens over the target and snaps shut (0-0.45 s). The bite
 * freezes it pale blue (0.45-1.15 s) as blue ice chunks burst off and
 * tumble away (0.45-1.0 s) and a cold white mist drifts over it
 * (0.55-1.3 s).
 */
export class IceFang {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const effects: Promise<void>[] = [
      ChompFx.chomp(refs, target, { w: Math.max(r.width * 1.1, 72), tilt: 0, grinds: 0, rays: false }),
      Fx.glow(targetEl, 'brightness(1.4) sepia(.6) hue-rotate(170deg) saturate(2.5)', 700, SNAP),
      Fx.wait(SNAP + 100).then(() => FxEffects.smokeCloud(fxEl, target, r.width, r.height * 0.8, ['#F4FAFF', '#CFE6F8'], 8, 550, 200))
    ];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.2;
      const reach = Math.max(r.width * 0.7, 44);
      effects.push(Fx.spawn(fxEl, FxGlyphs.iceChunk(), target, [
        { transform: 'translate(0,0) rotate(0deg) scale(.5)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * reach * 0.6}px,${Math.sin(a) * reach * 0.5 - 10}px) rotate(90deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach * 0.5 + 16}px) rotate(200deg) scale(.8)`, opacity: 0 }
      ], { duration: 550, delay: SNAP + (i * 23) % 80, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
