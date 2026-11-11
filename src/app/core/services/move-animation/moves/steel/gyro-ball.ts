import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Gyro Ball, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/05/Gyroball_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/6b/Gyroball_Gen5.png
 *
 * A ring of white glints spins up round the user, widening and then drawing
 * tight (0-0.8 s). The user darts at the target (0.8-1.06 s, hit at 0.92 s)
 * and a white whirl of spinning arcs grinds on the target while silver
 * sparkles fly off (to ~1.65 s).
 */
export class GyroBall {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // The spin-up: a ring of glints whirls round the user.
    const r = Math.max(lr.width, lr.height) * 0.6;
    const spin = GyroBall.glintRing(r * 2, 12);
    Fx.place(spin, launch);
    fxEl.appendChild(spin);
    Fx.flash(launchEl, '#E8ECF4', 0.5);
    await Fx.anim(spin, [
      { transform: 'rotate(0deg) scale(.4,.3)', opacity: 0 },
      { transform: 'rotate(360deg) scale(1.1,.45)', opacity: 1, offset: 0.4 },
      { transform: 'rotate(900deg) scale(.9,.4)', opacity: 1, offset: 0.8 },
      { transform: 'rotate(1260deg) scale(.5,.25)', opacity: 0 }
    ], { duration: 800, easing: 'ease-in' });
    spin.remove();

    // The hit: the user darts in; a white whirl grinds on the target.
    const dart = FxEffects.dart(launchEl, v.dir);
    await Fx.wait(120);
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 6);
    setTimeout(() => Fx.shake(targetEl, 4), 250);
    const size = Math.max(tr.width, tr.height) * 0.9;
    const effects: Promise<void>[] = [dart];
    for (let i = 0; i < 3; i++) {
      const arc = document.createElement('div');
      const s = size * (0.5 + i * 0.25);
      arc.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:3px solid transparent;border-top-color:#ffffff;border-right-color:#D8DEE8;filter:drop-shadow(0 0 3px #ffffff)`;
      Fx.place(arc, target);
      fxEl.appendChild(arc);
      const turn = i % 2 ? -1 : 1;
      effects.push(
        Fx.anim(arc, [
          { transform: `rotate(0deg) scale(.5)`, opacity: 0 },
          { transform: `rotate(${turn * 360}deg) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `rotate(${turn * 900}deg) scale(1.1)`, opacity: 0 }
        ], { duration: 650, delay: i * 50, easing: 'ease-out' }).then(() => arc.remove())
      );
    }
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 6, '#DDE2EC');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
      const d = size * (0.55 + Math.random() * 0.25);
      effects.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(.5)`, opacity: 0 }
        ], { duration: 550, delay: 80 + Math.random() * 120, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);
  }

  /** A ring `size` px wide of `count` small white glints (spins as one piece). */
  private static glintRing(size: number, count: number): HTMLElement {
    const ring = document.createElement('div');
    ring.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none`;
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count;
      const s = i % 3 ? 7 : 11;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;left:${50 + Math.cos(a) * 46}%;top:${50 + Math.sin(a) * 46}%;width:${s}px;height:${s}px;margin:${-s / 2}px 0 0 ${-s / 2}px;border-radius:50%;background:radial-gradient(circle,#ffffff 0 40%,#D8DEE8 60%,#D8DEE800);box-shadow:0 0 5px #ffffff`;
      ring.appendChild(dot);
    }
    return ring;
  }
}
