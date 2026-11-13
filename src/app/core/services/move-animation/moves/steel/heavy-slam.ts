import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Heavy Slam, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/d/df/Rammboss_Gen5.png
 *
 * The user leaps up out of view (0-0.3 s) and drops onto the target
 * (0.45-0.65 s). At the landing (0.65 s) the field shakes and a big
 * yellow-ochre dust cloud bursts at the target's feet, followed by brown dust
 * puffs to both sides (to ~1.45 s) while the user slides back home.
 */
export class HeavySlam {
  static play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height);
    const foot: Point = { x: target.x, y: target.y + tr.height * 0.3 };
    return FxEffects.leapCrash(refs, launch, target, async () => {
      Fx.shake(targetEl, 8);
      const puffs: Promise<void>[] = [FxEffects.smokePuff(fxEl, foot, size * 1.1, ['#F2D86A', '#D8B040'])];
      for (let i = 0; i < 2; i++) {
        const at: Point = { x: foot.x + (i ? 1 : -1) * size * 0.45, y: foot.y - tr.height * 0.1 };
        puffs.push(Fx.wait(200 + i * 60).then(() => FxEffects.smokePuff(fxEl, at, size * 0.55, ['#A8805A', '#7A5A3A'])));
      }
      await Promise.all(puffs);
    });
  }
}
