import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The mud ball flies in an arc and lands at `HIT` (ms). */
const HIT = 650;

/**
 * Mud Bomb, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/ef/Schlammbombe_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e2/Schlammbombe_Gen5.png
 *
 * A ball of dark green mud wrapped in a glossy bubble is lobbed at the
 * target in a high arc (0-0.65 s). It bursts there: yellow-green mud splats
 * fly out (0.65-1.05 s) and a murky grey cloud billows over the target
 * while it shakes (0.7-1.4 s).
 */
export class MudBomb {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = -Math.max(Math.abs(dx) * 0.35, 60);
    const s = Math.max(r.width * 0.35, 24);
    const ball = Fx.box(s, s, 'border-radius:50%;border:1.5px solid #CFF0D8aa;background:radial-gradient(circle at 32% 28%,#ffffffcc 0 12%,transparent 16%),radial-gradient(circle,#3A5A1A 0 38%,#5A7A3Acc 50%,#8AC8A066 70%);box-shadow:0 0 6px #A8E0B8aa');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, ball, launch, [
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: `translate(${dx * 0.25}px,${dy * 0.25 + lift * 0.75}px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + lift}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx * 0.75}px,${dy * 0.75 + lift * 0.75}px) scale(1)`, opacity: 1, offset: 0.75 },
        { transform: `translate(${dx}px,${dy}px) scale(.9)`, opacity: 1 }
      ], { duration: HIT, easing: 'linear' })
    ];
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 5);
      const parts: Promise<void>[] = [FxEffects.smokeCloud(fxEl, target, r.width, r.height * 0.8, ['#8A8A80', '#5A5A54'], 9, 600, 250)];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        const reach = Math.max(r.width * 0.6, 40);
        const sz = 8 + (i % 3) * 4;
        parts.push(Fx.spawn(fxEl, Fx.box(sz, sz, 'border-radius:45% 55% 50% 40%;background:radial-gradient(circle at 40% 35%,#F4FF9A,#C8E04A 55%,#8AA82A);box-shadow:0 0 4px #E0F06A'), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * reach * 0.7}px,${Math.sin(a) * reach * 0.55 - 12}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach * 0.6 + 8}px) scale(.7)`, opacity: 0 }
        ], { duration: 420, delay: (i * 19) % 60, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
