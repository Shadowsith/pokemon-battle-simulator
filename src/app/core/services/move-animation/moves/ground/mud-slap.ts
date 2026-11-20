import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Flight time of one mud clump and the gap between clumps, ms. */
const FLIGHT = 320;
const STEP = 40;
const CLUMPS = 7;

/**
 * Mud-Slap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5f/Lehmschelle_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/47/Lehmschelle_Gen5.png
 *
 * Brown mud clumps are flung at the target in a low arc (0-0.56 s, the first
 * splats at 0.32 s); a cloud of mud billows over the target's face as they
 * hit (0.32-0.9 s) and the target shakes. Then its accuracy drops: it turns
 * blue under stat-down bubbles (0.9 s to ~1.8 s).
 */
export class MudSlap {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.3, y: launch.y + lr.height * 0.1 };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const arc = -Math.max(Math.abs(dx) * 0.12, 16);

    const effects: Promise<void>[] = [];
    for (let i = 0; i < CLUMPS; i++) {
      const s = 10 + Math.random() * 8;
      const jitter = (Math.random() * 2 - 1) * tr.height * 0.15;
      const clump = Fx.box(s, s * 0.85, 'border-radius:45% 55% 50% 45%;background:radial-gradient(circle at 35% 35%,#B08850,#7A5428 55%,#4A3018)');
      effects.push(
        Fx.spawn(fxEl, clump, from, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${dy + jitter}px) scale(1.2)`, opacity: 0.8 }
        ], { duration: FLIGHT, easing: 'linear', delay: i * STEP })
      );
    }
    await Fx.wait(FLIGHT);
    effects.push(FxEffects.smokeCloud(fxEl, { x: target.x, y: target.y - tr.height * 0.1 }, tr.width * 0.8, tr.height * 0.6, ['#8A6438', '#B89060'], 9, 450, 250));
    for (let t = 0; t < 3; t++) setTimeout(() => Fx.shake(targetEl, 4), t * 120);
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
