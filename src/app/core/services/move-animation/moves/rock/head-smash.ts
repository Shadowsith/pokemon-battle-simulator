import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Head Smash, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/17/Kopfsto%C3%9F_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/67/Kopfsto%C3%9F_Gen5.png
 *
 * The scene goes dark (0-0.2 s) and a white ring closes in on the target with
 * grey rocks and black stars circling into it (0.2-0.6 s) while the user
 * charges forward. On impact (0.6 s) an orange burst backdrop flares, a white
 * dust cloud bursts round the target with a yellow star, rocks fly off and
 * the target glows red (to ~1.4 s). The burst fades (to ~1.65 s) and the
 * user takes heavy recoil (to ~2.0 s).
 */
export class HeadSmash {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height) * 1.3;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });

    // The ring closes in; rocks and stars spiral into it.
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:4px solid #ffffff;box-shadow:0 0 8px #ffffff,inset 0 0 8px #ffffff`;
    Fx.place(ring, target);
    fxEl.appendChild(ring);
    const closing: Promise<void>[] = [
      Fx.anim(ring, [
        { transform: 'scale(2.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(.85)', opacity: 0 }
      ], { duration: 400, easing: 'ease-in' }).then(() => ring.remove())
    ];
    for (let i = 0; i < 8; i++) {
      const bit = i % 2 ? FxGlyphs.rockChunk(10 + Math.random() * 6) : HeadSmash.blackStar(12);
      Fx.place(bit, target);
      fxEl.appendChild(bit);
      const a0 = (Math.PI * 2 * i) / 8;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const a = a0 + t * Math.PI;
        const d = size * (0.9 - t * 0.5);
        frames.push({ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.7}px)`, opacity: t < 0.15 ? t / 0.15 : 1 - Math.max(0, t - 0.8) * 5 });
      }
      closing.push(Fx.anim(bit, frames, { duration: 400, easing: 'linear' }).then(() => bit.remove()));
    }
    const lunge = Fx.anim(launchEl, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${-v.dir * 10}px)`, offset: 0.3 },
      { transform: `translateX(${v.dir * 70}px)`, offset: 0.65 },
      { transform: 'translateX(0)' }
    ], { duration: 550, easing: 'ease-in', fill: 'none' });
    const burstIn = FxEffects.burstBackdrop(fieldEl, target, 'orange');
    await Promise.all(closing);

    // Impact: the burst shows, a dust cloud with a star, flying rocks, the target glows red.
    dim.remove();
    const star = FxGlyphs.fivePointStar(Math.max(tr.width * 0.35, 26), '#FFC83A', '#FFF6A0', '#FFD23A');
    Fx.place(star, { x: target.x + tr.width * 0.2, y: target.y - tr.height * 0.3 });
    fxEl.appendChild(star);
    Fx.shake(targetEl, 9);
    Fx.shakeField(fieldEl, 1);
    setTimeout(() => Fx.shake(targetEl, 6), 300);
    const effects: Promise<void>[] = [
      lunge,
      FxEffects.smokePuff(fxEl, target, size * 0.9),
      Fx.wait(120).then(() => FxEffects.smokePuff(fxEl, target, size * 0.7, ['#F4E8D8', '#D8C4A8'])),
      Fx.anim(star, [
        { transform: 'scale(.2) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.1) rotate(40deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1) rotate(70deg)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out' }).then(() => star.remove()),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(8) hue-rotate(-30deg) brightness(.9)', offset: 0.15 },
        { filter: 'sepia(1) saturate(8) hue-rotate(-30deg) brightness(.9)', offset: 0.8 },
        { filter: 'none' }
      ], { duration: 750, fill: 'none' })
    ];
    for (let i = 0; i < 10; i++) {
      const rock = FxGlyphs.rockChunk(8 + Math.random() * 10);
      Fx.place(rock, target);
      fxEl.appendChild(rock);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.5 + Math.random() * 0.4);
      effects.push(
        Fx.anim(rock, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.7 + 30}px) rotate(${(Math.random() * 2 - 1) * 360}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, delay: Math.random() * 100, easing: 'ease-out' }).then(() => rock.remove())
      );
    }
    const burst = await burstIn;
    await Promise.all([...effects, Fx.wait(800)]);

    await Fx.anim(burst, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    burst.remove();

    // Heavy recoil.
    Fx.flash(launchEl, '#E06666', 0.6);
    Fx.shake(launchEl, 6);
    await Fx.wait(350);
  }

  /** A small black five-point star with a faint white rim. */
  private static blackStar(size: number): HTMLElement {
    return FxGlyphs.fivePointStar(size, '#ffffff88', '#141414', '#2A2A2A');
  }
}
