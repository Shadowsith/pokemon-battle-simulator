import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many notes float over to the target. */
const NOTES = 6;
/** The scene is green until `TUNE` (ms); then the target falls asleep, done at `TOTAL`. */
const TUNE = 1100;
const TOTAL = 1900;

/**
 * Grass Whistle, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/d2/Grasfl%C3%B6te_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/55/Grasfl%C3%B6te_Gen5.png
 *
 * The scene turns a soft green (0-0.2 s) and green music notes waft from
 * the user over to the target in a wavy line (0.1-1.0 s); the green fades
 * (1.0-1.25 s) and the target falls asleep - two lilac "Z"s rise from its
 * head (1.1-1.9 s).
 */
export class GrassWhistle {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const at = (ms: number) => ms / TOTAL;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;

    const green = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#7AD86A,#3A9A3A 60%,#1E6A28);opacity:0');
    const effects: Promise<void>[] = [
      Fx.anim(green, [
        { opacity: 0 },
        { opacity: 0.8, offset: at(200) },
        { opacity: 0.8, offset: at(1000) },
        { opacity: 0, offset: at(1250) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' })
    ];
    for (let i = 0; i < NOTES; i++) {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        frames.push({
          transform: `translate(${dx * u}px,${dy * u - Math.sin(u * Math.PI * 2 + i) * 14 - Math.sin(u * Math.PI) * 30}px) rotate(${Math.sin(u * 6 + i) * 15}deg)`,
          opacity: k === 0 || k === 6 ? 0 : 1
        });
      }
      effects.push(Fx.spawn(fxEl, FxGlyphs.musicNote(18, i % 2 ? '#5AE85A' : '#B8F87A', i % 3 ? '♪' : '♫'), launch, frames,
        { duration: 600, easing: 'linear', delay: 100 + i * 60 }));
    }
    const head: Point = { x: target.x, y: target.y - r.height * 0.4 };
    for (let i = 0; i < 2; i++) {
      effects.push(Fx.spawn(fxEl, FxGlyphs.sleepZ(16 + i * 6, i ? '#F0A8E8' : '#B898F0'), head, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: 'translate(8px,-16px) scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'translate(20px,-40px) scale(1.15)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out', delay: TUNE + i * 250 }));
    }
    await Promise.all(effects);
    green.remove();
  }
}
