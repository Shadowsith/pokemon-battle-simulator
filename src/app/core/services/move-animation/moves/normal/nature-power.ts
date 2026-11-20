import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The orbs circle the user until `MERGE` (ms), then fly into it and flash. */
const MERGE = 1000;
/** Orb colours: [core, glow]. */
const ORBS: [string, string][] = [
  ['#FF8A7A', '#FF3A2A'],
  ['#9AB8FF', '#3A5AFF'],
  ['#FFF09A', '#FFC81A']
];

/**
 * Nature Power, after the Gen 5 animation (Gen 4 shows only the called move):
 * - Gen 4: https://www.pokewiki.de/images/c/cc/Natur-Kraft_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/67/Natur-Kraft_Gen5.png
 *
 * The scene dims slightly and the user glows green. A red, a blue and a
 * yellow orb of light circle the user twice on a flat white ring, shrinking
 * and dimming on its far side (0-1.0 s). They dive into
 * the user (1.0-1.15 s), which flashes white while green leaves and
 * sparkles burst off it (1.15-1.6 s).
 */
export class NaturePower {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl, screenFxEl } = refs;
    const r = Fx.rect(launchEl);
    const rx = Math.max(r.width, 50) * 0.75;
    const ry = rx * 0.28;
    Fx.screenWash(screenFxEl, '#00000055', 200, MERGE + 200);
    const effects: Promise<void>[] = [Fx.glow(launchEl, 'brightness(1.15) drop-shadow(0 0 8px #7AE06A)', MERGE + 150)];

    const ring = Fx.box(rx * 2, ry * 2, 'border-radius:50%;border:2px solid #FFFFFFaa;box-shadow:0 0 6px #FFFFFF88');
    effects.push(Fx.spawn(fxEl, ring, launch, [
      { transform: 'scale(.5)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.8, offset: 0.2 },
      { transform: 'scale(1)', opacity: 0.8, offset: 0.85 },
      { transform: 'scale(.2)', opacity: 0 }
    ], { duration: MERGE + 150, easing: 'ease-out' }));

    ORBS.forEach(([core, glow], k) => {
      const orb = Fx.box(16, 16, `border-radius:50%;background:radial-gradient(circle,#FFFFFF,${core} 45%,${glow});box-shadow:0 0 10px ${glow},0 0 4px ${core}`);
      const frames: Keyframe[] = [];
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const a = (Math.PI * 2 * k) / 3 + (Math.PI * 4 * i) / steps;
        // Behind the user (top half of the ring) the orb shrinks and dims.
        const depth = Math.sin(a);
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${depth * ry}px) scale(${0.75 + depth * 0.25})`,
          opacity: depth < -0.4 ? 0.45 : 1,
          offset: (i / steps) * (MERGE / (MERGE + 150))
        });
      }
      frames.push({ transform: 'translate(0,0) scale(.3)', opacity: 0, offset: 1 });
      effects.push(Fx.spawn(fxEl, orb, launch, frames, { duration: MERGE + 150, easing: 'linear' }));
    });

    effects.push(Fx.wait(MERGE + 150).then(() => {
      Fx.flash(launchEl, '#FFFFFF', 0.8);
      const burst: Promise<void>[] = [];
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8;
        const d = rx * 0.9;
        const piece = i % 2 ? FxGlyphs.leafGlyph(14) : FxGlyphs.sparkStar(12, '#E8FFD0');
        burst.push(Fx.spawn(fxEl, piece, launch, [
          { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.7}px) rotate(${180 + i * 40}deg) scale(1)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }));
      }
      return Promise.all(burst).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
