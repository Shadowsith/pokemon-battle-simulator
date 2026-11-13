import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Psystrike, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/8/85/Psychosto%C3%9F_Gen5.png
 *
 * Crimson ripple rings spread over the ground from the user's feet
 * (0-0.7 s). The scene goes black (0.5-0.75 s) and glowing magenta orbs
 * gather round the target and close in (0.75-1.45 s). At the hit (1.45 s) a
 * magenta ray backdrop opens on the target, orange, white and pink stars
 * burst off it, then pink-red squares flicker over it (1.45-2.2 s); the
 * scene clears (to ~2.5 s).
 */
export class Psystrike {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const foot: Point = { x: launch.x, y: launch.y + lr.height * 0.4 };
    const ripples = FxEffects.groundRipples(fxEl, foot, Math.max(lr.width * 2.5, 180), ['#D82A5A', '#FF6A9A'], 3, 120, 460);
    await Fx.wait(500);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // Magenta orbs gather round the target.
    const rad = Math.max(tr.width * 0.9, 60);
    const orbs: Promise<void>[] = [ripples];
    for (let i = 0; i < 14; i++) {
      const orb = document.createElement('div');
      const s = 10 + Math.random() * 12;
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFE0F8,#F04AD8aa 45%,#F04AD800 72%)`;
      const a = Math.random() * Math.PI * 2;
      const d = rad * (0.6 + Math.random() * 0.4);
      Fx.place(orb, { x: target.x + Math.cos(a) * d, y: target.y + Math.sin(a) * d * 0.8 });
      fxEl.appendChild(orb);
      const tx = -Math.cos(a) * d * 0.7;
      const ty = -Math.sin(a) * d * 0.8 * 0.7;
      orbs.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(0)', opacity: 0 },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.35 },
          { transform: `translate(${tx}px,${ty}px) scale(.6)`, opacity: 0.8 }
        ], { duration: 600, delay: Math.random() * 100, easing: 'ease-in' }).then(() => orb.remove())
      );
    }
    await Promise.all(orbs);

    // The hit: magenta rays (opening under the fading black), bursting stars, flickering squares.
    const opening = FxEffects.burstBackdrop(fieldEl, target, 'magenta');
    Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => dim.remove());
    Fx.flash(targetEl, '#FF6AD8', 0.7);
    Fx.shake(targetEl, 6);
    const effects: Promise<void>[] = [];
    const tones = ['#FFB02A', '#FFFFFF', '#FF7AC8'];
    for (let i = 0; i < 9; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 10, tones[i % 3]);
      Fx.place(star, target);
      fxEl.appendChild(star);
      const a = (Math.PI * 2 * i) / 9 + Math.random() * 0.4;
      const d = tr.width * (0.5 + Math.random() * 0.4);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(1) rotate(90deg)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    for (let i = 0; i < 16; i++) {
      const sq = document.createElement('div');
      const s = 8 + Math.random() * 8;
      sq.style.cssText = `width:${s}px;height:${s}px;pointer-events:none;background:${i % 2 ? '#F02A6A' : '#FF8AC8'};opacity:0;box-shadow:0 0 4px #FF4A8A`;
      Fx.place(sq, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3 });
      fxEl.appendChild(sq);
      effects.push(
        Fx.anim(sq, [{ opacity: 0 }, { opacity: 0.9, offset: 0.2 }, { opacity: 0.2, offset: 0.45 }, { opacity: 0.9, offset: 0.7 }, { opacity: 0 }], {
          duration: 450,
          delay: 200 + Math.random() * 100
        }).then(() => sq.remove())
      );
    }
    await Promise.all(effects);
    const back = await opening;
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    back.remove();
  }
}
