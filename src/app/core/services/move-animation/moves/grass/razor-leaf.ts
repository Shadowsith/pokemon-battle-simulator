import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Razor Leaf, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/d/d3/Rasierblatt_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/a/a1/Rasierblatt_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/8/80/Rasierblatt_Gen5.png
 *
 * Sharp leaves whirl up round the user while it glows green (0-0.55 s), then
 * shoot at the target one after another, spinning (0.55-1.0 s). They cut it
 * from 0.85 s (hit): white slashes and yellow sparks flash on the target
 * (to ~1.35 s).
 */
export class RazorLeaf {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const rx = Math.max(lr.width * 0.6, 36);
    const ry = Math.max(lr.height * 0.4, 26);
    const leaf = Math.max(lr.width * 0.22, 16);
    const count = 10;
    const effects: Promise<unknown>[] = [Fx.glow(launchEl, 'brightness(1.1) drop-shadow(0 0 8px #7AF060)', 650)];

    for (let i = 0; i < count; i++) {
      const phase = (Math.PI * 2 * i) / count;
      // Whirl: two-thirds of a lap round the user, rising as they go.
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const a = phase + t * Math.PI * 1.4;
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * ry * 0.6 - t * ry * 0.8}px) rotate(${t * 540 + i * 36}deg)`,
          opacity: k === 0 ? 0 : 1,
          offset: t * 0.55
        });
      }
      // Then a straight spinning shot from where the whirl left it to the target.
      const endA = phase + Math.PI * 1.4;
      const sx = Math.cos(endA) * rx;
      const sy = Math.sin(endA) * ry * 0.6 - ry * 0.8;
      const hx = target.x - launch.x + (Math.random() * 2 - 1) * tr.width * 0.25;
      const hy = target.y - launch.y + (Math.random() * 2 - 1) * tr.height * 0.25;
      const startShot = 0.55 + i * 0.022;
      frames.push({ transform: `translate(${sx}px,${sy}px) rotate(${540 + i * 36}deg)`, opacity: 1, offset: startShot });
      frames.push({ transform: `translate(${hx}px,${hy}px) rotate(${1260 + i * 36}deg)`, opacity: 1, offset: Math.min(startShot + 0.3, 0.98) });
      frames.push({ transform: `translate(${hx}px,${hy}px) rotate(${1300 + i * 36}deg)`, opacity: 0 });
      effects.push(Fx.spawn(fxEl, FxGlyphs.leafGlyph(leaf), launch, frames, { duration: 1000, easing: 'linear' }));
    }
    await Fx.wait(850);

    // The cuts land on the target.
    const len = Math.max(tr.width * 0.7, 46);
    for (let i = 0; i < 4; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.25, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.25 };
      const deg = -30 + Math.random() * 60;
      effects.push(
        Fx.wait(i * 70).then(() => {
          Fx.shake(targetEl, 3);
          if (i % 2 === 0) Fx.flash(targetEl, '#FFFFFF', 0.4);
          return Promise.all([
            Fx.spawn(fxEl, Fx.box(len, 4, 'border-radius:50%;background:linear-gradient(90deg,#FFFFFF00,#FFFFFF,#FFFFFF00);box-shadow:0 0 6px #FFFFFF'), at, [
              { transform: `rotate(${deg}deg) scaleX(0)`, opacity: 1 },
              { transform: `rotate(${deg}deg) scaleX(1)`, opacity: 1, offset: 0.4 },
              { transform: `rotate(${deg}deg) scaleX(1) scaleY(.3)`, opacity: 0 }
            ], { duration: 260, easing: 'ease-out' }),
            Fx.spawn(fxEl, FxGlyphs.sparkStar(12, '#FFE04A'), { x: at.x + 8, y: at.y - 6 }, [
              { transform: 'scale(0) rotate(0deg)', opacity: 1 },
              { transform: 'scale(1) rotate(30deg)', opacity: 1, offset: 0.4 },
              { transform: 'scale(0) rotate(60deg)', opacity: 0 }
            ], { duration: 320, easing: 'ease-out' })
          ]);
        })
      );
    }
    await Promise.all(effects);
  }
}
