import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** How many sparks drift into the user. */
const SPARKS = 10;
/** The built-up charge flashes at `FLASH` (ms); the Sp. Def rise follows. */
const FLASH = 1000;

/**
 * Charge, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/dd/Ladevorgang_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/08/Ladevorgang_Gen5.png
 *
 * The scene goes dark (0-0.2 s); yellow sparks drift in from all round and
 * vanish into the user while a yellow glow builds on it (0.2-1.0 s), ending
 * in a bright flash (1.0-1.25 s). The scene clears and the user's Sp. Def rises
 * (1.25-2.05 s).
 */
export class Charge {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const d = Math.max(r.width, 50) * 0.9;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.85, offset: 0.18 },
        { opacity: 0.85, offset: 0.9 },
        { opacity: 0 }
      ], { duration: FLASH + 100, easing: 'linear' }),
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(3) hue-rotate(10deg) brightness(1.3) drop-shadow(0 0 8px #FFE84A)', offset: 0.95 },
        { filter: 'brightness(2.5) drop-shadow(0 0 14px #ffffff)' }
      ], { duration: FLASH - 200, easing: 'ease-in', delay: 200, fill: 'none' })
    ];
    for (let i = 0; i < SPARKS; i++) {
      const a = (Math.PI * 2 * i) / SPARKS;
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(12 + (i % 3) * 3, '#FFE84A'), launch, [
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.8}px) scale(.5)`, opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * 0.8}px,${Math.sin(a) * d * 0.64}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: 'translate(0,0) scale(.3)', opacity: 0.8 }
      ], { duration: 450, easing: 'ease-in', delay: 200 + (i % 5) * 70 }));
    }
    const ring = Fx.box(d, d, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFF08A 40%,#FFE84A00 70%)');
    effects.push(Fx.spawn(fxEl, ring, launch, [
      { transform: 'scale(.3)', opacity: 1 },
      { transform: 'scale(1.6)', opacity: 0 }
    ], { duration: 250, easing: 'ease-out', delay: FLASH }));
    await Promise.all(effects);
    dim.remove();
    await FxEffects.statUpAura(refs, launch);
  }
}
