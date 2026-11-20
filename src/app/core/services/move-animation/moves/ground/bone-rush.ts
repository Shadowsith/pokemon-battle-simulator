import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Length of one whack, ms; the bone connects `CONNECT` ms into it. */
const WHACK = 400;
const CONNECT = 160;

/**
 * Bone Rush, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/df/Knochenhatz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/bd/Knochenhatz_Gen5.png
 *
 * One whack per hit (`v.hits`, 0.4 s each, hits at 0.16 / 0.56 / 0.96 s for
 * three): a bone swings down onto the target from alternating sides, a yellow
 * spiky flash and a green ring burst where it connects, and the target blinks
 * dark and is knocked aside. The bone flies off spinning.
 */
export class BoneRush {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const base = targetEl.style.transform;
    const effects: Promise<void>[] = [];
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      const t0 = hit * WHACK;
      const side = (hit % 2 ? 1 : -1) * v.dir;
      const at: Point = { x: target.x + side * w * 0.12, y: target.y - h * 0.15 };
      const swing = side * 70;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.boneGlyph(Math.max(w * 0.6, 38)), { x: at.x + side * w * 0.3, y: at.y - h * 0.2 }, [
          { transform: `rotate(${swing}deg) translate(0,-20px)`, opacity: 0, easing: 'ease-in' },
          { transform: `rotate(${swing * 0.6}deg) translate(0,-10px)`, opacity: 1, offset: 0.15, easing: 'ease-in' },
          { transform: `rotate(${-side * 30}deg) translate(${-side * 8}px,${h * 0.12}px)`, opacity: 1, offset: CONNECT / WHACK, easing: 'ease-out' },
          { transform: `rotate(${-side * 200}deg) translate(${side * 40}px,-30px)`, opacity: 0 }
        ], { duration: WHACK, easing: 'linear', delay: t0 }),
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(w * 0.45, 30), '#F8C820', '#FFEA5A', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 240, easing: 'ease-out', delay: t0 + CONNECT }),
        Fx.spawn(fxEl, Fx.box(30, 30, 'border-radius:50%;border:3px solid #7AE070;box-shadow:0 0 6px #B8FFA8'), at, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1.4)', opacity: 0 }
        ], { duration: 260, easing: 'ease-out', delay: t0 + CONNECT }),
        Fx.anim(targetEl, [
          { transform: base, filter: 'none' },
          { transform: `${base} translateX(${-side * 6}px)`, filter: 'brightness(0)', offset: 0.25 },
          { transform: base, filter: 'brightness(0)', offset: 0.5 },
          { transform: base, filter: 'none' }
        ], { duration: 200, easing: 'ease-out', delay: t0 + CONNECT, fill: 'none' })
      );
    }
    await Promise.all(effects);
  }
}
