import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Scratch, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/da/Kratzer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0b/Kratzer_Gen5.png
 *
 * Three parallel yellow claw streaks rake down across the target from upper
 * right to lower left, one right after the other (0-0.2 s; hit at 0.12 s),
 * then fade while yellow specks scatter and float off (to ~0.65 s).
 */
export class Scratch {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(Math.max(tr.width, tr.height) * 0.85, 60);
    const gap = Math.max(tr.width * 0.11, 8);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      // Each streak is a pointed sliver that shoots out to full length.
      const streak = Fx.box(len, 6, 'clip-path:polygon(0 50%,20% 15%,100% 0,100% 100%,20% 85%);background:linear-gradient(90deg,#FFF6B0,#FFE040 50%,#FFFFFF)');
      const wrap = Fx.box(len, 6, 'filter:drop-shadow(0 0 4px #FFD020)');
      streak.style.left = streak.style.top = '0';
      wrap.appendChild(streak);
      const off = (i - 1) * gap;
      effects.push(
        Fx.spawn(fxEl, wrap, { x: target.x + off, y: target.y + off * 0.6 }, [
          { transform: 'rotate(-55deg) scaleX(0)', opacity: 1 },
          { transform: 'rotate(-55deg) scaleX(1)', opacity: 1, offset: 0.3 },
          { transform: 'rotate(-55deg) scaleX(1)', opacity: 1, offset: 0.6 },
          { transform: 'rotate(-55deg) scaleX(1) scaleY(.3)', opacity: 0 }
        ], { duration: 420, delay: i * 45, easing: 'ease-out' })
      );
    }
    await Fx.wait(120);
    Fx.flash(targetEl, '#FFE84A', 0.5);
    Fx.shake(targetEl, 4);
    for (let i = 0; i < 10; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.4, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.4 };
      const s = 4 + Math.random() * 4;
      effects.push(
        Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;background:#FFE860;box-shadow:0 0 5px #FFD020'), at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,-4px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.random() * 16 - 8}px,-22px) scale(.5)`, opacity: 0 }
        ], { duration: 450, delay: Math.random() * 100, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
