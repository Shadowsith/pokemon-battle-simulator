import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Seed Bomb, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5a/Samenbomben_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/3e/Samenbomben_Gen5.png
 *
 * Five hard olive seeds are lobbed one after another in high arcs from the
 * user to the target (throws 0-0.48 s, 0.12 s apart). Each bursts into a
 * fiery yellow-orange explosion on landing (hits at 0.5-0.98 s, first at
 * 0.5 s); the clouds fade by ~1.8 s.
 */
export class SeedBomb {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const arc = Math.max(fieldEl.clientHeight * 0.3, 70);
    const blast = Math.max(tr.width * 0.6, 50);

    const parts: Promise<void>[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const s = 10 + Math.random() * 3;
      const seed = SeedBomb.seed(s);
      Fx.place(seed, launch);
      fxEl.appendChild(seed);
      const land: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.3, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.25 };
      const dx = land.x - launch.x;
      const dy = land.y - launch.y;
      const flight: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        flight.push({ transform: `translate(${dx * t}px,${dy * t - arc * 4 * t * (1 - t)}px) scale(${1 - 0.25 * t})` });
      }
      parts.push(Fx.anim(seed, flight, { duration: 500, delay: i * 120, easing: 'linear', fill: 'backwards' }).then(() => seed.remove()));
      setTimeout(() => {
        if (i === 0) Fx.flash(targetEl, '#FFE070', 0.5);
        Fx.shake(targetEl, i === 0 ? 5 : 3);
        parts.push(FxEffects.fireBlastCloud(fxEl, land, blast, 6, '#FFE070'));
      }, i * 120 + 500);
    }
    await Fx.wait((count - 1) * 120 + 520);
    await Promise.all(parts);
  }

  /** A hard, round olive seed `s` px wide, with a light spot. */
  private static seed(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#C8C060,#6A6A1A 55%,#3A3A0A);box-shadow:0 1px 2px #00000066`;
    return el;
  }
}
