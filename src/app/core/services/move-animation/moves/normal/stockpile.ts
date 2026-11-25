import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Orbs gather into the user until `GULP` (ms); it then glows orange until `GLOW_END` (ms). */
const GULP = 650;
const GLOW_END = 1200;
const ORBS = 10;

/**
 * Stockpile, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/17/Horter_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/9/9b/Horter_Gen5.png
 *
 * Glowing orange and yellow orbs gather in from all round the user and sink
 * into it (0-0.65 s). The user flashes white and puffs up (0.65-0.85 s),
 * then glows orange with a zigzag sheen (0.75-1.2 s). Its Defense and
 * Sp. Def rise: orange stat-up bands scroll over it (1.2-2.0 s).
 */
export class Stockpile {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const d = Math.max(r.width, 50) * 0.85;
    const original = launchEl.style.transform;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < ORBS; i++) {
      const a = (Math.PI * 2 * i) / ORBS + (i % 2) * 0.25;
      const tone = i % 3 ? '#FFB03A' : '#FFE860';
      const s = 13 + (i % 3) * 4;
      const orb = Fx.box(s, s, `border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff,${tone} 45%,${tone}00 72%);filter:drop-shadow(0 0 4px ${tone})`);
      const ox = Math.cos(a) * d;
      const oy = Math.sin(a) * d * 0.75;
      effects.push(Fx.spawn(fxEl, orb, { x: launch.x + ox, y: launch.y + oy }, [
        { transform: 'translate(0,0) scale(.3)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.3 },
        { transform: `translate(${-ox}px,${-oy}px) scale(.4)`, opacity: 0.6 }
      ], { duration: 420, delay: (i * 47) % 230, easing: 'ease-in' }));
    }
    effects.push(Fx.wait(GULP).then(() => {
      Fx.flash(launchEl, '#FFFFFF', 0.7);
      return Fx.anim(launchEl, [
        { transform: `${original} scale(1)` },
        { transform: `${original} scale(1.1)`, offset: 0.5 },
        { transform: `${original} scale(1)` }
      ], { duration: 200, easing: 'ease-out', fill: 'none' });
    }));
    effects.push(Fx.glow(launchEl, 'sepia(1) saturate(4) hue-rotate(-15deg) brightness(1.15) drop-shadow(0 0 6px #FF9A2A)', GLOW_END - GULP - 100, GULP + 100));
    await Promise.all(effects);
    await FxEffects.statUpAura(refs, launch);
  }
}
