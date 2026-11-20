import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The gift lands on the target at `LAND` and bursts at `BURST` (ms). */
const LAND = 600;
const BURST = 750;

/**
 * Present, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/92/Geschenk_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1f/Geschenk_Gen5.png
 *
 * A white gift box tied with a red ribbon is tossed high over to the target
 * (0-0.6 s), bounces once on it (0.6-0.75 s) and bursts open in a white puff
 * with pink stars scattering all round (0.75 s, hit; stars to ~1.4 s).
 */
export class Present {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(tr.width * 0.4, 26);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.2, y: launch.y - lr.height * 0.2 };
    const dx = target.x - from.x;
    const dy = target.y - tr.height * 0.15 - from.y;
    const arc = -Math.max(Math.abs(dx) * 0.35, 60);

    const toss = Fx.spawn(fxEl, Present.gift(size), from, [
      { transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0 },
      { transform: `translate(${dx * 0.25}px,${dy * 0.25 + arc * 0.75}px) rotate(${v.dir * 60}deg) scale(.9)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) rotate(${v.dir * 140}deg) scale(1)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx * 0.8}px,${dy * 0.8 + arc * 0.6}px) rotate(${v.dir * 260}deg) scale(1)`, opacity: 1, offset: 0.62 },
      { transform: `translate(${dx}px,${dy}px) rotate(${v.dir * 360}deg) scale(1)`, opacity: 1, offset: LAND / BURST },
      { transform: `translate(${dx}px,${dy - 14}px) rotate(${v.dir * 360}deg) scale(1.05)`, opacity: 1, offset: (LAND + 80) / BURST },
      { transform: `translate(${dx}px,${dy}px) rotate(${v.dir * 360}deg) scale(1.15)`, opacity: 1 }
    ], { duration: BURST, easing: 'linear' });
    await toss;

    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    const at: Point = { x: target.x, y: target.y - tr.height * 0.15 };
    const effects: Promise<void>[] = [FxEffects.smokePuff(fxEl, at, size * 2.2)];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.3;
      const d = size * (1.2 + Math.random() * 0.8);
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.fivePointStar(12 + Math.random() * 6, '#FF9AC8', '#FFE0EE', '#FF8AB8'), at, [
          { transform: 'translate(0,0) rotate(0deg) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d * 0.7}px,${Math.sin(a) * d * 0.7}px) rotate(90deg) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 10}px) rotate(180deg) scale(.7)`, opacity: 0 }
        ], { duration: 650, easing: 'ease-out', delay: Math.random() * 60 })
      );
    }
    await Promise.all(effects);
  }

  /** A white gift box `size` px wide with a red ribbon and bow. */
  private static gift(size: number): HTMLElement {
    const el = Fx.box(size, size, 'border-radius:3px;border:1.5px solid #A8A8B0;box-sizing:border-box;filter:drop-shadow(0 2px 2px #0005);' +
      'background:linear-gradient(90deg,#0000 42%,#E0282A 42% 58%,#0000 58%),linear-gradient(0deg,#0000 42%,#E0282A 42% 58%,#0000 58%),#F8F8FA');
    const bow = Fx.box(size * 0.6, size * 0.3, `left:${size * 0.2 - 1.5}px;top:${-size * 0.26}px;border-radius:50% 50% 10% 10%;` +
      'background:radial-gradient(ellipse at 25% 60%,#E0282A 0 38%,#0000 40%),radial-gradient(ellipse at 75% 60%,#E0282A 0 38%,#0000 40%)');
    el.appendChild(bow);
    return el;
  }
}
