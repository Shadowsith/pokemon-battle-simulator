import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Total length, ms; the notes drift until `SONG_END`, then red eyes glow in the dark. */
const TOTAL = 1900;
const SONG_END = 1150;

/**
 * Perish Song, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/f2/Abgesang_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/30/Abgesang_Gen5.png
 *
 * The scene darkens and cyan spotlight rays fan down from above (0-0.3 s).
 * Glowing cyan music notes drift slowly across the field one after another
 * (0.2-1.15 s). The rays fade to black (1.15-1.35 s), red eyes glint on every
 * Pokémon in the dark (1.3-1.7 s), and the scene clears (to ~1.9 s).
 */
export class PerishSong {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = Fx.rect(fieldEl).width || 640;
    const at = (ms: number) => ms / TOTAL;

    const dark = Fx.backdrop(fieldEl, 'background:#05080C;opacity:0');
    const rays = Fx.backdrop(fieldEl,
      'background:repeating-conic-gradient(from 160deg at 50% -10%,#7FE8FF00 0deg 6deg,#7FE8FF55 7deg 10deg,#7FE8FF00 11deg 18deg);mix-blend-mode:screen;opacity:0');
    dark.after(rays);
    const effects: Promise<void>[] = [
      Fx.anim(dark, [
        { opacity: 0 },
        { opacity: 0.95, offset: at(300) },
        { opacity: 0.95, offset: at(1700) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' }),
      Fx.anim(rays, [
        { opacity: 0 },
        { opacity: 1, offset: at(300) },
        { opacity: 0.8, offset: at(SONG_END) },
        { opacity: 0, offset: at(SONG_END + 200) },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' })
    ];

    const notes = ['♪', '♫', '♪', '♬', '♫', '♪', '♬'];
    for (const [i, note] of notes.entries()) {
      const s = 20 + Math.random() * 8;
      const el = FxGlyphs.musicNote(s, '#A8F4FF', note);
      el.style.textShadow = '0 0 6px #3AD8FF,0 0 12px #3AD8FF';
      const y = 90 + Math.random() * 90;
      const startX = W * (0.1 + (i / notes.length) * 0.7);
      effects.push(
        Fx.spawn(fxEl, el, { x: startX, y }, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: 'translate(30px,-6px)', opacity: 1, offset: 0.25 },
          { transform: 'translate(80px,4px)', opacity: 1, offset: 0.7 },
          { transform: 'translate(110px,-4px)', opacity: 0 }
        ], { duration: 650, easing: 'ease-in-out', delay: 200 + i * 45 })
      );
    }

    // Red eyes glint on both Pokémon in the dark.
    for (const [el, p] of [[launchEl, launch], [targetEl, target]] as const) {
      const r = Fx.rect(el);
      for (const side of [-1, 1]) {
        const eye = Fx.box(6, 6, 'border-radius:50%;background:#FF3A2A;box-shadow:0 0 6px #FF2010,0 0 12px #FF2010');
        effects.push(
          Fx.spawn(fxEl, eye, { x: p.x + side * r.width * 0.1, y: p.y - r.height * 0.2 }, [
            { opacity: 0 },
            { opacity: 1, offset: 0.3 },
            { opacity: 1, offset: 0.7 },
            { opacity: 0 }
          ], { duration: 400, easing: 'ease-in-out', delay: 1300 })
        );
      }
    }
    await Promise.all(effects);
    dark.remove();
    rays.remove();
  }
}
