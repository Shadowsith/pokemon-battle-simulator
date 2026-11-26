import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** Acid drops rain on the target from `RAIN` (ms) for `POUR` ms. */
const RAIN = 100;
const POUR = 650;

/**
 * Gastro Acid, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b3/Magens%C3%A4fte_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/4d/Magens%C3%A4fte_Gen5.png
 *
 * Bright green acid drops splash down over the target (0.1-0.75 s), which
 * turns sickly green (0.3-1.2 s) while the acid pools round its feet and
 * green bubbles rise and pop there (0.6-1.25 s).
 */
export class GastroAcid {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const foot = target.y + r.height * 0.42;
    const effects: Promise<void>[] = [Fx.glow(targetEl, 'brightness(1.05) sepia(1) hue-rotate(50deg) saturate(4)', 900, 300)];
    for (let i = 0; i < 14; i++) {
      const x = target.x + (((i * 5) % 9) / 8 - 0.5) * r.width * 0.9;
      const land = target.y + (((i * 3) % 7) / 6 - 0.5) * r.height * 0.7;
      const s = 6 + (i % 3) * 2;
      const drop = Fx.box(s, s * 1.3, 'border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 40% 35%,#E8FFB0,#7AE83A 50%,#3AA82A);box-shadow:0 0 4px #8AF04A');
      effects.push(Fx.spawn(fxEl, drop, { x, y: land }, [
        { transform: `translateY(${-r.height * 0.8}px)`, opacity: 0 },
        { transform: `translateY(${-r.height * 0.5}px)`, opacity: 1, offset: 0.3 },
        { transform: 'translateY(0) scale(1.3,.6)', opacity: 1, offset: 0.9 },
        { transform: 'translateY(0) scale(1.8,.3)', opacity: 0 }
      ], { duration: 380, delay: RAIN + (i * 47) % (POUR - 380 + 100), easing: 'ease-in' }));
    }
    const pool = Fx.box(Math.max(r.width * 1.1, 60), 14, 'border-radius:50%;background:radial-gradient(ellipse,#9AF04Acc,#5AC82A88 55%,#5AC82A00 72%)');
    effects.push(Fx.spawn(fxEl, pool, { x: target.x, y: foot }, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 800, delay: 450, easing: 'ease-out' }));
    for (let i = 0; i < 8; i++) {
      const s = 6 + (i % 3) * 3;
      effects.push(Fx.spawn(fxEl, Fx.box(s, s, 'border-radius:50%;border:1.5px solid #CFFF8A;background:radial-gradient(circle at 35% 30%,#ffffffaa 0 15%,#7AE83A66 60%)'), { x: target.x + (i - 3.5) * r.width * 0.13, y: foot }, [
        { transform: 'translateY(0) scale(.4)', opacity: 0 },
        { transform: 'translateY(-8px) scale(1)', opacity: 1, offset: 0.6 },
        { transform: 'translateY(-14px) scale(1.4)', opacity: 0 }
      ], { duration: 450, delay: 600 + (i * 71) % 200, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
