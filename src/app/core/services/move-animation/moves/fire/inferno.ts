import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Inferno, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/a/a5/Inferno_Gen5.png
 *
 * A backdrop of flickering yellow-orange fire bands fades in (0-0.3 s).
 * Fire puffs swirl up round the target in a dense column (0.3-1.4 s); the
 * target is hit at 0.4 s and glows red (to 2.1 s). The fire dies down to
 * black (1.4-1.7 s) while dark smoke rises off the target (1.4-2.1 s), then
 * the scene clears (to ~2.35 s).
 */
export class Inferno {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const back = Fx.backdrop(fieldEl, 'background:#100400');
    const bands = document.createElement('div');
    bands.style.cssText =
      'position:absolute;inset:0 -30%;' +
      'background:repeating-linear-gradient(90deg,#F06A1A 0,#FFB02A 8%,#FFE85A 14%,#FFC83A 20%,#F27A1A 28%,#E8501A 34%)';
    back.appendChild(bands);
    const flicker = bands.animate([
      { transform: 'translateX(0)', filter: 'brightness(1)' },
      { transform: 'translateX(4%)', filter: 'brightness(1.15)' },
      { transform: 'translateX(0)', filter: 'brightness(1)' }
    ], { duration: 300, iterations: Infinity });
    await Fx.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // A column of fire puffs swirling up round the target.
    const w = Math.max(tr.width * 0.5, 34);
    const height = Math.max(tr.height * 1.1, 80);
    const foot: Point = { x: target.x, y: target.y + tr.height * 0.35 };
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < 30; i++) {
      const puff = FxGlyphs.firePuff(14 + Math.random() * 14, i % 4 === 0 ? 'red' : 'hot');
      Fx.place(puff, foot);
      fxEl.appendChild(puff);
      const phase = Math.random() * Math.PI * 2;
      const r = w * (0.5 + Math.random() * 0.5);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const a = phase + t * Math.PI * 2;
        frames.push({
          transform: `translate(${Math.cos(a) * r}px,${-t * height + Math.sin(a) * r * 0.3}px) scale(${0.6 + t * 0.6})`,
          opacity: Math.min(1, t * 5, (1 - t) * 3)
        });
      }
      puffs.push(Fx.anim(puff, frames, { duration: 600, delay: Math.random() * 500, easing: 'linear' }).then(() => puff.remove()));
    }
    await Fx.wait(100);
    Fx.flash(targetEl, '#FF6A2A', 0.7);
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.shake(targetEl, 4), i * 220);
    const red = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(5) hue-rotate(-30deg) brightness(.9)', offset: 0.15 },
      { filter: 'sepia(1) saturate(5) hue-rotate(-30deg) brightness(.9)', offset: 0.8 },
      { filter: 'none' }
    ], { duration: 1700, easing: 'ease-in-out', fill: 'none' });
    await Promise.all(puffs);

    // The fire dies down to black; dark smoke rises off the target.
    Fx.anim(bands, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    const smoke: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const puff = document.createElement('div');
      const s = w * (0.5 + Math.random() * 0.4);
      puff.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#4A3C30cc,#2A201800 70%)`;
      Fx.place(puff, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.15, y: target.y - tr.height * 0.2 });
      fxEl.appendChild(puff);
      smoke.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${(Math.random() * 2 - 1) * 6}px,${-tr.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${(Math.random() * 2 - 1) * 12}px,${-tr.height * 0.8}px) scale(1.4)`, opacity: 0 }
        ], { duration: 500, delay: i * 25, easing: 'ease-out' }).then(() => puff.remove())
      );
    }
    await Promise.all([...smoke, red]);
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    flicker.cancel();
    back.remove();
  }
}
