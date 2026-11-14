import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Sacred Sword, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/3/3e/Sanctoklinge_Gen5.png
 *
 * After a short pause (0-0.2 s) a white blade streak slashes diagonally up
 * across the target (0.2-0.4 s, hit 0.3 s). Glowing blue orbs pop along the
 * cut and drift apart (0.3-0.9 s).
 */
export class SacredSword {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.height * 1.5, 110);
    const angle = v.dir * -55;
    await Fx.wait(200);

    // The blade streak: a thin white line with a pale blue glow (glow on the wrapper).
    const wrap = document.createElement('div');
    wrap.style.cssText = `width:${len}px;height:8px;pointer-events:none;filter:drop-shadow(0 0 5px #8AD8FF);transform:rotate(${angle}deg)`;
    const line = document.createElement('div');
    line.style.cssText = 'width:100%;height:100%;clip-path:polygon(0 50%,8% 20%,100% 45%,100% 55%,8% 80%);background:linear-gradient(90deg,#FFFFFF00,#FFFFFF 30%,#E8F8FF)';
    wrap.appendChild(line);
    Fx.place(wrap, target);
    fxEl.appendChild(wrap);
    const effects: Promise<void>[] = [
      Fx.anim(line, [
        { clipPath: 'polygon(0 50%,0 50%,0 50%,0 50%,0 50%)', opacity: 1 },
        { clipPath: 'polygon(0 50%,8% 20%,100% 45%,100% 55%,8% 80%)', opacity: 1, offset: 0.4 },
        { clipPath: 'polygon(100% 50%,100% 45%,100% 45%,100% 55%,100% 55%)', opacity: 0.6 }
      ], { duration: 380, easing: 'ease-out' }).then(() => wrap.remove())
    ];
    await Fx.wait(100);

    // The hit: blue orbs pop along the cut.
    Fx.flash(targetEl, '#BFE8FF', 0.6);
    Fx.shake(targetEl, 5);
    const rad = (angle * Math.PI) / 180;
    for (let i = 0; i < 12; i++) {
      const t = Math.random() - 0.5;
      const s = 6 + Math.random() * 9;
      const orb = document.createElement('div');
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#FFFFFF,#7AD0FF 45%,#2A8CF0 75%,#2A8CF000);box-shadow:0 0 6px #5AB8FF`;
      Fx.place(orb, { x: target.x + Math.cos(rad) * len * t * 0.8, y: target.y + Math.sin(rad) * len * t * 0.8 });
      fxEl.appendChild(orb);
      const ang = Math.random() * Math.PI * 2;
      const d = 10 + Math.random() * 18;
      effects.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(0)', opacity: 0 },
          { transform: 'translate(0,0) scale(1.1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - 8}px) scale(.5)`, opacity: 0 }
        ], { duration: 500, delay: Math.abs(t) * 150, easing: 'ease-out', fill: 'backwards' }).then(() => orb.remove())
      );
    }
    await Promise.all(effects);
  }
}
