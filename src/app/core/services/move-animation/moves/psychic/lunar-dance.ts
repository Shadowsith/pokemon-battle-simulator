import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The moon rises until `MOON` (ms); the dance swirls from `DANCE` (ms) for `SWIRL` ms. */
const MOON = 400;
const DANCE = 350;
const SWIRL = 1100;

/**
 * Lunar Dance, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/87/Lunartanz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/78/Lunartanz_Gen5.png
 *
 * The scene goes dark and a pale crescent moon rises above the user
 * (0-0.4 s). Pink rings of light swirl up round the user from a golden glow
 * at its feet while pink and white sparkles twinkle (0.35-1.45 s). The moon
 * fades and the scene clears (1.45-1.8 s). The user faints right after
 * (the dance heals the next one).
 */
export class LunarDance {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const s = Math.max(r.width, r.height, 60);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out' })];

    // A crescent: a pale disc with a dark disc bitten out of one side.
    const ms = s * 0.45;
    const moon = Fx.box(ms, ms, `border-radius:50%;background:radial-gradient(circle at 70% 40%,transparent 0 42%,#F4F0D8 44%,#E0DCC0 70%);filter:drop-shadow(0 0 6px #FFF8D0)`);
    effects.push(Fx.spawn(fxEl, moon, { x: launch.x + s * 0.35, y: launch.y - s * 0.75 }, [
      { transform: 'translateY(20px)', opacity: 0, offset: 0 },
      { transform: 'translateY(0)', opacity: 1, offset: MOON / 1800 },
      { transform: 'translateY(0)', opacity: 1, offset: 1450 / 1800 },
      { transform: 'translateY(-6px)', opacity: 0, offset: 1 }
    ], { duration: 1800, easing: 'ease-out' }));

    const foot: Point = { x: launch.x, y: launch.y + r.height * 0.42 };
    effects.push(Fx.spawn(fxEl, Fx.box(s * 0.9, s * 0.25, 'border-radius:50%;background:radial-gradient(ellipse,#FFFAB0,#FFE04Acc 40%,#FFE04A00 70%)'), foot, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1)', opacity: 1, offset: 0.75 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: SWIRL, delay: DANCE, easing: 'ease-out' }));
    for (let i = 0; i < 5; i++) {
      // Flat rings rise from the feet up the user, like a dancer's ribbon.
      effects.push(Fx.spawn(fxEl, Fx.box(s * 0.85, s * 0.25, 'border-radius:50%;border:3px solid #FF9AD8;box-shadow:0 0 8px #FF7AC8'), foot, [
        { transform: 'translateY(0) scale(.7)', opacity: 0 },
        { transform: `translateY(${-r.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translateY(${-r.height * 0.9}px) scale(.6)`, opacity: 0 }
      ], { duration: 650, delay: DANCE + i * 110, easing: 'ease-out' }));
    }
    for (let i = 0; i < 10; i++) {
      const at: Point = { x: launch.x + (((i * 5) % 7) / 6 - 0.5) * s, y: launch.y + (((i * 3) % 5) / 4 - 0.6) * s * 0.8 };
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(8 + (i % 3) * 3, i % 2 ? '#FFB0E8' : '#ffffff'), at, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 400, delay: DANCE + (i * 97) % (SWIRL - 400), easing: 'ease-out' }));
    }
    effects.push(Fx.glow(launchEl, 'brightness(1.3) sepia(.4) hue-rotate(290deg) saturate(2)', SWIRL, DANCE));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }
}
