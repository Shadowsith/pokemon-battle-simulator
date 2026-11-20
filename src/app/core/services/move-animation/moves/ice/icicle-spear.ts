import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** An icicle is thrown every `GAP` ms and strikes `FLIGHT` ms later. */
const GAP = 220;
const FLIGHT = 260;

/**
 * Icicle Spear, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/4f/Eisspeer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/38/Eisspeer_Gen5.png
 *
 * One icicle per hit (`v.hits`): a pale blue spear of ice shoots straight
 * from the user at the target every 0.22 s and strikes 0.26 s later (0.26 /
 * 0.48 / 0.7 s … for each hit). Each strike bursts into white frost puffs
 * and icy sparkles round a different spot of the target, which flashes
 * icy blue (last puffs gone ~0.4 s after the last hit).
 */
export class IcicleSpear {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const len = Math.max(w * 0.6, 34);
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const t0 = hit * GAP;
      const end: Point = { x: target.x + ((hit % 3) - 1) * w * 0.18, y: target.y + ((hit % 2) ? -1 : 1) * w * 0.12 };
      const dx = end.x - launch.x;
      const dy = end.y - launch.y;
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      // The glow sits on a wrapper: a drop-shadow on the clip-path element would be cut off.
      const spear = Fx.box(len, len * 0.28, 'filter:drop-shadow(0 0 4px #BFF0FF)');
      spear.appendChild(Fx.box(len, len * 0.28, 'left:0;top:0;clip-path:polygon(0 35%,70% 0,100% 50%,70% 100%,0 65%);background:linear-gradient(180deg,#FFFFFF,#BDEBFF 45%,#5AB4E8)'));
      effects.push(Fx.spawn(fxEl, spear, launch, [
        { transform: `translate(0,0) rotate(${deg}deg) scale(.5)`, opacity: 0 },
        { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) rotate(${deg}deg) scale(1)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px,${dy}px) rotate(${deg}deg) scale(1)`, opacity: 1 }
      ], { duration: FLIGHT, easing: 'linear', delay: t0 }));
      effects.push(Fx.wait(t0 + FLIGHT).then(() => {
        Fx.flash(targetEl, '#9AE0FF', 0.5);
        Fx.shake(targetEl, 3);
        const burst: Promise<void>[] = [];
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI * 2 * i) / 4 + hit;
          const at = { x: end.x + Math.cos(a) * w * 0.2, y: end.y + Math.sin(a) * w * 0.16 };
          burst.push(FxEffects.smokePuff(fxEl, at, w * 0.22, ['#FFFFFF', '#CFEAF8']));
          burst.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#E8FAFF'), at, [
            { transform: 'scale(.3)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * 12}px,${Math.sin(a) * 12}px) scale(1)`, opacity: 0 }
          ], { duration: 360, easing: 'ease-out' }));
        }
        return Promise.all(burst).then(() => void 0);
      }));
    }
    await Promise.all(effects);
  }
}
