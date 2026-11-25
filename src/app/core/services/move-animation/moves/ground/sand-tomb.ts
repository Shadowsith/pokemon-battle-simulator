import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The sand whirls round the target for `SPIN` ms. */
const SPIN = 1300;
const GRAINS = 26;

/**
 * Sand Tomb, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b2/Sandgrab_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e2/Sandgrab_Gen5.png
 *
 * A yellow-brown sand vortex swirls up round the target: a hazy dust cloud
 * billows over it while clumps of sand whirl round it on a rising spiral
 * (0-1.3 s). The target shakes as the sand hits it (0.2, 0.55 and 0.9 s).
 */
export class SandTomb {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const effects: Promise<void>[] = [
      FxEffects.smokeCloud(fxEl, target, w * 1.1, h * 1.0, ['#D8C070', '#A88A40'], 10, 800, 450)
    ];
    for (let i = 0; i < GRAINS; i++) {
      const s = 6 + (i % 4) * 3;
      const grain = Fx.box(s, s * 0.8, `border-radius:2px;background:${i % 3 ? '#C8A850' : '#8A7030'};opacity:.9;filter:blur(.5px)`);
      const phase = (Math.PI * 2 * i) / 7;
      const frames: Keyframe[] = [];
      const steps = 16;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const a = phase + t * Math.PI * 3;
        const rx = w * (0.65 - t * 0.2);
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${h * (0.45 - t * 0.9) + Math.sin(a) * rx * 0.25}px) scale(${0.8 + 0.3 * Math.sin(a)})`,
          opacity: k === 0 || k === steps ? 0 : 0.9
        });
      }
      effects.push(Fx.spawn(fxEl, grain, target, frames, { duration: 650, delay: (i * 23) % (SPIN - 650), easing: 'linear' }));
    }
    for (const at of [200, 550, 900]) effects.push(Fx.wait(at).then(() => Fx.shake(targetEl, 4)));
    await Promise.all(effects);
  }
}
