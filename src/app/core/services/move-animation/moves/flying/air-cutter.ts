import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/** When each blade cuts through the target, ms from the start. */
const HITS = [300, 550];
const TOTAL = 1000;

/**
 * Air Cutter, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a1/Windschnitt_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8c/Windschnitt_Gen5.png
 *
 * Horizontal wind lines rush across the scene (0-1.0 s). Two pale pink
 * crescent blades whirl round the target, cutting through it at 0.3 and
 * 0.55 s, then fly off.
 */
export class AirCutter {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const rx = Math.max(r.width, 50) * 0.65;
    const ry = Math.max(r.height, 50) * 0.25;
    const at = (ms: number) => ms / TOTAL;

    const wind = Fx.backdrop(fieldEl, 'background:repeating-linear-gradient(0deg,#C8D8E800 0 9px,#E8F0F8cc 9px 11px,#C8D8E800 11px 23px),linear-gradient(#A8B8C8,#7A8898);background-size:220px 100%,100% 100%;opacity:0');
    const effects: Promise<void>[] = [
      Fx.anim(wind, [
        { opacity: 0, backgroundPosition: '0 0,0 0' },
        { opacity: 0.85, offset: at(150) },
        { opacity: 0.85, offset: at(850) },
        { opacity: 0, backgroundPosition: '-1100px 0,0 0' }
      ], { duration: TOTAL, easing: 'linear' })
    ];
    HITS.forEach((hit, i) => {
      const blade = Fx.box(rx * 0.7, rx * 0.7, 'border-radius:50%;border-top:5px solid #FFD8EC;border-right:2px solid #FFE8F4aa;box-shadow:0 -3px 6px -2px #FF9AD0');
      const frames: Keyframe[] = [];
      const steps = 10;
      const a0 = i ? Math.PI : 0;
      for (let k = 0; k <= steps; k++) {
        const u = k / steps;
        const a = a0 + u * Math.PI * 2.4;
        frames.push({
          transform: `translate(${Math.cos(a) * rx * (1.2 - u * 0.4)}px,${Math.sin(a) * ry}px) rotate(${u * 900}deg)`,
          opacity: k === 0 || k === steps ? 0 : 1
        });
      }
      effects.push(Fx.spawn(fxEl, blade, target, frames, { duration: 500, easing: 'linear', delay: hit - 150 }));
      setTimeout(() => {
        Fx.flash(targetEl, '#FFD8EC', 0.5);
        Fx.shake(targetEl, 4);
      }, hit);
    });
    await Promise.all(effects);
    wind.remove();
  }
}
