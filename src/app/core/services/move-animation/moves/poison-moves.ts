import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';

/** Hand-made animations for Poison-type moves. */
export class PoisonMoveAnimations {
  /** Hand-made Poison move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    acid: (refs, launch, target) => PoisonMoveAnimations.playAcidSpit(refs, launch, target),
    toxic: (refs, _launch, target) => PoisonMoveAnimations.playToxic(refs, target)
  };

  /**
   * Toxic: a glowing purple poison pool spreads on the ground under the target,
   * pink-purple bubbles well up around it and the sprite turns purple.
   */
  private static async playToxic(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const purple = '#7A2E9E';
    const dark = '#3A0F55';
    const bubbleColor = '#D77CF0';
    const r = targetEl.getBoundingClientRect();
    const spreadX = Math.max(r.width * 0.55, 30);
    const spreadY = Math.max(r.height * 0.5, 28);

    // 1. Ground layer: above the platforms, below HUD and sprites.
    const ground = document.createElement('div');
    ground.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fieldEl.insertBefore(ground, fieldEl.querySelector('.hud') ?? fieldEl.querySelector('.sprite'));
    const foot = Fx.footOf(targetEl, fieldEl);
    const w = Math.max(r.width * 1.7, 110);
    const pool = document.createElement('div');
    pool.style.cssText = `position:absolute;width:${w}px;height:${w * 0.32}px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,#FFE8FF 0%,#F2B8FF 18%,${purple} 42%,${dark} 72%,${dark}00 100%);box-shadow:0 0 18px ${purple}`;
    Fx.place(pool, foot);
    ground.appendChild(pool);
    const poolDur = 1900;
    const poolDone = Fx.anim(pool, [
      { transform: 'scale(.15)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.95, offset: 0.22 },
      { transform: 'scale(1.04)', opacity: 0.85, offset: 0.55 },
      { transform: 'scale(1)', opacity: 0.95, offset: 0.8 },
      { transform: 'scale(1.08)', opacity: 0 }
    ], { duration: poolDur, easing: 'ease-out' });
    await Fx.wait(300);

    // 2. Poisoned: the sprite turns purple while bubbles rise around it.
    const tint = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(1.05)', offset: 0.15 },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(.95)', offset: 0.85 },
      { filter: 'none' }
    ], { duration: 1400, easing: 'ease-in-out', fill: 'none' });
    const bubbles: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const size = 9 + Math.random() * 14;
      const b = document.createElement('div');
      b.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#FFF3FF,${bubbleColor} 40%,${purple}CC 85%);box-shadow:0 0 6px ${bubbleColor}`;
      Fx.place(b, {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (0.2 + Math.random() * 0.8) * spreadY
      });
      fxEl.appendChild(b);
      const rise = 26 + Math.random() * spreadY;
      const drift = Math.random() * 14 - 7;
      bubbles.push(
        Fx.anim(b, [
          { transform: 'translate(0,0) scale(.2)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,${-rise * 0.3}px) scale(1)`, opacity: 0.9, offset: 0.3 },
          { transform: `translate(${drift}px,${-rise}px) scale(1.25)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 250, easing: 'ease-out', delay: i * 60 }).then(() => b.remove())
      );
      if (i % 5 === 0) setTimeout(() => Fx.shake(targetEl, 2), i * 60);
    }
    await Promise.all([tint, ...bubbles, poolDone]);
    ground.remove();
  }

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
