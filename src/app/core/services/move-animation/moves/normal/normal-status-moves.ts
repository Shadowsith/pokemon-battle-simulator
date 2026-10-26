import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hand-made animations for Normal-type status moves (healing, setup). */
export class NormalStatusMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    recover: (refs, launch) => NormalStatusMoveAnimations.playRecover(refs, launch),
    softboiled: (refs, launch) => NormalStatusMoveAnimations.playSoftBoiled(refs, launch)
  };

  /**
   * Soft-Boiled: an egg drops onto the caster's head and cracks open - its
   * halves fly apart, blue sparkles burst out and a pale blue wave washes
   * quickly over the caster - then green HP sparkles show it healing.
   */
  private static async playSoftBoiled(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
    const f = fieldEl.getBoundingClientRect();
    const head: Point = { x: launch.x, y: r.top - f.top + r.height * 0.15 };

    // 1. The egg drops onto the head.
    const w = Math.max(r.width * 0.22, 22);
    const egg = FxGlyphs.eggGlyph(w);
    Fx.place(egg, head);
    fxEl.appendChild(egg);
    await Fx.anim(egg, [
      { transform: 'translateY(-70px)', opacity: 0 },
      { transform: 'translateY(-50px)', opacity: 1, offset: 0.25 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 420, easing: 'ease-in' });
    egg.remove();

    // 2. Crack: the two shell halves tip and fly apart.
    const halves = [-1, 1].map((side) => {
      const half = FxGlyphs.eggGlyph(w);
      half.style.clipPath = side < 0 ? 'polygon(0 0,100% 0,100% 45%,75% 55%,50% 42%,25% 55%,0 45%)' : 'polygon(0 45%,25% 55%,50% 42%,75% 55%,100% 45%,100% 100%,0 100%)';
      Fx.place(half, head);
      fxEl.appendChild(half);
      return Fx.anim(half, [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${side * 4}px,${side * 3}px) rotate(${side * 8}deg)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${side * 26}px,${side < 0 ? -22 : 14}px) rotate(${side * 40}deg)`, opacity: 0 }
      ], { duration: 520, easing: 'ease-out' }).then(() => half.remove());
    });

    // Pale blue wave: a ring that swells fast over the caster and fades.
    const size = Math.max(r.width, r.height) * 1.1;
    const wave = document.createElement('div');
    wave.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:3px solid #BFE6FF;background:radial-gradient(circle,#D8F0FF00 40%,#A8DCFF66 70%,#D8F0FF00);box-shadow:0 0 12px #A8DCFF`;
    Fx.place(wave, launch);
    fxEl.appendChild(wave);
    const waveDone = Fx.anim(wave, [
      { transform: 'scale(.2)', opacity: 0.9 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 420, easing: 'ease-out' }).then(() => wave.remove());

    // Blue sparkles twinkle all over the caster.
    const rx = Math.max(r.width * 0.5, 30);
    const ry = Math.max(r.height * 0.5, 30);
    for (let i = 0; i < 14; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 12, i % 3 ? '#7FC8FF' : '#ffffff');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * rx, y: launch.y + (Math.random() * 2 - 1) * ry });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * 600 }).then(() => star.remove());
    }
    Fx.flash(launchEl, '#A8DCFF', 0.4);
    await Promise.all([...halves, waveDone, Fx.wait(1150)]);

    // 3. HP gain.
    await FxEffects.healSparkles(refs, launch);
  }

  /**
   * Recover: orange and golden stars twinkle all over the caster while it
   * glows warmly, then green HP sparkles rise as it regains health.
   */
  private static async playRecover(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = launchEl.getBoundingClientRect();
    const rx = Math.max(r.width * 0.5, 30);
    const ry = Math.max(r.height * 0.45, 28);
    const colors = ['#FFA62B', '#FFD34D', '#FF8A1F'];

    for (let i = 0; i < 18; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 14, colors[i % colors.length]);
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * rx,
        y: launch.y + (Math.random() * 2 - 1) * ry
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.3) rotate(45deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(.8) rotate(70deg)', opacity: 0.9, offset: 0.6 },
        { transform: 'scale(0) rotate(110deg)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', delay: Math.random() * 700 }).then(() => star.remove());
    }
    Fx.flash(launchEl, '#FFA62B', 0.4);
    setTimeout(() => Fx.flash(launchEl, '#FFD34D', 0.3), 400);
    await Fx.wait(1250);

    await FxEffects.healSparkles(refs, launch);
  }
}
