import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Roost, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/8b/Ruheort_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/19/Ruheort_Gen5.png
 *
 * White-grey feathers burst out of the user and flutter down round it
 * (0-0.85 s). A white star shines on the user, which glows white
 * (0.75-1.1 s), then green heal sparkles twinkle round it (1.1-2.0 s).
 */
export class Roost {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const spread = Math.max(r.width * 0.7, 45);

    const parts: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const len = 16 + Math.random() * 8;
      const feather = FxGlyphs.featherGlyph(len);
      Fx.place(feather, { x: launch.x, y: launch.y - r.height * 0.1 });
      fxEl.appendChild(feather);
      const side = i % 2 ? 1 : -1;
      const x = side * spread * (0.4 + Math.random() * 0.6);
      const up = -r.height * (0.25 + Math.random() * 0.25);
      const fall = r.height * (0.35 + Math.random() * 0.2);
      const a = Math.random() * 360;
      // Burst up and out, then sway down like a leaf.
      parts.push(
        Fx.anim(feather, [
          { transform: `translate(0,0) rotate(${a}deg) scale(.4)`, opacity: 0 },
          { transform: `translate(${x * 0.7}px,${up}px) rotate(${a + 60 * side}deg) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${x}px,${up * 0.3}px) rotate(${a - 30 * side}deg) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${x * 0.8}px,${fall * 0.5}px) rotate(${a + 40 * side}deg) scale(1)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${x}px,${fall}px) rotate(${a - 20 * side}deg) scale(.9)`, opacity: 0 }
        ], { duration: 750, delay: i * 12, easing: 'ease-out' }).then(() => feather.remove())
      );
    }
    await Fx.wait(750);

    // A white star shines on the user.
    const star = FxGlyphs.sparkStar(Math.max(r.width * 0.45, 32), '#FFF8D0');
    Fx.place(star, { x: launch.x - r.width * 0.15, y: launch.y - r.height * 0.1 });
    fxEl.appendChild(star);
    parts.push(
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(25deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(50deg)', opacity: 0 }
      ], { duration: 350, easing: 'ease-out' }).then(() => star.remove()),
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(1.8) drop-shadow(0 0 6px #ffffff)', offset: 0.4 },
        { filter: 'none' }
      ], { duration: 350, easing: 'ease-out', fill: 'none' })
    );
    await Fx.wait(350);

    await Promise.all([...parts, FxEffects.healSparkles(refs, launch)]);
  }
}
