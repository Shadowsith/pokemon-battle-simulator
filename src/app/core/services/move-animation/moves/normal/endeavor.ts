import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The user strains until ~0.5 s; the burst hits the target at `HIT` (ms). */
const HIT = 600;

/**
 * Endeavor, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/c5/Notsituation_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/ea/Notsituation_Gen5.png
 *
 * The user strains, shaking three times as cyan sweat drops fly off it
 * (0-0.5 s), then a yellow spiky burst flares on the target, which shakes
 * (0.6 s, burst gone at ~0.9 s).
 */
export class Endeavor {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const lw = Math.max(lr.width, 50);
    const head: Point = { x: launch.x, y: launch.y - lr.height * 0.35 };
    const effects: Promise<void>[] = [];
    for (let t = 0; t < 3; t++) setTimeout(() => Fx.shake(launchEl, 3), t * 150);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * lw * (0.35 + (i % 3) * 0.08);
      const drop = Fx.box(7, 11, 'border-radius:50% 50% 50% 50% / 65% 65% 35% 35%;background:radial-gradient(circle at 40% 60%,#ffffff,#7AE8F0 50%,#2AA8C8)');
      effects.push(Fx.spawn(fxEl, drop, head, [
        { transform: `translate(0,0) rotate(${side * 30}deg) scale(.5)`, opacity: 0 },
        { transform: `translate(${x * 0.6}px,-14px) rotate(${side * 40}deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x}px,8px) rotate(${side * 60}deg) scale(1)`, opacity: 0 }
      ], { duration: 350, easing: 'ease-out', delay: (i >> 1) * 150 }));
    }
    effects.push(Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.6, 36), '#F8C820', '#FFEA5A'), target, [
      { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'scale(1.1) rotate(15deg)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.2) rotate(25deg)', opacity: 0 }
    ], { duration: 300, easing: 'ease-out', delay: HIT }));
    setTimeout(() => {
      Fx.flash(targetEl, '#FFE84A', 0.5);
      Fx.shake(targetEl, 5);
    }, HIT);
    await Promise.all(effects);
  }
}
