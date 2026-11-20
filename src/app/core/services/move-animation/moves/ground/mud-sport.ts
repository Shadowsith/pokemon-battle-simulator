import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** How many mud blobs the user flings up. */
const BLOBS = 12;
/** The blobs fly up until `PEAK` (ms) and land at `LAND` (ms) (the last ones a little later). */
const PEAK = 450;
const LAND = 950;

/**
 * Mud Sport, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/9e/Lehmsuhler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/60/Lehmsuhler_Gen5.png
 *
 * The user wallows and flings blobs of brown and olive mud high up into the
 * air in a fountain (0-0.45 s, the user rocking from side to side). They
 * rain back down all round the user and splat on the ground in little
 * brown dust puffs (landings 0.95-1.1 s, puffs gone at ~1.65 s).
 */
export class MudSport {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const w = Math.max(r.width, 50);
    const base = launchEl.style.transform;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { transform: `${base} translateX(0)` },
        { transform: `${base} translateX(-4px)`, offset: 0.25 },
        { transform: `${base} translateX(4px)`, offset: 0.5 },
        { transform: `${base} translateX(-3px)`, offset: 0.75 },
        { transform: `${base} translateX(0)` }
      ], { duration: PEAK, easing: 'ease-in-out', fill: 'none' })
    ];
    for (let i = 0; i < BLOBS; i++) {
      const u = i / (BLOBS - 1);
      const size = 10 + (i % 4) * 4;
      const tone = i % 3 === 0 ? '#7A7A2A' : '#6A4A1E';
      const blob = Fx.box(size, size * 0.85, `border-radius:${40 + (i % 3) * 10}% ${60 - (i % 3) * 10}% 50% 45%;background:radial-gradient(circle at 35% 35%,#B08A50,${tone} 55%,#3A2408);box-shadow:0 1px 2px #00000055`);
      const peak: Point = { x: (u - 0.5) * w * 0.8, y: -r.height * (0.9 + (i % 3) * 0.25) };
      const land: Point = { x: (u - 0.5) * w * 1.8, y: foot.y - launch.y + ((i % 2) ? 4 : -4) };
      const delay = (i % 4) * 50;
      effects.push(Fx.spawn(fxEl, blob, { x: launch.x, y: launch.y + r.height * 0.2 }, [
        { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 0, easing: 'ease-out' },
        { transform: `translate(${peak.x}px,${peak.y}px) rotate(${i * 50}deg) scale(1)`, opacity: 1, offset: PEAK / LAND, easing: 'ease-in' },
        { transform: `translate(${land.x}px,${land.y - r.height * 0.2}px) rotate(${i * 50 + 120}deg) scale(1)`, opacity: 1 }
      ], { duration: LAND, delay, easing: 'linear' }).then(() =>
        FxEffects.smokePuff(fxEl, { x: launch.x + land.x, y: launch.y + land.y }, size * 1.6, ['#B8925A', '#7A5A2A'])));
    }
    await Promise.all(effects);
  }
}
