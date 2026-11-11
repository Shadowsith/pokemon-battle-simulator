import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Brave Bird, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1c/Sturzflug_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/2f/Sturzflug_Gen5.png
 *
 * The scene darkens and the user leans back (0-0.25 s), then the backdrop
 * turns into a bright blue sky with wavy bands scrolling past (0.25 s). The
 * user, glowing red-orange, dives all the way into the target (0.35-0.6 s):
 * a white ring of sparkles bursts and red feather flares fly off while the
 * target glows red (0.6-1.2 s). The sky fades, the user is back in its place
 * and takes recoil (1.2-1.65 s).
 */
export class BraveBird {
  /** Red of the feather flares. */
  private static readonly RED = '#F0402A';

  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const original = launchEl.style.transform;

    // Dark flash while the user winds up.
    const dark = Fx.backdrop(fieldEl, 'background:#2A1A14');
    Fx.anim(dark, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
    await Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)` },
      { transform: `${original} translate(${-dir * 12}px,4px)` }
    ], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // The blue sky with wavy bands.
    const sky = Fx.backdrop(fieldEl, BraveBird.SKY);
    sky.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: `${-dir * 160}px 0` }], { duration: 500, iterations: Infinity });
    dark.remove();
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 100, easing: 'ease-out' });

    // The dive into the target, glowing red-orange.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const glow = 'sepia(1) saturate(5) hue-rotate(-30deg) brightness(1.15) drop-shadow(0 0 8px #FF6A2A)';
    await Fx.anim(launchEl, [
      { transform: `${original} translate(${-dir * 12}px,4px)`, filter: 'none' },
      { transform: `${original} translate(${dx * 0.85}px,${dy * 0.85}px)`, filter: glow }
    ], { duration: 250, easing: 'ease-in', fill: 'forwards' });

    // Impact: white sparkle ring, red feather flares, the target glows red.
    Fx.flash(targetEl, '#ffffff', 0.9);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.6);
    const effects: Promise<void>[] = [BraveBird.sparkleRing(fxEl, target, Math.max(tr.width * 0.9, 60))];
    for (let i = 0; i < 7; i++) effects.push(BraveBird.featherFlare(fxEl, target, Math.max(tr.width * 0.8, 55), i));
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(6) hue-rotate(-40deg) brightness(.95)', offset: 0.2 },
        { filter: 'sepia(1) saturate(6) hue-rotate(-40deg) brightness(.95)', offset: 0.7 },
        { filter: 'none' }
      ], { duration: 600, easing: 'ease-in-out', fill: 'none' })
    );
    const back = Fx.anim(launchEl, [
      { transform: `${original} translate(${dx * 0.85}px,${dy * 0.85}px)`, filter: glow, opacity: 1 },
      { transform: `${original} translate(${dx * 0.85}px,${dy * 0.85}px)`, filter: glow, opacity: 0, offset: 0.3 },
      { transform: original, filter: 'none', opacity: 0, offset: 0.7 },
      { transform: original, filter: 'none', opacity: 1 }
    ], { duration: 600, easing: 'ease-out' });
    await Promise.all([...effects, back]);
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;

    // The sky fades; the user takes recoil.
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    sky.remove();
    Fx.flash(launchEl, '#E06666', 0.5);
    Fx.shake(launchEl, 4);
    await Fx.wait(250);
  }

  /** Bright sky blue with lighter wavy bands (tiles horizontally, so it can scroll). */
  private static readonly SKY =
    'background:url("data:image/svg+xml,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="40" viewBox="0 0 160 40">' +
        '<rect width="160" height="40" fill="#1EB4F0"/>' +
        '<path d="M0,14 Q20,8 40,14 T80,14 T120,14 T160,14" fill="none" stroke="#7AD8FF" stroke-width="3"/>' +
        '<path d="M0,30 Q20,24 40,30 T80,30 T120,30 T160,30" fill="none" stroke="#0A8ED8" stroke-width="2"/>' +
        '</svg>'
    ) +
    '")';

  /** A white ring with four-point sparkles bursting out from `at`. */
  private static sparkleRing(fxEl: HTMLElement, at: Point, size: number): Promise<void> {
    const ring = document.createElement('div');
    ring.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:3px solid #ffffff;box-shadow:0 0 8px #ffffff,inset 0 0 8px #C8F0FF`;
    Fx.place(ring, at);
    fxEl.appendChild(ring);
    const parts: Promise<void>[] = [
      Fx.anim(ring, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }).then(() => ring.remove())
    ];
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#BFF0FF');
      Fx.place(star, at);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const d = size * (0.5 + Math.random() * 0.3);
      parts.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d * 1.15}px,${Math.sin(ang) * d * 1.15}px) scale(.4)`, opacity: 0 }
        ], { duration: 550, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    return Promise.all(parts).then(() => void 0);
  }

  /** A red, feather-shaped flare shooting out from `at` (the `i`-th of a fan). */
  private static featherFlare(fxEl: HTMLElement, at: Point, reach: number, i: number): Promise<void> {
    const w = 14 + Math.random() * 8;
    const flare = document.createElement('div');
    flare.style.cssText =
      `width:${w}px;height:${w * 0.55}px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;` +
      `background:radial-gradient(ellipse at 30% 40%,#FFD0B0,${BraveBird.RED} 55%,#A0100A);filter:drop-shadow(0 0 3px ${BraveBird.RED})`;
    Fx.place(flare, at);
    fxEl.appendChild(flare);
    const ang = -Math.PI / 2 + ((i - 3) / 3) * 1.4 + (Math.random() * 2 - 1) * 0.2;
    const d = reach * (0.7 + Math.random() * 0.4);
    const rot = (ang * 180) / Math.PI;
    return Fx.anim(flare, [
      { transform: `translate(0,0) rotate(${rot}deg) scale(.4)`, opacity: 1 },
      { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px) rotate(${rot}deg) scale(1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + 12}px) rotate(${rot + 40}deg) scale(.8)`, opacity: 0 }
    ], { duration: 650, delay: i * 30, easing: 'ease-out' }).then(() => flare.remove());
  }
}
