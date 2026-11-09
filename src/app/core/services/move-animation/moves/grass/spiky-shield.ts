import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Spiky Shield, after the XY animation: the user turns green and a glowing
 * green ring opens in front of it, facing the foe (0-0.35 s). A thick cone
 * of green spikes bursts out of the ring toward the foe (0.3-0.6 s), bristles
 * for a moment and fades with the green tint (to ~1.3 s).
 */
export class SpikyShield {
  private static readonly TINT = 'sepia(1) saturate(4) hue-rotate(60deg) brightness(1.05) drop-shadow(0 0 6px #40F070)';

  static async play(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const dir = v.dir;
    const total = 1300;

    const tint = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: SpikyShield.TINT, offset: 0.2 },
      { filter: SpikyShield.TINT, offset: 0.7 },
      { filter: 'none' }
    ], { duration: total, easing: 'ease-in-out', fill: 'none' });

    // The ring sits on the user's front, facing the foe.
    const ringAt: Point = { x: launch.x + dir * r.width * 0.3, y: launch.y };
    const ringSize = Math.max(r.height * 0.6, 50);
    const ring = document.createElement('div');
    ring.style.cssText =
      `width:${ringSize * 0.45}px;height:${ringSize}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(ellipse,#0A3A1Acc 0 30%,#3CE070 42%,#8CFFA8 52%,#20B04800 72%);box-shadow:0 0 14px #40F070';
    Fx.place(ring, ringAt);
    fxEl.appendChild(ring);
    const ringDone = Fx.anim(ring, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.8)', opacity: 0 }
    ], { duration: total - 100, easing: 'ease-out' }).then(() => ring.remove());

    // The spikes: long thin green triangles fanning out of the ring toward the foe.
    const reach = Math.max(r.width * 1.5, 110);
    const spikes: Promise<void>[] = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      // Spread over ±45°, packed a little toward the middle.
      const u = (i / (count - 1)) * 2 - 1;
      const spread = Math.sign(u) * Math.pow(Math.abs(u), 0.8) * 45 + (Math.random() * 2 - 1) * 4;
      const deg = dir > 0 ? spread : 180 - spread;
      const len = reach * (0.55 + Math.random() * 0.45);
      const width = 6 + Math.random() * 6;
      const shade = Math.random() < 0.5 ? '#1EC050' : '#38E06A';
      const spike = document.createElement('div');
      spike.style.cssText =
        `position:absolute;left:${ringAt.x}px;top:${ringAt.y - width / 2}px;width:${len}px;height:${width}px;transform-origin:0 50%;pointer-events:none;` +
        `clip-path:polygon(0 0,100% 50%,0 100%);background:linear-gradient(90deg,#0E8A34,${shade} 45%,#B8FFC8);filter:drop-shadow(0 0 3px #40F070)`;
      fxEl.appendChild(spike);
      const off = (Math.random() * 2 - 1) * ringSize * 0.25;
      const at = (s: number) => `translateY(${off}px) rotate(${deg}deg) scaleX(${s})`;
      const delay = 300 + Math.random() * 120;
      spikes.push(
        Fx.anim(spike, [
          { transform: at(0), opacity: 1 },
          { transform: at(1.05), opacity: 1, offset: 0.25 },
          { transform: at(1), opacity: 1, offset: 0.6 },
          { transform: at(1.1), opacity: 0 }
        ], { duration: total - delay - 80, delay, easing: 'ease-out' }).then(() => spike.remove())
      );
    }
    await Promise.all([tint, ringDone, ...spikes]);
  }
}
