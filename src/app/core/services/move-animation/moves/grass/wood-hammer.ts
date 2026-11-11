import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Wood Hammer, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/95/Holzhammer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/55/Holzhammer_Gen5.png
 *
 * The user glows green twice (0-0.3 s) and rams forward (0.3-0.65 s). On
 * impact (0.5 s) a green flash hits the target and splintered logs, green
 * leaves and yellow stars burst off it and fall away (to ~1.35 s). The user
 * flashes red from the recoil (0.62 s).
 */
export class WoodHammer {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);

    Fx.flash(launchEl, '#5AE05A', 0.8);
    await Fx.wait(150);
    Fx.flash(launchEl, '#5AE05A', 0.8);
    await Fx.wait(150);
    const lunge = Fx.anim(launchEl, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${v.dir * 60}px)`, offset: 0.55 },
      { transform: 'translateX(0)' }
    ], { duration: 350, easing: 'ease-in', fill: 'none' });
    await Fx.wait(200);

    // Impact: green flash, logs, leaves and stars burst off the target.
    Fx.flash(targetEl, '#7AF07A', 0.8);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    const reach = Math.max(tr.width, 60);
    const parts: Promise<void>[] = [lunge];
    const debris: HTMLElement[] = [
      ...Array.from({ length: 6 }, () => WoodHammer.logGlyph(14 + Math.random() * 10)),
      ...Array.from({ length: 8 }, () => FxGlyphs.leafGlyph(10 + Math.random() * 6)),
      ...Array.from({ length: 4 }, () => FxGlyphs.sparkStar(10 + Math.random() * 5, '#FFE04A'))
    ];
    debris.forEach((el, i) => {
      Fx.place(el, target);
      fxEl.appendChild(el);
      const ang = (Math.PI * 2 * i) / debris.length + Math.random() * 0.4;
      const d = reach * (0.5 + Math.random() * 0.4);
      const x = Math.cos(ang) * d;
      const y = Math.sin(ang) * d * 0.75;
      const spin = (Math.random() * 2 - 1) * 400;
      parts.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) rotate(0deg) scale(.5)', opacity: 1 },
          { transform: `translate(${x * 0.8}px,${y * 0.8}px) rotate(${spin * 0.6}deg) scale(1)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x}px,${y + 40}px) rotate(${spin}deg) scale(.9)`, opacity: 0 }
        ], { duration: 750 + Math.random() * 100, delay: Math.random() * 60, easing: 'ease-out' }).then(() => el.remove())
      );
    });
    // Recoil on the user (no status fleck: Wood Hammer has none).
    FxEffects.afterImpact(refs, launch, target, v);
    await Promise.all(parts);
  }

  /** A short brown log `w` px long, with a pale cut ring at one end. */
  private static logGlyph(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${w}px;height:${w * 0.4}px;border-radius:${w * 0.12}px;pointer-events:none;box-shadow:0 1px 2px #00000066;` +
      'background:radial-gradient(ellipse 18% 50% at 90% 50%,#F0D8A0 0 55%,#9A6A30 60%,#9A6A3000 100%),linear-gradient(180deg,#B88448,#7A4A1E 60%,#5A3412)';
    return el;
  }
}
