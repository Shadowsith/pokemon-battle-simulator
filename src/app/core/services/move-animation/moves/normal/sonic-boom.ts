import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Sonic Boom, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/23/Ultraschall_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/65/Ultraschall_Gen5.png
 *
 * A stream of six white crescent shock waves flies from the user to the
 * target (one every 0.08 s, 0.33 s each, 0-0.73 s). Each one bursts on the
 * target in a white star flash (from the hit at 0.33 s until ~0.9 s).
 */
export class SonicBoom {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const start: Point = { x: launch.x + dir * lr.width * 0.25, y: launch.y };
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const h = Math.max(tr.height * 0.6, 40);
    const effects: Promise<unknown>[] = [];
    for (let i = 0; i < 6; i++) {
      const wave = Fx.box(h * 0.4, h, 'border-radius:50%;border-right:4px solid #ffffff;filter:drop-shadow(0 0 3px #D8DCFF)');
      const delay = i * 80;
      effects.push(
        Fx.spawn(fxEl, wave, start, [
          { transform: `translate(0,0) rotate(${deg}deg) scale(.5)`, opacity: 0 },
          { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) rotate(${deg}deg) scale(.75)`, opacity: 0.95, offset: 0.2 },
          { transform: `translate(${dx}px,${dy}px) rotate(${deg}deg) scale(1.05)`, opacity: 0.9 }
        ], { duration: 330, delay, easing: 'linear' })
      );
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.12, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.12 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(tr.width * 0.4, 28), '#E8ECFF'), at, [
          { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(.6) rotate(45deg)', opacity: 0 }
        ], { duration: 180, delay: delay + 330, easing: 'ease-out' })
      );
    }
    await Fx.wait(330);
    Fx.flash(targetEl, '#ffffff', 0.5);
    Fx.shake(targetEl, 4);
    await Promise.all(effects);
  }
}
