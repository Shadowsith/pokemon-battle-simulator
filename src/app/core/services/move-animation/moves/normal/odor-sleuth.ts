import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/** The user sniffs at each of `SNIFFS` (ms). */
const SNIFFS = [0, 300, 600];
/** The target is sniffed out at `FOUND` (ms). */
const FOUND = 1000;

/**
 * Odor Sleuth, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/be/Schn%C3%BCffler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/28/Schn%C3%BCffler_Gen5.png
 *
 * The user sniffs three times (0, 0.3 and 0.6 s), nudging its nose
 * forward each time, while wavy grey-violet scent trails drift from the
 * target over to it (0-0.9 s). The target is sniffed out (1.0 s): it blinks
 * white twice (1.0-1.3 s).
 */
export class OdorSleuth {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const nose: Point = { x: launch.x + v.dir * lr.width * 0.3, y: launch.y - lr.height * 0.1 };
    const base = launchEl.style.transform;
    const effects: Promise<void>[] = SNIFFS.map((t) =>
      Fx.anim(launchEl, [
        { transform: `${base} translate(0,0)` },
        { transform: `${base} translate(${v.dir * 6}px,-2px)`, offset: 0.4 },
        { transform: `${base} translate(0,0)` }
      ], { duration: 220, delay: t, easing: 'ease-in-out', fill: 'none' })
    );
    for (let i = 0; i < 6; i++) {
      const from: Point = { x: target.x + ((i % 3) - 1) * tr.width * 0.25, y: target.y - tr.height * (0.05 + (i % 2) * 0.2) };
      const dx = nose.x - from.x;
      const dy = nose.y - from.y;
      const trail = Fx.box(34, 12, 'filter:drop-shadow(0 0 2px #E0D0FF)');
      trail.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 34 12"><path d="M1 6 Q5 1 9 6 T17 6 T25 6 T33 6" fill="none" stroke="#B8A8D8" stroke-width="2" stroke-linecap="round"/></svg>';
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      effects.push(Fx.spawn(fxEl, trail, from, [
        { transform: `translate(0,0) rotate(${deg}deg) scale(.6)`, opacity: 0 },
        { transform: `translate(${dx * 0.3}px,${dy * 0.3 - 8}px) rotate(${deg}deg) scale(1)`, opacity: 0.9, offset: 0.3 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.7 + 6}px) rotate(${deg}deg) scale(1)`, opacity: 0.8, offset: 0.7 },
        { transform: `translate(${dx}px,${dy}px) rotate(${deg}deg) scale(.4)`, opacity: 0 }
      ], { duration: 600, delay: i * 60, easing: 'ease-in-out' }));
    }
    effects.push(Fx.wait(FOUND).then(async () => {
      for (let i = 0; i < 2; i++) {
        await Fx.anim(targetEl, [{ filter: 'none' }, { filter: 'brightness(2.2)', offset: 0.5 }, { filter: 'none' }], { duration: 150, fill: 'none' });
      }
    }));
    await Promise.all(effects);
  }
}
