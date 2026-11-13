import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Quiver Dance, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/8/80/Falterreigen_Gen5.png
 *
 * The user flutters its wings, squeezing narrow and bobbing (0-0.5 s). The
 * scene dims, pale ripple rings spread on the ground under the user and
 * cyan sparkles rise and twinkle round it (0.4-1.4 s). Glowing orange orbs
 * float up round the user (1.4-2.0 s), then the stat-up aura (2.0-2.8 s).
 */
export class QuiverDance {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const original = launchEl.style.transform;
    const flutter = Fx.anim(launchEl, [
      { transform: `${original} translateY(0) scaleX(1)` },
      { transform: `${original} translateY(-4px) scaleX(.6)`, offset: 0.25 },
      { transform: `${original} translateY(0) scaleX(1)`, offset: 0.5 },
      { transform: `${original} translateY(-4px) scaleX(.6)`, offset: 0.75 },
      { transform: `${original} translateY(0) scaleX(1)` }
    ], { duration: 500, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(400);

    // Dim scene, ripples on the ground, cyan sparkles round the user.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const dimIn = Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    const foot: Point = { x: launch.x, y: launch.y + lr.height * 0.4 };
    const effects: Promise<void>[] = [flutter, dimIn, FxEffects.groundRipples(fxEl, foot, Math.max(lr.width * 1.4, 90), ['#C8D8D0', '#7AE8D8'], 4, 140, 600)];
    const rad = Math.max(lr.width * 0.6, 34);
    for (let i = 0; i < 16; i++) {
      const star = FxGlyphs.sparkStar(6 + Math.random() * 7, i % 3 ? '#6AF0E8' : '#FFFFFF');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * rad, y: launch.y + Math.random() * rad * 0.6 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: `translateY(${-rad * 0.4}px) scale(1.1)`, opacity: 1, offset: 0.4 },
          { transform: `translateY(${-rad * 0.6}px) scale(.6)`, opacity: 0.4, offset: 0.7 },
          { transform: `translateY(${-rad}px) scale(0)`, opacity: 0 }
        ], { duration: 550, delay: Math.random() * 450, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);

    // Orange orbs float up round the user while the scene clears.
    const dimOut = Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 400, easing: 'ease-in' }).then(() => dim.remove());
    const orbs: Promise<void>[] = [dimOut];
    for (let i = 0; i < 8; i++) {
      const orb = document.createElement('div');
      const s = 10 + Math.random() * 6;
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0B0,#FFA82Acc 45%,#FF8A1A00 72%)`;
      Fx.place(orb, { x: launch.x + (Math.random() * 2 - 1) * rad, y: launch.y + rad * (Math.random() * 0.8 - 0.2) });
      fxEl.appendChild(orb);
      orbs.push(
        Fx.anim(orb, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-6px) scale(1)', opacity: 1, offset: 0.35 },
          { transform: 'translateY(-18px) scale(.7)', opacity: 0 }
        ], { duration: 450, delay: Math.random() * 150, easing: 'ease-out' }).then(() => orb.remove())
      );
    }
    await Promise.all(orbs);
    await FxEffects.statUpAura(refs, launch);
  }
}
