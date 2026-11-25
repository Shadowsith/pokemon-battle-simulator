import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The light orbs swap sides in `TRAVEL` ms; both Pokémon flash when they arrive. */
const TRAVEL = 750;

/**
 * Skill Swap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/8c/F%C3%A4higkeitstausch_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f3/F%C3%A4higkeitstausch_Gen5.png
 *
 * Glowing yellow light orbs (with a blue one among them) well up out of the
 * user and the target at once and cross over to the other side in a high
 * and a low arc (0.05-0.8 s). As they sink in, both Pokémon flash yellow
 * (0.8-1.1 s).
 */
export class SkillSwap {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const effects: Promise<void>[] = [
      ...SkillSwap.cross(fxEl, launch, target, -1),
      ...SkillSwap.cross(fxEl, target, launch, 1),
      Fx.wait(TRAVEL + 50).then(() => {
        Fx.flash(launchEl, '#FFF06A', 0.7);
        Fx.flash(targetEl, '#FFF06A', 0.7);
        return Fx.wait(250);
      })
    ];
    await Promise.all(effects);
  }

  /** Four orbs fly `from` → `to`, arcing up (`bend` -1) or down (`bend` 1). */
  private static cross(fxEl: HTMLElement, from: Point, to: Point, bend: 1 | -1): Promise<void>[] {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const arc = bend * Math.max(Math.abs(dx) * 0.18, 24);
    return [0, 1, 2, 3].map((i) => {
      const s = 22 - i * 3;
      const tone = i === 1 ? '#5A8AFF' : '#FFE84A';
      const orb = Fx.box(s, s, `border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff,${tone} 45%,${tone}00 72%);filter:drop-shadow(0 0 5px ${tone})`);
      return Fx.spawn(fxEl, orb, from, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1 + arc * 0.35}px) scale(1)`, opacity: 1, offset: 0.12 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(.5)`, opacity: 0 }
      ], { duration: TRAVEL - i * 60, delay: 50 + i * 60, easing: 'ease-in-out' });
    });
  }
}
