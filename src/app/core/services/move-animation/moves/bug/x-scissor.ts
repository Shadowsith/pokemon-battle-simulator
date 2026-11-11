import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Red of the X-Scissor blades. */
const RED = '#FF3A5A';

/**
 * X-Scissor, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/52/Kreuzschere_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/3d/Kreuzschere_Gen5.png
 *
 * The user darts forward (0-0.26 s) while two red blade streaks sweep across
 * the target one after another, crossing into an X (0.1-0.22 s and
 * 0.2-0.32 s, hit at 0.32 s). A big white starburst glints on the cross and
 * red specks scatter (to ~0.9 s).
 */
export class XScissor {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.width * 1.5, 90);
    const parts: Promise<void>[] = [FxEffects.dart(launchEl, v.dir)];

    await Fx.wait(100);
    parts.push(XScissor.slash(fxEl, target, len, 40));
    await Fx.wait(100);
    parts.push(XScissor.slash(fxEl, target, len, 140));
    await Fx.wait(120);

    // Hit: a white starburst on the cross, red specks.
    Fx.flash(targetEl, '#ffffff', 0.8);
    Fx.shake(targetEl, 6);
    const glints: [number, Point, number][] = [
      [Math.max(tr.width * 0.9, 60), target, 0],
      [Math.max(tr.width * 0.4, 26), { x: target.x + tr.width * 0.25, y: target.y - tr.height * 0.2 }, 90],
      [Math.max(tr.width * 0.35, 22), { x: target.x - tr.width * 0.2, y: target.y + tr.height * 0.15 }, 160]
    ];
    for (const [size, at, delay] of glints) {
      const star = FxGlyphs.sparkStar(size, '#ffffff');
      Fx.place(star, at);
      fxEl.appendChild(star);
      parts.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.35 },
          { transform: 'scale(.2) rotate(45deg)', opacity: 0 }
        ], { duration: 420, delay, easing: 'ease-out', fill: 'backwards' }).then(() => star.remove())
      );
    }
    for (let i = 0; i < 10; i++) {
      const s = 3 + Math.random() * 3;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFE0E6,${RED} 60%,${RED}00);box-shadow:0 0 4px ${RED}`;
      Fx.place(dot, target);
      fxEl.appendChild(dot);
      const ang = Math.random() * Math.PI * 2;
      const d = tr.width * (0.3 + Math.random() * 0.4);
      parts.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.8 + 10}px)`, opacity: 0 }
        ], { duration: 500, delay: Math.random() * 60, easing: 'ease-out' }).then(() => dot.remove())
      );
    }
    await Promise.all(parts);
  }

  /** One red blade streak, `len` px long, sweeping through `c` at `angle` degrees. */
  private static slash(fxEl: HTMLElement, c: Point, len: number, angle: number): Promise<void> {
    const a = (angle * Math.PI) / 180;
    const start: Point = { x: c.x - (Math.cos(a) * len) / 2, y: c.y - (Math.sin(a) * len) / 2 };
    const blade = document.createElement('div');
    blade.style.cssText =
      `position:absolute;left:${start.x}px;top:${start.y - 2.5}px;width:${len}px;height:5px;border-radius:3px;pointer-events:none;transform-origin:0 50%;` +
      `background:linear-gradient(90deg,${RED}00,${RED} 25%,#FFE0E6 50%,${RED} 75%,${RED}00);box-shadow:0 0 6px ${RED}`;
    fxEl.appendChild(blade);
    return Fx.anim(blade, [
      { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: 0.35 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0 }
    ], { duration: 340, easing: 'ease-out' }).then(() => blade.remove());
  }
}
