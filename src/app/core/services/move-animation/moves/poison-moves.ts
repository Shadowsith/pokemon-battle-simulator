import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';

/** Hand-made animations for Poison-type moves. */
export class PoisonMoveAnimations {
  /** Hand-made Poison move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    acid: (refs, launch, target) => PoisonMoveAnimations.playAcidSpit(refs, launch, target)
  };

  /**
   * Acid:the caster spits a quick volley of dark purple poison droplets that
   * fly in a shallow arc and splash on the target.
   */
  private static async playAcidSpit(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const purple = '#5A1F8C';
    const dark = '#2A0B45';
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 36 + Math.abs(dx) * 0.08;
    const drops = 7;
    const gap = 75;
    const travel = 440;
    const steps = 8;

    const landed: Promise<void>[] = [];
    for (let i = 0; i < drops; i++) {
      const size = 11 + Math.random() * 7;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#C79BEA,${purple} 45%,${dark});box-shadow:0 0 5px ${purple}`;
      Fx.place(drop, { x: launch.x + (Math.random() * 10 - 5), y: launch.y + (Math.random() * 10 - 5) });
      fxEl.appendChild(drop);
      // Each droplet lands a little off-centre so the volley spreads over the target.
      const hx = dx + (Math.random() * 30 - 15);
      const hy = dy + (Math.random() * 24 - 12);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wobble = k % 2 ? 1.15 : 0.88;
        frames.push({
          transform: `translate(${hx * t}px,${hy * t - Math.sin(t * Math.PI) * lift}px) scale(${(0.6 + t * 0.5) * wobble},${(0.6 + t * 0.5) / wobble})`,
          opacity: t === 0 ? 0 : 1
        });
      }
      landed.push(
        Fx.anim(drop, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          drop.remove();
          PoisonMoveAnimations.acidSplash(fxEl, { x: launch.x + hx, y: launch.y + hy }, purple);
          if (i === 0) Fx.flash(targetEl, purple, 0.45);
          if (i % 2 === 0) Fx.shake(targetEl, 3);
        })
      );
    }
    await Promise.all(landed);
    Fx.flash(targetEl, purple, 0.5);
    await Fx.wait(250);
  }

  /** A few dark purple specks that burst out where a poison droplet hits. */
  private static acidSplash(fxEl: HTMLElement, at: Point, color: string) {
    for (let i = 0; i < 4; i++) {
      const s = 4 + Math.random() * 4;
      const speck = document.createElement('div');
      speck.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${color}`;
      Fx.place(speck, at);
      fxEl.appendChild(speck);
      const ang = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 14;
      Fx.anim(speck, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 8}px) scale(.4)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => speck.remove());
    }
  }
}
