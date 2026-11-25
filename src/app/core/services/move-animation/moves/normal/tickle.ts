import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The tickling runs from `TICKLE` (ms) for `SQUIRM` ms; then the stats drop. */
const TICKLE = 350;
const SQUIRM = 700;

/**
 * Tickle, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/93/Spa%C3%9Fkanone_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/9/93/Spa%C3%9Fkanone_Gen5.png
 *
 * The user darkens for a moment as it reaches out (0-0.35 s). Blue squiggly
 * tickle marks flicker all over the target while it squirms from side to
 * side and blue sparkles rise off it (0.35-1.05 s). Its Attack and Defense
 * drop: it turns blue under stat-down bubbles (1.15-2.05 s).
 */
export class Tickle {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = targetEl.style.transform;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [{ filter: 'none' }, { filter: 'brightness(.3)', offset: 0.5 }, { filter: 'none' }], { duration: TICKLE, easing: 'ease-in-out', fill: 'none' })
    ];
    const wiggle: Keyframe[] = [];
    for (let k = 0; k <= 14; k++) {
      const x = k === 0 || k === 14 ? 0 : (k % 2 ? 1 : -1) * 4;
      wiggle.push({ transform: `${original} translateX(${x}px)` });
    }
    effects.push(Fx.anim(targetEl, wiggle, { duration: SQUIRM, delay: TICKLE, easing: 'linear', fill: 'none' }));
    for (let i = 0; i < 10; i++) {
      const at: Point = { x: target.x + (((i * 7) % 5) - 2) * tr.width * 0.18, y: target.y + (((i * 3) % 5) - 2) * tr.height * 0.18 };
      const mark = Fx.box(16, 10, 'filter:drop-shadow(0 0 3px #6AB0FF)');
      mark.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 16 10"><path d="M1,5 Q3,1 5,5 T9,5 T13,5 L15,4" fill="none" stroke="#7AC8FF" stroke-width="2" stroke-linecap="round"/></svg>';
      effects.push(Fx.spawn(fxEl, mark, at, [
        { transform: 'scale(.4) rotate(-20deg)', opacity: 0 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1) rotate(-10deg)', opacity: 1, offset: 0.65 },
        { transform: 'scale(.6) rotate(15deg)', opacity: 0 }
      ], { duration: 260, delay: TICKLE + (i * 61) % (SQUIRM - 260), easing: 'ease-in-out' }));
    }
    for (let i = 0; i < 6; i++) {
      const spark = Fx.box(6, 6, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#7AC8FF 55%,#3A90FF00 75%);box-shadow:0 0 4px #6AB0FF');
      effects.push(Fx.spawn(fxEl, spark, { x: target.x + (i - 2.5) * tr.width * 0.15, y: target.y - tr.height * 0.2 }, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: 'translateY(-10px)', opacity: 1, offset: 0.3 },
        { transform: 'translateY(-34px)', opacity: 0 }
      ], { duration: 500, delay: TICKLE + 150 + i * 30, easing: 'ease-out' }));
    }
    await Promise.all(effects);
    await Fx.wait(100);
    await FxEffects.blueStatDrop(refs, target);
  }
}
