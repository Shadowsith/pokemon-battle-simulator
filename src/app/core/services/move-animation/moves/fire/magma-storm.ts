import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Magma Storm, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/6e/Lavasturm_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/fa/Lavasturm_Gen5.png
 *
 * The scene turns into a molten yellow-orange wall with orange blobs drifting
 * up (0-0.3 s). A vortex of red magma balls and white swirl rings coils up
 * round the target (0.3-1.55 s); the target glows red and shakes (hit at
 * 0.5 s, again at 0.9 s). The molten wall darkens and fades (1.55-1.9 s).
 */
export class MagmaStorm {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const rx = Math.max(tr.width * 0.55, 34);
    const ry = rx * 0.3;
    const rise = Math.max(tr.height * 1.1, 70);
    const bottom = target.y + tr.height * 0.45;

    const molten = Fx.backdrop(
      fieldEl,
      'background:radial-gradient(ellipse 40% 45%,#FF7A1A 0 55%,#FF7A1A00 75%) 0 0/44px 52px,' +
        'linear-gradient(90deg,#FFD84A,#FFA422 25%,#FFD84A 50%,#FF9A1A 75%,#FFD84A)'
    );
    const drift = molten.animate([{ backgroundPosition: '0 0, 0 0' }, { backgroundPosition: '22px -104px, 0 0' }], { duration: 900, iterations: Infinity });
    await Fx.anim(molten, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The vortex: magma balls and white rings spiral up an ellipse round the target.
    const parts: Promise<void>[] = [];
    const steps = 12;
    for (let i = 0; i < 20; i++) {
      const ring = i % 4 === 3;
      const s = ring ? rx * 0.9 : 18 + Math.random() * 12;
      const el = ring ? MagmaStorm.swirlRing(s) : FxGlyphs.firePuff(s, 'red');
      Fx.place(el, { x: target.x, y: bottom });
      fxEl.appendChild(el);
      const a0 = Math.random() * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const a = a0 + t * Math.PI * 3;
        // Behind the target (sin < 0) the ball is smaller and fainter.
        const depth = 0.75 + 0.25 * Math.sin(a);
        const x = ring ? 0 : Math.cos(a) * rx;
        const y = -t * rise + (ring ? 0 : Math.sin(a) * ry);
        const fade = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
        frames.push({ transform: `translate(${x}px,${y}px) scale(${ring ? 0.7 + t * 0.5 : depth})`, opacity: fade * (ring ? 0.8 : depth) });
      }
      parts.push(Fx.anim(el, frames, { duration: 650 + Math.random() * 150, delay: (i / 20) * 450, easing: 'linear', fill: 'backwards' }).then(() => el.remove()));
    }

    // Hit: the target glows red and shakes twice.
    await Fx.wait(200);
    Fx.shake(targetEl, 6);
    setTimeout(() => Fx.shake(targetEl, 5), 400);
    parts.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(6) hue-rotate(-30deg) brightness(1.05)', offset: 0.15 },
        { filter: 'sepia(1) saturate(6) hue-rotate(-30deg) brightness(1.05)', offset: 0.8 },
        { filter: 'none' }
      ], { duration: 1050, fill: 'none' })
    );
    await Promise.all(parts);

    // The molten wall darkens and fades away.
    await Fx.anim(molten, [{ opacity: 1, filter: 'brightness(1)' }, { opacity: 0, filter: 'brightness(.35)' }], { duration: 350, easing: 'ease-in' });
    drift.cancel();
    molten.remove();
  }

  /** A thin white swirl ring, seen flat from the side, `w` px wide. */
  private static swirlRing(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w * 2}px;height:${w * 0.6}px;pointer-events:none;border-radius:50%;border:2px solid #FFF4E0;box-shadow:0 0 5px #FFD0A0`;
    return el;
  }
}
