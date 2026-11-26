import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** A punch lands every `GAP` ms from `FIRST` (ms). */
const FIRST = 80;
const GAP = 140;
const PUNCHES = 5;

/**
 * Bullet Punch, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/25/Patronenhieb_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/d4/Patronenhieb_Gen5.png
 *
 * A rapid volley of five steel-grey fists pelts the target at different
 * spots (0.08-0.64 s): each pops in with a dark grey spiky burst, and the
 * target flashes and twitches. The last burst fades (to ~0.95 s).
 */
export class BulletPunch {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.3, 22);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < PUNCHES; i++) {
      const at: Point = {
        x: target.x + ((((i * 3) % 5) - 2) / 2) * r.width * 0.28,
        y: target.y + ((((i * 2) % 5) - 2) / 2) * r.height * 0.25
      };
      const delay = FIRST + i * GAP;
      effects.push(Fx.spawn(fxEl, FxGlyphs.spikyBurst(w * 1.7, '#5A5E6A', '#9A9EAA', '#E8ECF4'), at, [
        { transform: 'scale(.3)', opacity: 0.95 },
        { transform: 'scale(1)', opacity: 0.95, offset: 0.4 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 260, delay, easing: 'ease-out' }));
      effects.push(Fx.spawn(fxEl, FxGlyphs.fistGlyph(w, 'steel'), at, [
        { transform: `translateX(${-v.dir * 14}px) scale(.6)`, opacity: 0 },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translateX(0) scale(1.1)', opacity: 0 }
      ], { duration: 230, delay: delay - 40, easing: 'ease-out' }));
      effects.push(Fx.wait(delay).then(() => {
        Fx.flash(targetEl, '#ECEFF6', 0.45);
        Fx.shake(targetEl, 3);
      }));
    }
    await Promise.all(effects);
  }
}
