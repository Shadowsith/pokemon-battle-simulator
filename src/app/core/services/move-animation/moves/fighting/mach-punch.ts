import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the fist lands, ms from the start. */
const HIT = 150;

/**
 * Mach Punch, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/4/4b/Tempohieb_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/9/99/Tempohieb_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/6/61/Tempohieb_Gen5.png
 *
 * Lightning fast: white speed rings rush in round the target while a big
 * white fist zooms in at it from the user's side (0-0.15 s, hit at 0.15 s).
 * A white starburst flashes, pale blue sparkles scatter and the target
 * blinks white (0.15-0.55 s).
 */
export class MachPunch {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);

    const effects: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = Fx.box(w * 1.2, w * 1.2, 'border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 8px #CFE8FF');
      effects.push(
        Fx.spawn(fxEl, ring, target, [
          { transform: 'scale(1.8)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 0.9, offset: 0.4 },
          { transform: 'scale(.3)', opacity: 0 }
        ], { duration: 200, easing: 'ease-in', delay: i * 40 })
      );
    }
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.fistGlyph(Math.max(w * 0.6, 38), 'ice'), { x: target.x - v.dir * w * 0.1, y: target.y - h * 0.05 }, [
        { transform: `translateX(${-v.dir * w * 0.8}px) scale(2.2)`, opacity: 0 },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: HIT / 300 },
        { transform: 'translateX(0) scale(1.05)', opacity: 1, offset: (HIT + 60) / 300 },
        { transform: `translateX(${-v.dir * 8}px) scale(1.1)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out' })
    );

    await Fx.wait(HIT);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(w * 0.7, 44), '#CFE8FF', '#ffffff', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.15) rotate(25deg)', opacity: 0 }
      ], { duration: 260, easing: 'ease-out' }),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(3)', offset: 0.2 },
        { filter: 'none', offset: 0.45 },
        { filter: 'brightness(3)', offset: 0.65 },
        { filter: 'none' }
      ], { duration: 300, easing: 'linear', fill: 'none' })
    );
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.min(w, h) * (0.35 + Math.random() * 0.3);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(8 + Math.random() * 6, '#A8D8FF'), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(a) * d * 1.2}px,${Math.sin(a) * d * 1.2}px) scale(0)`, opacity: 0 }
        ], { duration: 400, easing: 'ease-out', delay: Math.random() * 60 })
      );
    }
    Fx.shake(targetEl, 4);
    await Promise.all(effects);
  }
}
