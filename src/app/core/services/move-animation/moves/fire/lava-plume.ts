import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Lava Plume, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/38/Flammensturm_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/b1/Flammensturm_Gen5.png
 *
 * Three waves of fireballs and dark red smoke erupt from the user and roll
 * out across the whole field while red embers scatter (0-1.0 s). The target
 * glows red and shakes as the first wave reaches it (hit at 0.6 s); the
 * smoke drifts and fades (to ~1.7 s).
 */
export class LavaPlume {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const reach = Math.max(W, H) * 0.65;
    // Fan the waves out round the line to the target, wide enough to cover the field.
    const aim = Math.atan2(target.y - launch.y, target.x - launch.x);

    const parts: Promise<void>[] = [];
    for (let wave = 0; wave < 3; wave++) {
      const start = wave * 280;
      for (let i = 0; i < 9; i++) {
        const ang = aim + (Math.random() * 2 - 1) * Math.PI * 0.75;
        const d = reach * (0.45 + Math.random() * 0.55);
        const end = `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6}px)`;
        const smoke = i % 3 === 0;
        const s = (smoke ? 46 : 30) + Math.random() * 22;
        const el = smoke ? LavaPlume.smokeCloud(s) : FxGlyphs.firePuff(s, Math.random() < 0.4 ? 'red' : 'hot');
        Fx.place(el, launch);
        fxEl.appendChild(el);
        parts.push(
          Fx.anim(el, [
            { transform: 'translate(0,0) scale(.3)', opacity: 0 },
            { transform: `${end} scale(1)`, opacity: 1, offset: 0.55 },
            { transform: `${end} translateY(-14px) scale(1.25)`, opacity: 0 }
          ], { duration: 800 + Math.random() * 200, delay: start + Math.random() * 120, easing: 'ease-out', fill: 'backwards' }).then(() => el.remove())
        );
      }
      for (let i = 0; i < 8; i++) {
        const ember = document.createElement('div');
        const s = 3 + Math.random() * 3;
        ember.style.cssText = `position:absolute;width:${s}px;height:${s}px;pointer-events:none;background:${Math.random() < 0.5 ? '#D0281C' : '#6A1A10'}`;
        const ang = aim + (Math.random() * 2 - 1) * Math.PI * 0.8;
        const d = reach * (0.3 + Math.random() * 0.6);
        Fx.place(ember, launch);
        fxEl.appendChild(ember);
        parts.push(
          Fx.anim(ember, [
            { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
            { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.4 - 20}px) rotate(180deg)`, opacity: 1, offset: 0.4 },
            { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6 + 10}px) rotate(360deg)`, opacity: 0 }
          ], { duration: 900, delay: start + Math.random() * 200, easing: 'ease-out', fill: 'backwards' }).then(() => ember.remove())
        );
      }
    }

    // The first wave reaches the target: it glows red and shakes.
    await Fx.wait(600);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    setTimeout(() => Fx.shake(targetEl, 4), 300);
    parts.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(8) hue-rotate(-35deg) brightness(.95)', offset: 0.2 },
        { filter: 'sepia(1) saturate(8) hue-rotate(-35deg) brightness(.95)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 800, fill: 'none' })
    );
    await Promise.all(parts);
  }

  /** A billowing dark red smoke cloud, `s` px wide. */
  private static smokeCloud(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${s}px;height:${s}px;pointer-events:none;border-radius:46% 54% 50% 50%/52% 48% 52% 48%;` +
      'background:radial-gradient(circle at 35% 35%,#E0302A 0 18%,#E0302A00 34%),radial-gradient(circle at 65% 60%,#B01A14 0 16%,#B01A1400 32%),' +
      'radial-gradient(circle,#5A1410,#2A0A08 60%,#2A0A0800 72%)';
    return el;
  }
}
