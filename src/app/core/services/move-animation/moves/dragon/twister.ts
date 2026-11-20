import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** How many wind bands make up the twister. */
const BANDS = 8;
/** When the target is buffeted, ms from the start. */
const HITS = [300, 600, 900];
const TOTAL = 1350;

/**
 * Twister, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/06/Windhose_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f6/Windhose_Gen5.png
 *
 * A white-pink twister of whirling wind bands rises up round the target,
 * narrow at the ground and wide at the top (0-0.4 s), and keeps whirling
 * while grey dust puffs up at its base (to 1.1 s); the target is buffeted
 * three times (0.3, 0.6 and 0.9 s). Then the twister fades (1.1-1.35 s).
 */
export class Twister {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 60) * 1.4;
    const foot = Fx.footOf(targetEl, fieldEl);
    const at = (ms: number) => ms / TOTAL;

    const effects: Promise<void>[] = [];
    for (let i = 0; i < BANDS; i++) {
      const u = i / (BANDS - 1);
      const bw = w * (0.35 + u * 0.9);
      const band = Fx.box(bw, bw * 0.22, `border-radius:50%;border:3px solid ${i % 2 ? '#FFFFFF' : '#F8D0E8'};border-left-color:#ffffff22;box-shadow:0 0 5px #ffffffaa`);
      const p: Point = { x: foot.x, y: foot.y - 6 - u * h };
      const sway = w * 0.12;
      const frames: Keyframe[] = [{ transform: 'translateX(0) scaleY(.4)', opacity: 0 }];
      const rise = 100 + u * 300;
      frames.push({ transform: 'translateX(0) scaleY(1)', opacity: 0.95, offset: at(rise) });
      for (let k = 1; k <= 8; k++) {
        const t = rise + ((1100 - rise) * k) / 8;
        frames.push({ transform: `translateX(${Math.sin(k * 1.6 + i * 0.8) * sway}px) scaleY(1)`, opacity: 0.95, offset: at(t) });
      }
      frames.push({ transform: `translateX(0) translateY(-10px) scaleY(1)`, opacity: 0 });
      effects.push(Fx.spawn(fxEl, band, p, frames, { duration: TOTAL, easing: 'linear' }));
    }
    for (let i = 0; i < 4; i++) {
      effects.push(Fx.wait(150 + i * 220).then(() =>
        FxEffects.smokePuff(fxEl, { x: foot.x + (i % 2 ? 1 : -1) * w * 0.35, y: foot.y - 6 }, w * 0.4, ['#C8C8C8', '#9A9A9A'])));
    }
    for (const t of HITS) setTimeout(() => {
      Fx.flash(targetEl, '#ffffff', 0.4);
      Fx.shake(targetEl, 4);
    }, t);
    await Promise.all(effects);
  }
}
