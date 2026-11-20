import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** How many red zigzag sound lines burst from the user. */
const LINES = 7;
/** The howl rings until `HOWL` (ms); then the user's Attack rises. */
const HOWL = 750;

/**
 * Howl, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/7a/Jauler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e7/Jauler_Gen5.png
 *
 * The user howls: a red glow swells round it and red zigzag sound lines
 * shoot up and out from its head in waves (0-0.7 s). Then its Attack rises
 * - orange bands scroll up over it (0.75-1.55 s).
 */
export class Howl {
  static async play(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const head: Point = { x: launch.x + v.dir * w * 0.15, y: launch.y - Math.max(r.height, 50) * 0.3 };
    const halo = Fx.box(w * 1.4, w * 1.4, 'border-radius:50%;background:radial-gradient(circle,#FF3A2A88,#FF3A2A33 50%,#FF3A2A00 70%)');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, halo, launch, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' })
    ];
    for (let i = 0; i < LINES; i++) {
      const a = -90 + (i - (LINES - 1) / 2) * 22 + v.dir * 10;
      const rad = (a * Math.PI) / 180;
      const len = w * 0.45;
      const line = Fx.box(len, 10, 'transform-origin:0 50%');
      line.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 40 10" preserveAspectRatio="none"><polyline points="0,5 6,1 12,9 18,1 24,9 30,1 36,9 40,5" fill="none" stroke="#FF2A1A" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
      line.style.filter = 'drop-shadow(0 0 3px #FF8A6A)';
      const d = w * 0.25;
      effects.push(Fx.spawn(fxEl, line, { x: head.x + len / 2, y: head.y }, [
        { transform: `translate(${Math.cos(rad) * d * 0.3}px,${Math.sin(rad) * d * 0.3}px) rotate(${a}deg) scaleX(.3)`, opacity: 0 },
        { transform: `translate(${Math.cos(rad) * d}px,${Math.sin(rad) * d}px) rotate(${a}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${Math.cos(rad) * d * 2}px,${Math.sin(rad) * d * 2}px) rotate(${a}deg) scaleX(1)`, opacity: 0 }
      ], { duration: 380, easing: 'ease-out', delay: (i % 3) * 110 + (i % 2) * 50 }));
    }
    setTimeout(() => Fx.shake(launchEl, 2), 100);
    await Promise.all(effects);
    await Fx.wait(HOWL - 700);
    await FxEffects.statUpAura(refs, launch);
  }
}
