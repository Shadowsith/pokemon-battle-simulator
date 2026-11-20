import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the smash lands, ms from the start. */
const HIT = 150;

/**
 * Rock Smash, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/d6/Zertr%C3%BCmmerer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e8/Zertr%C3%BCmmerer_Gen5.png
 *
 * A yellow fist smashes into the target (0-0.15 s, hit at 0.15 s): a yellow
 * burst flares and olive rock fragments burst up and away from it, tumble and
 * fall (0.15-0.95 s); the target shakes.
 */
export class RockSmash {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);

    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, FxGlyphs.fistGlyph(Math.max(w * 0.45, 30), 'yellow'), target, [
        { transform: 'scale(1.8)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: HIT / 300 },
        { transform: 'scale(1.05)', opacity: 0 }
      ], { duration: 300, easing: 'ease-in' })
    ];
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#FFE84A', 0.6);
    Fx.shake(targetEl, 6);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(w * 0.6, 36), '#F8C820', '#FFEA5A', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 280, easing: 'ease-out' })
    );
    for (let i = 0; i < 10; i++) {
      const s = 8 + Math.random() * 8;
      const rock = Fx.box(s, s * 0.9, 'border-radius:40% 55% 45% 50%;background:radial-gradient(circle at 35% 35%,#A8A050,#6A6428 55%,#3E3A16)');
      const up = -(h * (0.5 + Math.random() * 0.6));
      const side = (Math.random() * 2 - 1) * w * 0.9;
      effects.push(
        Fx.spawn(fxEl, rock, target, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1, easing: 'ease-out' },
          { transform: `translate(${side * 0.6}px,${up}px) rotate(${side * 3}deg)`, opacity: 1, offset: 0.45, easing: 'ease-in' },
          { transform: `translate(${side}px,${h * 0.4}px) rotate(${side * 6}deg)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 150, easing: 'linear', delay: Math.random() * 40 })
      );
    }
    await Promise.all(effects);
  }
}
