import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Roar of Time, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/dc/Zeitenl%C3%A4rm_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a4/Zeitenl%C3%A4rm_Gen5.png
 *
 * The scene darkens while white specks gather into the user (0-0.55 s); a
 * white ring of sparkles bursts out from it (0.55-1.0 s) and blue rays flare
 * round it as time warps (0.8-1.2 s). The scene turns pale and a rolling
 * stream of cream, gold and pink blasts sweeps from the user over the target
 * (1.2-2.17 s, hit at 1.67 s); the scene clears (2.17-2.47 s).
 */
export class RoarOfTime {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(lr.width, lr.height);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // White specks gather into the user.
    const parts: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const dot = RoarOfTime.speck(3 + Math.random() * 3);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.7 + Math.random() * 0.4);
      Fx.place(dot, launch);
      fxEl.appendChild(dot);
      parts.push(
        Fx.anim(dot, [
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.7}px)`, opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.42}px)`, opacity: 1, offset: 0.4 },
          { transform: 'translate(0,0)', opacity: 0 }
        ], { duration: 350, delay: 100 + Math.random() * 100, easing: 'ease-in' }).then(() => dot.remove())
      );
    }
    await Promise.all(parts);
    parts.length = 0;

    // The sparkling ring bursts out; blue rays flare round the user.
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:${size * 0.08}px solid #F4F8FF;box-shadow:0 0 10px #fff,inset 0 0 10px #fff`;
    Fx.place(ring, launch);
    fxEl.appendChild(ring);
    parts.push(Fx.anim(ring, [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.6 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 400, easing: 'ease-out' }).then(() => ring.remove()));
    for (let i = 0; i < 16; i++) {
      const dot = RoarOfTime.speck(4 + Math.random() * 4);
      const ang = (Math.PI * 2 * i) / 16;
      const d = size * (0.5 + Math.random() * 0.3);
      Fx.place(dot, launch);
      fxEl.appendChild(dot);
      parts.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }).then(() => dot.remove())
      );
    }
    await Fx.wait(250);
    // The ray backdrop goes in below the dim one: fade the dim out to reveal it.
    const raysIn = FxEffects.burstBackdrop(fieldEl, launch, 'blue');
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-out' });
    dim.remove();
    const rays = await raysIn;
    await Promise.all([...parts, Fx.wait(150)]);
    parts.length = 0;

    // The pale scene and the rolling blasts.
    const pale = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#FFFFFF,#ECEAF2 60%,#D8D4E2)');
    rays.after(pale);
    await Fx.anim(pale, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out' });
    rays.remove();
    const tones = [
      ['#FFFBE0', '#FFD86A', '#F0A0C8'],
      ['#FFFFFF', '#FFE8A0', '#E890C0'],
      ['#FFF4D0', '#FFC860', '#D878B8']
    ];
    for (let i = 0; i < 22; i++) {
      const t = i / 21;
      const s = size * (0.35 + Math.random() * 0.3) * (0.7 + t * 0.6);
      const [c0, c1, c2] = tones[i % 3];
      const bloom = document.createElement('div');
      bloom.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,${c0} 0 25%,${c1} 45%,${c2}aa 65%,${c2}00 72%)`;
      // Spread along the line from the user to just past the target.
      const k = t * 1.15;
      const at: Point = {
        x: launch.x + (target.x - launch.x) * k,
        y: launch.y + (target.y - launch.y) * k + (Math.random() * 2 - 1) * tr.height * 0.35
      };
      Fx.place(bloom, at);
      fxEl.appendChild(bloom);
      parts.push(
        Fx.anim(bloom, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'scale(1.35)', opacity: 0 }
        ], { duration: 450, delay: t * 400, easing: 'ease-out', fill: 'backwards' }).then(() => bloom.remove())
      );
    }
    // The hit lands once the stream reaches the target.
    await Fx.wait(350);
    Fx.flash(targetEl, '#FFE8A0', 0.7);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 0.8);
    setTimeout(() => Fx.shake(targetEl, 6), 300);
    await Promise.all(parts);

    await Fx.anim(pale, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    pale.remove();
  }

  /** A small glowing white speck, `s` px wide. */
  private static speck(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#fff;box-shadow:0 0 4px #ffffff`;
    return el;
  }
}
