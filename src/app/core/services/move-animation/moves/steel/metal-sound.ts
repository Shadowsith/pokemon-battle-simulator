import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** A screeching ring leaves the user at each of `RINGS` (ms) and takes `TRAVEL` ms to reach the target. */
const RINGS = [0, 180, 360];
const TRAVEL = 500;

/**
 * Metal Sound, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/06/Metallsound_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/b5/Metallsound_Gen5.png
 *
 * The scene darkens (0-0.2 s). Three spinning rings of yellow and black
 * stripes swirl out of the user one after another (0.2, 0.38, 0.56 s) and
 * widen as they fly to the target (each 0.5 s), which trembles while they
 * pass over it (0.65-1.06 s). The scene clears (1.06-1.26 s), then the
 * target's Sp. Def drops sharply - it turns blue under stat-down bubbles
 * (1.26-2.16 s).
 */
export class MetalSound {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const s = Math.max(r.width, 50) * 0.8;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

    const effects: Promise<void>[] = RINGS.map((t) => {
      // A striped disc masked to a thick ring, with a soft yellow glow round it.
      const ring = Fx.box(s, s, 'border-radius:50%;filter:drop-shadow(0 0 5px #FFE84A)');
      ring.appendChild(Fx.box(s, s, 'left:0;top:0;border-radius:50%;background:repeating-conic-gradient(#FFE84A 0 18deg,#2A2410 18deg 30deg);-webkit-mask:radial-gradient(circle,#0000 38%,#000 40% 68%,#0000 70%);mask:radial-gradient(circle,#0000 38%,#000 40% 68%,#0000 70%)'));
      return Fx.spawn(fxEl, ring, launch, [
        { transform: 'translate(0,0) rotate(0deg) scale(.3)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) rotate(120deg) scale(.6)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px,${dy}px) rotate(720deg) scale(1.5)`, opacity: 0.9, offset: 0.9 },
        { transform: `translate(${dx * 1.05}px,${dy * 1.05}px) rotate(800deg) scale(1.7)`, opacity: 0 }
      ], { duration: TRAVEL, delay: t, easing: 'linear' });
    });
    // The target trembles from when the first ring arrives until the last one has passed.
    effects.push(Fx.wait(TRAVEL * 0.9).then(async () => {
      for (let t = 0; t < RINGS[RINGS.length - 1] + TRAVEL * 0.1; t += 140) {
        Fx.shake(targetEl, 3);
        await Fx.wait(140);
      }
    }));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
    await FxEffects.blueStatDrop(refs, target);
  }
}
