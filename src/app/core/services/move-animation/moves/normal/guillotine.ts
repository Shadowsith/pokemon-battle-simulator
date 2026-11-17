import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';

/**
 * Guillotine, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/54/Guillotine_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/ef/Guillotine_Gen5.png
 *
 * The scene darkens (0-0.25 s) and two curved steel blades open up on either
 * side of the target (0.25-0.45 s), then snap shut on it like pincers (hit at
 * 0.6 s): a white flash, the target shakes and yellow sparkles drift down
 * while the blades fade (0.6-1.2 s); the scene lightens (to ~1.45 s).
 */
export class Guillotine {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    const h = Math.max(r.height * 0.95, 64);
    const gap = Math.max(r.width * 0.5, 34);
    const blades = [-1, 1].map((side) => {
      const blade = Guillotine.blade(h, side);
      return Fx.spawn(fxEl, blade, { x: target.x + side * gap * 0.55, y: target.y }, [
        { transform: `translateX(${side * gap * 0.9}px) rotate(${side * 25}deg)`, opacity: 0 },
        { transform: `translateX(${side * gap * 0.6}px) rotate(${side * 18}deg)`, opacity: 1, offset: 0.17 },
        { transform: `translateX(${side * gap * 0.6}px) rotate(${side * 18}deg)`, opacity: 1, offset: 0.25 },
        { transform: 'translateX(0) rotate(0deg)', opacity: 1, offset: 0.4 },
        { transform: 'translateX(0) rotate(0deg)', opacity: 1, offset: 0.7 },
        { transform: 'translateX(0) rotate(0deg)', opacity: 0 }
      ], { duration: 900, easing: 'ease-in' });
    });
    await Fx.wait(360);
    Fx.flash(targetEl, '#ffffff', 0.9);
    Fx.shake(targetEl, 6);

    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 12; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * r.width * 0.6, y: target.y - r.height * (0.1 + Math.random() * 0.4) };
      sparkles.push(
        Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:radial-gradient(circle,#FFFBD0,#F8D040 60%);box-shadow:0 0 5px #F8D040'), at, [
          { transform: 'translateY(0) scale(.4)', opacity: 0 },
          { transform: 'translateY(4px) scale(1)', opacity: 1, offset: 0.25 },
          { transform: `translateY(${24 + Math.random() * 20}px) scale(.6)`, opacity: 0 }
        ], { duration: 600, easing: 'ease-in', delay: i * 25 })
      );
    }
    await Promise.all([...blades, ...sparkles]);
    await Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }

  /** One curved steel blade, `h` px tall, its hooked edge facing the target (`side` -1 = left blade). */
  private static blade(h: number, side: number): HTMLElement {
    const el = Fx.box(h * 0.45, h, `filter:drop-shadow(0 0 3px #00000099);transform-origin:50% 50%`);
    el.innerHTML =
      `<svg viewBox="0 0 18 40" width="100%" height="100%" style="transform:scaleX(${side < 0 ? -1 : 1})">` +
      '<defs><linearGradient id="guillotineSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5A5A64"/><stop offset=".55" stop-color="#C8C8D0"/><stop offset="1" stop-color="#F4F4F8"/></linearGradient></defs>' +
      '<path d="M3,1 C14,6 17,14 17,20 C17,26 14,34 3,39 C8,32 10,26 10,20 C10,14 8,8 3,1 Z" fill="url(#guillotineSteel)" stroke="#2A2A30" stroke-width="1" stroke-linejoin="round"/>' +
      '<path d="M6,6 C12,11 14,16 14,20" stroke="#ffffff" stroke-width="1" fill="none" opacity=".8"/></svg>';
    return el;
  }
}
