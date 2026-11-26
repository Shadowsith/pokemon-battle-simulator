import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The hand reaches the target at `GRAB` (ms), squeezes until `CRUSH` (ms). */
const GRAB = 400;
const CRUSH = 950;

/**
 * Crush Grip, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/25/Quetschgriff_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/c4/Quetschgriff_Gen5.png
 *
 * A huge white hand reaches from the user over to the target (0-0.4 s) and
 * closes round it, turning cream and then glowing yellow as it squeezes
 * tighter (0.4-0.95 s) while the target trembles. It lets go in a yellow
 * spiky burst with dark specks flying off (0.95-1.4 s).
 */
export class CrushGrip {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.1, 64);
    const dx = launch.x - target.x;
    const dy = launch.y - target.y;
    const hand = FxGlyphs.gloveGlyph(w, '#ffffff', '#B8B8C4');
    const grip = (scale: number, filter: string) => ({ transform: `translate(0,0) scale(${scale})`, filter });
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, hand, target, [
        { transform: `translate(${dx * 0.6}px,${dy * 0.6}px) scale(.6)`, opacity: 0, filter: 'none' },
        { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(1)`, opacity: 0.95, filter: 'none', offset: 0.2 },
        { ...grip(1.15, 'none'), opacity: 0.95, offset: GRAB / CRUSH * 0.75 },
        { ...grip(0.95, 'sepia(.5) brightness(1.05)'), opacity: 0.95, offset: 0.65 },
        { ...grip(0.8, 'sepia(1) saturate(3) brightness(1.1)'), opacity: 0.9, offset: 0.92 },
        { ...grip(0.75, 'sepia(1) saturate(4) brightness(1.3)'), opacity: 0 }
      ], { duration: CRUSH + 80, easing: 'ease-in-out' })
    ];
    const original = targetEl.style.transform;
    const tremble: Keyframe[] = [];
    for (let k = 0; k <= 12; k++) tremble.push({ transform: `${original} translateX(${k === 0 || k === 12 ? 0 : (k % 2 ? 2 : -2)}px)` });
    effects.push(Fx.anim(targetEl, tremble, { duration: CRUSH - GRAB, delay: GRAB, easing: 'linear', fill: 'none' }));
    effects.push(Fx.wait(CRUSH).then(() => {
      Fx.flash(targetEl, '#FFF6A0', 0.7);
      Fx.shake(targetEl, 6);
      const parts: Promise<void>[] = [Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(r.width * 0.9, 56), '#FFE04A', '#FFF6C0', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.15) rotate(15deg)', opacity: 0 }
      ], { duration: 420, easing: 'ease-out' })];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.4;
        const reach = Math.max(r.width * 0.8, 50);
        parts.push(Fx.spawn(fxEl, Fx.box(5, 5, `border-radius:${i % 2 ? '50%' : '20%'};background:${i % 3 ? '#2A2A2A' : '#7A5A2A'}`), target, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach - 12}px)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
