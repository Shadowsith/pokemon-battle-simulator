import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Poison Powder, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b5/Giftpuder_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0f/Giftpuder_Gen5.png
 *
 * A cloud of glowing purple powder appears above the target (0-0.25 s) and
 * sifts down over it, swaying (0.25-0.85 s). The target turns purple as it is
 * dusted (0.45-1.1 s), and the last specks float back up and fade (to ~1.35 s).
 */
export class PoisonPowder {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const spreadX = Math.max(tr.width * 0.5, 34);
    const top = target.y - Math.max(tr.height * 0.75, 50);
    const effects: Promise<unknown>[] = [Fx.glow(targetEl, 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(1.05)', 650, 450)];
    for (let i = 0; i < 34; i++) {
      const s = 5 + Math.random() * 5;
      const dot = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#F4C8FF,#C040E0 55%,#8A20B0);box-shadow:0 0 5px #D060F0');
      const x = (Math.random() * 2 - 1) * spreadX;
      const fall = target.y + (Math.random() * 0.6 - 0.2) * tr.height - top;
      const sway = 6 + Math.random() * 8;
      // A few specks float back up once they have settled.
      const rises = i % 5 === 0;
      const frames: Keyframe[] = [
        { transform: 'translate(0,-6px) scale(.2)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.2 },
        { transform: `translate(${sway}px,${fall * 0.4}px) scale(1)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${-sway}px,${fall * 0.75}px) scale(1)`, opacity: 1, offset: 0.7 },
        rises
          ? { transform: `translate(${sway * 1.5}px,${fall * 0.2}px) scale(.8)`, opacity: 0 }
          : { transform: `translate(0,${fall}px) scale(.6)`, opacity: 0 }
      ];
      effects.push(Fx.spawn(fxEl, dot, { x: target.x + x, y: top + Math.random() * 18 }, frames, { duration: rises ? 1250 : 850, delay: Math.random() * 120, easing: 'ease-in-out' }));
    }
    setTimeout(() => Fx.shake(targetEl, 3), 500);
    await Promise.all(effects);
  }
}
