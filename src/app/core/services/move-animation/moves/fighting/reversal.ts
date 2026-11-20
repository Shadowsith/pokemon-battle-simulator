import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Sparks gather into the user until `CHARGED`; the orb is flung and hits at `HIT` (ms). */
const CHARGED = 600;
const HIT = 850;

/**
 * Reversal, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/18/Gegenschlag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/df/Gegenschlag_Gen5.png
 *
 * Blue-white sparks streak in to the user from all sides (0-0.6 s) and gather
 * into a glowing blue orb in front of it (0.3-0.65 s). The orb shoots at the
 * target (0.65-0.85 s, hit at 0.85 s) and bursts into a blue-white flash with
 * scattering sparks; the target shakes (to ~1.2 s).
 */
export class Reversal {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const core: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y };
    const reach = Math.max(lr.width, lr.height, 50) * 0.8;

    const effects: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const start = { x: Math.cos(a) * reach, y: Math.sin(a) * reach * 0.7 };
      effects.push(
        Fx.spawn(fxEl, Fx.box(6, 6, 'border-radius:50%;background:#ffffff;box-shadow:0 0 6px #5AA8FF,0 0 10px #3A7AF0'), core, [
          { transform: `translate(${start.x}px,${start.y}px)`, opacity: 0 },
          { transform: `translate(${start.x * 0.6}px,${start.y * 0.6}px)`, opacity: 1, offset: 0.3 },
          { transform: 'translate(0,0)', opacity: 0.6 }
        ], { duration: 350, easing: 'ease-in', delay: i * 25 })
      );
    }
    const s = Math.max(lr.width * 0.45, 28);
    const orb = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 25%,#9AD0FF 45%,#3A7AF0aa 70%,#3A7AF000);box-shadow:0 0 14px #5AA8FF');
    const dx = target.x - core.x;
    const dy = target.y - core.y;
    const total = HIT + 50;
    effects.push(
      Fx.spawn(fxEl, orb, core, [
        { transform: 'translate(0,0) scale(0)', opacity: 0 },
        { transform: 'translate(0,0) scale(.4)', opacity: 1, offset: 300 / total },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: CHARGED / total },
        { transform: 'translate(0,0) scale(1.1)', opacity: 1, offset: 650 / total, easing: 'ease-in' },
        { transform: `translate(${dx}px,${dy}px) scale(1)`, opacity: 1, offset: HIT / total },
        { transform: `translate(${dx}px,${dy}px) scale(1.6)`, opacity: 0 }
      ], { duration: total, easing: 'linear' })
    );
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#8AC0FF', 0.6);
    Fx.shake(targetEl, 5);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.55, 34), '#5AA8FF', '#D8ECFF', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 280, easing: 'ease-out' })
    );
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 25 + Math.random() * 25;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#9AD0FF'), target, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(0)`, opacity: 0 }
        ], { duration: 350, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
