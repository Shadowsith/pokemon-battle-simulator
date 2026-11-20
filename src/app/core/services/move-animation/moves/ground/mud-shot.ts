import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The mud stream gushes from the user until `STREAM` (ms). */
const STREAM = 650;
/** How many mud clods fly along the stream. */
const CLODS = 12;

/**
 * Mud Shot, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1e/Lehmschuss_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/eb/Lehmschuss_Gen5.png
 *
 * An olive-brown stream of mud gushes from the user to the target
 * (0-0.65 s), dark brown clods flying along it and scattering round the
 * target (last clods gone at 0.7 s), which shakes under the splatter
 * (0.2-0.6 s). Then the target's Speed drops - it turns blue under
 * stat-down bubbles (0.7-1.6 s).
 */
export class MudShot {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy);
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const thick = Math.max(tr.height * 0.22, 16);

    // The stream: a bar anchored at the user that stretches out to the target, then thins away.
    const stream = Fx.box(len, thick, `transform-origin:0 50%;border-radius:${thick}px;background:linear-gradient(180deg,#6A5A1Acc,#A8A040 45%,#6A5A1Acc);filter:blur(1.5px)`);
    stream.style.left = `${launch.x}px`;
    stream.style.top = `${launch.y - thick / 2}px`;
    fxEl.appendChild(stream);
    const effects: Promise<void>[] = [
      Fx.anim(stream, [
        { transform: `rotate(${deg}deg) scale(0,.6)`, opacity: 0.9 },
        { transform: `rotate(${deg}deg) scale(1,1)`, opacity: 1, offset: 0.3 },
        { transform: `rotate(${deg}deg) scale(1,1)`, opacity: 1, offset: 0.75 },
        { transform: `rotate(${deg}deg) scale(1,.1)`, opacity: 0 }
      ], { duration: STREAM, easing: 'ease-out' }).then(() => stream.remove())
    ];
    for (let i = 0; i < CLODS; i++) {
      const size = 9 + (i % 4) * 3;
      const clod = Fx.box(size, size * 0.85, `border-radius:${45 + (i % 3) * 8}% ${55 - (i % 3) * 8}% 50% 40%;background:radial-gradient(circle at 35% 35%,#8A6A3A,#4A3214 60%,#2A1A08)`);
      const a = (Math.PI * 2 * i) / CLODS;
      const off = tr.width * (0.3 + (i % 3) * 0.12);
      effects.push(Fx.spawn(fxEl, clod, launch, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px,${dy * 0.3 + ((i % 3) - 1) * 6}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx + Math.cos(a) * off}px,${dy + Math.sin(a) * off * 0.7}px) scale(.8)`, opacity: 0 }
      ], { duration: 420, delay: i * 25, easing: 'linear' }));
    }
    effects.push(Fx.wait(200).then(async () => {
      for (let i = 0; i < 3; i++) {
        Fx.shake(targetEl, 4);
        await Fx.wait(130);
      }
    }));
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
