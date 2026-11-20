import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The target jolts at `HIT` (ms); the sweat drops are gone at ~0.65 s. */
const HIT = 150;

/**
 * Astonish, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/67/Erstauner_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/58/Erstauner_Gen5.png
 *
 * The target jolts with fright (hit at 0.15 s): a yellow spiky "!" burst
 * pops above its head (0.15-0.55 s) and blue sweat drops spray up and off
 * it (0.15-0.65 s).
 */
export class Astonish {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const head: Point = { x: target.x, y: target.y - Math.max(r.height, 50) * 0.55 };
    const base = targetEl.style.transform;

    const burst = FxGlyphs.spikyBurst(Math.max(w * 0.45, 30), '#F8C820', '#FFEA5A', '#FFF6C0');
    const mark = Fx.box(0, 0, 'inset:0;width:auto;height:auto;display:flex;align-items:center;justify-content:center;font:900 20px/1 sans-serif;color:#E02020;text-shadow:0 0 2px #fff');
    mark.textContent = '!';
    burst.appendChild(mark);
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, burst, head, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: 400, easing: 'ease-out', delay: HIT }),
      Fx.anim(targetEl, [
        { transform: base },
        { transform: `${base} translateY(-10px)`, offset: 0.3 },
        { transform: `${base} translateY(2px)`, offset: 0.65 },
        { transform: base }
      ], { duration: 250, easing: 'ease-out', delay: HIT, fill: 'none' })
    ];
    for (let i = 0; i < 4; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * w * (0.3 + (i >> 1) * 0.15);
      const drop = Fx.box(8, 12, 'border-radius:50% 50% 50% 50% / 65% 65% 35% 35%;background:radial-gradient(circle at 40% 60%,#ffffff,#7AC8FF 50%,#2A7ADA);transform-origin:50% 100%');
      effects.push(Fx.spawn(fxEl, drop, { x: target.x, y: head.y + 10 }, [
        { transform: `translate(0,0) rotate(${side * 30}deg) scale(.5)`, opacity: 0 },
        { transform: `translate(${x * 0.6}px,-18px) rotate(${side * 30}deg) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${x}px,4px) rotate(${side * 50}deg) scale(1)`, opacity: 0 }
      ], { duration: 500, easing: 'ease-out', delay: HIT + (i >> 1) * 60 }));
    }
    setTimeout(() => Fx.flash(targetEl, '#ffffff', 0.5), HIT);
    await Promise.all(effects);
  }
}
