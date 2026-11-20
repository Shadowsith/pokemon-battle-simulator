import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/** The streak slashes across the target at `HIT` (ms); the scene is clear again at `TOTAL`. */
const HIT = 250;
const TOTAL = 800;

/**
 * Aerial Ace, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/72/Aero-Ass_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a9/Aero-Ass_Gen5.png
 *
 * The scene goes dark (0-0.15 s) while the user darts forward and back as
 * a pale afterimage (0-0.3 s). A blue-white streak slashes diagonally
 * across the target (0.18-0.4 s, hit at 0.25 s) and pink-red orbs scatter
 * off it (0.25-0.65 s). The scene clears (0.6-0.8 s).
 */
export class AerialAce {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const at = (ms: number) => ms / TOTAL;
    const base = launchEl.style.transform;
    const dash = (target.x - launch.x) * 0.12;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const streak = Fx.box(w * 1.6, 7, 'border-radius:4px;background:linear-gradient(90deg,#9AD8FF00,#CFF0FF 30%,#ffffff 50%,#CFF0FF 70%,#9AD8FF00);box-shadow:0 0 10px #8AD0FF,0 0 4px #ffffff');
    const angle = v.dir > 0 ? 35 : -35;
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.85, offset: at(150) },
        { opacity: 0.85, offset: at(600) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' }),
      Fx.anim(launchEl, [
        { transform: base, opacity: 1, filter: 'none' },
        { transform: `${base} translateX(${dash}px)`, opacity: 0.45, filter: 'brightness(1.8)', offset: 0.45 },
        { transform: base, opacity: 1, filter: 'none' }
      ], { duration: 300, easing: 'ease-in-out', fill: 'none' }),
      Fx.spawn(fxEl, streak, target, [
        { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
        { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.35 },
        { transform: `rotate(${angle}deg) scaleX(1) scaleY(.4)`, opacity: 0 }
      ], { duration: 220, easing: 'ease-out', delay: HIT - 70 })
    ];
    for (let i = 0; i < 7; i++) {
      const a = (Math.PI * 2 * i) / 7 + 0.3;
      const d = w * (0.45 + (i % 3) * 0.12);
      const orb = Fx.box(9, 9, `border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff,${i % 2 ? '#FF5A7A' : '#FF9AC0'} 60%);box-shadow:0 0 5px #FF6A90`);
      effects.push(Fx.spawn(fxEl, orb, target, [
        { transform: 'translate(0,0) scale(.4)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.7}px) scale(1)`, opacity: 0 }
      ], { duration: 400, easing: 'ease-out', delay: HIT }));
    }
    setTimeout(() => {
      Fx.flash(targetEl, '#ffffff', 0.6);
      Fx.shake(targetEl, 5);
    }, HIT);
    await Promise.all(effects);
    dim.remove();
  }
}
