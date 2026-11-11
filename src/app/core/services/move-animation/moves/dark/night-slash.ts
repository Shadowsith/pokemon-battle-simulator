import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Night Slash, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a8/Nachthieb_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/dd/Nachthieb_Gen5.png
 *
 * The scene darkens and purple speed lines rush past (0-0.25 s). Three red
 * blades slash across the target in quick succession (0.25-0.6 s, hit at
 * 0.3 s); glowing red orbs burst out round it and drift away (0.35-1.05 s)
 * while a purple streak swipes across it (0.65-0.95 s). The scene clears
 * (1.05-1.3 s).
 */
export class NightSlash {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.width * 1.2, 80);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    FxEffects.speedLines(dim, fieldEl.clientWidth, fieldEl.clientHeight, v.dir, ['#7A4AA8', '#B04A6A']);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // Three red blades, each cutting along a slightly different line.
    const parts: Promise<void>[] = [-28, 18, -6].map((deg, i) => {
      const y = target.y + (i - 1) * tr.height * 0.15;
      const blade = NightSlash.blade(len, 7, '#D0202A', '#FFB0B0');
      // The blade turns round its left end (the end it grows from); place that end so its middle crosses the target.
      const a = v.dir > 0 ? deg : 180 - deg;
      const rad = (a * Math.PI) / 180;
      blade.style.left = `${target.x - (Math.cos(rad) * len) / 2}px`;
      blade.style.top = `${y - (Math.sin(rad) * len) / 2 - 3.5}px`;
      fxEl.appendChild(blade);
      return Fx.anim(blade, [
        { transform: `rotate(${a}deg) scaleX(0)`, transformOrigin: '0 50%', opacity: 1 },
        { transform: `rotate(${a}deg) scaleX(1)`, transformOrigin: '0 50%', opacity: 1, offset: 0.45 },
        { transform: `rotate(${a}deg) scale(1,.2)`, transformOrigin: '0 50%', opacity: 0 }
      ], { duration: 220, delay: i * 110, easing: 'ease-out' }).then(() => blade.remove());
    });
    await Fx.wait(50);
    Fx.flash(targetEl, '#FF4A4A', 0.6);
    Fx.shake(targetEl, 6);
    setTimeout(() => Fx.shake(targetEl, 4), 220);

    // Red orbs burst out round the target.
    for (let i = 0; i < 12; i++) {
      const s = 6 + Math.random() * 6;
      const orb = document.createElement('div');
      orb.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF0E8,#FF4A3A 55%,#FF4A3A00);box-shadow:0 0 6px #FF3A2A`;
      Fx.place(orb, target);
      fxEl.appendChild(orb);
      const ang = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const d = tr.width * (0.45 + Math.random() * 0.35);
      const dx = Math.cos(ang) * d;
      const dy = Math.sin(ang) * d * 0.55;
      parts.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${dx}px,${dy - 14}px) scale(.5)`, opacity: 0 }
        ], { duration: 650, delay: 50 + Math.random() * 120, easing: 'ease-out' }).then(() => orb.remove())
      );
    }

    // A purple streak swipes across the target.
    await Fx.wait(300);
    const streak = NightSlash.blade(len * 1.3, 10, '#6A2A9A', '#E0B8FF');
    streak.style.left = `${target.x - len * 0.65}px`;
    streak.style.top = `${target.y + tr.height * 0.1 - 5}px`;
    fxEl.appendChild(streak);
    const from = v.dir > 0 ? '0 50%' : '100% 50%';
    parts.push(
      Fx.anim(streak, [
        { transform: 'scaleX(0)', transformOrigin: from, opacity: 0.9 },
        { transform: 'scaleX(1)', transformOrigin: from, opacity: 0.9, offset: 0.5 },
        { transform: 'scale(1,.2)', transformOrigin: from, opacity: 0 }
      ], { duration: 300, easing: 'ease-out' }).then(() => streak.remove())
    );
    await Promise.all(parts);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }

  /** A tapered blade stroke `len` x `h` px: `color` edges round a pale `core`, with a soft glow. */
  private static blade(len: number, h: number, color: string, core: string): HTMLElement {
    // The glow sits on a wrapper: clip-path on the same element would cut the drop-shadow off.
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:absolute;width:${len}px;height:${h}px;pointer-events:none;filter:drop-shadow(0 0 4px ${color})`;
    const shape = document.createElement('div');
    shape.style.cssText = `width:100%;height:100%;clip-path:polygon(0 50%,20% 0,80% 0,100% 50%,80% 100%,20% 100%);background:linear-gradient(90deg,${color}00,${color} 25%,${core} 50%,${color} 75%,${color}00)`;
    wrap.appendChild(shape);
    return wrap;
  }
}
