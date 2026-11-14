import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Shift Gear, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/8/8f/Gangwechsel_Gen5.png
 *
 * Two big pale grey gears fade in over the user, meshing and turning
 * against each other, faster and faster (0-1.1 s), and fade out. Glowing
 * orange sparkles drift down over the user (1.1-2.3 s).
 */
export class ShiftGear {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const big = Math.max(lr.height * 1.1, 70);
    const small = big * 0.68;
    // The small gear sits low and to the side so the teeth mesh.
    const gap = (big + small) * 0.43;
    const bigAt: Point = { x: launch.x + gap * 0.35, y: launch.y - big * 0.2 };
    const smallAt: Point = { x: bigAt.x - gap * 0.8, y: bigAt.y + gap * 0.6 };

    const gears = [
      { el: ShiftGear.gear(big, 12), at: bigAt, turn: 180 },
      { el: ShiftGear.gear(small, 8), at: smallAt, turn: -270 }
    ];
    await Promise.all(
      gears.map(({ el, at, turn }) => {
        Fx.place(el, at);
        fxEl.appendChild(el);
        return Fx.anim(el, [
          { transform: 'rotate(0deg)', opacity: 0 },
          { transform: `rotate(${turn * 0.15}deg)`, opacity: 0.95, offset: 0.2 },
          { transform: `rotate(${turn * 0.8}deg)`, opacity: 0.95, offset: 0.8 },
          { transform: `rotate(${turn}deg)`, opacity: 0 }
        ], { duration: 1100, easing: 'ease-in' }).then(() => el.remove());
      })
    );
    await FxEffects.orangeSparkles(refs, launch, launch.y - lr.height * 0.5);
  }

  /** A pale grey gear `size` px wide with `teeth` teeth and a hub hole. */
  private static gear(size: number, teeth: number): HTMLElement {
    const el = document.createElement('div');
    // The mask cuts the hub out so the user shows through.
    const hub = 'radial-gradient(circle,#0000 0 11%,#000 12%)';
    el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;-webkit-mask-image:${hub};mask-image:${hub}`;
    const pts: string[] = [];
    const steps = teeth * 4;
    for (let i = 0; i < steps; i++) {
      const a = (Math.PI * 2 * i) / steps;
      const r = i % 4 < 2 ? 48 : 38;
      pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`);
    }
    el.innerHTML =
      '<svg viewBox="0 0 100 100" width="100%" height="100%">' +
      `<polygon points="${pts.join(' ')}" fill="#E4E6EA" stroke="#B4B8C0" stroke-width="1.5"/>` +
      '<circle cx="50" cy="50" r="15" fill="none" stroke="#C8CCD4" stroke-width="3"/></svg>';
    return el;
  }
}
