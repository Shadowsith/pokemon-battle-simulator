import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Work Up, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/d/de/Kraftschub_Gen5.png
 *
 * The user hunches down twice, gathering strength (0-0.5 s), then flares
 * orange in a puff of reddish haze (0.5-1.1 s) and orange sparks burst out
 * all round it (0.9-1.6 s).
 */
export class WorkUp {
  private static readonly HAZE: [string, string] = ['#FF9A6A', '#E0603A'];

  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const original = launchEl.style.transform;

    for (let i = 0; i < 2; i++) {
      await Fx.anim(launchEl, [
        { transform: `${original} scale(1,1)`, transformOrigin: 'center bottom' },
        { transform: `${original} scale(1.06,.88)`, transformOrigin: 'center bottom', offset: 0.5 },
        { transform: `${original} scale(1,1)`, transformOrigin: 'center bottom' }
      ], { duration: 250, easing: 'ease-in-out', fill: 'none' });
    }

    // Orange flare with reddish haze.
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(3) hue-rotate(-20deg) brightness(1.15) drop-shadow(0 0 8px #FF8A3A)', offset: 0.3 },
        { filter: 'sepia(1) saturate(3) hue-rotate(-20deg) brightness(1.15) drop-shadow(0 0 8px #FF8A3A)', offset: 0.6 },
        { filter: 'none' }
      ], { duration: 650, fill: 'none' }),
      FxEffects.smokePuff(fxEl, { x: launch.x, y: launch.y - lr.height * 0.1 }, Math.max(lr.width * 1.1, 60), WorkUp.HAZE)
    ];
    await Fx.wait(400);

    // Orange sparks burst outward.
    const reach = Math.max(lr.width, 60);
    for (let i = 0; i < 14; i++) {
      const s = 6 + Math.random() * 6;
      const dot = document.createElement('div');
      dot.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF3C4,#FFA62B 55%,#FF7A0000);box-shadow:0 0 6px #FFA62B`;
      Fx.place(dot, launch);
      fxEl.appendChild(dot);
      const ang = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const d = reach * (0.45 + Math.random() * 0.3);
      effects.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.6}px) scale(1.1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + 8}px) scale(.4)`, opacity: 0 }
        ], { duration: 650, delay: Math.random() * 120, easing: 'ease-out', fill: 'backwards' }).then(() => dot.remove())
      );
    }
    await Promise.all(effects);
  }
}
