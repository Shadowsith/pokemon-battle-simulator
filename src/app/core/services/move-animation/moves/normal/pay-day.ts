import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Pay Day, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/c3/Zahltag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/2b/Zahltag_Gen5.png
 *
 * The user flicks a spinning gold coin at the target in an arc (0-0.43 s).
 * It strikes with a white glint (hit at 0.43 s), and a shower of coins bursts
 * up off the target, twinkling, and tumbles down to its feet (0.45-1.2 s).
 */
export class PayDay {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 40 + Math.abs(dx) * 0.1;
    const size = Math.max(tr.width * 0.18, 13);

    const flight: Keyframe[] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      flight.push({ transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * lift}px) scaleX(${k % 2 ? 0.25 : 1})`, opacity: k === 0 ? 0 : 1 });
    }
    await Fx.spawn(fxEl, PayDay.coin(size), launch, flight, { duration: 430, easing: 'linear' });

    Fx.flash(targetEl, '#FFF6C0', 0.5);
    Fx.shake(targetEl, 4);
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, FxGlyphs.sparkStar(size * 2.2, '#FFFFFF'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(25deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.4) rotate(45deg)', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' })
    ];
    // The coin shower: each coin arcs up and out, then falls to the ground.
    const floor = Fx.footOf(targetEl, fieldEl).y;
    for (let i = 0; i < 8; i++) {
      const x = (i / 7 - 0.5) * tr.width * 1.4 + (Math.random() * 2 - 1) * 8;
      const up = 20 + Math.random() * 30;
      const down = floor - target.y - Math.random() * 10;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const y = -up * Math.sin(Math.min(t / 0.4, 1) * (Math.PI / 2)) + (t > 0.4 ? ((t - 0.4) / 0.6) ** 2 * (up + down) : 0);
        frames.push({ transform: `translate(${x * t}px,${y}px) scaleX(${k % 2 ? 0.3 : 1})`, opacity: k === 10 ? 0 : 1 });
      }
      effects.push(Fx.spawn(fxEl, PayDay.coin(size * (0.7 + Math.random() * 0.3)), target, frames, { duration: 700 + Math.random() * 100, delay: i * 20, easing: 'linear' }));
    }
    await Promise.all(effects);
  }

  /** A shiny gold coin `size` px across. */
  private static coin(size: number): HTMLElement {
    return Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle at 35% 30%,#FFF8C0,#F8D030 45%,#C89810);border:1.5px solid #8A6A08;box-shadow:0 0 5px #FFE060');
  }
}
