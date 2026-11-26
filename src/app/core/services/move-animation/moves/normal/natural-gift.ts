import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The berry's power glows on the user until `RELEASE` (ms); the target is hit at `HIT` (ms). */
const RELEASE = 650;
const HIT = 1050;
const RINGS = 4;

/**
 * Natural Gift, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/fc/Beerenkr%C3%A4fte_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0a/Beerenkr%C3%A4fte_Gen5.png
 *
 * Green sparkles rise round the user while a white light orb swells in
 * front of it (0-0.65 s). The berry's power is released in green rings of
 * light that spread out from the user over the whole field (0.65-1.3 s);
 * the target shakes as they pass it (1.05 s).
 */
export class NaturalGift {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const r = Fx.rect(launchEl);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const x = launch.x + (((i * 5) % 7) / 6 - 0.5) * r.width;
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#8AF07A'), { x, y: launch.y + r.height * 0.2 }, [
        { transform: 'translateY(0) scale(0)', opacity: 0 },
        { transform: `translateY(${-r.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translateY(${-r.height * 0.7}px) scale(0)`, opacity: 0 }
      ], { duration: 550, delay: (i * 61) % 350, easing: 'ease-out' }));
    }
    const os = Math.max(r.width * 0.4, 28);
    effects.push(Fx.spawn(fxEl, Fx.box(os, os, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 35%,#E8FFE0cc 55%,#8AF07A00 72%)'), { x: launch.x, y: launch.y + r.height * 0.05 }, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.3)', opacity: 0 }
    ], { duration: RELEASE + 150, easing: 'ease-out' }));
    const reach = Math.hypot(f.width, f.height) * 1.1;
    for (let i = 0; i < RINGS; i++) {
      const ring = Fx.box(reach, reach, 'border-radius:50%;border:10px solid #7AE86A;box-shadow:0 0 14px #5AD84A,inset 0 0 12px #5AD84A');
      effects.push(Fx.spawn(fxEl, ring, launch, [
        { transform: `scale(${16 / reach})`, opacity: 0.9 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: 650, delay: RELEASE + i * 110, easing: 'ease-out' }));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#C8FFB0', 0.5);
      Fx.shake(targetEl, 5);
    }));
    await Promise.all(effects);
  }
}
