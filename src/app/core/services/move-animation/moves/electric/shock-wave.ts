import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The user discharges at `BURST` (ms); the shock hits the target at `HIT` (ms). */
const BURST = 650;
const HIT = 950;

/**
 * Shock Wave, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/ce/Schockwelle_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/ea/Schockwelle_Gen5.png
 *
 * The scene darkens (0-0.2 s). Yellow light orbs swirl in round the user
 * and sink into it while it glows yellow and crackles (0.1-0.65 s). It
 * discharges: a burst of white-violet lightning bolts flashes out round its
 * feet (0.65-0.95 s). The never-missing shock lands on the target, which
 * glows yellow and crackles (0.95-1.35 s). The scene clears (1.35-1.55 s).
 */
export class ShockWave {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const yellow = 'sepia(1) saturate(6) hue-rotate(5deg) brightness(1.3) drop-shadow(0 0 6px #FFE84A)';
    const effects: Promise<void>[] = [
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 200, easing: 'ease-out' }),
      Fx.glow(launchEl, yellow, 800, 100)
    ];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      const d = Math.max(lr.width, 50) * (0.7 + (i % 3) * 0.15);
      const orb = Fx.box(9, 9, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFF06A 50%,#FFE04A00 75%);box-shadow:0 0 6px #FFE84A');
      effects.push(Fx.spawn(fxEl, orb, { x: launch.x + Math.cos(a) * d, y: launch.y + Math.sin(a) * d * 0.7 }, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${-Math.cos(a + 0.6) * d * 0.4}px,${-Math.sin(a + 0.6) * d * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${-Math.cos(a) * d}px,${-Math.sin(a) * d * 0.7}px) scale(.5)`, opacity: 0 }
      ], { duration: 420, delay: 100 + (i * 37) % 160, easing: 'ease-in' }));
    }
    const charge = FxEffects.crackleOver(fxEl, launch, Math.max(lr.width, lr.height, 50), '#FFF6A0');
    effects.push(Fx.wait(BURST).then(() => {
      charge();
      return ShockWave.bolts(fxEl, { x: launch.x, y: launch.y + lr.height * 0.3 }, Math.max(lr.width, 50));
    }));
    effects.push(Fx.wait(HIT).then(async () => {
      Fx.shake(targetEl, 5);
      Fx.flash(targetEl, '#FFF06A', 0.8);
      const stop = FxEffects.crackleOver(fxEl, target, Math.max(tr.width, tr.height, 50), '#FFF6A0');
      await Fx.glow(targetEl, yellow, 400);
      stop();
    }));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }

  /** A flat ring of jagged white-violet bolts flashing out from `at` (~0.3 s). */
  private static bolts(fxEl: HTMLElement, at: Point, w: number): Promise<void> {
    const size = w * 1.6;
    const el = Fx.box(size, size * 0.5, 'filter:drop-shadow(0 0 4px #B8A0FF)');
    let paths = '';
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10;
      const pts = Fx.zigzagPoints(50, 25, 50 + Math.cos(a) * 48, 25 + Math.sin(a) * 24, 4);
      paths += `<polyline points="${pts}" fill="none" stroke="${i % 2 ? '#ffffff' : '#D8C8FF'}" stroke-width="1.6"/>`;
    }
    el.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 50">${paths}</svg>`;
    return Fx.spawn(fxEl, el, at, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.1)', opacity: 0.6, offset: 0.6 },
      { transform: 'scale(1.15)', opacity: 0 }
    ], { duration: 300, easing: 'ease-out' });
  }
}
