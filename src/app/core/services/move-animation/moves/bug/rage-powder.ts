import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Rage Powder, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/b/b7/Wutpulver_Gen5.png
 *
 * Four fuzzy pale yellow powder balls appear round the user and circle it
 * slowly (0-1.9 s). A cloud of red powder puffs bursts out of the user and
 * drifts outward over the field as it fades (0.5-1.5 s).
 */
export class RagePowder {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const rad = Math.max(lr.width * 0.7, 40);
    const effects: Promise<void>[] = [];

    // Fuzzy yellow powder balls circle the user.
    for (let i = 0; i < 4; i++) {
      const ball = document.createElement('div');
      const s = Math.max(lr.width * 0.35, 22);
      ball.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFDE0,#F8EC9A 45%,#F0D86Acc 62%,#F0D86A00 75%)`;
      Fx.place(ball, launch);
      fxEl.appendChild(ball);
      const phase = (Math.PI * 2 * i) / 4;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const a = phase + t * Math.PI;
        frames.push({
          transform: `translate(${Math.cos(a) * rad}px,${Math.sin(a) * rad * 0.6}px) scale(${t === 0 ? 0 : 1 + 0.08 * Math.sin(t * 20)})`,
          opacity: Math.min(1, t * 8, (1 - t) * 8)
        });
      }
      effects.push(Fx.anim(ball, frames, { duration: 1900, easing: 'linear' }).then(() => ball.remove()));
    }
    await Fx.wait(500);

    // The red powder cloud bursts out and drifts over the field.
    Fx.flash(launchEl, '#FF4A4A', 0.5);
    for (let i = 0; i < 26; i++) {
      const puff = document.createElement('div');
      const s = 8 + Math.random() * 22;
      puff.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FF3A3Aee,#E8142Acc 55%,#E8142A00 75%)`;
      Fx.place(puff, launch);
      fxEl.appendChild(puff);
      const a = Math.random() * Math.PI * 2;
      const d = rad * (0.8 + Math.random() * 1.6);
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d * 0.6;
      effects.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${x * 0.6}px,${y * 0.6}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${x}px,${y + 10}px) scale(1.3)`, opacity: 0 }
        ], { duration: 750, delay: Math.random() * 250, easing: 'ease-out' }).then(() => puff.remove())
      );
    }
    await Promise.all(effects);
  }
}
