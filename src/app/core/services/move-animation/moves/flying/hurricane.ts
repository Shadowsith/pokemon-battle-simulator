import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Hurricane, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/4/4e/Orkan_Gen5.png
 *
 * The user beats its wings, bobbing up and down (0-0.45 s). A bright sky-blue
 * backdrop with streaming wind lines fades in (0.35-0.6 s), and a white
 * whirlwind of spinning rings full of olive-gold specks spins up round the
 * target (0.6-1.9 s); the target shakes from the hit (0.75 s) on. The
 * backdrop fades (1.9-2.2 s).
 */
export class Hurricane {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const flap = Fx.anim(launchEl, [
      { transform: `${original} translateY(0)` },
      { transform: `${original} translateY(-8px)`, offset: 0.25 },
      { transform: `${original} translateY(2px)`, offset: 0.5 },
      { transform: `${original} translateY(-8px)`, offset: 0.75 },
      { transform: `${original} translateY(0)` }
    ], { duration: 450, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(350);

    // Sky backdrop with wind lines streaming past.
    const sky = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#7ACCF8,#2A9AE8 45%,#46B4F4 70%,#1E7ED8)');
    const lines = document.createElement('div');
    lines.style.cssText =
      'position:absolute;inset:-10% -50%;opacity:.7;' +
      'background:repeating-linear-gradient(180deg,#0000 0 9px,#D8F2FF88 9px 11px,#0000 11px 23px,#FFFFFF55 23px 24px,#0000 24px 37px)';
    sky.appendChild(lines);
    const stream = lines.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${launch.x < target.x ? '' : '-'}25%)` }], {
      duration: 600,
      iterations: Infinity
    });
    await Promise.all([flap, Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' })]);

    // The whirlwind round the target.
    const w = Math.max(tr.width * 0.9, 60);
    const height = Math.max(tr.height * 1.3, 90);
    const foot: Point = { x: target.x, y: target.y + tr.height * 0.4 };
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const ring = document.createElement('div');
      ring.style.cssText =
        `width:${w}px;height:${w * 0.32}px;border-radius:50%;pointer-events:none;` +
        'border:3px solid #FFFFFFdd;border-left-color:#FFFFFF00;border-bottom-color:#E8F6FF88;box-shadow:0 0 5px #FFFFFF99';
      Fx.place(ring, foot);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [
          { transform: 'translateY(0) rotate(0deg) scale(.7)', opacity: 0 },
          { transform: `translateY(${-height * 0.3}px) rotate(200deg) scale(1)`, opacity: 1, offset: 0.25 },
          { transform: `translateY(${-height * 0.8}px) rotate(500deg) scale(1.15)`, opacity: 0.85, offset: 0.8 },
          { transform: `translateY(${-height}px) rotate(640deg) scale(1.2)`, opacity: 0 }
        ], { duration: 650, delay: i * 70, easing: 'ease-out' }).then(() => ring.remove())
      );
    }
    for (let i = 0; i < 28; i++) {
      const speck = document.createElement('div');
      const s = 4 + Math.random() * 5;
      speck.style.cssText = `width:${s}px;height:${s}px;border-radius:30%;pointer-events:none;background:${i % 3 ? '#C8A83A' : '#E8D06A'};box-shadow:0 0 3px #A88A2A`;
      Fx.place(speck, foot);
      fxEl.appendChild(speck);
      const r = w * (0.25 + Math.random() * 0.25);
      const phase = Math.random() * Math.PI * 2;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const a = phase + t * Math.PI * 4;
        frames.push({
          transform: `translate(${Math.cos(a) * r}px,${-t * height + Math.sin(a) * r * 0.3}px) rotate(${t * 720}deg)`,
          opacity: Math.min(1, t * 6, (1 - t) * 4)
        });
      }
      effects.push(Fx.anim(speck, frames, { duration: 700, delay: Math.random() * 600, easing: 'linear' }).then(() => speck.remove()));
    }
    await Fx.wait(150);
    Fx.flash(targetEl, '#ffffff', 0.5);
    for (let i = 0; i < 5; i++) setTimeout(() => Fx.shake(targetEl, 4), i * 200);
    await Promise.all(effects);

    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    stream.cancel();
    sky.remove();
  }
}
