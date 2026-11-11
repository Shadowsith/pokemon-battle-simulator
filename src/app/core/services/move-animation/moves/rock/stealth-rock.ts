import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Stealth Rock, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/b0/Tarnsteine_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/19/Tarnsteine_Gen5.png
 *
 * Five pointed stones are tossed one after another in high arcs from the user
 * onto the foe's side (0-1.05 s, landings 0.45-1.05 s), each with a small
 * dust puff. They rise to float round the target (1.05-1.45 s), glint and
 * fade (1.45-1.75 s).
 */
export class StealthRock {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const spread = Math.max(tr.width * 0.75, 50);
    const arc = Math.max(fieldEl.clientHeight * 0.3, 70);

    const parts: Promise<void>[] = [];
    const spots = [-1, 0.5, -0.4, 1, 0];
    for (let i = 0; i < spots.length; i++) {
      const w = 13 + Math.random() * 6;
      const rock = FxGlyphs.pointedRock(w);
      Fx.place(rock, launch);
      fxEl.appendChild(rock);
      const land: Point = { x: target.x + spots[i] * spread, y: foot.y - w * 0.5 + (i % 2 ? -8 : 6) };
      const hover = -tr.height * (0.25 + Math.random() * 0.35);
      const dx = land.x - launch.x;
      const dy = land.y - launch.y;
      // Every stone ends at 1.75 s: flight 0.45 s from its throw, rest until 1.05 s, rise to 1.45 s, fade.
      const start = i * 150;
      const dur = 1750 - start;
      const at = (ms: number) => (ms - start) / dur;
      // A parabola: x moves evenly, y follows dy·t minus a hump of `arc`.
      const flight: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        flight.push({ transform: `translate(${dx * t}px,${dy * t - arc * 4 * t * (1 - t)}px) rotate(${t * 360}deg)`, opacity: 1, offset: (t * 450) / dur });
      }
      parts.push(
        Fx.anim(rock, [
          ...flight,
          { transform: `translate(${dx}px,${dy}px) rotate(360deg)`, opacity: 1, offset: at(1050) },
          { transform: `translate(${dx}px,${dy + hover}px) rotate(360deg)`, opacity: 1, offset: at(1450) },
          { transform: `translate(${dx}px,${dy + hover - 4}px) rotate(360deg)`, opacity: 0 }
        ], { duration: dur, delay: start, easing: 'linear', fill: 'backwards' }).then(() => rock.remove())
      );
      setTimeout(() => {
        parts.push(FxEffects.smokePuff(fxEl, { x: land.x, y: land.y + w * 0.5 }, 28, ['#D8C8A0', '#B0A070']));
      }, i * 150 + 450);
    }

    // The stones glint as they hover, then fade.
    await Fx.wait(1450);
    for (let i = 0; i < 4; i++) {
      const star = FxGlyphs.sparkStar(12, '#ffffff');
      Fx.place(star, { x: target.x + (Math.random() * 2 - 1) * spread, y: foot.y - tr.height * (0.3 + Math.random() * 0.4) });
      fxEl.appendChild(star);
      parts.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(60deg)', opacity: 0 }
        ], { duration: 260, delay: i * 50, easing: 'ease-out', fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all(parts);
  }
}
