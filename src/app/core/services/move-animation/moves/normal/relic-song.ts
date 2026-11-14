import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Relic Song, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/5/56/Urgesang_Gen5.png
 *
 * Pale white rings pulse out round the singing user (0-0.6 s). Orange and
 * yellow music notes float over to the target on a swaying path
 * (0.5-1.2 s). They reach it at the hit (1.1 s): yellow rings and small notes
 * twinkle round the target (to ~1.7 s).
 */
export class RelicSong {
  private static readonly NOTE_COLORS = ['#F0901A', '#F8C83A', '#E86A1A'];

  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const effects: Promise<void>[] = [];

    // Pale rings pulse out round the user.
    const ringSize = Math.max(lr.width, lr.height, 60) * 1.3;
    for (let i = 0; i < 3; i++) {
      const ring = document.createElement('div');
      ring.style.cssText =
        `width:${ringSize}px;height:${ringSize}px;border-radius:50%;pointer-events:none;` +
        'border:3px solid #FFFFFFcc;box-shadow:0 0 10px #FFF4E0,inset 0 0 12px #FFFFFF88';
      Fx.place(ring, launch);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [
          { transform: 'scale(.4)', opacity: 0 },
          { transform: 'scale(.7)', opacity: 1, offset: 0.3 },
          { transform: 'scale(1.15)', opacity: 0 }
        ], { duration: 400, delay: i * 120, easing: 'ease-out' }).then(() => ring.remove())
      );
    }

    // Music notes float over to the target on a swaying path.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let i = 0; i < 7; i++) {
      const note = FxGlyphs.musicNote(16 + Math.random() * 6, RelicSong.NOTE_COLORS[i % 3], i % 2 ? '♫' : '♪');
      const start: Point = { x: launch.x, y: launch.y - lr.height * 0.2 + (Math.random() * 2 - 1) * 12 };
      Fx.place(note, start);
      fxEl.appendChild(note);
      const sway = 18 + Math.random() * 10;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        const wave = Math.sin(u * Math.PI * 2 + i) * sway;
        frames.push({
          transform: `translate(${dx * u}px,${dy * u + wave}px) scale(${0.6 + 0.4 * Math.sin(Math.PI * Math.min(u * 1.2, 1))})`,
          opacity: u === 0 ? 0 : u === 1 ? 0 : 1
        });
      }
      effects.push(Fx.anim(note, frames, { duration: 600, delay: 500 + i * 70, easing: 'linear', fill: 'backwards' }).then(() => note.remove()));
    }
    await Fx.wait(1100);

    // The hit: yellow rings and small notes twinkle round the target.
    Fx.flash(targetEl, '#FFE07A', 0.5);
    Fx.shake(targetEl, 4);
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.45, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.4 };
      const el = i % 2 ? FxGlyphs.musicNote(13, '#F8D84A') : RelicSong.ring(12 + Math.random() * 8);
      Fx.place(el, at);
      fxEl.appendChild(el);
      effects.push(
        Fx.anim(el, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-4px) scale(1.1)', opacity: 1, offset: 0.35 },
          { transform: 'translateY(-14px) scale(.8)', opacity: 0 }
        ], { duration: 450, delay: i * 50, easing: 'ease-out', fill: 'backwards' }).then(() => el.remove())
      );
    }
    await Promise.all(effects);
  }

  /** A small yellow ring, `s` px wide. */
  private static ring(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:2px solid #F8D84A;box-shadow:0 0 4px #FFF0A0`;
    return el;
  }
}
