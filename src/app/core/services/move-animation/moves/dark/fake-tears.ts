import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The user sobs out a spray of tears at each of `SOBS` (ms); each tear flies `FLIGHT` ms. */
const SOBS = [0, 200, 400];
const FLIGHT = 500;

/**
 * Fake Tears, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/2/21/Trugtr%C3%A4ne_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/c/c7/Trugtr%C3%A4ne_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/9/97/Trugtr%C3%A4ne_Gen5.png
 *
 * The user sobs three times (0, 0.2 and 0.4 s), each time spraying blue
 * tear drops in high arcs over to the target, where they splash (0.5-0.9 s).
 * Then the target's Sp. Def drops - it turns blue under stat-down bubbles
 * (0.9-1.8 s).
 */
export class FakeTears {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const eyes: Point = { x: launch.x, y: launch.y - lr.height * 0.25 };
    const effects: Promise<void>[] = [];
    SOBS.forEach((t, s) => {
      setTimeout(() => Fx.shake(launchEl, 2), t);
      for (let i = 0; i < 3; i++) {
        const end: Point = { x: target.x + (i - 1) * tr.width * 0.25, y: target.y - tr.height * (0.1 + s * 0.08) };
        const dx = end.x - eyes.x;
        const dy = end.y - eyes.y;
        const arc = -Math.max(Math.abs(dx) * 0.35, 50) * (1 + i * 0.15);
        const drop = Fx.box(9, 13, 'border-radius:50% 50% 50% 50% / 65% 65% 35% 35%;background:radial-gradient(circle at 40% 60%,#ffffff,#7AC8FF 50%,#2A7ADA);box-shadow:0 0 3px #9AD8FF');
        effects.push(Fx.spawn(fxEl, drop, eyes, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15 + arc * 0.5}px) scale(.9)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.9 },
          { transform: `translate(${dx}px,${dy}px) scale(1.6,.4)`, opacity: 0 }
        ], { duration: FLIGHT, easing: 'linear', delay: t + i * 30 }));
      }
    });
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
