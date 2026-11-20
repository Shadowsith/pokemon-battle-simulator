import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The red X slams down at `SLAM` (ms) and is gone at `TOTAL`. */
const SLAM = 400;
const TOTAL = 1200;

/**
 * Block, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/9f/R%C3%BCckentzug_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0f/R%C3%BCckentzug_Gen5.png
 *
 * Brown dust puffs up round the target (0-0.4 s), then a big red X slams
 * down over it (0.4 s), the target shakes and purple puffs burst at the
 * X's ends; the X holds, barring the way, and fades (0.9-1.2 s).
 */
export class Block {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const s = Math.max(r.width, r.height, 50) * 1.05;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      effects.push(Fx.wait(i * 110).then(() =>
        FxEffects.smokePuff(fxEl, { x: target.x + (i - 1) * r.width * 0.35, y: target.y + r.height * 0.25 }, s * 0.4, ['#C8A070', '#8A6438'])));
    }
    const cross = Fx.box(s, s, '');
    for (const a of [45, -45]) {
      cross.appendChild(Fx.box(s, s * 0.17, `left:0;top:${s * 0.415}px;border-radius:${s * 0.04}px;transform:rotate(${a}deg);background:linear-gradient(#FF6A5A,#E01818 50%,#A80A10);box-shadow:0 0 0 2px #fff,0 0 8px #FF3A3A`));
    }
    effects.push(Fx.spawn(fxEl, cross, target, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 120 / (TOTAL - SLAM + 120) },
      { transform: 'scale(1)', opacity: 1, offset: (900 - SLAM + 120) / (TOTAL - SLAM + 120) },
      { transform: 'scale(1)', opacity: 0 }
    ], { duration: TOTAL - SLAM + 120, easing: 'ease-out', delay: SLAM - 120 }));
    effects.push(Fx.wait(SLAM).then(() => {
      Fx.flash(targetEl, '#FF5A5A', 0.4);
      Fx.shake(targetEl, 5);
      const d = s * 0.38;
      return Promise.all([[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) =>
        FxEffects.smokePuff(fxEl, { x: target.x + x * d, y: target.y + y * d }, s * 0.28, ['#C89AE8', '#8A5AC0']))).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
