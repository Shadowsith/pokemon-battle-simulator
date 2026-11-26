import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The light orbs swap sides in `TRAVEL` ms; both Pokémon flash when they arrive. */
const TRAVEL = 750;

/** Orb colours of a swap: the main tone, the odd orb's tone and the flash on arrival. */
export interface SwapStyle {
  tone: string;
  odd: string;
  flash: string;
}

/**
 * Skill Swap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/8c/F%C3%A4higkeitstausch_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f3/F%C3%A4higkeitstausch_Gen5.png
 *
 * Glowing yellow light orbs (with a blue one among them) well up out of the
 * user and the target at once and cross over to the other side in a high
 * and a low arc (0.05-0.8 s). As they sink in, both Pokémon flash yellow
 * (0.8-1.1 s).
 *
 * Guard Swap plays the same exchange with pale blue orbs (`GUARD`):
 * - Gen 4: https://www.pokewiki.de/images/1/1f/Schutztausch_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/9/90/Schutztausch_Gen5.png
 */
export class SkillSwap {
  /** Skill Swap: yellow orbs with a blue one. */
  static readonly SKILL: SwapStyle = { tone: '#FFE84A', odd: '#5A8AFF', flash: '#FFF06A' };
  /** Guard Swap: pale blue orbs with a deep blue one. */
  static readonly GUARD: SwapStyle = { tone: '#7AD8FF', odd: '#3A6AFF', flash: '#9AE4FF' };

  static async play(refs: BattleStageRefs, launch: Point, target: Point, style: SwapStyle = SkillSwap.SKILL) {
    const { fxEl, launchEl, targetEl } = refs;
    const effects: Promise<void>[] = [
      ...SkillSwap.cross(fxEl, launch, target, -1, style),
      ...SkillSwap.cross(fxEl, target, launch, 1, style),
      Fx.wait(TRAVEL + 50).then(() => {
        Fx.flash(launchEl, style.flash, 0.7);
        Fx.flash(targetEl, style.flash, 0.7);
        return Fx.wait(250);
      })
    ];
    await Promise.all(effects);
  }

  /** Four orbs fly `from` → `to`, arcing up (`bend` -1) or down (`bend` 1). */
  private static cross(fxEl: HTMLElement, from: Point, to: Point, bend: 1 | -1, style: SwapStyle): Promise<void>[] {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const arc = bend * Math.max(Math.abs(dx) * 0.18, 24);
    return [0, 1, 2, 3].map((i) => {
      const s = 22 - i * 3;
      const tone = i === 1 ? style.odd : style.tone;
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
