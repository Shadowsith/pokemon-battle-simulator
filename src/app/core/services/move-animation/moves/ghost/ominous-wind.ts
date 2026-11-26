import { BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** The wind blows from 0 until `END` (ms); the scene darkens at the `GUSTS` moments (ms). */
const END = 1400;
const GUSTS = [450, 900];

/**
 * Ominous Wind, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/11/Unheilb%C3%B6en_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f7/Unheilb%C3%B6en_Gen5.png
 *
 * An eerie violet wind sweeps over the whole scene: smeared purple streaks
 * rush across it towards the target (0-1.4 s) and both Pokémon are tinted
 * a ghostly purple. Twice the gale darkens in a heavy gust (0.45 s,
 * 0.9 s) and the target shakes; then the wind dies down (1.4-1.65 s).
 */
export class OminousWind {
  static async play(refs: BattleStageRefs, dir: number) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const haze = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#7A5A9A,#5A3E7A 55%,#3A2852)');
    const effects: Promise<void>[] = [
      Fx.anim(haze, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 300, easing: 'ease-out' }),
      Fx.glow(launchEl, 'sepia(.6) hue-rotate(230deg) saturate(2) brightness(.85)', END),
      Fx.glow(targetEl, 'sepia(.6) hue-rotate(230deg) saturate(2) brightness(.85)', END)
    ];
    for (let i = 0; i < 22; i++) {
      const w = f.width * (0.25 + (i % 4) * 0.08);
      const y = f.height * ((i * 0.31 + 0.05) % 1);
      const streak = Fx.box(w, 4 + (i % 3) * 3, 'border-radius:4px;background:linear-gradient(90deg,#E8C8FF00,#E8C8FF88 50%,#E8C8FF00);filter:blur(1.5px)');
      const from = dir > 0 ? -w : f.width + w;
      const to = dir > 0 ? f.width + w : -w;
      effects.push(Fx.spawn(fxEl, streak, { x: from, y }, [
        { transform: 'translateX(0)', opacity: 0 },
        { transform: `translateX(${(to - from) * 0.3}px)`, opacity: 1, offset: 0.3 },
        { transform: `translateX(${to - from}px)`, opacity: 0 }
      ], { duration: 650, delay: (i * 59) % (END - 650), easing: 'linear' }));
    }
    for (const at of GUSTS) {
      effects.push(Fx.wait(at).then(() => {
        Fx.shake(targetEl, 4);
        return Fx.anim(haze, [{ filter: 'brightness(1)' }, { filter: 'brightness(.45)', offset: 0.4 }, { filter: 'brightness(1)' }], { duration: 350, easing: 'ease-in-out', fill: 'none' });
      }));
    }
    await Promise.all(effects);
    await Fx.anim(haze, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    haze.remove();
  }
}
