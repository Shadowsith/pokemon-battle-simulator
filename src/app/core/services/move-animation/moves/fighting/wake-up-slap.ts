import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Wake-Up Slap, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/42/Weckruf_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/88/Weckruf_Gen5.png
 *
 * A dark grey open hand swings in from the target's far side and slaps its
 * face (0.1-0.22 s, hit at 0.22 s), then from the near side (0.4-0.52 s,
 * hit at 0.52 s). Each slap knocks out a spray of pale blue stars (to ~1.0 s).
 */
export class WakeUpSlap {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const face: Point = { x: target.x, y: target.y - tr.height * 0.08 };
    const w = Math.max(tr.width * 0.6, 46);
    // The far side of the target first (away from the user), then the near side.
    const away: 1 | -1 = target.x >= launch.x ? 1 : -1;
    const parts: Promise<void>[] = [];
    await Fx.wait(100);
    for (const side of [away, -away as 1 | -1]) {
      await WakeUpSlap.slap(fxEl, face, w, side);
      Fx.flash(targetEl, '#ffffff', 0.7);
      Fx.shake(targetEl, 6);
      parts.push(WakeUpSlap.stars(fxEl, { x: face.x + side * tr.width * 0.1, y: face.y }, tr.width, -side as 1 | -1));
      await Fx.wait(180);
    }
    await Promise.all(parts);
  }

  /** The hand swings in from `side` (1 = right) to the face; resolves on contact and pulls back on its own. */
  private static async slap(fxEl: HTMLElement, face: Point, w: number, side: 1 | -1): Promise<void> {
    const hand = FxGlyphs.chopHandGlyph(w, '#3A3C44', '#C8CCD4');
    // The glyph points right: from the right it is mirrored to point left (an effect, not a sprite).
    const flip = side > 0 ? -1 : 1;
    const contact = side * w * 0.35;
    Fx.place(hand, face);
    fxEl.appendChild(hand);
    await Fx.anim(hand, [
      { transform: `translateX(${side * w * 1.1}px) scaleX(${flip}) rotate(${side * 18}deg)`, opacity: 0 },
      { transform: `translateX(${side * w * 0.9}px) scaleX(${flip}) rotate(${side * 14}deg)`, opacity: 1, offset: 0.3 },
      { transform: `translateX(${contact}px) scaleX(${flip}) rotate(0deg)`, opacity: 1 }
    ], { duration: 120, easing: 'ease-in' });
    Fx.anim(hand, [
      { transform: `translateX(${contact}px) scaleX(${flip})`, opacity: 1 },
      { transform: `translateX(${contact - side * 10}px) scaleX(${flip})`, opacity: 0 }
    ], { duration: 160, easing: 'ease-out' }).then(() => hand.remove());
  }

  /** Pale blue stars spray off `at`, mostly toward `dir` (the way the slap pushes). */
  private static stars(fxEl: HTMLElement, at: Point, width: number, dir: 1 | -1): Promise<void> {
    const parts: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const star = FxGlyphs.sparkStar(9 + Math.random() * 7, i % 2 ? '#ffffff' : '#8FD0FF');
      Fx.place(star, at);
      fxEl.appendChild(star);
      const ang = (Math.random() * 2 - 1) * Math.PI * 0.55 + (dir > 0 ? 0 : Math.PI);
      const d = Math.max(width, 60) * (0.4 + Math.random() * 0.35);
      parts.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.5}px) scale(1) rotate(45deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6 + 12}px) scale(.5) rotate(90deg)`, opacity: 0 }
        ], { duration: 480, delay: Math.random() * 50, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    return Promise.all(parts).then(() => undefined);
  }
}
