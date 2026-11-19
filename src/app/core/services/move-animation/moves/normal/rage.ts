import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Rage, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/73/Raserei_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/eb/Raserei_Gen5.png
 *
 * The user flushes red and shakes with fury while an anger mark throbs above
 * it (0-0.5 s), then darts at the target (0.5-0.76 s; hit at 0.62 s): a
 * white-yellow burst flares and orange specks float up off the target
 * (to ~1.15 s).
 */
export class Rage {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const base = launchEl.style.transform;
    const shake: Keyframe[] = [];
    for (let k = 0; k <= 10; k++) shake.push({ transform: `${base} translateX(${k === 0 || k === 10 ? 0 : k % 2 ? 3 : -3}px)` });
    const mark = Math.max(lr.width * 0.28, 20);
    await Promise.all([
      Fx.glow(launchEl, 'sepia(1) saturate(6) hue-rotate(-35deg) brightness(.95)', 700),
      Fx.anim(launchEl, shake, { duration: 450, easing: 'linear', fill: 'none' }),
      Fx.spawn(fxEl, FxGlyphs.angerMark(mark), { x: launch.x + v.dir * lr.width * 0.25, y: launch.y - lr.height * 0.45 }, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.25 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.75 },
        { transform: 'scale(1)', opacity: 0 }
      ], { duration: 500, easing: 'ease-in-out' })
    ]);

    const dart = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);
    Fx.flash(targetEl, '#FFF2A0', 0.55);
    Fx.shake(targetEl, 5);
    const size = Math.max(tr.width * 0.55, 38);
    const effects: Promise<void>[] = [
      dart,
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(size, '#F8E060', '#FFFFFF', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' })
    ];
    for (let i = 0; i < 8; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.45, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3 };
      effects.push(
        Fx.spawn(fxEl, Fx.box(6, 6, 'border-radius:50%;background:radial-gradient(circle,#FFF0B0,#FFA030 60%);box-shadow:0 0 5px #FF9020'), at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,-8px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.random() * 10 - 5}px,-30px) scale(.6)`, opacity: 0 }
        ], { duration: 450, delay: 40 + i * 20, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
