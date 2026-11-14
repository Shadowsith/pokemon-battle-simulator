import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Scald, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/9/90/Siedewasser_Gen5.png
 *
 * A jet of hot, pale cyan water shoots from the user to the target
 * (0-0.35 s) and keeps gushing (to 0.75 s) while white mist sprays off the
 * target (hit 0.35 s). The jet fades (0.75-0.95 s), the target flushes red
 * and white steam curls up from it (0.95-1.95 s).
 */
export class Scald {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    // The jet: a soft cyan-white band growing from the user to the target.
    const jet = document.createElement('div');
    jet.style.cssText =
      `position:absolute;left:${launch.x}px;top:${launch.y - 11}px;width:${len}px;height:22px;pointer-events:none;` +
      `transform-origin:0 50%;transform:rotate(${angle}deg);border-radius:11px;` +
      'background:linear-gradient(180deg,#9AE8F000,#C8F6FF 30%,#FFFFFF 50%,#C8F6FF 70%,#9AE8F000);filter:drop-shadow(0 0 5px #6AD8F0)';
    fxEl.appendChild(jet);
    const flow = jet.animate([{ opacity: 0.85 }, { opacity: 1 }, { opacity: 0.85 }], { duration: 120, iterations: Infinity });
    await Fx.anim(jet, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 350, easing: 'ease-in' });

    // The hit: mist sprays off the target while the jet keeps gushing.
    Fx.flash(targetEl, '#FFFFFF', 0.5);
    Fx.shake(targetEl, 5);
    const effects: Promise<void>[] = [
      FxEffects.smokePuff(fxEl, target, Math.max(tr.width, 60), ['#E8FAFF', '#9ADCF0']),
      Fx.wait(200).then(() => FxEffects.smokePuff(fxEl, { x: target.x, y: target.y - 8 }, Math.max(tr.width, 60) * 0.9, ['#E8FAFF', '#9ADCF0']))
    ];
    await Fx.wait(400);
    await Fx.anim(jet, [{ clipPath: 'inset(0 0 0 0)', opacity: 1 }, { clipPath: 'inset(0 0 0 100%)', opacity: 0.6 }], { duration: 200, easing: 'ease-out' });
    flow.cancel();
    jet.remove();

    // The target flushes red, steam curls up.
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(6) hue-rotate(-30deg) brightness(.95)', offset: 0.2 },
        { filter: 'sepia(1) saturate(6) hue-rotate(-30deg) brightness(.95)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 850, fill: 'none' })
    );
    for (let i = 0; i < 7; i++) {
      const s = 14 + Math.random() * 10;
      const steam = document.createElement('div');
      steam.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#FFFFFF,#ECEFF4cc 55%,#D4D8E000 75%)`;
      Fx.place(steam, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3, y: target.y - tr.height * 0.25 });
      fxEl.appendChild(steam);
      const sway = (Math.random() * 2 - 1) * 10;
      effects.push(
        Fx.anim(steam, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${sway}px,-16px) scale(1)`, opacity: 0.95, offset: 0.35 },
          { transform: `translate(${-sway}px,-42px) scale(1.4)`, opacity: 0 }
        ], { duration: 650, delay: i * 70, easing: 'ease-out', fill: 'backwards' }).then(() => steam.remove())
      );
    }
    await Promise.all(effects);
  }
}
