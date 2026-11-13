import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Night Daze, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/e/ee/Nachtflut_Gen5.png
 *
 * Crimson-purple ripple rings spread over the ground from the user's feet
 * (0-0.9 s) while dark purple orbs well up round the target and burst
 * (0.2-0.8 s). At the hit (0.6 s) a murky dusk settles over the scene and
 * the target darkens (0.6-1.5 s); the dusk lifts (to ~1.8 s).
 */
export class NightDaze {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const foot: Point = { x: launch.x, y: launch.y + lr.height * 0.4 };
    const effects: Promise<void>[] = [
      FxEffects.groundRipples(fxEl, foot, Math.max(lr.width * 3, 220), ['#9A1A4A', '#5A1A6A'], 4, 130, 500)
    ];

    // Dark purple orbs well up round the target and burst.
    for (let i = 0; i < 7; i++) {
      const orb = document.createElement('div');
      const s = 12 + Math.random() * 8;
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#C86AC8,#7A2A8A 50%,#3A0A4A 80%,#3A0A4A00);box-shadow:0 0 6px #8A2A9A`;
      Fx.place(orb, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.8, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.6 });
      fxEl.appendChild(orb);
      effects.push(
        Fx.anim(orb, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(1.6)', opacity: 0 }
        ], { duration: 350, delay: 200 + Math.random() * 250, easing: 'ease-out' }).then(() => orb.remove())
      );
    }
    await Fx.wait(600);

    // The hit: a murky dusk settles, the target darkens.
    const dusk = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 40%,#5A4E36,#2A2416 60%,#0E0C06)');
    Fx.flash(targetEl, '#6A2A7A', 0.6);
    Fx.shake(targetEl, 5);
    effects.push(
      Fx.anim(dusk, [{ opacity: 0 }, { opacity: 0.9, offset: 0.25 }, { opacity: 0.9, offset: 0.75 }, { opacity: 0 }], {
        duration: 1200,
        easing: 'ease-in-out'
      }).then(() => dusk.remove()),
      Fx.anim(targetEl, [{ filter: 'none' }, { filter: 'brightness(.45)', offset: 0.3 }, { filter: 'brightness(.45)', offset: 0.7 }, { filter: 'none' }], {
        duration: 1000,
        easing: 'ease-in-out',
        fill: 'none'
      })
    );
    await Promise.all(effects);
  }
}
