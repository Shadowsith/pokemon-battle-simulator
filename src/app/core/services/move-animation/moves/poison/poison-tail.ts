import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The tail swishes across the target, striking at `HIT` (ms). */
const HIT = 280;
/** How many poison orbs rise off the target. */
const ORBS = 8;

/**
 * Poison Tail, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/24/Giftschweif_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f0/Giftschweif_Gen5.png
 *
 * A pale tail swish - a fan of white motion streaks - whips across the
 * target, striking it at 0.28 s. A yellow-brown dust cloud billows round
 * its feet (0.28-1.0 s) while the target turns poison purple and glossy
 * purple orbs rise off it (0.3-1.2 s).
 */
export class PoisonTail {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const effects: Promise<void>[] = [];
    // The swish: curved white streaks sweeping from the user's side over the target.
    for (let i = 0; i < 4; i++) {
      const streak = Fx.box(w * 1.1, w * 0.55, '');
      streak.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 50"><path d="M4 ${40 - i * 6} Q50 ${-6 + i * 4} 96 ${40 - i * 6}" fill="none" stroke="#FFFFFF" stroke-width="${3 - i * 0.5}" stroke-linecap="round" opacity="${0.95 - i * 0.18}"/></svg>`;
      if (v.dir < 0) streak.style.transform = 'scaleX(-1)';
      const holder = Fx.box(w * 1.1, w * 0.55, '');
      holder.appendChild(streak);
      effects.push(Fx.spawn(fxEl, holder, { x: target.x, y: target.y - r.height * 0.1 }, [
        { transform: `translateX(${-v.dir * w * 0.4}px) rotate(${-v.dir * 25}deg) scaleX(.3)`, opacity: 0 },
        { transform: `translateX(0) rotate(0deg) scaleX(1)`, opacity: 1, offset: 0.55 },
        { transform: `translateX(${v.dir * w * 0.3}px) rotate(${v.dir * 20}deg) scaleX(.8)`, opacity: 0 }
      ], { duration: HIT + 150, delay: i * 25, easing: 'ease-out' }));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 5);
      Fx.flash(targetEl, '#FFFFFF', 0.4);
      return FxEffects.smokeCloud(fxEl, { x: target.x, y: target.y + r.height * 0.25 }, w * 1.4, r.height * 0.4, ['#E8C860', '#B08A30'], 10, 500, 220);
    }));
    effects.push(Fx.glow(targetEl, 'sepia(1) saturate(4) hue-rotate(250deg) brightness(.9)', 850, HIT + 20));
    for (let i = 0; i < ORBS; i++) {
      const x = ((i % 4) - 1.5) * w * 0.2;
      effects.push(Fx.spawn(fxEl, FxGlyphs.poisonBubble(11 + (i % 3) * 4), { x: target.x + x, y: target.y }, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: `translate(0,${-r.height * 0.35}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x * 0.3}px,${-r.height * 0.8}px) scale(1.1)`, opacity: 0 }
      ], { duration: 600, delay: HIT + 20 + (i % 4) * 60 + (i >> 2) * 70, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
