import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Tackle, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1b/Tackle_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/5c/Tackle_Gen5.png
 *
 * The user charges into the target (0-0.26 s; hit at 0.12 s). A soft yellow
 * glow swells on the target (0.12-0.45 s) and glowing yellow-orange specks
 * float up off it and fade (0.12-0.9 s).
 */
export class Tackle {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const dart = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);

    Fx.shake(targetEl, 4);
    const size = Math.max(r.width * 0.6, 42);
    const at: Point = { x: target.x - v.dir * r.width * 0.1, y: target.y };
    const effects: Promise<unknown>[] = [
      dart,
      Fx.glow(targetEl, 'sepia(.6) saturate(3) brightness(1.25) hue-rotate(-10deg)', 330),
      Fx.spawn(fxEl, Fx.box(size, size, 'border-radius:50%;background:radial-gradient(circle,#FFFDE0,#FFE04Acc 35%,#F8B82000 70%)'), at, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 330, easing: 'ease-out' })
    ];
    for (let i = 0; i < 9; i++) {
      const x = (Math.random() * 2 - 1) * size * 0.7;
      const up = 24 + Math.random() * 30;
      const s = 4 + Math.random() * 4;
      effects.push(
        Fx.spawn(fxEl, Fx.box(s, s, `border-radius:50%;background:${i % 3 ? '#FFB040' : '#FFE04A'};box-shadow:0 0 5px #FF9A20`), { x: at.x + x * 0.4, y: at.y + (Math.random() * 2 - 1) * 10 }, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${x * 0.6}px,${-up * 0.5}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${x}px,${-up}px) scale(.6)`, opacity: 0 }
        ], { duration: 600 + Math.random() * 180, delay: Math.random() * 60, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
