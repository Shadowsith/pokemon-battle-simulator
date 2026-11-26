import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The hole opens by `OPEN` (ms); the target is swallowed until `BACK` (ms). */
const OPEN = 450;
const SINK = 450;
const BACK = 1500;

/**
 * Dark Void, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DPPt): https://www.pokewiki.de/images/9/9a/Schlummerort_DPPt.png
 * - Gen 4 (HGSS): https://www.pokewiki.de/images/f/fe/Schlummerort_HGSS.png
 * - Gen 5: https://www.pokewiki.de/images/2/2e/Schlummerort_Gen5.png
 *
 * The scene turns into a grey-violet wall of wavy curtains (0-0.3 s). A
 * black hole with a purple rim opens under the target (0.2-0.45 s), which
 * sinks into it and is gone (0.45-0.9 s). The hole closes, the curtains
 * darken almost to black (0.9-1.3 s), then the scene clears and the target
 * is back (1.3-1.5 s), fast asleep under rising "Z"s (1.5-2.3 s).
 */
export class DarkVoid {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const curtain = Fx.backdrop(fieldEl,
      'background:repeating-linear-gradient(90deg,#3A2A4A 0 6px,#5A4A6A 6px 9px,#2A1E38 9px 14px),linear-gradient(180deg,#4A3A5A,#1A1024);' +
      'background-blend-mode:multiply;filter:saturate(.8)');
    const effects: Promise<void>[] = [Fx.anim(curtain, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out' })];
    const foot: Point = { x: target.x, y: target.y + r.height * 0.42 };
    const hw = Math.max(r.width * 1.5, 90);
    const hole = Fx.box(hw, hw * 0.3, 'border-radius:50%;background:radial-gradient(ellipse,#000 0 45%,#3A0A4A 60%,#B03AD0aa 72%,#B03AD000 78%)');
    effects.push(Fx.spawn(fxEl, hole, foot, [
      { transform: 'scale(0)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: OPEN / 1200 },
      { transform: 'scale(1)', opacity: 1, offset: (OPEN + SINK + 50) / 1200 },
      { transform: 'scale(0)', opacity: 0 }
    ], { duration: 1200, delay: 200, easing: 'ease-in-out' }));
    const original = targetEl.style.transform;
    const sink = r.height * 0.7;
    effects.push(Fx.anim(targetEl, [
      { transform: `${original} translateY(0)`, opacity: 1, clipPath: 'inset(0 0 0 0)', offset: 0 },
      { transform: `${original} translateY(0)`, opacity: 1, clipPath: 'inset(0 0 0 0)', offset: (OPEN + 200) / BACK },
      { transform: `${original} translateY(${sink}px)`, opacity: 1, clipPath: `inset(0 0 ${sink}px 0)`, offset: (OPEN + 200 + SINK) / BACK },
      { transform: `${original} translateY(0)`, opacity: 0, clipPath: 'inset(0 0 0 0)', offset: (BACK - 200) / BACK },
      { transform: `${original} translateY(0)`, opacity: 1, clipPath: 'inset(0 0 0 0)', offset: 1 }
    ], { duration: BACK, easing: 'ease-in', fill: 'none' }));
    effects.push(Fx.wait(950).then(() => Fx.anim(curtain, [{ filter: 'saturate(.8) brightness(1)' }, { filter: 'saturate(.8) brightness(.15)' }], { duration: 350, easing: 'ease-in', fill: 'forwards' })));
    await Promise.all(effects);
    await Fx.anim(curtain, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    curtain.remove();
    await FxEffects.sleepZs(fxEl, { x: target.x, y: target.y - r.height * 0.35 }, -v.dir, ['#9C7CE8', '#B59CF2']);
  }
}
