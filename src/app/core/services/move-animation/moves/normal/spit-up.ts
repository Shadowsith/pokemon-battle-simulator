import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The user swells until `SPIT` (ms), then spits one orb every `GAP` ms, each reaching the target `FLIGHT` ms later. */
const SPIT = 350;
const ORBS = 6;
const GAP = 60;
const FLIGHT = 300;
const TONES = ['#FF8A3A', '#FFD040', '#B8E050', '#FFB03A', '#F0E060', '#FF9A50'];

/**
 * Spit Up, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/2b/Entfessler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/46/Entfessler_Gen5.png
 *
 * The user swells up with what it stockpiled (0-0.35 s), then spits it out:
 * six glowing orange, yellow and green orbs fly at the target in a quick
 * stream (0.35-0.95 s), each bursting on it in a white-yellow pop (first
 * at 0.65 s); the target shakes, and yellow stars flash round it as the
 * last one hits (0.95-1.25 s).
 */
export class SpitUp {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { transform: `${original} scale(1)` },
        { transform: `${original} scale(1.12,1.08)`, offset: 0.7 },
        { transform: `${original} scale(.94,1.04)`, offset: 0.85 },
        { transform: `${original} scale(1)` }
      ], { duration: SPIT + 150, easing: 'ease-in-out', fill: 'none' })
    ];
    const from: Point = { x: launch.x + v.dir * 10, y: launch.y - 6 };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    for (let i = 0; i < ORBS; i++) {
      const t0 = SPIT + i * GAP;
      const s = 16 + (i % 2) * 5;
      const tone = TONES[i];
      const end: Point = { x: dx + ((i % 3) - 1) * tr.width * 0.12, y: dy + ((i % 2) ? 1 : -1) * tr.height * 0.1 };
      const orb = Fx.box(s, s, `border-radius:50%;background:radial-gradient(circle at 40% 35%,#ffffff,${tone} 45%,${tone}00 72%);filter:drop-shadow(0 0 4px ${tone})`);
      effects.push(Fx.spawn(fxEl, orb, from, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${end.x * 0.5}px,${end.y * 0.5 - 14}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${end.x}px,${end.y}px) scale(1.1)`, opacity: 1 }
      ], { duration: FLIGHT, delay: t0, easing: 'linear' }));
      effects.push(Fx.wait(t0 + FLIGHT).then(() => {
        Fx.shake(targetEl, 3);
        return Fx.spawn(fxEl, Fx.box(s * 1.8, s * 1.8, 'border-radius:50%;background:radial-gradient(circle,#ffffff,#FFF6A0 40%,#FFE04A00 70%)'), { x: from.x + end.x, y: from.y + end.y }, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1.2)', opacity: 0 }
        ], { duration: 220, easing: 'ease-out' });
      }));
    }
    const last = SPIT + (ORBS - 1) * GAP + FLIGHT;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.9;
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(13, '#FFE04A'), { x: target.x + Math.cos(a) * tr.width * 0.4, y: target.y + Math.sin(a) * tr.height * 0.35 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 300, delay: last + i * 30, easing: 'ease-out' }));
    }
    await Promise.all(effects);
  }
}
