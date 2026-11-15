import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * V-create, after the Gen 5 animation:
 * - Gen 5 (SW): https://www.pokewiki.de/images/b/b7/V-Generator_SW.png
 *
 * The user darts at the target and embers spray off it (0.12-0.6 s). A huge
 * orange "V" burns onto the target with a fireball on each tip
 * (0.3-0.95 s), then explodes: a red ray backdrop flares in (0.95-1.2 s) and
 * the target turns dark in a fire cloud (blast at 1.2 s, to ~1.9 s). The
 * user's defences drop: blue bubbles drift down over it (1.9-2.8 s).
 */
export class VCreate {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, dir: 1 | -1) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const effects: Promise<void>[] = [FxEffects.dart(launchEl, dir)];

    // Embers spray off the target as the user rams it.
    await Fx.wait(120);
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('div');
      const s = 4 + Math.random() * 4;
      dot.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#FFC83A;box-shadow:0 0 5px #FF8A1A`;
      Fx.place(dot, target);
      fxEl.appendChild(dot);
      const ang = Math.random() * Math.PI * 2;
      const d = Math.max(tr.width, 60) * (0.4 + Math.random() * 0.4);
      effects.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 0 }
        ], { duration: 500, easing: 'ease-out' }).then(() => dot.remove())
      );
    }
    await Fx.wait(180);

    // The burning "V" with a fireball on each tip.
    const vw = Math.max(tr.width * 1.5, 100);
    const vh = vw * 0.95;
    const v = document.createElement('div');
    v.style.cssText =
      `width:${vw}px;height:${vh}px;pointer-events:none;filter:drop-shadow(0 0 6px #FF7A1A);` +
      'clip-path:polygon(0 0,24% 0,50% 68%,76% 0,100% 0,62% 100%,38% 100%);' +
      'background:linear-gradient(180deg,#FFB24A,#F07A1A 60%,#D0501A)';
    Fx.place(v, target);
    fxEl.appendChild(v);
    const tips = [-1, 1].map((side) => {
      const ball = FxGlyphs.firePuff(vw * 0.32, 'hot');
      Fx.place(ball, { x: target.x + side * vw * 0.38, y: target.y - vh * 0.45 });
      fxEl.appendChild(ball);
      return ball;
    });
    await Promise.all([
      Fx.anim(v, [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 0.95 }], { duration: 250, easing: 'ease-out' }),
      ...tips.map((b) => Fx.anim(b, [{ transform: 'scale(0)' }, { transform: 'scale(1.2)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' }))
    ]);
    const flicker = [v, ...tips].map((el) => el.animate([{ opacity: 0.95 }, { opacity: 0.75 }, { opacity: 0.95 }], { duration: 120, iterations: 3 }));
    await Fx.wait(350);
    flicker.forEach((f) => f.cancel());
    v.remove();
    tips.forEach((b) => b.remove());

    // Explosion: red rays, the target goes dark inside a fire cloud.
    const back = await FxEffects.burstBackdrop(fieldEl, target, 'red');
    Fx.shakeField(fieldEl, 1);
    Fx.shake(targetEl, 8);
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(.25) sepia(1) saturate(3) hue-rotate(-30deg)', offset: 0.2 },
        { filter: 'brightness(.25) sepia(1) saturate(3) hue-rotate(-30deg)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 700, fill: 'none' }),
      FxEffects.fireBlastCloud(fxEl, target, Math.max(tr.width, 60), 10, '#FFC83A')
    );
    await Fx.wait(500);
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    back.remove();
    await Promise.all(effects);

    await FxEffects.statDownBubbles(refs, launch);
  }
}
