import { Point, BattleStageRefs, MoveAnimRegistry } from '../../animation.types';
import { Fx } from '../../fx';
import { RelicSong } from './relic-song';

/** Hand-made animations for Normal-type sound attacks (Relic Song lives in `relic-song.ts`). */
export class NormalSoundMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    boomburst: (refs, launch, target) => NormalSoundMoveAnimations.playBoomburst(refs, launch, target),
    relicsong: (refs, launch, target) => RelicSong.play(refs, launch, target)
  };

  /**
   * Boomburst, after the XY animation: the user rears up while red-pink rays
   * radiate from it and yellow zigzag sparks crackle at its mouth (0-0.65 s).
   * The scene turns orange and five shockwave rings roll out over the ground
   * from the user (0.6-1.9 s, 0.12 s apart) with glowing orange orbs; they
   * hit the target at 0.95 s with an orange flash and shakes, then clear.
   */
  private static async playBoomburst(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const lFoot = Fx.footOf(launchEl, fieldEl);

    // Red-pink rays radiate from the user; yellow sparks crackle at its mouth.
    const c = `${launch.x}px ${launch.y}px`;
    const rays = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${c},#0000 0 10%,#4A1830aa 60%),repeating-conic-gradient(from 0deg at ${c},#7A2A50 0 7deg,#FF5A8A 7deg 9deg,#7A2A50 9deg 16deg)`
    );
    const original = launchEl.style.transform;
    const effects: Promise<unknown>[] = [
      Fx.anim(rays, [{ opacity: 0 }, { opacity: 0.85, offset: 0.25 }, { opacity: 0.85, offset: 0.75 }, { opacity: 0 }], { duration: 650, easing: 'linear' }).then(() => rays.remove()),
      Fx.anim(launchEl, [
        { transform: `${original} translateY(0) scale(1,1)` },
        { transform: `${original} translateY(-8px) scale(.97,1.05)`, offset: 0.4 },
        { transform: `${original} translateY(0) scale(1.03,.97)`, offset: 0.7 },
        { transform: `${original} translateY(0) scale(1,1)` }
      ], { duration: 650, easing: 'ease-out', fill: 'none' })
    ];
    const mouth: Point = { x: launch.x + (target.x >= launch.x ? 1 : -1) * lr.width * 0.25, y: launch.y - lr.height * 0.2 };
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const len = 16 + Math.random() * 14;
      const x0 = mouth.x + Math.cos(ang) * 8;
      const y0 = mouth.y + Math.sin(ang) * 8;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 3px #FFE040)');
      const bolt = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      bolt.setAttribute('points', Fx.zigzagPoints(x0, y0, x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len, 4));
      bolt.setAttribute('fill', 'none');
      bolt.setAttribute('stroke', '#FFE860');
      bolt.setAttribute('stroke-width', '2.5');
      svg.appendChild(bolt);
      fxEl.appendChild(svg);
      effects.push(
        Fx.anim(svg, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], {
          duration: 250,
          delay: 150 + i * 60,
          easing: 'linear'
        }).then(() => svg.remove())
      );
    }
    await Fx.wait(600);

    // The orange scene and the shockwave rings rolling over the ground.
    const orange = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 60%,#F0A050,#D06A28 60%,#8A3A10)');
    effects.push(Fx.anim(orange, [{ opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0.85, offset: 0.75 }, { opacity: 0 }], { duration: 1200, easing: 'linear' }).then(() => orange.remove()));
    const reach = Math.hypot(W, H) * 1.2;
    for (let i = 0; i < 5; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${reach}px;height:${reach * 0.3}px;border-radius:50%;pointer-events:none;border:6px solid #FFD070;box-shadow:0 0 12px #FFB040,inset 0 0 12px #FFB040`;
      Fx.place(ring, lFoot);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [{ transform: 'scale(.05)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 800, delay: i * 120, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    for (let i = 0; i < 12; i++) {
      const s = 10 + Math.random() * 10;
      const orb = document.createElement('div');
      orb.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 20%,#FFC060 50%,#FF802000 72%);box-shadow:0 0 6px #FF9030`;
      const from: Point = { x: lFoot.x + (Math.random() * 2 - 1) * 30, y: lFoot.y - Math.random() * 20 };
      const to: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.5 };
      Fx.place(orb, from);
      fxEl.appendChild(orb);
      effects.push(
        Fx.anim(orb, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${(to.x - from.x) * 0.5}px,${(to.y - from.y) * 0.5}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(.6)`, opacity: 0 }
        ], { duration: 600, delay: 100 + Math.random() * 400, easing: 'ease-out' }).then(() => orb.remove())
      );
    }

    // The waves hit the target.
    await Fx.wait(350);
    const flashSize = Math.max(tr.width * 1.6, 120);
    const flash = document.createElement('div');
    flash.style.cssText = `width:${flashSize}px;height:${flashSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF4D0 0 25%,#FFC060aa 45%,#FF902000 70%)`;
    Fx.place(flash, target);
    fxEl.appendChild(flash);
    Fx.flash(targetEl, '#FFC060', 0.7);
    for (const at of [0, 150, 300]) setTimeout(() => Fx.shake(targetEl, 6), at);
    Fx.shakeField(fieldEl, 0.6);
    effects.push(
      Fx.anim(flash, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.15)', opacity: 0 }], { duration: 500, easing: 'ease-out' })
        .then(() => flash.remove())
    );
    await Promise.all(effects);
  }
}
