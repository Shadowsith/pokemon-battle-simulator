import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** A seed is fired every `GAP` ms and lands `FLIGHT` ms later. */
const GAP = 250;
const FLIGHT = 300;

/**
 * Bullet Seed, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/20/Kugelsaat_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/2e/Kugelsaat_Gen5.png
 *
 * One seed per hit (`v.hits`): a brown seed is spat out every 0.25 s and
 * lobs over to the target in a low arc, landing 0.3 s later (0.3 / 0.55 /
 * 0.8 s for three) with a burst of yellow sparks while the target flickers
 * dark.
 */
export class BulletSeed {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const t0 = hit * GAP;
      const end: Point = { x: target.x + ((hit % 3) - 1) * w * 0.15, y: target.y + ((hit % 2) ? -1 : 1) * w * 0.08 };
      const dx = end.x - launch.x;
      const dy = end.y - launch.y;
      const arc = -Math.max(Math.abs(dx) * 0.18, 24);
      const seed = Fx.box(10, 13, 'border-radius:50% 50% 45% 45% / 60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#E8B878,#9A6028 60%,#5A3410);box-shadow:0 0 2px #00000088');
      effects.push(Fx.spawn(fxEl, seed, launch, [
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1 + arc * 0.4}px) scale(.8)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(1.1)`, opacity: 1 }
      ], { duration: FLIGHT, easing: 'linear', delay: t0 }));
      for (let s = 0; s < 5; s++) {
        const a = (Math.PI * 2 * s) / 5 + hit * 0.6;
        const d = w * 0.22;
        effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(11, '#FFE84A'), end, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out', delay: t0 + FLIGHT }));
      }
      effects.push(Fx.anim(targetEl, [{ filter: 'brightness(.3)' }, { filter: 'none' }], { duration: 160, delay: t0 + FLIGHT, fill: 'none' }));
    }
    await Promise.all(effects);
  }
}
