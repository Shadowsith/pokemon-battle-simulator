import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { ChompFx } from '../../chomp-fx';

/** The jaw snaps shut at `SNAP` (ms); crumbs fly off from then on. */
const SNAP = 450;

/**
 * Bug Bite, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/29/K%C3%A4ferbiss_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/22/K%C3%A4ferbiss_Gen5.png
 *
 * A small jaw snaps shut on the target (0-0.45 s) and nibbles twice more
 * (to ~0.85 s). With every bite little brown and green crumbs fly up off the
 * target and tumble down round it (0.45-1.2 s).
 */
export class BugBite {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const effects: Promise<void>[] = [ChompFx.chomp(refs, target, { w: Math.max(r.width * 0.55, 40), tilt: -8, grinds: 2, rays: false })];
    const colors = ['#8A6A2A', '#B0903A', '#6A8A2A', '#C8B060'];
    for (let i = 0; i < 14; i++) {
      const s = 4 + (i % 3) * 2;
      const crumb = Fx.box(s, s, `border-radius:${i % 2 ? '30%' : '50%'};background:${colors[i % colors.length]};box-shadow:0 0 1px #00000088`);
      const side = (i % 2 ? 1 : -1) * (0.2 + ((i * 3) % 5) * 0.1) * r.width;
      const up = r.height * (0.35 + (i % 4) * 0.1);
      effects.push(Fx.spawn(fxEl, crumb, { x: target.x, y: target.y - r.height * 0.1 }, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
        { transform: `translate(${side * 0.6}px,${-up}px) rotate(120deg)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${side}px,${r.height * 0.45}px) rotate(300deg)`, opacity: 0 }
      ], { duration: 600, delay: SNAP + Math.floor(i / 5) * 140 + (i % 5) * 20, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
