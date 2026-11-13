import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Grass Pledge, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/4/4d/Pflanzens%C3%A4ulen_Gen5.png
 *
 * Pale wind rings spin up round the target in three columns, left, centre
 * and right (0-1.2 s), and green leaves whirl up inside them (0.15-1.3 s);
 * the target shakes from the hit (0.3 s) on, and the whirl thins out at the
 * top (to ~1.4 s).
 */
export class GrassPledge {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const w = Math.max(tr.width, 60);
    const foot: Point = { x: target.x, y: target.y + tr.height * 0.4 };
    const height = Math.max(tr.height * 1.4, 100);
    const columns = [-0.5, 0, 0.5];
    const effects: Promise<void>[] = [];

    // Wind rings spinning up each column.
    columns.forEach((off, c) => {
      for (let i = 0; i < 4; i++) {
        const ring = document.createElement('div');
        const rw = w * 0.6;
        ring.style.cssText =
          `width:${rw}px;height:${rw * 0.35}px;border-radius:50%;pointer-events:none;` +
          'border:2px solid #FFF4E8cc;border-left-color:#FFF4E800;box-shadow:0 0 4px #FFFFFF88';
        Fx.place(ring, { x: foot.x + off * w, y: foot.y });
        fxEl.appendChild(ring);
        effects.push(
          Fx.anim(ring, [
            { transform: 'translateY(0) rotate(0deg) scale(.6)', opacity: 0 },
            { transform: `translateY(${-height * 0.3}px) rotate(180deg) scale(1)`, opacity: 1, offset: 0.3 },
            { transform: `translateY(${-height * 0.75}px) rotate(400deg) scale(1.1)`, opacity: 0.8, offset: 0.75 },
            { transform: `translateY(${-height}px) rotate(540deg) scale(.9)`, opacity: 0 }
          ], { duration: 700, delay: c * 80 + i * 150, easing: 'ease-out' }).then(() => ring.remove())
        );
      }
    });

    // Leaves whirl up inside the wind.
    for (let i = 0; i < 24; i++) {
      const leaf = FxGlyphs.leafGlyph(9 + Math.random() * 6);
      const base: Point = { x: foot.x + columns[i % 3] * w, y: foot.y };
      Fx.place(leaf, base);
      fxEl.appendChild(leaf);
      const r = w * 0.3;
      const phase = Math.random() * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const a = phase + t * Math.PI * 3;
        frames.push({
          transform: `translate(${Math.cos(a) * r}px,${-t * height + Math.sin(a) * r * 0.3}px) rotate(${t * 540}deg)`,
          opacity: Math.min(1, t * 6, (1 - t) * 4)
        });
      }
      effects.push(Fx.anim(leaf, frames, { duration: 800, delay: 150 + Math.random() * 400, easing: 'linear' }).then(() => leaf.remove()));
    }
    await Fx.wait(300);
    Fx.flash(targetEl, '#7AD84A', 0.5);
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.shake(targetEl, 4), i * 200);
    await Promise.all(effects);
  }
}
