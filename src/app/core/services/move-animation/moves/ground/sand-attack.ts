import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Sand Attack, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/59/Sandwirbel_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/13/Sandwirbel_Gen5.png
 *
 * The user kicks up a spray of sand that flies low at the target (0-0.5 s)
 * and engulfs it in a gritty yellow-brown cloud (0.45-1.0 s); then its
 * accuracy drops: the target turns blue under stat-down bubbles (1.0-1.9 s).
 */
export class SandAttack {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const from = { x: launch.x, y: (launch.y + Fx.footOf(launchEl, fieldEl).y) / 2 };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const effects: Promise<unknown>[] = [];
    for (let i = 0; i < 30; i++) {
      const s = 3 + Math.random() * 4;
      const grain = Fx.box(s, s, `border-radius:40%;background:${i % 3 ? '#E0B850' : '#A8782A'}`);
      const jx = (Math.random() * 2 - 1) * tr.width * 0.35;
      const jy = (Math.random() * 2 - 1) * tr.height * 0.3;
      const lift = 20 + Math.random() * 30;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        frames.push({ transform: `translate(${(dx + jx) * t}px,${(dy + jy) * t - Math.sin(t * Math.PI) * lift}px)`, opacity: k === 0 ? 0 : k === 6 ? 0.3 : 1 });
      }
      effects.push(Fx.spawn(fxEl, grain, from, frames, { duration: 420, delay: i * 8, easing: 'ease-out' }));
    }
    await Fx.wait(450);
    Fx.shake(targetEl, 3);
    effects.push(
      FxEffects.smokePuff(fxEl, target, Math.max(tr.width * 1.1, 70), ['#E8C870dd', '#B08838bb']),
      Fx.glow(targetEl, 'sepia(1) saturate(2) brightness(.8)', 550)
    );
    await Promise.all(effects);
    await FxEffects.blueStatDrop(refs, target);
  }
}
