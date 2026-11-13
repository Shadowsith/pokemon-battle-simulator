import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Fusion Flare, after the Gen 5 animation (only the boosted variant is on Pokewiki):
 * - Gen 5: https://www.pokewiki.de/images/8/8a/Kreuzflamme_%28Verst%C3%A4rkt%29_Gen5.png
 *
 * The user glows red while embers rise round it (0-0.6 s). Red-orange rays
 * burst open on black above the target and a fireball swells there inside
 * widening fire rings (0.6-1.3 s). The fireball drops onto the target
 * (1.3-1.5 s) and erupts into a big fire dome (hit at 1.5 s) while the target
 * glows red (to ~2.2 s); the scene clears (to ~2.45 s).
 */
export class FusionFlare {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const red = 'sepia(1) saturate(6) hue-rotate(-35deg) brightness(.95)';

    // 1. The user glows red, embers rise round it.
    const tint = Fx.anim(launchEl, [{ filter: 'none' }, { filter: red, offset: 0.25 }, { filter: red, offset: 0.75 }, { filter: 'none' }], {
      duration: 800,
      fill: 'none'
    });
    const embers: Promise<void>[] = [tint];
    for (let i = 0; i < 12; i++) {
      const e = FxGlyphs.firePuff(8 + Math.random() * 6, 'hot');
      Fx.place(e, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.5, y: launch.y + lr.height * 0.3 });
      fxEl.appendChild(e);
      embers.push(
        Fx.anim(e, [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { transform: `translateY(${-lr.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translateY(${-lr.height * 0.8}px) scale(.4)`, opacity: 0 }
        ], { duration: 550, delay: Math.random() * 250, easing: 'ease-out' }).then(() => e.remove())
      );
    }
    await Promise.all(embers);

    // 2. Rays burst open above the target; a fireball swells inside fire rings.
    const sky: Point = { x: target.x, y: Math.max(target.y - tr.height * 1.1, 30) };
    const back = await FxEffects.burstBackdrop(fieldEl, sky, 'flare');
    const size = Math.max(tr.width, tr.height) * 0.8;
    const ball = document.createElement('div');
    ball.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle at 45% 45%,#FFF2A0,#FFB43A 30%,#FF5A1A 60%,#E0200A00 75%);filter:drop-shadow(0 0 10px #FF5A1A)';
    Fx.place(ball, sky);
    fxEl.appendChild(ball);
    const rings: Promise<void>[] = [];
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${size * 2}px;height:${size * 0.5}px;border-radius:50%;pointer-events:none;border:3px solid #FF6A2A;box-shadow:0 0 6px #FF3A0A`;
      Fx.place(ring, sky);
      fxEl.appendChild(ring);
      rings.push(
        Fx.anim(ring, [
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(.8)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.6)', opacity: 0 }
        ], { duration: 500, delay: i * 150, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    await Promise.all([
      ...rings,
      Fx.anim(ball, [{ transform: 'scale(.15)' }, { transform: 'scale(1)' }], { duration: 700, easing: 'ease-out' })
    ]);

    // 3. It drops onto the target and erupts.
    await Fx.anim(ball, [{ transform: 'translateY(0) scale(1)' }, { transform: `translateY(${target.y - sky.y}px) scale(.8)` }], {
      duration: 200,
      easing: 'ease-in'
    });
    ball.remove();
    Fx.shakeField(fieldEl, 1);
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.shake(targetEl, 6), i * 200);
    await Promise.all([
      FxEffects.fireBlastCloud(fxEl, { x: target.x, y: target.y + tr.height * 0.1 }, Math.max(tr.width, tr.height) * 1.4, 14, '#FFB43A'),
      Fx.anim(targetEl, [{ filter: 'none' }, { filter: red, offset: 0.15 }, { filter: red, offset: 0.8 }, { filter: 'none' }], {
        duration: 700,
        fill: 'none'
      })
    ]);

    // 4. The scene clears.
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    back.remove();
  }
}
