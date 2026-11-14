import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Secret Sword, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/e/e0/Mystoschwert_Gen5.png
 *
 * The scene dims (0-0.25 s) and a faint white streak flashes past above the
 * target (0.25-0.45 s). A tall cyan blade of light drops straight down onto
 * the target (0.45-0.75 s). At the hit (0.75 s) three cyan blade arcs slash
 * across it while white sparkles shoot up and yellow orbs pop (to ~1.3 s);
 * the scene clears (to ~1.55 s).
 */
export class SecretSword {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.7 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // A faint streak flashes past above the target.
    const streak = document.createElement('div');
    const sw = Math.max(tr.width * 1.4, 100);
    streak.style.cssText = `width:${sw}px;height:3px;pointer-events:none;background:linear-gradient(90deg,#FFFFFF00,#FFFFFFcc,#FFFFFF00);transform:rotate(${v.dir * -12}deg)`;
    Fx.place(streak, { x: target.x, y: target.y - tr.height * 0.5 });
    fxEl.appendChild(streak);
    await Fx.anim(streak, [
      { translate: `${-v.dir * sw * 0.6}px 0`, opacity: 0 },
      { translate: '0 0', opacity: 1, offset: 0.5 },
      { translate: `${v.dir * sw * 0.6}px 0`, opacity: 0 }
    ], { duration: 200, easing: 'linear' });
    streak.remove();

    // A tall cyan blade of light drops onto the target (glow on the wrapper).
    const bh = Math.max(tr.height * 1.4, 110);
    const blade = document.createElement('div');
    blade.style.cssText = `width:14px;height:${bh}px;pointer-events:none;filter:drop-shadow(0 0 6px #4AE8E0)`;
    blade.innerHTML = '<div style="width:100%;height:100%;clip-path:polygon(50% 0,100% 12%,62% 100%,38% 100%,0 12%);background:linear-gradient(180deg,#FFFFFF,#9AF8F0 40%,#2AC8C8)"></div>';
    Fx.place(blade, { x: target.x, y: target.y - bh * 0.35 });
    fxEl.appendChild(blade);
    await Fx.anim(blade, [
      { transform: `translateY(${-bh}px) scaleY(.6)`, opacity: 0 },
      { transform: 'translateY(0) scaleY(1)', opacity: 1 }
    ], { duration: 300, easing: 'ease-in' });

    // The hit: cyan arcs slash across, sparkles shoot up, yellow orbs pop.
    Fx.flash(targetEl, '#9AF8F0', 0.7);
    Fx.shake(targetEl, 6);
    const effects: Promise<void>[] = [
      Fx.anim(blade, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).then(() => blade.remove())
    ];
    const arc = Math.max(tr.width * 1.3, 90);
    [-35, -10, 15].forEach((tilt, i) => {
      const el = document.createElement('div');
      el.style.cssText = `width:${arc}px;height:${arc * 0.5}px;border-radius:50%;pointer-events:none;border-top:5px solid #6AF0F0;filter:drop-shadow(0 0 4px #2AC8E8)`;
      Fx.place(el, { x: target.x, y: target.y - tr.height * 0.1 + i * 8 });
      fxEl.appendChild(el);
      effects.push(
        Fx.anim(el, [
          { transform: `rotate(${v.dir * (tilt - 25)}deg) scale(.7)`, opacity: 0 },
          { transform: `rotate(${v.dir * tilt}deg) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `rotate(${v.dir * (tilt + 15)}deg) scale(1.05)`, opacity: 0 }
        ], { duration: 350, delay: i * 70, easing: 'ease-out', fill: 'backwards' }).then(() => el.remove())
      );
    });
    for (let i = 0; i < 8; i++) {
      const yellow = i % 2 === 1;
      const el = yellow ? SecretSword.orb(8 + Math.random() * 5) : FxGlyphs.sparkStar(9 + Math.random() * 5, '#FFFFFF');
      Fx.place(el, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.4, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3 });
      fxEl.appendChild(el);
      const rise = yellow ? 8 : 26 + Math.random() * 14;
      effects.push(
        Fx.anim(el, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-4px) scale(1.1)', opacity: 1, offset: 0.3 },
          { transform: `translateY(${-rise}px) scale(.6)`, opacity: 0 }
        ], { duration: 450, delay: 60 + i * 40, easing: 'ease-out', fill: 'backwards' }).then(() => el.remove())
      );
    }
    await Promise.all(effects);
    Fx.anim(dim, [{ opacity: 0.7 }, { opacity: 0 }], { duration: 250 }).then(() => dim.remove());
  }

  /** A glowing yellow orb, `s` px wide. */
  private static orb(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#FFFFFF,#FFE84A 50%,#F0B01A);box-shadow:0 0 6px #FFE84A`;
    return el;
  }
}
