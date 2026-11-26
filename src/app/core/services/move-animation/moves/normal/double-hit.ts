import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** One hit every `GAP` ms from `FIRST` (ms). */
const FIRST = 150;
const GAP = 450;

/**
 * Double Hit, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/39/Doppelschlag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/ed/Doppelschlag_Gen5.png
 *
 * Two quick whacks (0.15 s and 0.6 s, `v.hits` of them): each time a white
 * star flares on the target in a pink glow, the target flashes as a black
 * silhouette and shakes, and pink sparkles burst off it and drift away
 * (to ~1.0 s).
 */
export class DoubleHit {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const hits = Math.max(v.hits || 2, 1);
    const effects: Promise<void>[] = [];
    for (let h = 0; h < hits; h++) {
      const at: Point = { x: target.x + (h % 2 ? -1 : 1) * r.width * 0.12, y: target.y - (h % 2 ? 0 : 1) * r.height * 0.1 };
      effects.push(Fx.wait(FIRST + h * GAP).then(() => {
        Fx.shake(targetEl, 5);
        const parts: Promise<void>[] = [
          Fx.glow(targetEl, 'brightness(0)', 140),
          Fx.spawn(fxEl, Fx.box(r.width * 0.5, r.width * 0.5, 'border-radius:50%;background:radial-gradient(circle,#ffffffcc,#FF8AD066 50%,#FF8AD000 70%)'), at, [
            { transform: 'scale(.3)', opacity: 1 },
            { transform: 'scale(1.2)', opacity: 0 }
          ], { duration: 300, easing: 'ease-out' }),
          Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.32, 20), '#ffffff'), at, [
            { transform: 'scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
            { transform: 'scale(0) rotate(90deg)', opacity: 0 }
          ], { duration: 280, easing: 'ease-out' })
        ];
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + h;
          const reach = Math.max(r.width * 0.55, 34);
          parts.push(Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#FF9AD8;box-shadow:0 0 4px #FF6AC0'), at, [
            { transform: 'translate(0,0)', opacity: 0 },
            { transform: `translate(${Math.cos(a) * reach * 0.6}px,${Math.sin(a) * reach * 0.6}px)`, opacity: 1, offset: 0.3 },
            { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach - 14}px)`, opacity: 0 }
          ], { duration: 450, delay: 40, easing: 'ease-out' }));
        }
        return Promise.all(parts).then(() => void 0);
      }));
    }
    await Promise.all(effects);
  }
}
