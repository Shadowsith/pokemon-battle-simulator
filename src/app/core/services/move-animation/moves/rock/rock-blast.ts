import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** A rock is hurled every `GAP` ms and smashes into the target `FLIGHT` ms later. */
const GAP = 280;
const FLIGHT = 320;

/**
 * Rock Blast, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/66/Felswurf_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/fb/Felswurf_Gen5.png
 *
 * One rock per hit (`v.hits`): a tumbling boulder is hurled at the target
 * every 0.28 s in a low arc and smashes into it 0.32 s later (0.32 / 0.6 /
 * 0.88 s … for each hit). Each smash bursts into a yellow dust cloud with
 * small rock bits flying off, and the target flickers dark and shakes
 * (dust gone ~0.5 s after the last hit).
 */
export class RockBlast {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const size = Math.max(w * 0.4, 22);
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const t0 = hit * GAP;
      const end: Point = { x: target.x + ((hit % 3) - 1) * w * 0.12, y: target.y - ((hit % 2) ? 1 : -1) * w * 0.06 };
      const dx = end.x - launch.x;
      const dy = end.y - launch.y;
      const arc = -Math.max(Math.abs(dx) * 0.15, 22);
      effects.push(Fx.spawn(fxEl, FxGlyphs.rockChunk(size), launch, [
        { transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0 },
        { transform: `translate(${dx * 0.15}px,${dy * 0.15 + arc * 0.5}px) rotate(80deg) scale(.85)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) rotate(240deg) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) rotate(460deg) scale(1.05)`, opacity: 1 }
      ], { duration: FLIGHT, easing: 'linear', delay: t0 }));
      effects.push(Fx.wait(t0 + FLIGHT).then(() => {
        Fx.shake(targetEl, 5);
        const burst: Promise<void>[] = [
          FxEffects.smokePuff(fxEl, end, w * 0.7, ['#F0D860', '#C8A830']),
          Fx.anim(targetEl, [{ filter: 'brightness(.3)' }, { filter: 'none' }], { duration: 160, fill: 'none' })
        ];
        for (let i = 0; i < 4; i++) {
          const a = -Math.PI / 2 + (i - 1.5) * 0.7;
          const d = w * 0.5;
          burst.push(Fx.spawn(fxEl, FxGlyphs.rockChunk(7 + (i % 2) * 3), end, [
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) rotate(180deg)`, opacity: 1, offset: 0.6 },
            { transform: `translate(${Math.cos(a) * d * 1.3}px,${Math.sin(a) * d + 20}px) rotate(260deg)`, opacity: 0 }
          ], { duration: 450, easing: 'ease-out' }));
        }
        return Promise.all(burst).then(() => void 0);
      }));
    }
    await Promise.all(effects);
  }
}
