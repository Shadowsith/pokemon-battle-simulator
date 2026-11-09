import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Origin Pulse, after the ORAS animation: cyan rings pulse out from the user
 * as the scene sinks into a deep teal sea (0-0.5 s). Glowing blue orbs gather
 * round the user (0.25-1.2 s) and thin light beams shoot out of it
 * (0.7-1.25 s). The orbs then stream over to the target (1.2-1.8 s) and
 * erupt in a big blue-white burst with crackling rays (1.8-2.4 s); the sea
 * clears (to ~2.7 s).
 */
export class OriginPulse {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const sea = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${launch.x}px ${launch.y}px,#1A6A7A,#0A3A4A 45%,#03141C)`);
    const seaIn = Fx.anim(sea, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: 'ease-out' });

    const layer = document.createElement('div');
    layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fxEl.appendChild(layer);

    // Rings pulse out from the user.
    const ringSize = Math.max(lr.height * 1.2, 90);
    const rings: Promise<void>[] = [];
    for (const delay of [0, 180]) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${ringSize}px;height:${ringSize}px;border-radius:50%;pointer-events:none;border:4px solid #9AF4FF;box-shadow:0 0 14px #40D8FF,inset 0 0 14px #40D8FF`;
      Fx.place(ring, launch);
      layer.appendChild(ring);
      rings.push(Fx.anim(ring, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], { duration: 500, delay, easing: 'ease-out' }).then(() => ring.remove()));
    }
    await Fx.wait(250);

    // Orbs gather round the user, pulsing; light beams shoot out of it.
    const orbs: HTMLElement[] = [];
    const homes: Point[] = [];
    const gather: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const s = 14 + Math.random() * 14;
      const orb = OriginPulse.orb(s);
      const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const d0 = Math.max(lr.width, 70) * (1 + Math.random() * 0.4);
      const d1 = d0 * 0.55;
      const from: Point = { x: launch.x + Math.cos(ang) * d0, y: launch.y + Math.sin(ang) * d0 * 0.7 };
      const home: Point = { x: launch.x + Math.cos(ang) * d1, y: launch.y + Math.sin(ang) * d1 * 0.7 };
      Fx.place(orb, home);
      layer.appendChild(orb);
      orbs.push(orb);
      homes.push(home);
      gather.push(
        Fx.anim(orb, [
          { transform: `translate(${from.x - home.x}px,${from.y - home.y}px) scale(.3)`, opacity: 0 },
          { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'translate(0,0) scale(.8)', opacity: 1, offset: 0.75 },
          { transform: 'translate(0,0) scale(1.1)', opacity: 1 }
        ], { duration: 750, delay: i * 25, easing: 'ease-out' })
      );
    }
    await Fx.wait(450);
    const beams: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const len = Math.max(lr.width * 2.4, 180) * (0.7 + Math.random() * 0.5);
      const ang = Math.random() * 360;
      const beam = document.createElement('div');
      beam.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y - 2}px;width:${len}px;height:4px;transform-origin:0 50%;border-radius:2px;pointer-events:none;background:linear-gradient(90deg,#ffffff,#7AE8FF 40%,#40C8FF00);box-shadow:0 0 6px #40D8FF`;
      layer.appendChild(beam);
      beams.push(
        Fx.anim(beam, [
          { transform: `rotate(${ang}deg) scaleX(0)`, opacity: 1 },
          { transform: `rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.5 },
          { transform: `rotate(${ang}deg) scaleX(1.1)`, opacity: 0 }
        ], { duration: 350, delay: i * 25, easing: 'ease-out' }).then(() => beam.remove())
      );
    }
    await Promise.all([seaIn, ...rings, ...gather]);

    // The orbs stream over to the target.
    const flights = orbs.map((orb, i) =>
      Fx.anim(orb, [
        { transform: 'translate(0,0) scale(1.1)', opacity: 1 },
        { transform: `translate(${target.x - homes[i].x}px,${target.y - homes[i].y}px) scale(.7)`, opacity: 1 }
      ], { duration: 280, delay: i * 30, easing: 'ease-in' }).then(() => orb.remove())
    );
    await Promise.all([...beams, ...flights]);

    await OriginPulse.burst(refs, layer, target);
    await Fx.anim(sea, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    sea.remove();
    layer.remove();
  }

  /** A big blue-white burst on the target with crackling rays shooting out. */
  private static async burst(refs: BattleStageRefs, layer: HTMLElement, target: Point) {
    const { fieldEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 1.6, 120);
    const glow = document.createElement('div');
    glow.style.cssText = `width:${size * 1.4}px;height:${size * 1.4}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 18%,#C8F4FFdd 32%,#50C8FF88 52%,#2080FF00 72%)`;
    const spikes = FxGlyphs.spikyBurst(size, '#40A8FF', '#A8E8FF', '#ffffff');
    Fx.place(glow, target);
    Fx.place(spikes, target);
    layer.append(glow, spikes);
    const effects: Promise<void>[] = [
      Fx.anim(glow, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1.05)', opacity: 0.9, offset: 0.65 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 600, easing: 'ease-out' }).then(() => glow.remove()),
      Fx.anim(spikes, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(12deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.2) rotate(20deg)', opacity: 0 }
      ], { duration: 600, easing: 'ease-out' }).then(() => spikes.remove())
    ];
    // Crackling rays: short zigzag bolts out of the blast.
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const len = size * (0.5 + Math.random() * 0.35);
      const x1 = target.x + Math.cos(ang) * len;
      const y1 = target.y + Math.sin(ang) * len;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 3px #40C8FF)');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('points', OriginPulse.crackle(target, { x: x1, y: y1 }));
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#E8FAFF');
      line.setAttribute('stroke-width', '2');
      svg.appendChild(line);
      layer.appendChild(svg);
      effects.push(
        Fx.anim(svg, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0.4, offset: 0.5 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], {
          duration: 380,
          delay: 60 + Math.random() * 200,
          easing: 'linear'
        }).then(() => svg.remove())
      );
    }
    Fx.flash(targetEl, '#A8E8FF', 0.9);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.7);
    await Promise.all(effects);
  }

  /** SVG points for a short jagged bolt from `a` to `b`. */
  private static crackle(a: Point, b: Point): string {
    const pts: string[] = [];
    const segs = 5;
    const nx = -(b.y - a.y);
    const ny = b.x - a.x;
    const n = Math.max(Math.hypot(nx, ny), 1);
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const off = k === 0 || k === segs ? 0 : (Math.random() * 2 - 1) * 8;
      pts.push(`${(a.x + (b.x - a.x) * t + (nx / n) * off).toFixed(1)},${(a.y + (b.y - a.y) * t + (ny / n) * off).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  /** A glowing blue orb `s` px across. */
  private static orb(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 20%,#9AE4FF 45%,#3A90FF88 65%,#2060FF00 75%);box-shadow:0 0 10px #40A8FF`;
    return el;
  }
}
