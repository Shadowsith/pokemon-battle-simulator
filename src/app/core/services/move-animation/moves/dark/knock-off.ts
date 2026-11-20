import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The hand swats the target at `HIT` (ms). */
const HIT = 300;

/**
 * Knock Off, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/15/Abschlag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/69/Abschlag_Gen5.png
 *
 * A dark red hand swings down from above the target, swatting across it
 * (0-0.3 s). On the swat (0.3 s) a yellow spiky burst flares, the target
 * turns into a black silhouette for a moment and shakes (0.3-0.55 s); the
 * hand sweeps on past it and fades (to ~0.6 s).
 */
export class KnockOff {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    // The hand comes from the user's side, high up, and sweeps down past the target.
    const side = -v.dir;
    const hand = FxGlyphs.chopHandGlyph(Math.max(w * 0.55, 36), '#7A1A1C', '#2A0406');
    const wrap = Fx.box(Math.max(w * 0.55, 36), Math.max(w * 0.55, 36), 'filter:drop-shadow(0 0 4px #FF9A6A)');
    wrap.appendChild(hand);
    const from = `translate(${side * w * 0.55}px,${-r.height * 0.75}px) rotate(${side * 40}deg)`;
    const at = `translate(${side * w * 0.05}px,${-r.height * 0.05}px) rotate(${side * 10}deg)`;
    const past = `translate(${-side * w * 0.35}px,${r.height * 0.3}px) rotate(${-side * 10}deg)`;
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, wrap, target, [
        { transform: `${from} scale(.8)`, opacity: 0 },
        { transform: `${from} scale(1)`, opacity: 1, offset: 0.2 },
        { transform: `${at} scale(1.05)`, opacity: 1, offset: 0.5 },
        { transform: `${past} scale(1)`, opacity: 0 }
      ], { duration: HIT * 2, easing: 'ease-in' })
    ];
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 6);
      const burst = FxGlyphs.spikyBurst(w * 0.9, '#FFE040', '#FFF8B0');
      return Promise.all([
        Fx.spawn(fxEl, burst, target, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.15)', opacity: 0 }
        ], { duration: 280, easing: 'ease-out' }),
        Fx.anim(targetEl, [
          { filter: 'brightness(0)' },
          { filter: 'brightness(0)', offset: 0.7 },
          { filter: 'none' }
        ], { duration: 250, fill: 'none' })
      ]).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
