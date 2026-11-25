import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** One mocking thought cloud pops up every `GAP` ms; the target fumes at `ANGER` (ms). */
const CLOUDS = 5;
const GAP = 140;
const ANGER = 1050;

/**
 * Torment, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/67/Folterknecht_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/b3/Folterknecht_Gen5.png
 *
 * Five white thought clouds with a black scribble in them pop up round the
 * user one after another (0.1-0.66 s), bob and drift toward the target,
 * then fade (gone by ~1.0 s). A red anger mark throbs over the target's
 * head (1.05-1.6 s).
 */
export class Torment {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const w = Math.max(lr.width * 0.4, 30);
    const dx = (target.x - launch.x) * 0.25;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < CLOUDS; i++) {
      const cloud = FxGlyphs.questionCloud(w);
      const mark = cloud.lastElementChild as HTMLElement;
      mark.textContent = '@';
      mark.style.color = '#2A2A30';
      const a = -Math.PI * (0.15 + (i / (CLOUDS - 1)) * 0.7);
      const at: Point = { x: launch.x + Math.cos(a) * lr.width * 0.6, y: launch.y + Math.sin(a) * lr.height * 0.6 };
      effects.push(Fx.spawn(fxEl, cloud, at, [
        { transform: 'translate(0,0) scale(0)', opacity: 0 },
        { transform: 'translate(0,-4px) scale(1.1)', opacity: 1, offset: 0.15 },
        { transform: `translate(${dx * 0.4}px,2px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,-6px) scale(.9)`, opacity: 0 }
      ], { duration: 560, delay: 100 + i * GAP, easing: 'ease-out' }));
    }
    effects.push(Fx.spawn(fxEl, FxGlyphs.angerMark(Math.max(tr.width * 0.35, 24)), { x: target.x + tr.width * 0.2, y: target.y - tr.height * 0.4 }, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1.2)', opacity: 1, offset: 0.2 },
      { transform: 'scale(.9)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.15)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.9)', opacity: 1, offset: 0.8 },
      { transform: 'scale(1)', opacity: 0 }
    ], { duration: 550, delay: ANGER, easing: 'ease-in-out' }));
    effects.push(Fx.wait(ANGER).then(() => Fx.shake(targetEl, 3)));
    await Promise.all(effects);
  }
}
