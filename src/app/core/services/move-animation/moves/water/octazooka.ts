import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Flight time of one ink ball and the gap between balls, ms. */
const FLIGHT = 420;
const STEP = 60;
const BALLS = 4;

/**
 * Octazooka, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/20/Octazooka_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/6c/Octazooka_Gen5.png
 *
 * Black ink balls shoot out of the user's mouth in a puff of grey smoke and
 * fly at the target one after another (0-0.6 s, the first hits at 0.42 s).
 * A thick black ink cloud bursts over the target and lingers while it shakes
 * (0.42-1.2 s). Then its accuracy drops: it turns blue under stat-down
 * bubbles (1.2 s to ~2.1 s).
 */
export class Octazooka {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.3, y: launch.y - lr.height * 0.05 };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const arc = -Math.max(Math.abs(dx) * 0.08, 10);

    const effects: Promise<void>[] = [FxEffects.smokePuff(fxEl, from, lr.width * 0.4, ['#6A6A70', '#3A3A40'])];
    for (let i = 0; i < BALLS; i++) {
      const s = 16 - i * 1.5;
      const ball = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 35% 35%,#5A5A62,#202024 55%,#0A0A0C)');
      effects.push(
        Fx.spawn(fxEl, ball, from, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${dy}px) scale(1.2)`, opacity: 0.9 }
        ], { duration: FLIGHT, easing: 'linear', delay: i * STEP })
      );
    }
    await Fx.wait(FLIGHT);
    effects.push(FxEffects.smokeCloud(fxEl, target, tr.width * 0.9, tr.height * 0.8, ['#1A1A1E', '#4A4A52'], 12, 600, 200));
    for (let t = 0; t < 4; t++) setTimeout(() => Fx.shake(targetEl, 4), t * STEP);
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
