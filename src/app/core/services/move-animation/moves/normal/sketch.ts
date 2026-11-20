import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Star colours the pencil leaves behind. */
const STAR_COLORS = ['#5AB0FF', '#FFE04A', '#FF9A3A', '#7AE070'];
/** The pencil scribbles until `DRAWN` ms; then the target is copied. */
const DRAWN = 800;
const TOTAL = 1400;

/**
 * Sketch, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/cc/Nachahmer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/2a/Nachahmer_Gen5.png
 *
 * A green pencil scribbles back and forth across the target (0-0.8 s),
 * leaving a trail of little blue, yellow, orange and green stars. The target
 * flickers see-through as it is copied (0.8-1.1 s) and the stars drift up and
 * fade (to ~1.4 s).
 */
export class Sketch {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);

    // Zigzag stops over the target, top to bottom.
    const path: Point[] = [];
    for (let i = 0; i < 5; i++) path.push({ x: (i % 2 ? 0.4 : -0.4) * w, y: (i / 4 - 0.5) * h * 0.7 });
    const frames: Keyframe[] = path.map((p, i) => ({
      transform: `translate(${p.x}px,${p.y}px) rotate(${i % 2 ? 55 : 25}deg)`,
      opacity: i === 0 ? 0 : 1,
      offset: (i / (path.length - 1)) * (DRAWN / TOTAL)
    }));
    frames.push({ transform: `translate(${path[4].x}px,${path[4].y - 20}px) rotate(25deg)`, opacity: 0, offset: (DRAWN + 150) / TOTAL }, { opacity: 0 });
    const effects: Promise<void>[] = [Fx.spawn(fxEl, Sketch.pencil(Math.max(h * 0.5, 34)), target, frames, { duration: TOTAL, easing: 'linear' })];

    for (let i = 0; i < 14; i++) {
      const u = i / 13;
      const seg = Math.min(Math.floor(u * 4), 3);
      const k = u * 4 - seg;
      const a = path[seg];
      const b = path[seg + 1];
      const p: Point = { x: target.x + a.x + (b.x - a.x) * k, y: target.y + a.y + (b.y - a.y) * k + h * 0.12 };
      const t = u * DRAWN;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(9 + Math.random() * 5, STAR_COLORS[i % STAR_COLORS.length]), p, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.15 },
          { transform: 'translateY(-4px) scale(.8)', opacity: 1, offset: 0.6 },
          { transform: 'translateY(-22px) scale(.4)', opacity: 0 }
        ], { duration: TOTAL - t, easing: 'ease-in', delay: t })
      );
    }
    effects.push(
      Fx.anim(targetEl, [
        { opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }
      ], { duration: 300, easing: 'steps(1, end)', delay: DRAWN, fill: 'none' })
    );
    await Promise.all(effects);
  }

  /** A green pencil `len` px long, tip down-left: green body, light wood cone, dark lead. */
  private static pencil(len: number): HTMLElement {
    const el = Fx.box(len * 0.2, len, 'filter:drop-shadow(0 1px 1px #0006)');
    el.appendChild(Fx.box(len * 0.2, len * 0.75, 'left:0;top:0;border-radius:2px 2px 0 0;background:linear-gradient(90deg,#3A9A40,#6ADA60 40%,#2A7A30)'));
    el.appendChild(Fx.box(len * 0.2, len * 0.25, `left:0;top:${len * 0.75}px;clip-path:polygon(0 0,100% 0,50% 100%);background:linear-gradient(180deg,#F0D0A0 0 70%,#303030 70%)`));
    return el;
  }
}
