import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Blue orbs drop into the user from `DROP` (ms); it heals from `HEAL` (ms). */
const DROP = 300;
const HEAL = 850;

/**
 * Swallow, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/17/Verzehrer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/89/Verzehrer_Gen5.png
 *
 * The user stretches up and gulps (0-0.45 s) while glowing blue orbs drop
 * down into it from above one after another (0.3-0.8 s), lighting it up
 * pale blue. Then it heals: green stars twinkle round it as it flashes
 * green (0.85-1.75 s).
 */
export class Swallow {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const original = launchEl.style.transform;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { transform: `${original} scale(1)` },
        { transform: `${original} scale(.94,1.1)`, offset: 0.4 },
        { transform: `${original} scale(1.06,.9)`, offset: 0.75 },
        { transform: `${original} scale(1)` }
      ], { duration: 450, easing: 'ease-in-out', fill: 'none' }),
      Fx.glow(launchEl, 'brightness(1.2) drop-shadow(0 0 6px #6AB8FF)', 500, DROP + 100)
    ];
    for (let i = 0; i < 5; i++) {
      const s = 12 + (i % 2) * 5;
      const x = launch.x + ((i % 3) - 1) * r.width * 0.2;
      const fall = r.height * 0.9;
      const orb = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff,#6AB8FF 45%,#2A70E000 72%);filter:drop-shadow(0 0 4px #4A90FF)');
      effects.push(Fx.spawn(fxEl, orb, { x, y: launch.y - fall }, [
        { transform: 'translateY(0) scale(.6)', opacity: 0 },
        { transform: `translateY(${fall * 0.3}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translateY(${fall}px) scale(.5)`, opacity: 0 }
      ], { duration: 380, delay: DROP + i * 30, easing: 'ease-in' }));
    }
    await Promise.all(effects);
    await Fx.wait(Math.max(HEAL - DROP - 4 * 30 - 380, 0));
    await FxEffects.healSparkles(refs, launch);
  }
}
