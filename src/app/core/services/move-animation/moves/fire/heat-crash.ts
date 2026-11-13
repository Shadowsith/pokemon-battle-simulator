import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Heat Crash, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/b/be/Brandstempel_Gen5.png
 *
 * The user leaps up out of view (0-0.3 s); a blazing yellow glow flares in
 * the sky above the target (0.3-0.65 s) as the user drops onto it
 * (0.45-0.65 s). At the landing (0.65 s) a fire explosion bursts round the
 * target with dark red smoke puffs, and the target glows red (to ~1.45 s)
 * while the user slides back home.
 */
export class HeatCrash {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height);

    const sunSize = size * 0.7;
    const sun = document.createElement('div');
    sun.style.cssText =
      `width:${sunSize}px;height:${sunSize}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#FFFFE0,#FFE84A 40%,#FFC82A88 60%,#FFC82A00 72%)';
    Fx.place(sun, { x: target.x, y: Math.max(target.y - size * 1.1, sunSize / 2) });
    fxEl.appendChild(sun);
    const glow = Fx.anim(sun, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 350, delay: 300, easing: 'ease-out' }).then(() => sun.remove());

    await Promise.all([
      glow,
      FxEffects.leapCrash(refs, launch, target, async () => {
        const red = 'sepia(1) saturate(6) hue-rotate(-35deg) brightness(.95)';
        Fx.shake(targetEl, 7);
        const effects: Promise<void>[] = [
          FxEffects.fireBlastCloud(fxEl, { x: target.x, y: target.y + tr.height * 0.25 }, size * 0.9, 10, '#FFC24A'),
          Fx.anim(targetEl, [{ filter: 'none' }, { filter: red, offset: 0.2 }, { filter: red, offset: 0.85 }, { filter: 'none' }], {
            duration: 800,
            fill: 'none'
          })
        ];
        for (let i = 0; i < 2; i++) {
          const at: Point = { x: target.x + (i ? 1 : -1) * size * 0.4, y: target.y + tr.height * 0.15 };
          effects.push(Fx.wait(120 + i * 80).then(() => FxEffects.smokePuff(fxEl, at, size * 0.45, ['#B0302A', '#6A1814'])));
        }
        await Promise.all(effects);
      })
    ]);
  }
}
