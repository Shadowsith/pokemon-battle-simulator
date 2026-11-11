import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Aqua Tail, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/9b/Nassschweif_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/f8/Nassschweif_Gen5.png
 *
 * Water rings ripple out on the ground under the user while bubbles rise
 * round it (0-0.5 s). A curved blue swipe of water sweeps low across to the
 * target with a trail of bubbles (0.45-0.8 s) and bursts there into a wide
 * white splash of spray while the target shakes (0.8-1.4 s).
 */
export class AquaTail {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const foot = Fx.footOf(launchEl, fieldEl);

    // Ripples under the user and rising bubbles.
    const ringW = Math.max(lr.width * 1.4, 90);
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${ringW}px;height:${ringW * 0.3}px;border-radius:50%;pointer-events:none;border:2px solid #E8F8FFcc;box-shadow:0 0 6px #7CCBFF,inset 0 0 6px #7CCBFF`;
      Fx.place(ring, foot);
      fxEl.appendChild(ring);
      Fx.anim(ring, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(.7)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 500, delay: i * 130, easing: 'ease-out' }).then(() => ring.remove());
    }
    for (let i = 0; i < 10; i++) {
      const bubble = FxGlyphs.bubbleGlyph(8 + Math.random() * 12);
      Fx.place(bubble, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.6, y: foot.y - Math.random() * lr.height * 0.3 });
      fxEl.appendChild(bubble);
      Fx.anim(bubble, [
        { transform: 'translateY(0) scale(.4)', opacity: 0 },
        { transform: `translateY(${-lr.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translateY(${-lr.height * 0.75}px) scale(1.1)`, opacity: 0 }
      ], { duration: 600, delay: Math.random() * 250, easing: 'ease-out' }).then(() => bubble.remove());
    }
    await Fx.wait(450);

    // The swipe: a curved crescent of water sweeps low over to the target, trailing bubbles.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const size = Math.max(tr.width * 1.2, 80);
    const swipe = document.createElement('div');
    const dir = dx >= 0 ? 1 : -1;
    swipe.style.cssText =
      `width:${size}px;height:${size * 0.6}px;border-radius:50%;pointer-events:none;` +
      `border-bottom:${size * 0.12}px solid #4AA8F0;border-${dir > 0 ? 'right' : 'left'}:${size * 0.05}px solid #9CD6FF;` +
      'filter:drop-shadow(0 0 4px #CDEEFF)';
    Fx.place(swipe, launch);
    fxEl.appendChild(swipe);
    const sweep = Fx.anim(swipe, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: `translate(${dx * 0.3}px,${dy * 0.3 + 25}px) scale(.9)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1 }
    ], { duration: 350, easing: 'ease-in' });
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const u = i / 8;
        const bubble = FxGlyphs.bubbleGlyph(6 + Math.random() * 8);
        Fx.place(bubble, { x: launch.x + dx * u, y: launch.y + dy * u + 25 * Math.sin(Math.PI * u) });
        fxEl.appendChild(bubble);
        Fx.anim(bubble, [
          { transform: 'translateY(0) scale(1)', opacity: 0.9 },
          { transform: 'translateY(-14px) scale(.5)', opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }).then(() => bubble.remove());
      }, i * 40);
    }
    await sweep;
    swipe.remove();

    // The splash: a wide white burst of spray with flying droplets.
    Fx.flash(targetEl, '#CDEEFF', 0.7);
    Fx.shake(targetEl, 6);
    const splashes: Promise<void>[] = [
      FxEffects.smokePuff(fxEl, { x: target.x - size * 0.3, y: target.y }, size * 0.8, ['#F4FAFF', '#C8DCF0']),
      FxEffects.smokePuff(fxEl, { x: target.x + size * 0.3, y: target.y }, size * 0.8, ['#F4FAFF', '#C8DCF0']),
      FxEffects.smokePuff(fxEl, target, size, ['#FFFFFF', '#D8D0F0'])
    ];
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const drop = document.createElement('div');
      drop.style.cssText = `width:${s}px;height:${s * 1.3}px;border-radius:50% 50% 50% 50%/65% 65% 40% 40%;pointer-events:none;background:radial-gradient(circle at 40% 30%,#fff,#7CCBFF)`;
      Fx.place(drop, target);
      fxEl.appendChild(drop);
      const ang = -Math.PI / 2 + (Math.random() * 2 - 1) * 1.4;
      const d = size * (0.5 + Math.random() * 0.4);
      splashes.push(
        Fx.anim(drop, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d * 1.1}px,${Math.sin(ang) * d + 18}px)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-out' }).then(() => drop.remove())
      );
    }
    await Promise.all(splashes);
  }
}
