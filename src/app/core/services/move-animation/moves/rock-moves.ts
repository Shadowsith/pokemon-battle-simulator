import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Rock-type moves. */
export class RockMoveAnimations {
  /** Hand-made Rock move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    rockslide: (refs, _launch, target) => RockMoveAnimations.playRockSlide(refs, target)
  };

  /**
   * Rock Slide: a hail of stones falls from above onto the target. Each one
   * lands somewhere on the sprite, bounces off and fades, while the target
   * shakes under the hits and the ground shakes at the end.
   */
  private static async playRockSlide(refs: BattleStageRefs, target: Point) {
    const { fxEl, fieldEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const spreadX = Math.max(r.width * 0.5, 34);
    const spreadY = Math.max(r.height * 0.4, 28);
    const count = 26;
    const span = 1100;

    const stones: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const size = 14 + Math.random() * 14;
      const stone = FxGlyphs.rockChunk(size);
      const land: Point = {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (Math.random() * 2 - 1) * spreadY
      };
      Fx.place(stone, land);
      fxEl.appendChild(stone);
      const fall = 150 + land.y + r.height * 0.5;
      const drift = (Math.random() * 2 - 1) * 18;
      const bounceX = (Math.random() * 2 - 1) * 26;
      const spin = (Math.random() * 2 - 1) * 200;
      const delay = (i / count) * span + Math.random() * 60;
      stones.push(
        Fx.anim(stone, [
          { transform: `translate(${-drift}px,${-fall}px) rotate(0deg)`, opacity: 1, easing: 'ease-in' },
          { transform: 'translate(0,0) rotate(' + spin * 0.6 + 'deg)', opacity: 1, offset: 0.55, easing: 'ease-out' },
          { transform: `translate(${bounceX * 0.6}px,-14px) rotate(${spin * 0.8}deg)`, opacity: 1, offset: 0.75, easing: 'ease-in' },
          { transform: `translate(${bounceX}px,${spreadY * 0.6}px) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 620, delay }).then(() => stone.remove())
      );
    }

    // The target flinches under the hits.
    for (let t = 340; t < span + 340; t += 220) {
      setTimeout(() => {
        Fx.flash(targetEl, '#F2CF6B', 0.35);
        Fx.shake(targetEl, 4);
      }, t);
    }
    setTimeout(() => Fx.shakeField(fieldEl, 0.5), span);
    await Promise.all(stones);
  }
}
