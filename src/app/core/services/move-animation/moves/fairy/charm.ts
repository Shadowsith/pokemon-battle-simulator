import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Charm, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a3/Charme_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1e/Charme_Gen5.png
 *
 * The user sways cutely from side to side (0-0.9 s) while five pink hearts
 * float up off it one after another (0.05-0.95 s). Then the target's Attack
 * drops sharply: it turns blue under stat-down bubbles (0.95 s to ~1.85 s).
 */
export class Charm {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width, 50);
    const h = Math.max(r.height, 50);
    const base = launchEl.style.transform;

    const sway = Fx.anim(launchEl, [
      { transform: base },
      { transform: `${base} translateX(-5px) skewX(4deg)`, offset: 0.17 },
      { transform: `${base} translateX(5px) skewX(-4deg)`, offset: 0.42 },
      { transform: `${base} translateX(-5px) skewX(4deg)`, offset: 0.67 },
      { transform: `${base} translateX(4px) skewX(-3deg)`, offset: 0.88 },
      { transform: base }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });

    const hearts: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const s = 12 + Math.random() * 8;
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * w * 0.35, y: launch.y - h * (0.15 + Math.random() * 0.2) };
      const drift = (Math.random() * 2 - 1) * 12;
      hearts.push(
        Fx.spawn(fxEl, FxGlyphs.heartGlyph(s), at, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,-10px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${-drift * 0.3}px,-24px) scale(1)`, opacity: 1, offset: 0.65 },
          { transform: `translate(${drift}px,-38px) scale(.85)`, opacity: 0 }
        ], { duration: 550, easing: 'ease-out', delay: 50 + i * 90 })
      );
    }
    await Promise.all([sway, ...hearts]);
    await FxEffects.blueStatDrop(refs, target);
  }
}
