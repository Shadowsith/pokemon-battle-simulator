import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Coil, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/0/06/Einrollen_Gen5.png
 *
 * Grey rings of wind wind round the user from its feet up, tightening as they
 * rise (0-0.7 s), and turn into a glowing cyan coil swirling round its base
 * (0.6-1.1 s). Then orange sparkles drift down over it as its stats rise
 * (1.0-2.2 s).
 */
export class Coil {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const w = Math.max(lr.width * 1.3, 60);
    const foot = launch.y + lr.height * 0.4;
    const effects: Promise<void>[] = [];

    // Grey rings rising and tightening round the user.
    for (let i = 0; i < 5; i++) {
      const ring = document.createElement('div');
      ring.style.cssText =
        `position:absolute;width:${w}px;height:${w * 0.3}px;border-radius:50%;pointer-events:none;` +
        'border:3px solid #D8DCE4cc;border-bottom-color:#9AA0AC88;filter:blur(.5px)';
      Fx.place(ring, { x: launch.x, y: foot });
      fxEl.appendChild(ring);
      const lean = (i % 2 ? 1 : -1) * 6;
      const rise = lr.height * (0.25 + i * 0.13);
      effects.push(
        Fx.anim(ring, [
          { transform: `translateY(0) rotate(${lean}deg) scale(1.3)`, opacity: 0 },
          { transform: `translateY(${-rise * 0.5}px) rotate(${-lean}deg) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translateY(${-rise}px) rotate(${lean}deg) scale(.75)`, opacity: 0 }
        ], { duration: 500, delay: i * 50, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    await Fx.wait(600);

    // The cyan coil swirling round the user's base.
    const coil = document.createElement('div');
    coil.style.cssText =
      `position:absolute;width:${w * 1.1}px;height:${w * 0.4}px;border-radius:50%;pointer-events:none;mix-blend-mode:screen;` +
      'background:conic-gradient(from 0deg,#5AE8F000,#8AF4FFee 25%,#2AB8D888 45%,#5AE8F000 55%,#8AF4FFcc 80%,#5AE8F000);' +
      '-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#0000 45%,#000 60%,#0000 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 50%,#0000 45%,#000 60%,#0000 100%)';
    Fx.place(coil, { x: launch.x, y: foot - lr.height * 0.1 });
    fxEl.appendChild(coil);
    const spin = coil.animate([{ filter: 'hue-rotate(0deg) brightness(1)' }, { filter: 'hue-rotate(20deg) brightness(1.3)' }, { filter: 'hue-rotate(0deg) brightness(1)' }], { duration: 250, iterations: Infinity });
    Fx.flash(launchEl, '#8AF4FF', 0.35);
    effects.push(
      Fx.anim(coil, [
        { transform: 'scale(1.3,1.1)', opacity: 0 },
        { transform: 'scale(1,1)', opacity: 1, offset: 0.3 },
        { transform: 'translateY(-6px) scale(.9,1)', opacity: 1, offset: 0.7 },
        { transform: 'translateY(-10px) scale(.8,.9)', opacity: 0 }
      ], { duration: 500, easing: 'ease-in-out' }).then(() => {
        spin.cancel();
        coil.remove();
      })
    );
    await Fx.wait(400);

    // The stats rise.
    effects.push(FxEffects.orangeSparkles(refs, launch, launch.y - lr.height * 0.45));
    await Promise.all(effects);
  }
}
