import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Power Whip, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DPPt): https://www.pokewiki.de/images/9/93/Blattgei%C3%9Fel_DPPt.png
 * - Gen 4 (HGSS): https://www.pokewiki.de/images/4/4c/Blattgei%C3%9Fel_HGSS.png
 * - Gen 5: https://www.pokewiki.de/images/d/d9/Blattgei%C3%9Fel_Gen5.png
 *
 * The scene darkens (0-0.2 s) and a green vine whips down from above in a
 * curved swing onto the target (0.15-0.45 s). On the hit (0.4 s) a spiky green
 * burst flares and green orbs scatter, then a bright green backdrop with white
 * rays flickers behind the shaking target (0.45-1.15 s) and fades (to ~1.4 s).
 */
export class PowerWhip {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width, tr.height) * 1.1;

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const dimIn = Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 200, easing: 'ease-out' });

    // The vine: a green crescent swinging down round a pivot above the target.
    await Fx.wait(150);
    const vine = PowerWhip.vine(size * 0.5, size);
    const pivot: Point = { x: target.x, y: target.y - size * 0.55 };
    vine.style.left = `${pivot.x - size * 0.25}px`;
    vine.style.top = `${pivot.y}px`;
    fxEl.appendChild(vine);
    const swing = Fx.anim(vine, [
      { transform: 'rotate(-120deg)', transformOrigin: '50% 0', opacity: 0 },
      { transform: 'rotate(-60deg)', transformOrigin: '50% 0', opacity: 1, offset: 0.35 },
      { transform: 'rotate(10deg)', transformOrigin: '50% 0', opacity: 1, offset: 0.8 },
      { transform: 'rotate(25deg)', transformOrigin: '50% 0', opacity: 0 }
    ], { duration: 300, easing: 'ease-in' }).then(() => vine.remove());
    await Fx.wait(250);

    // Hit: spiky burst, scattering orbs, then the green ray backdrop.
    const burst = FxGlyphs.spikyBurst(size * 0.8, '#2A9A1A', '#7EE04A', '#F0FFD0');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    Fx.flash(targetEl, '#9AF060', 0.6);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    const parts: Promise<void>[] = [
      swing,
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1.1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.3) rotate(25deg)', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => burst.remove())
    ];
    for (let i = 0; i < 10; i++) {
      const s = 6 + Math.random() * 8;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#E8FFC8,#5ACC2A 60%,#2A8A14);box-shadow:0 0 4px #7EE04A`;
      Fx.place(orb, target);
      fxEl.appendChild(orb);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.4 + Math.random() * 0.4);
      parts.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(.5)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.7 - 10}px) scale(1)`, opacity: 0 }
        ], { duration: 550 + Math.random() * 200, easing: 'ease-out' }).then(() => orb.remove())
      );
    }
    // The ray backdrop goes in below the dim one: fade the dim out to reveal it.
    const raysIn = FxEffects.burstBackdrop(fieldEl, target, 'green');
    await dimIn;
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-out' });
    dim.remove();
    const rays = await raysIn;
    setTimeout(() => Fx.shake(targetEl, 5), 100);
    await Promise.all([...parts, Fx.wait(450)]);

    await Fx.anim(rays, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    rays.remove();
  }

  /** A curved green vine `w` x `h` px, hanging from its top centre and bowing to the left. */
  private static vine(w: number, h: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 4px #7EE04A)`;
    el.innerHTML =
      '<svg width="100%" height="100%" viewBox="0 0 20 40" preserveAspectRatio="none">' +
      '<path d="M10,0 C2,12 2,28 9,40 C6,28 6,12 12,1 Z" fill="#3AB020" stroke="#C8FF90" stroke-width=".8" stroke-linejoin="round"/>' +
      '</svg>';
    return el;
  }
}
