import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The user charges until `DASH`, rams the target at `HIT` (ms). */
const DASH = 450;
const HIT = 600;
const TOTAL = 1000;

/**
 * Spark, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/e9/Funkensprung_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/04/Funkensprung_Gen5.png
 *
 * The user crackles with yellow sparks and a bright ball of light flares on
 * it (0-0.45 s). Charged, it darts into the target (0.45-0.6 s, hit at
 * 0.6 s): yellow light orbs scatter round the target, which turns yellow and
 * crackles (0.6-1.0 s) while the user slides home.
 */
export class Spark {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const base = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.6;
    const dy = (target.y - launch.y) * 0.6;
    const at = (ms: number) => ms / TOTAL;
    const yellow = 'sepia(1) saturate(5) hue-rotate(10deg) brightness(1.3) drop-shadow(0 0 6px #FFE04A)';

    const stopUser = FxEffects.crackleOver(fxEl, launch, Math.max(lr.width, lr.height, 50), '#FFF27A');
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { transform: base, filter: 'none' },
        { transform: base, filter: yellow, offset: at(250) },
        { transform: base, filter: yellow, offset: at(DASH), easing: 'ease-in' },
        { transform: `${base} translate(${dx}px,${dy}px)`, filter: yellow, offset: at(HIT), easing: 'ease-out' },
        { transform: base, filter: 'none' }
      ], { duration: TOTAL, easing: 'linear', fill: 'none' }),
      Fx.spawn(fxEl, Fx.box(lr.width * 0.6, lr.width * 0.6, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 25%,#FFF27A 45%,#FFD82000 72%)'), launch, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1.2)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1.5)', opacity: 0 }
      ], { duration: 250, easing: 'ease-out', delay: 250 })
    ];
    await Fx.wait(DASH);
    stopUser();
    await Fx.wait(HIT - DASH);
    Fx.flash(targetEl, '#FFE04A', 0.7);
    Fx.shake(targetEl, 5);
    const stopTarget = FxEffects.crackleOver(fxEl, target, Math.max(tr.width, tr.height, 50), '#FFF27A');
    effects.push(Fx.glow(targetEl, yellow, 400));
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      const d = Math.max(tr.width, 50) * (0.45 + Math.random() * 0.2);
      effects.push(
        Fx.spawn(fxEl, Fx.box(10, 10, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFE04A 50%,#FFD82000);box-shadow:0 0 6px #FFE04A'), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(a) * d * 1.1}px,${Math.sin(a) * d * 1.1}px) scale(.6)`, opacity: 0 }
        ], { duration: 380, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
    stopTarget();
  }
}
