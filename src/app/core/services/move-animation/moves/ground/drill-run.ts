import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Drill Run, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/e/ea/Schlagbohrer_Gen5.png
 *
 * The user rushes at the target (0-0.3 s). At the hit (0.25 s) a spinning
 * dark drill bores into the target, framed by a flaring orange spiky ring,
 * while the target shakes (0.25-0.8 s); yellow sparks fly off as the drill
 * pulls out and the ring fades (0.6-1.05 s).
 */
export class DrillRun {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const rush = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)` },
      { transform: `${original} translate(${dx * 0.3}px,${dy * 0.3}px)`, offset: 0.45 },
      { transform: `${original} translate(0,0)` }
    ], { duration: 550, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(250);

    // The orange spiky ring behind the drill.
    const size = Math.max(tr.width * 0.7, 56);
    const ring = FxGlyphs.spikyBurst(size, '#FF7A1A', '#FFC24A00', '#FFC24A00');
    ring.style.filter = 'drop-shadow(0 0 4px #FF9A2A)';
    Fx.place(ring, target);
    fxEl.appendChild(ring);

    // The drill: a striped cone pointing along the attack, its stripes scrolling as it spins.
    const len = size * 0.75;
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const holder = document.createElement('div');
    holder.style.cssText = `position:absolute;width:${len}px;height:${len * 0.55}px;pointer-events:none;transform:rotate(${deg}deg);filter:drop-shadow(0 0 2px #FFFFFF88)`;
    const cone = document.createElement('div');
    cone.style.cssText =
      'width:100%;height:100%;clip-path:polygon(0 0,100% 50%,0 100%);' +
      'background:repeating-linear-gradient(60deg,#3A3A42 0 6px,#8A8A96 6px 9px,#1E1E24 9px 14px);background-size:28px 100%';
    holder.appendChild(cone);
    Fx.place(holder, target);
    fxEl.appendChild(holder);
    const spin = cone.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '0 -28px' }], { duration: 90, iterations: Infinity });
    const ux = Math.cos((deg * Math.PI) / 180);
    const uy = Math.sin((deg * Math.PI) / 180);
    const back = `translate(${-ux * len * 0.5}px,${-uy * len * 0.5}px) rotate(${deg}deg)`;
    const inn = `translate(${ux * len * 0.05}px,${uy * len * 0.05}px) rotate(${deg}deg)`;

    Fx.shakeField(fieldEl, 0.3);
    const boring = Fx.anim(holder, [
      { transform: back, opacity: 0 },
      { transform: inn, opacity: 1, offset: 0.25 },
      { transform: `translate(${ux * len * 0.12}px,${uy * len * 0.12}px) rotate(${deg}deg)`, opacity: 1, offset: 0.75 },
      { transform: back, opacity: 0 }
    ], { duration: 650, easing: 'ease-out' }).then(() => {
      spin.cancel();
      holder.remove();
    });
    const flare = Fx.anim(ring, [
      { transform: 'scale(.4) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.05) rotate(60deg)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.2) rotate(80deg)', opacity: 0 }
    ], { duration: 750, easing: 'ease-out' }).then(() => ring.remove());
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.shake(targetEl, 4), i * 120);
    Fx.flash(targetEl, '#FFC24A', 0.5);
    await Fx.wait(350);

    // Sparks fly off as the drill pulls out.
    const sparks: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const star = FxGlyphs.sparkStar(7 + Math.random() * 6, '#FFE84A');
      Fx.place(star, target);
      fxEl.appendChild(star);
      const ang = Math.random() * Math.PI * 2;
      const d = size * (0.5 + Math.random() * 0.4);
      sparks.push(
        Fx.anim(star, [
          { transform: 'translate(0,0) scale(.4)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d - v.power * 6}px) scale(1)`, opacity: 0 }
        ], { duration: 400 + Math.random() * 150, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    await Promise.all([rush, boring, flare, ...sparks]);
  }
}
