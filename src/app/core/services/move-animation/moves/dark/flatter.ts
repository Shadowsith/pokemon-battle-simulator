import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** How many confetti flecks rain on the target. */
const CONFETTI = 16;
const COLORS = ['#FF5A5A', '#FFD84A', '#5AD8FF', '#7AE85A', '#FF8AE0', '#ffffff'];

/**
 * Flatter, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/6e/Schmeichler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1b/Schmeichler_Gen5.png
 *
 * Bright confetti rains down over the target, twinkling as it tumbles
 * (0-0.7 s). The target's Sp. Atk rises - orange bands scroll up over it
 * (0.7-1.5 s) - and then it is confused: little birds circle its head
 * (1.5-2.4 s).
 */
export class Flatter {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const confetti: Promise<void>[] = [];
    for (let i = 0; i < CONFETTI; i++) {
      const x = (((i * 7) % CONFETTI) / CONFETTI - 0.5) * w * 1.3;
      const fleck = Fx.box(6, 9, `background:${COLORS[i % COLORS.length]};box-shadow:0 0 2px #00000055`);
      confetti.push(Fx.spawn(fxEl, fleck, { x: target.x + x, y: target.y - h * 0.8 }, [
        { transform: 'translate(0,0) rotate(0deg) scaleX(1)', opacity: 0 },
        { transform: `translate(${Math.sin(i) * 8}px,${h * 0.3}px) rotate(200deg) scaleX(.2)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${-Math.sin(i) * 8}px,${h * 0.7}px) rotate(400deg) scaleX(1)`, opacity: 1, offset: 0.7 },
        { transform: `translate(0,${h * 1.0}px) rotate(560deg) scaleX(.3)`, opacity: 0 }
      ], { duration: 500, easing: 'linear', delay: (i % 6) * 35 }));
    }
    setTimeout(() => Fx.flash(targetEl, '#FFE8A0', 0.35), 250);
    await Promise.all(confetti);
    await Fx.wait(700 - 675);
    await FxEffects.statUpAura({ ...refs, launchEl: targetEl }, target);
    await FxEffects.dizzyBirds(fxEl, { x: target.x, y: target.y - r.height * 0.45 }, Math.max(r.width * 0.4, 24), 8, 900);
  }
}
