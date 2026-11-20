import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Flight time of one snow sparkle and the gap between them, ms. */
const FLIGHT = 450;
const STEP = 35;
const FLAKES = 16;
const TOTAL = 1350;

/**
 * Powder Snow, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1a/Pulverschnee_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/00/Pulverschnee_Gen5.png
 *
 * The scene darkens (0-0.2 s) and fine white snow sparkles drift from the
 * user over to the target in a loose stream (0.1-1.0 s, the first arrives at
 * 0.55 s). Little pale blue snowflakes whirl round the target as it is hit
 * and it flickers icy blue (0.55-1.1 s); the scene clears (to ~1.35 s).
 */
export class PowderSnow {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const at = (ms: number) => ms / TOTAL;

    const dim = Fx.backdrop(fieldEl, `${DIM_BACKDROP};opacity:0`);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.9, offset: at(200) },
        { opacity: 0.9, offset: at(1100) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' })
    ];
    for (let i = 0; i < FLAKES; i++) {
      const wobble = (Math.random() * 2 - 1) * 24;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(7 + Math.random() * 6, '#ffffff'), from, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${dx * 0.35}px,${dy * 0.35 + wobble}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${dx * 0.7}px,${dy * 0.7 - wobble * 0.5}px) scale(.9)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${dx + (Math.random() * 2 - 1) * tr.width * 0.3}px,${dy + (Math.random() * 2 - 1) * tr.height * 0.3}px) scale(.6)`, opacity: 0 }
        ], { duration: FLIGHT, easing: 'linear', delay: 100 + i * STEP })
      );
    }
    const hit = 100 + FLIGHT;
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const flake = FxGlyphs.musicNote(14, '#CFE8FF', '❄');
      flake.style.textShadow = '0 0 4px #7FB8FF';
      const p: Point = { x: target.x + Math.cos(a) * tr.width * 0.35, y: target.y + Math.sin(a) * tr.height * 0.3 };
      effects.push(
        Fx.spawn(fxEl, flake, p, [
          { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 0 },
          { transform: `translate(${-Math.sin(a) * 10}px,${Math.cos(a) * 8}px) rotate(90deg) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${-Math.sin(a) * 18}px,${Math.cos(a) * 14 + 8}px) rotate(180deg) scale(.7)`, opacity: 0 }
        ], { duration: 500, easing: 'ease-out', delay: hit + i * 40 })
      );
    }
    effects.push(Fx.glow(targetEl, 'grayscale(.5) brightness(1.3) sepia(1) saturate(3) hue-rotate(170deg)', 500, hit));
    setTimeout(() => Fx.shake(targetEl, 3), hit);
    await Promise.all(effects);
    dim.remove();
  }
}
