import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The roots have spread at `ROOTED` (ms); then the light motes rise. */
const ROOTED = 600;
/** How many yellow-green light motes rise from the roots. */
const MOTES = 7;

/**
 * Ingrain, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/9/9f/Verwurzler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/ae/Verwurzler_Gen5.png
 *
 * Brown roots grow out of the ground under the user and spread to both
 * sides, the user sinking in a little (0-0.6 s). Then yellow-green light
 * motes well up from the roots and rise round the user while it glows a
 * soft green (0.6-1.35 s), and the roots fade (1.2-1.5 s).
 */
export class Ingrain {
  static async play(refs: BattleStageRefs) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);
    const w = Math.max(r.width, 60) * 1.5;
    const h = w * 0.3;

    const roots = Fx.box(w, h, 'filter:drop-shadow(0 1px 1px #2A1608)');
    const paths = [
      'M50 4 C44 10 34 12 22 14 C14 15 8 20 2 26',
      'M50 4 C56 10 66 12 78 14 C86 15 92 20 98 26',
      'M50 4 C46 14 40 20 30 26',
      'M50 4 C54 14 60 20 70 26',
      'M30 13 C26 18 18 20 12 19',
      'M70 13 C74 18 82 20 88 19'
    ];
    roots.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">${paths
      .map((d, i) => `<path d="${d}" fill="none" stroke="${i % 2 ? '#7A4A22' : '#8E5A2C'}" stroke-width="${i < 2 ? 3.2 : 2.2}" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`)
      .join('')}</svg>`;
    Fx.place(roots, { x: foot.x, y: foot.y + h * 0.3 });
    fxEl.appendChild(roots);
    const grow = Array.from(roots.querySelectorAll('path')).map((p, i) =>
      Fx.anim(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ROOTED - 180, delay: (i >> 1) * 90, easing: 'ease-out' })
    );
    const base = launchEl.style.transform;
    const sink = Fx.anim(launchEl, [
      { transform: `${base} translateY(0)` },
      { transform: `${base} translateY(4px)`, offset: 0.3 },
      { transform: `${base} translateY(4px)`, offset: 0.8 },
      { transform: `${base} translateY(0)` }
    ], { duration: 1300, easing: 'ease-in-out', fill: 'none' });
    await Promise.all(grow);

    const effects: Promise<void>[] = [sink, Fx.glow(launchEl, 'brightness(1.1) drop-shadow(0 0 8px #B8F060)', 750)];
    for (let i = 0; i < MOTES; i++) {
      const u = i / (MOTES - 1);
      const from: Point = { x: foot.x + (u - 0.5) * w * 0.8, y: foot.y };
      const mote = Fx.box(12, 12, 'border-radius:50%;background:radial-gradient(circle,#FFFFFF,#E8FF80 40%,#9AE040 70%,#9AE04000);box-shadow:0 0 8px #C8FF60');
      effects.push(Fx.spawn(fxEl, mote, from, [
        { transform: 'translateY(0) scale(.3)', opacity: 0 },
        { transform: `translate(${(0.5 - u) * w * 0.15}px,${-r.height * 0.3}px) scale(1)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${(0.5 - u) * w * 0.25}px,${-r.height * 0.8}px) scale(.6)`, opacity: 0 }
      ], { duration: 600, delay: (i % 3) * 70 + (i % 2) * 40, easing: 'ease-out' }));
      if (i % 2 === 0) {
        effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#F0FFB0'), { x: from.x, y: from.y - r.height * 0.4 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 340, delay: 200 + i * 40, easing: 'ease-out' }));
      }
    }
    effects.push(Fx.anim(roots, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 600, easing: 'ease-in' }).then(() => roots.remove()));
    await Promise.all(effects);
  }
}
