import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Switcheroo, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/84/Wechseldich_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/d9/Wechseldich_Gen5.png
 *
 * The scene darkens (0-0.3 s). A cream item bag pops up in front of each
 * Pokémon (0.3-0.45 s), then the two swap places in one crossing pass, the
 * user's bag arcing high, the target's low (0.45-1.05 s). They hold
 * (to 1.2 s) and fade (to 1.45 s); the scene clears (to 1.75 s).
 */
export class Switcheroo {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const size = Math.max(Math.min(lr.width, tr.width) * 0.28, 20);

    const dark = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#2C2C32,#16161A 60%,#0C0C10)');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 300, easing: 'ease-out' });

    // One bag in front of each Pokémon, a little below its centre.
    const mine: Point = { x: launch.x + v.dir * lr.width * 0.45, y: launch.y + lr.height * 0.1 };
    const theirs: Point = { x: target.x - v.dir * tr.width * 0.45, y: target.y + tr.height * 0.1 };
    const arc = Math.max(Math.abs(theirs.x - mine.x) * 0.25, 40);
    const swaps = [
      { from: mine, to: theirs, hump: arc },
      { from: theirs, to: mine, hump: -arc * 0.4 }
    ].map(async ({ from, to, hump }) => {
      const bag = FxGlyphs.itemBag(size);
      Fx.place(bag, from);
      fxEl.appendChild(bag);
      await Fx.anim(bag, [{ transform: 'scale(0)' }, { transform: 'scale(1.15)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 150, easing: 'ease-out' });
      // Eased along the line, with a parabolic hump (up for the user's bag, down for the target's).
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 12; k++) {
        const e = (k / 12) * (k / 12) * (3 - (2 * k) / 12);
        frames.push({ transform: `translate(${(to.x - from.x) * e}px,${(to.y - from.y) * e - hump * 4 * e * (1 - e)}px)` });
      }
      await Fx.anim(bag, frames, { duration: 600, easing: 'linear' });
      await Fx.wait(150);
      await Fx.anim(bag, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
      bag.remove();
    });
    await Promise.all(swaps);

    await Fx.anim(dark, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dark.remove();
  }
}
