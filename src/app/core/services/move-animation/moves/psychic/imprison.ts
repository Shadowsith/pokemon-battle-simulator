import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The seal stamps down onto the user at `STAMP` (ms). */
const STAMP = 550;

/**
 * Imprison, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/59/Begrenzer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/7f/Begrenzer_Gen5.png
 *
 * The scene darkens (0-0.25 s) and a big red wax seal drops in from above
 * the user, growing as it falls (0.2-0.55 s). It stamps down onto the user
 * (0.55 s) with a jolt and a ring of pink-purple puffs, holds there while
 * white sparkles twinkle round its rim (0.55-1.15 s), then fades away with
 * the dark scene (1.15-1.5 s).
 */
export class Imprison {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 60) * 0.95;
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' })];

    const seal = Imprison.sealGlyph(size);
    Fx.place(seal, launch);
    fxEl.appendChild(seal);
    effects.push(Fx.anim(seal, [
      { transform: `translateY(${-size * 1.4}px) scale(.4)`, opacity: 0 },
      { transform: `translateY(${-size * 1.1}px) scale(.6)`, opacity: 1, offset: 0.1, easing: 'ease-in' },
      { transform: 'translateY(0) scale(1.15)', opacity: 1, offset: 0.27 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.73 },
      { transform: 'translateY(0) scale(1.05)', opacity: 0 }
    ], { duration: 1500 - 200, delay: 200, easing: 'linear' }).then(() => seal.remove()));

    effects.push(Fx.wait(STAMP).then(() => {
      Fx.shake(launchEl, 4);
      const puffs: Promise<void>[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        puffs.push(FxEffects.smokePuff(fxEl, { x: launch.x + Math.cos(a) * size * 0.5, y: launch.y + Math.sin(a) * size * 0.4 }, size * 0.3, ['#F0B8E8', '#B070C0']));
      }
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + 0.3;
        puffs.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(12, '#FFFFFF'), { x: launch.x + Math.cos(a) * size * 0.48, y: launch.y + Math.sin(a) * size * 0.48 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 360, delay: 80 + (i % 4) * 120, easing: 'ease-out' }));
      }
      return Promise.all(puffs).then(() => void 0);
    }));

    await Promise.all(effects.slice(1));
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }

  /** A round red wax seal with a wavy rim, a raised inner ring and a cross-shaped sigil. */
  private static sealGlyph(size: number): HTMLElement {
    const el = Fx.box(size, size, 'filter:drop-shadow(0 2px 3px #00000088)');
    const bumps = 14;
    let d = '';
    for (let i = 0; i <= bumps * 2; i++) {
      const a = (Math.PI * i) / bumps;
      const rr = i % 2 ? 46 : 50;
      d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * rr).toFixed(1)},${(50 + Math.sin(a) * rr).toFixed(1)}`;
    }
    el.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100">
      <path d="${d}Z" fill="#C8202A" stroke="#7A0A12" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="33" fill="#E0343C" stroke="#8A1018" stroke-width="3"/>
      <circle cx="50" cy="50" r="24" fill="none" stroke="#FF8A8A" stroke-width="2" opacity=".7"/>
      <path d="M50 30 L56 44 L70 50 L56 56 L50 70 L44 56 L30 50 L44 44 Z" fill="#9A1018"/>
      <ellipse cx="38" cy="30" rx="10" ry="5" fill="#FFFFFF" opacity=".35" transform="rotate(-30 38 30)"/>
    </svg>`;
    return el;
  }
}
