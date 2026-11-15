import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Volt Switch, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/5/50/Voltwechsel_Gen5.png
 *
 * The scene dims (0-0.25 s) and a crackling yellow ball of electricity
 * forms on the user (0.25-0.6 s). It shoots to the target (0.6-0.85 s, hit
 * at 0.85 s) and bursts into a big yellow spark with little bolts flying
 * off (to ~1.4 s) before the scene clears (to ~1.6 s).
 */
export class VoltSwitch {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The ball of electricity forms on the user.
    const size = Math.max(lr.width * 0.4, 30);
    const ball = document.createElement('div');
    ball.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#FFFFF0 0 30%,#FFF04A 55%,#F0C81A 70%,#F0C81A00 74%);box-shadow:0 0 14px #FFE84A';
    Fx.place(ball, launch);
    fxEl.appendChild(ball);
    const stop = FxEffects.crackle(ball, size);
    await Fx.anim(ball, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 350, easing: 'ease-out' });

    // It shoots to the target.
    await Fx.anim(ball, [
      { transform: 'translate(0,0)' },
      { transform: `translate(${target.x - launch.x}px,${target.y - launch.y}px)` }
    ], { duration: 250, easing: 'ease-in' });
    stop();
    ball.remove();

    // Hit: a big yellow spark, bolts fly off.
    Fx.flash(targetEl, '#FFE84A', 0.8);
    Fx.shake(targetEl, 7);
    const burstSize = Math.max(tr.width * 1.1, 70);
    const burst = FxGlyphs.spikyBurst(burstSize, '#E8E01A', '#FFF65A', '#FFFFF0');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    const effects: Promise<void>[] = [
      Fx.anim(burst, [
        { transform: 'scale(.2) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.05) rotate(10deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.9) rotate(-6deg)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1.2) rotate(8deg)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).then(() => burst.remove())
    ];
    for (let i = 0; i < 6; i++) {
      const bolt = FxGlyphs.sparkBolt();
      Fx.place(bolt, target);
      fxEl.appendChild(bolt);
      const ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.6;
      const d = burstSize * (0.6 + Math.random() * 0.3);
      effects.push(
        Fx.anim(bolt, [
          { transform: 'translate(0,0) scale(.5)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1)`, opacity: 0 }
        ], { duration: 500, delay: 80, easing: 'ease-out', fill: 'backwards' }).then(() => bolt.remove())
      );
    }
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }
}
