import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Seed Flare, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/89/Schocksamen_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/9/9e/Schocksamen_Gen5.png
 *
 * The scene turns pale (0-0.3 s). Cyan sparks gather into the user, which
 * glows cyan (0.3-0.9 s), and three cyan beams shoot up from it into the sky
 * (0.9-1.4 s). They come down on the target: a lilac-white flare bursts with
 * cyan streaks spraying out (hit at 1.35 s, to ~1.9 s). The scene clears
 * (1.9-2.15 s).
 */
export class SeedFlare {
  private static readonly CYAN = '#5AF0FF';

  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const cyan = SeedFlare.CYAN;

    const pale = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 40%,#FFFAF4,#F2E2DA 60%,#DCC8C0)');
    await Fx.anim(pale, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // Cyan sparks gather into the user, which glows cyan.
    const parts: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: `brightness(1.2) drop-shadow(0 0 8px ${cyan})`, offset: 0.5 },
        { filter: `brightness(1.4) drop-shadow(0 0 10px ${cyan})`, offset: 0.9 },
        { filter: 'none' }
      ], { duration: 1000, easing: 'ease-in-out', fill: 'none' })
    ];
    for (let i = 0; i < 12; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, cyan);
      const ang = Math.random() * Math.PI * 2;
      const d = Math.max(lr.width, 60) * (0.7 + Math.random() * 0.4);
      Fx.place(star, launch);
      fxEl.appendChild(star);
      parts.push(
        Fx.anim(star, [
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1)`, opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: 'translate(0,0) scale(.3)', opacity: 0 }
        ], { duration: 400, delay: i * 18, easing: 'ease-in', fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Fx.wait(600);

    // Three cyan beams shoot up from the user into the sky.
    const beamLen = Math.max(launch.y + 40, H * 0.8);
    for (let i = 0; i < 3; i++) {
      const beam = SeedFlare.beam(beamLen, 10 - i * 2);
      const tilt = v.dir * (12 + i * 12);
      beam.style.left = `${launch.x + (i - 1) * 10 - (10 - i * 2) / 2}px`;
      beam.style.top = `${launch.y - beamLen}px`;
      fxEl.appendChild(beam);
      parts.push(
        Fx.anim(beam, [
          { transform: `rotate(${tilt}deg) scaleY(0)`, transformOrigin: '50% 100%', opacity: 1 },
          { transform: `rotate(${tilt}deg) scaleY(1)`, transformOrigin: '50% 100%', opacity: 1, offset: 0.5 },
          { transform: `rotate(${tilt}deg) translateY(${-beamLen}px) scaleY(1)`, transformOrigin: '50% 100%', opacity: 0.6 }
        ], { duration: 400, delay: i * 60, easing: 'ease-in' }).then(() => beam.remove())
      );
    }
    await Fx.wait(450);

    // The flare comes down on the target: a lilac-white burst with cyan streaks.
    const size = Math.max(tr.width * 1.6, 120);
    const flare = document.createElement('div');
    flare.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 22%,#F0E0FFee 38%,#B880F088 56%,#8040D000 72%)`;
    Fx.place(flare, target);
    fxEl.appendChild(flare);
    parts.push(
      Fx.anim(flare, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out' }).then(() => flare.remove())
    );
    for (let i = 0; i < 14; i++) {
      const len = size * (0.35 + Math.random() * 0.3);
      const ang = (360 * i) / 14 + Math.random() * 12;
      const streak = document.createElement('div');
      streak.style.cssText = `position:absolute;width:${len}px;height:4px;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#ffffff,${cyan} 50%,${cyan}00);box-shadow:0 0 4px ${cyan}`;
      streak.style.left = `${target.x}px`;
      streak.style.top = `${target.y - 2}px`;
      fxEl.appendChild(streak);
      parts.push(
        Fx.anim(streak, [
          { transform: `rotate(${ang}deg) translateX(0) scaleX(.2)`, transformOrigin: '0 50%', opacity: 1 },
          { transform: `rotate(${ang}deg) translateX(${len * 0.5}px) scaleX(1)`, transformOrigin: '0 50%', opacity: 0 }
        ], { duration: 450, delay: Math.random() * 100, easing: 'ease-out' }).then(() => streak.remove())
      );
    }
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.6);
    await Promise.all(parts);

    await Fx.anim(pale, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    pale.remove();
  }

  /** A tall cyan light beam `len` px long and `w` px wide, white at its core. */
  private static beam(len: number, w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w}px;height:${len}px;pointer-events:none;border-radius:${w}px;background:linear-gradient(90deg,${SeedFlare.CYAN}00,${SeedFlare.CYAN} 25%,#ffffff 50%,${SeedFlare.CYAN} 75%,${SeedFlare.CYAN}00);box-shadow:0 0 8px ${SeedFlare.CYAN}`;
    return el;
  }
}
