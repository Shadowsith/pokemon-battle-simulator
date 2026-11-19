import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Spike Cannon, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f9/Dornkanone_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/28/Dornkanone_Gen5.png
 *
 * One big white-grey cone spike per hit (`v.hits`, one every 0.4 s): it is
 * fired from alternately above and below the user and flies tip first into
 * the target (0.24 s). On each hit (0.24 / 0.64 / 1.04 / 1.44 / 1.84 s) the
 * target blacks out for a moment, a white star flashes and grey shards
 * scatter.
 */
export class SpikeCannon {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.width * 0.5, 34);
    const effects: Promise<unknown>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const from: Point = { x: launch.x, y: launch.y + (hit % 2 ? 1 : -1) * lr.height * 0.25 };
      const end: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.15, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.15 };
      const dx = end.x - from.x;
      const dy = end.y - from.y;
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      // The glow sits on a wrapper: the clip-path would cut it off.
      const wrap = Fx.box(len, len * 0.3, 'filter:drop-shadow(0 0 3px #ffffffcc)');
      wrap.appendChild(Fx.box(len, len * 0.3, 'left:0;top:0;clip-path:polygon(0 8%,100% 50%,0 92%,6% 50%);background:linear-gradient(180deg,#FFFFFF,#D8D8E0 55%,#8A8A98)'));
      await Fx.spawn(fxEl, wrap, from, [
        { transform: `translate(0,0) rotate(${deg}deg)`, opacity: 0 },
        { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) rotate(${deg}deg)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px,${dy}px) rotate(${deg}deg)`, opacity: 1 }
      ], { duration: 240, easing: 'linear' });
      Fx.shake(targetEl, 3);
      effects.push(
        Fx.glow(targetEl, 'brightness(0)', 160),
        Fx.spawn(fxEl, FxGlyphs.sparkStar(len * 0.9, '#ffffff'), end, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.7) rotate(35deg)', opacity: 0 }
        ], { duration: 220, easing: 'ease-out' })
      );
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 + Math.random() * 0.6;
        const d = len * (0.5 + Math.random() * 0.4);
        effects.push(
          Fx.spawn(fxEl, Fx.box(5, 5, 'background:#C8C8D4;transform:rotate(45deg)'), end, [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 8}px) scale(.5)`, opacity: 0 }
          ], { duration: 350, easing: 'ease-out' })
        );
      }
      await Fx.wait(160);
    }
    await Promise.all(effects);
  }
}
