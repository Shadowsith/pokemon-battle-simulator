import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Double Team, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5e/Doppelteam_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/ea/Doppelteam_Gen5.png
 *
 * Two see-through copies of the user split off to its left and right and
 * swap sides back and forth, ever wider, while the user flickers (0-1.0 s);
 * they slide back into it, then orange stat-up bands scroll up over the user
 * (1.0-1.8 s).
 */
export class DoubleTeam {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { launchEl } = refs;
    const r = Fx.rect(launchEl);
    const base = launchEl.style.transform;
    const spread = Math.max(r.width * 0.45, 30);
    // Copies of the sprite sit just behind it, so they share its place and look.
    const copies = [-1, 1].map((side) => {
      const copy = launchEl.cloneNode(false) as HTMLElement;
      // No slot id: sprite lookups by `data-slot` must keep finding the real one.
      copy.removeAttribute('data-slot');
      copy.classList.remove('acting');
      copy.style.pointerEvents = 'none';
      launchEl.before(copy);
      return { copy, side };
    });
    const swaps = [0, 0.55, -0.7, 0.85, -1, 0.6, 0];
    const runs = copies.map(({ copy, side }) =>
      Fx.anim(
        copy,
        swaps.map((f, k) => ({
          transform: `${base} translateX(${side * f * spread}px)`,
          opacity: k === 0 || k === swaps.length - 1 ? 0 : 0.5
        })),
        { duration: 1000, easing: 'ease-in-out', fill: 'none' }
      ).then(() => copy.remove())
    );
    const flicker = Fx.anim(launchEl, [
      { opacity: 1 },
      { opacity: 0.55, offset: 0.2 },
      { opacity: 1, offset: 0.4 },
      { opacity: 0.55, offset: 0.6 },
      { opacity: 1, offset: 0.8 },
      { opacity: 1 }
    ], { duration: 1000, easing: 'steps(5, end)', fill: 'none' });
    await Promise.all([flicker, ...runs]);
    await FxEffects.statUpAura(refs, launch);
  }
}
