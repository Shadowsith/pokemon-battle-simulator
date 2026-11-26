import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Snowballs start falling at `FALL` (ms); each takes `DROP` ms; the last lands by about 1.35 s. */
const FALL = 200;
const DROP = 380;
const COUNT = 18;

/**
 * Avalanche, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f4/Lawine_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0c/Lawine_Gen5.png
 *
 * The scene turns a pale lavender white (0-0.3 s). Grey-blue snowballs rain
 * down onto the target (0.2-1.35 s), each bursting into a pinkish snow puff
 * where it lands; the target shakes three times and the field once. The
 * snow settles and the scene clears (1.35-1.7 s).
 */
export class Avalanche {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const pale = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#EEEAF8,#D6CFE8 60%,#C4BCDA)');
    const effects: Promise<void>[] = [Fx.anim(pale, [{ opacity: 0 }, { opacity: 0.92 }], { duration: 300, easing: 'ease-out' })];
    const spread = Math.max(r.width * 0.55, 36);
    for (let i = 0; i < COUNT; i++) {
      const s = 10 + ((i * 7) % 4) * 4;
      const land: Point = {
        x: target.x + (((i * 5) % 7) / 6 - 0.5) * spread * 2,
        y: target.y + (((i * 3) % 5) / 4 - 0.4) * r.height * 0.6
      };
      const fall = r.height * 1.6 + land.y * 0.4;
      const ball = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#A8B0CC 45%,#4A5070);box-shadow:0 0 3px #00000044');
      const delay = FALL + (i * 61) % (1150 - DROP);
      effects.push(Fx.spawn(fxEl, ball, land, [
        { transform: `translate(${(i % 2 ? 1 : -1) * 12}px,${-fall}px)`, opacity: 0 },
        { transform: `translate(${(i % 2 ? 1 : -1) * 9}px,${-fall * 0.75}px)`, opacity: 1, offset: 0.2 },
        { transform: 'translate(0,0)', opacity: 1 }
      ], { duration: DROP, delay, easing: 'ease-in' }).then(() => FxEffects.smokePuff(fxEl, land, s * 2.4, ['#F6EAF4', '#E2C8DE'])));
    }
    for (let k = 0; k < 3; k++) effects.push(Fx.wait(FALL + DROP + k * 300).then(() => Fx.shake(targetEl, 4)));
    effects.push(Fx.wait(1100).then(() => Fx.shakeField(fieldEl, 0.6)));
    await Promise.all(effects);
    await Fx.anim(pale, [{ opacity: 0.92 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    pale.remove();
  }
}
