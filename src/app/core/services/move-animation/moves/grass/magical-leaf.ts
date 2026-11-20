import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** How many glowing leaves swirl up and home in. */
const LEAVES = 9;
/** The leaves swirl round the user until `SWIRL` (ms), then fly `FLIGHT` ms to the target. */
const SWIRL = 600;
const FLIGHT = 420;
/** Glow colours the leaves cycle through. */
const GLOWS = ['#FF4AC8', '#B05AFF', '#5A8AFF'];

/**
 * Magical Leaf, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a4/Zauberblatt_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/79/Zauberblatt_Gen5.png
 *
 * Dark leaves with a pink, violet or blue glow whirl up round the user,
 * tumbling (0-0.6 s). Then they curve over to the target one after another
 * along bent paths that cannot miss, 0.04 s apart; each lands with a
 * pink-white sparkle (landings 1.02-1.34 s, sparkles gone at ~1.6 s), and
 * the target flashes pink and shakes from the first landing on.
 */
export class MagicalLeaf {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const rx = Math.max(lr.width, 50) * 0.7;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < LEAVES; i++) {
      const a = (Math.PI * 2 * i) / LEAVES;
      const start: Point = { x: launch.x + Math.cos(a) * rx * 0.4, y: launch.y + lr.height * 0.3 };
      const up: Point = { x: launch.x + Math.cos(a + 1.5) * rx, y: launch.y - lr.height * (0.2 + (i % 3) * 0.15) };
      const end: Point = { x: target.x + ((i % 3) - 1) * tr.width * 0.2, y: target.y + (((i >> 1) % 3) - 1) * tr.height * 0.18 };
      // The leaf bends off to one side on its way over, alternating per leaf.
      const bend = (i % 2 ? 1 : -1) * Math.max(Math.abs(end.x - up.x) * 0.25, 40);
      const mid: Point = { x: (up.x + end.x) / 2, y: (up.y + end.y) / 2 + bend };
      const leaf = Fx.box(18, 11, `filter:drop-shadow(0 0 4px ${GLOWS[i % 3]}) drop-shadow(0 0 2px ${GLOWS[i % 3]})`);
      const body = FxGlyphs.leafGlyph(18);
      body.style.background = 'linear-gradient(135deg,#5A3A4A,#2A1A2A 60%,#140A14)';
      leaf.appendChild(body);
      const rel = (p: Point) => `translate(${p.x - start.x}px,${p.y - start.y}px)`;
      const fly = i * 40;
      const total = SWIRL + fly + FLIGHT;
      effects.push(Fx.spawn(fxEl, leaf, start, [
        { transform: `${rel(start)} rotate(0deg) scale(.4)`, opacity: 0 },
        { transform: `${rel(up)} rotate(${300 + i * 30}deg) scale(1)`, opacity: 1, offset: SWIRL / total },
        { transform: `${rel(up)} rotate(${360 + i * 30}deg) scale(1)`, opacity: 1, offset: (SWIRL + fly) / total },
        { transform: `${rel(mid)} rotate(${540 + i * 30}deg) scale(1)`, opacity: 1, offset: (SWIRL + fly + FLIGHT / 2) / total },
        { transform: `${rel(end)} rotate(${720 + i * 30}deg) scale(.9)`, opacity: 1 }
      ], { duration: total, easing: 'ease-in-out' }));
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(16, '#FFD8F4'), end, [
        { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.6) rotate(90deg)', opacity: 0 }
      ], { duration: 260, delay: total, easing: 'ease-out' }));
    }
    const firstHit = SWIRL + FLIGHT;
    setTimeout(() => {
      Fx.flash(targetEl, '#FF8AE0', 0.5);
      Fx.shake(targetEl, 4);
    }, firstHit);
    setTimeout(() => Fx.shake(targetEl, 3), firstHit + LEAVES * 20);
    await Promise.all(effects);
  }
}
