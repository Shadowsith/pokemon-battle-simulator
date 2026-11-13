import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Flame Burst, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/c/c2/Funkenflug_Gen5.png
 *
 * A small fireball flies from the user to the target (0-0.4 s) and bursts on
 * it (hit at 0.4 s) into a puff of fire, flinging red embers far out to both
 * sides, onto its neighbours, while the target glows red (0.4-1.3 s).
 */
export class FlameBurst {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height, 60);
    const dir = target.x >= launch.x ? 1 : -1;
    const from: Point = { x: launch.x + dir * lr.width * 0.25, y: launch.y };

    // The fireball.
    const ball = FxGlyphs.firePuff(22);
    ball.style.filter = 'drop-shadow(0 0 5px #FF8A2A)';
    Fx.place(ball, from);
    fxEl.appendChild(ball);
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    await Fx.anim(ball, [
      { transform: 'translate(0,0) rotate(0deg) scale(.6)' },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 18}px) rotate(180deg) scale(1)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) rotate(360deg) scale(1.1)` }
    ], { duration: 400, easing: 'ease-in' });
    ball.remove();

    // The burst: fire cloud on the target, embers flung out sideways.
    Fx.flash(targetEl, '#FF6A3A', 0.6);
    Fx.shake(targetEl, 5);
    const burn = Fx.anim(targetEl, [
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg)' },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(-35deg)', offset: 0.2 },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(-35deg)', offset: 0.7 },
      { filter: 'sepia(0) saturate(1) hue-rotate(0deg)' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });
    const effects: Promise<void>[] = [burn, FxEffects.fireBlastCloud(fxEl, target, size * 0.55, 8, '#FFB03A')];
    const W = fieldEl.clientWidth;
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1;
      const ember = document.createElement('div');
      const s = 5 + Math.random() * 4;
      ember.style.cssText = `position:absolute;width:${s * 1.6}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFE0A0,#F2583A 55%,#D0281C00);box-shadow:0 0 5px #F2583A`;
      Fx.place(ember, target);
      fxEl.appendChild(ember);
      const reach = Math.min(W * 0.35, 200) * (0.5 + Math.random() * 0.5);
      const rise = -20 - Math.random() * 40;
      effects.push(
        Fx.anim(ember, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${side * reach * 0.6}px,${rise}px)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${side * reach}px,${rise + 40 + Math.random() * 20}px)`, opacity: 0 }
        ], { duration: 750 + Math.random() * 150, delay: Math.random() * 100, easing: 'ease-out' }).then(() => ember.remove())
      );
    }
    await Promise.all(effects);
  }
}
