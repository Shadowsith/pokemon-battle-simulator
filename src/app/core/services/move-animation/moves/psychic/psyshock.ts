import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Psyshock, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/9/92/Psychoschock_Gen5.png
 *
 * Small orbs - white, dark grey and purple - circle the target and close in
 * on it (0-0.9 s). At the hit (0.9 s) a cluster of glowing blue squares
 * flickers up from the target's lower body and drifts up as they fade
 * (0.9-1.5 s).
 */
export class Psyshock {
  private static readonly ORBS = [
    'radial-gradient(circle,#FFFFFF,#FFFFFFaa 40%,#FFFFFF00 70%)',
    'radial-gradient(circle,#3A3A44,#3A3A44aa 45%,#3A3A4400 70%)',
    'radial-gradient(circle,#C84AE8,#7A1AA8aa 45%,#7A1AA800 70%)'
  ];

  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const rad = Math.max(tr.width * 0.75, 50);
    const orbs: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const orb = document.createElement('div');
      const s = 14;
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${Psyshock.ORBS[i % 3]}`;
      Fx.place(orb, target);
      fxEl.appendChild(orb);
      const phase = (Math.PI * 2 * i) / 6;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        const a = phase + t * Math.PI * 2.5;
        const d = rad * (1 - t * 0.85);
        frames.push({ transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.5}px)`, opacity: Math.min(1, t * 5, (1 - t) * 6) });
      }
      orbs.push(Fx.anim(orb, frames, { duration: 900, easing: 'ease-in' }).then(() => orb.remove()));
    }
    await Promise.all(orbs);

    // The hit: blue squares flicker up from the target's lower body.
    Fx.flash(targetEl, '#6AD8FF', 0.6);
    Fx.shake(targetEl, 5);
    const squares: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const sq = document.createElement('div');
      const s = 5 + Math.random() * 6;
      sq.style.cssText = `width:${s}px;height:${s}px;pointer-events:none;background:#E8FCFF;border:2px solid #4AC8F8;box-shadow:0 0 5px #4AC8F8`;
      Fx.place(sq, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.25, y: target.y + tr.height * (0.1 + Math.random() * 0.25) });
      fxEl.appendChild(sq);
      const rise = -10 - Math.random() * 20;
      squares.push(
        Fx.anim(sq, [
          { transform: 'translateY(0) rotate(45deg) scale(0)', opacity: 0 },
          { transform: `translateY(${rise * 0.3}px) rotate(45deg) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translateY(${rise * 0.6}px) rotate(45deg) scale(.8)`, opacity: 0.3, offset: 0.5 },
          { transform: `translateY(${rise * 0.8}px) rotate(45deg) scale(1)`, opacity: 1, offset: 0.7 },
          { transform: `translateY(${rise}px) rotate(45deg) scale(.6)`, opacity: 0 }
        ], { duration: 450, delay: Math.random() * 150, easing: 'ease-out' }).then(() => sq.remove())
      );
    }
    await Promise.all(squares);
  }
}
