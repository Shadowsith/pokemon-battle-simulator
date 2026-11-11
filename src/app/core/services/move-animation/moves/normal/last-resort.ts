import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Last Resort's star yellow and its glow. */
const GOLD = '#FFD83A';

/**
 * Last Resort, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/ce/Zuflucht_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/5f/Zuflucht_Gen5.png
 *
 * Yellow stars pop up all round the target and swirl in on it, more and
 * more of them (0-0.8 s). The user darts in (0.8-1.06 s) and the stars
 * crowd into a bright yellow-white glow (hit at 0.92 s): a golden burst
 * flares and the stars scatter outward and fade (to ~1.65 s).
 */
export class LastResort {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const reach = Math.max(tr.width, tr.height) * 0.75;

    // The stars swirl in.
    const swirl: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const star = FxGlyphs.fivePointStar(10 + Math.random() * 8, GOLD, '#FFF8C0', GOLD);
      Fx.place(star, target);
      fxEl.appendChild(star);
      const a0 = Math.random() * Math.PI * 2;
      const d0 = reach * (0.8 + Math.random() * 0.4);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6;
        const a = a0 + t * Math.PI * 1.4;
        const d = d0 * (1 - t * 0.85);
        frames.push({ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.75}px) scale(${t < 0.2 ? t * 5 : 1})`, opacity: t < 0.2 ? t * 5 : 1 });
      }
      const delay = i * 30;
      swirl.push(Fx.anim(star, frames, { duration: 900 - delay, delay, easing: 'ease-in', fill: 'backwards' }).then(() => star.remove()));
    }
    await Fx.wait(800);
    const dart = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);

    // The hit: a bright glow and golden burst; stars scatter.
    const glow = document.createElement('div');
    const gs = reach * 1.1;
    glow.style.cssText = `position:absolute;width:${gs}px;height:${gs}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 20%,#FFF6B0 40%,${GOLD}88 60%,${GOLD}00 72%)`;
    Fx.place(glow, target);
    fxEl.appendChild(glow);
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.8, 64), '#FFB020', '#FFE88A', '#FFFFFF');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    Fx.flash(targetEl, '#FFF6B0', 0.8);
    Fx.shake(targetEl, 7);
    setTimeout(() => Fx.shake(targetEl, 4), 250);
    const effects: Promise<void>[] = [
      ...swirl,
      dart,
      Fx.anim(glow, [{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1)', opacity: 0.9, offset: 0.4 }, { transform: 'scale(1.2)', opacity: 0 }], { duration: 500, easing: 'ease-out' }).then(() => glow.remove()),
      Fx.anim(burst, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 450, delay: 60, easing: 'ease-out', fill: 'backwards' }).then(() => burst.remove())
    ];
    for (let i = 0; i < 12; i++) {
      const star = FxGlyphs.fivePointStar(9 + Math.random() * 8, GOLD, '#FFF8C0', GOLD);
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const d = reach * (0.9 + Math.random() * 0.4);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6 + 10}px) scale(.6)`, opacity: 0 }
        ], { duration: 600 + Math.random() * 150, delay: 40, easing: 'ease-out', fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);
  }
}
