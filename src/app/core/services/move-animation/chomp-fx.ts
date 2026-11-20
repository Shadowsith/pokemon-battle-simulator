import { BattleStageRefs, Point } from './animation.types';
import { Fx } from './fx';
import { FxGlyphs } from './fx-glyphs';

/** The white snapping jaw of the biting moves (Bite, Crunch, Poison Fang). */
export class ChompFx {
  /**
   * A white jaw (`w` px wide, turned by `tilt` degrees) opens above and below
   * the target and snaps shut, stopping just before the teeth touch: a flash,
   * a shake and white sparks - plus white impact rays when `rays` is set.
   * `grinds` extra small bites follow before the jaw lets go.
   */
  static async chomp(refs: BattleStageRefs, target: Point, o: { w: number; tilt: number; grinds: number; rays: boolean }) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const { w } = o;
    const h = w * 0.46;
    // Tooth tips sit at 45/46 of the glyph height; stop them a few px apart so the halves never touch.
    const gap = 3;
    const shut = h * (45 / 46 - 0.5) + gap;
    const open = shut + Math.max(r.height * 0.22, 16);
    const turn = `rotate(${o.tilt}deg)`;

    const upper = FxGlyphs.jawGlyph(w, h, false);
    const lower = FxGlyphs.jawGlyph(w, h, true);
    Fx.place(upper, target);
    Fx.place(lower, target);
    fxEl.append(upper, lower);
    const at = (sign: number, flip: string, d: number) => `${turn} translateY(${sign * d}px) ${flip}`;

    const move = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      Fx.anim(el, [
        { transform: at(sign, flip, open + 8), opacity: 0, offset: 0 },
        { transform: at(sign, flip, open), opacity: 1, offset: 0.43 },
        { transform: at(sign, flip, open + 4), opacity: 1, offset: 0.79 },
        // Must end at offset 1: otherwise the browser adds a final frame at the untransformed spot.
        { transform: at(sign, flip, shut), opacity: 1, offset: 1 }
      ], { duration: 450, easing: 'ease-in', fill: 'forwards' });
    await Promise.all([move(upper, -1, ''), move(lower, 1, 'scaleY(-1)')]);

    // Snap: flash, shake and a burst of white sparks where the teeth meet.
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#FFF6C8');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 8;
      Fx.anim(star, [
        { transform: 'translate(0,0) scale(.3)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * w * 0.55}px,${Math.sin(ang) * h * 0.6}px) scale(1)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => star.remove());
    }
    if (o.rays) ChompFx.impactRays(fxEl, target, w * 0.75);

    // Grinding: the jaw eases open a little and bites down again.
    for (let g = 0; g < o.grinds; g++) {
      await Fx.wait(90);
      const grind = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
        Fx.anim(el, [
          { transform: at(sign, flip, shut) },
          { transform: at(sign, flip, shut + 8), offset: 0.45 },
          { transform: at(sign, flip, shut) }
        ], { duration: 160, easing: 'ease-in-out', fill: 'forwards' });
      await Promise.all([grind(upper, -1, ''), grind(lower, 1, 'scaleY(-1)')]);
      Fx.flash(targetEl, '#ffffff', 0.45);
      Fx.shake(targetEl, 4);
      if (o.rays) ChompFx.impactRays(fxEl, target, w * 0.55);
    }

    await Fx.wait(220);
    const release = (el: HTMLElement, sign: number, flip: string): Promise<void> =>
      Fx.anim(el, [
        { transform: at(sign, flip, shut), opacity: 1 },
        { transform: at(sign, flip, shut + 10), opacity: 0 }
      ], { duration: 220, easing: 'ease-out' }).then(() => el.remove());
    await Promise.all([release(upper, -1, ''), release(lower, 1, 'scaleY(-1)')]);
  }

  /** Thin white impact rays shooting out from `at` and fading. */
  private static impactRays(fxEl: HTMLElement, at: Point, reach: number): void {
    for (let i = 0; i < 10; i++) {
      const len = reach * (0.35 + Math.random() * 0.35);
      const ray = document.createElement('div');
      ray.style.cssText = `position:absolute;width:${len}px;height:3px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#ffffff00,#ffffff);box-shadow:0 0 4px #ffffff`;
      Fx.place(ray, at);
      fxEl.appendChild(ray);
      const deg = (360 * i) / 10 + Math.random() * 20;
      Fx.anim(ray, [
        { transform: `rotate(${deg}deg) translateX(${reach * 0.15}px) scaleX(.3)`, opacity: 1 },
        { transform: `rotate(${deg}deg) translateX(${reach * 0.6}px) scaleX(1)`, opacity: 0 }
      ], { duration: 280, easing: 'ease-out' }).then(() => ray.remove());
    }
  }
}
