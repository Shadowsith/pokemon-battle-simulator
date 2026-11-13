import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Icicle Crash, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/a/a1/Eiszapfhagel_Gen5.png
 *
 * Three pale icicles drop from the sky onto the target, one after another
 * (landing at 0.3 / 0.5 / 0.7 s); each lands with a yellow spiky flash, the
 * target shakes, and white dust puffs roll off to the sides (to ~1.4 s).
 */
export class IcicleCrash {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.height * 0.7, 50);
    const effects: Promise<void>[] = [];
    [-0.25, 0.2, 0].forEach((off, i) => {
      const land: Point = { x: target.x + off * tr.width, y: target.y + tr.height * 0.1 };
      effects.push(IcicleCrash.drop(refs, land, len, i * 200, tr.width));
    });
    await Fx.wait(300);
    Fx.flash(targetEl, '#ffffff', 0.6);
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.shake(targetEl, 6), i * 200);
    await Promise.all(effects);
  }

  /** One icicle falling onto `land` after `delay` ms (fall 300 ms), then a spiky flash and dust puffs. */
  private static async drop(refs: BattleStageRefs, land: Point, len: number, delay: number, spread: number) {
    const { fieldEl, fxEl } = refs;
    await Fx.wait(delay);
    const wrap = document.createElement('div');
    wrap.style.cssText = `width:${len * 0.3}px;height:${len}px;pointer-events:none;filter:drop-shadow(0 0 4px #C8F0FF) drop-shadow(0 0 8px #7ACCE8)`;
    const ice = document.createElement('div');
    ice.style.cssText = 'width:100%;height:100%;clip-path:polygon(15% 0,85% 0,50% 100%);background:linear-gradient(90deg,#9CD6FF,#FFFFFF 45%,#C8ECFF 60%,#6AB4E8)';
    wrap.appendChild(ice);
    Fx.place(wrap, { x: land.x, y: land.y - len / 2 });
    fxEl.appendChild(wrap);
    const fall = land.y + len;
    await Fx.anim(wrap, [
      { transform: `translateY(${-fall}px)`, opacity: 1 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 300, easing: 'ease-in' });
    Fx.anim(wrap, [{ opacity: 1, transform: 'scaleY(1)' }, { opacity: 0, transform: 'scaleY(.6)' }], { duration: 150 }).then(() => wrap.remove());
    Fx.shakeField(fieldEl, 0.5);

    const burst = FxGlyphs.spikyBurst(Math.max(len * 0.6, 34), '#FFE84A', '#FFF8B0', '#FFFFFF');
    Fx.place(burst, land);
    fxEl.appendChild(burst);
    await Promise.all([
      Fx.anim(burst, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' }).then(() => burst.remove()),
      FxEffects.smokePuff(fxEl, { x: land.x - spread * 0.45, y: land.y + len * 0.2 }, len * 0.55),
      FxEffects.smokePuff(fxEl, { x: land.x + spread * 0.45, y: land.y + len * 0.2 }, len * 0.55)
    ]);
  }
}
