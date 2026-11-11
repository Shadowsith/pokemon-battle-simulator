import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/** Pink of Sucker Punch's orb and burst. */
const PINK = '#FF4AC8';

/**
 * Sucker Punch, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/7d/Tiefschlag_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/36/Tiefschlag_Gen5.png
 *
 * The user darts forward (0-0.26 s) as a pink orb with a streaking tail zips
 * low in from its side and slams into the target (0.04-0.24 s, hit at
 * 0.24 s): a pink ring bursts and pink specks scatter off it (to ~0.85 s).
 */
export class SuckerPunch {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const parts: Promise<void>[] = [FxEffects.dart(launchEl, v.dir)];

    // A pink orb with a tail zips low into the target.
    const from: Point = { x: launch.x + v.dir * 30, y: target.y + tr.height * 0.15 };
    const tail = Math.max(Math.abs(target.x - from.x) * 0.35, 40);
    const orb = document.createElement('div');
    orb.style.cssText =
      `position:absolute;left:${from.x - (v.dir > 0 ? tail : 0)}px;top:${from.y - 7}px;width:${tail + 14}px;height:14px;pointer-events:none;border-radius:7px;` +
      `background:linear-gradient(${v.dir > 0 ? 90 : 270}deg,${PINK}00,${PINK}88 60%,#FFE0F4 88%,#ffffff);box-shadow:0 0 8px ${PINK}`;
    fxEl.appendChild(orb);
    const dx = target.x - from.x;
    await Fx.anim(orb, [
      { transform: 'translateX(0) scaleY(.6)', opacity: 0 },
      { transform: `translateX(${dx * 0.3}px) scaleY(1)`, opacity: 1, offset: 0.25 },
      { transform: `translateX(${dx}px) scaleY(1)`, opacity: 1 }
    ], { duration: 200, delay: 40, easing: 'ease-in' });
    orb.remove();

    // Hit: a pink ring bursts and specks scatter.
    const hit: Point = { x: target.x, y: from.y };
    Fx.flash(targetEl, PINK, 0.6);
    Fx.shake(targetEl, 6);
    const size = Math.max(tr.width * 0.6, 50);
    const ring = document.createElement('div');
    ring.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;border:5px solid ${PINK};background:radial-gradient(circle,#ffffff 0 20%,${PINK}88 40%,${PINK}00 60%);box-shadow:0 0 10px ${PINK}`;
    Fx.place(ring, hit);
    fxEl.appendChild(ring);
    parts.push(
      Fx.anim(ring, [
        { transform: 'scale(.2,.15)', opacity: 1 },
        { transform: 'scale(1,.7)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.3,.9)', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => ring.remove())
    );
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFE0F4,${PINK} 60%,${PINK}00);box-shadow:0 0 4px ${PINK}`;
      Fx.place(dot, hit);
      fxEl.appendChild(dot);
      const ang = -Math.PI * Math.random();
      const d = tr.width * (0.35 + Math.random() * 0.45);
      parts.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.8}px) scale(.8)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${Math.cos(ang) * d * 1.1}px,${Math.sin(ang) * d * 0.8 + 12}px) scale(.3)`, opacity: 0 }
        ], { duration: 550, delay: Math.random() * 80, easing: 'ease-out' }).then(() => dot.remove())
      );
    }
    await Promise.all(parts);
  }
}
