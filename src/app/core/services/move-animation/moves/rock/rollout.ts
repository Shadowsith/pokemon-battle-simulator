import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** The boulder rolls from the user until it smashes into the target at `HIT` (ms). */
const HIT = 550;

/**
 * Rollout, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/12/Walzer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/60/Walzer_Gen5.png
 *
 * A round brown boulder rolls out from the user along the ground to the
 * target, spinning, with dust puffing up behind it (0-0.55 s). It smashes
 * into the target (hit at 0.55 s) and breaks into chunks that fly up and fall
 * while the target shakes (0.55-1.15 s).
 */
export class Rollout {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(Math.min(lr.width, tr.width) * 0.55, 30);
    const from = Fx.footOf(launchEl, fieldEl);
    from.y -= size / 2;
    from.x += v.dir * lr.width * 0.3;
    const to: Point = { x: target.x - v.dir * tr.width * 0.15, y: target.y + tr.height * 0.1 };
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    const boulder = Fx.box(size, size,
      'border-radius:50%;background:radial-gradient(circle at 30% 70%,#5E3F12 0 8%,#0000 10%),radial-gradient(circle at 65% 35%,#5E3F12 0 7%,#0000 9%),' +
      'radial-gradient(circle at 35% 30%,#D8B070,#9A7034 55%,#5A3E18);box-shadow:inset -3px -4px 5px #0006');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, boulder, from, [
        { transform: 'translate(0,0) rotate(0deg) scale(.7)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) rotate(${v.dir * 60}deg) scale(.8)`, opacity: 1, offset: 0.1 },
        { transform: `translate(${dx}px,${dy}px) rotate(${v.dir * 720}deg) scale(1)`, opacity: 1 }
      ], { duration: HIT, easing: 'ease-in' })
    ];
    for (let i = 0; i < 5; i++) {
      const u = 0.15 + i * 0.17;
      const p: Point = { x: from.x + dx * u, y: from.y + dy * u + size * 0.4 };
      effects.push(Fx.wait(HIT * u * u).then(() => FxEffects.smokePuff(fxEl, p, size * 0.8, ['#E0CCA8', '#B8A078'])));
    }
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#F0D8A0', 0.5);
    Fx.shake(targetEl, 6);
    for (let i = 0; i < 7; i++) {
      const s = size * (0.25 + Math.random() * 0.2);
      const chunk = Fx.box(s, s * 0.9, 'border-radius:40% 55% 45% 50%;background:radial-gradient(circle at 35% 35%,#D8B070,#9A7034 55%,#5A3E18)');
      const side = (Math.random() * 2 - 1) * tr.width * 0.7;
      const up = -(tr.height * (0.4 + Math.random() * 0.4));
      effects.push(
        Fx.spawn(fxEl, chunk, to, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1, easing: 'ease-out' },
          { transform: `translate(${side * 0.6}px,${up}px) rotate(${side * 3}deg)`, opacity: 1, offset: 0.45, easing: 'ease-in' },
          { transform: `translate(${side}px,${tr.height * 0.3}px) rotate(${side * 6}deg)`, opacity: 0 }
        ], { duration: 600, easing: 'linear', delay: Math.random() * 40 })
      );
    }
    await Promise.all(effects);
  }
}
