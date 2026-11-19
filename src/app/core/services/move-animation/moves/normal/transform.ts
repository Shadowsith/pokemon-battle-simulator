import { BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Transform, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/aa/Wandler_Gen4.gif
 * - Gen 5: https://www.pokewiki.de/images/c/cc/Wandler_Gen5.png
 *
 * The user flashes white (0-0.2 s) and melts down into a flat slab
 * (0.2-0.45 s). It stretches back up in jerks while a flickering mosaic of
 * grey and lilac pixel blocks covers it (0.45-0.95 s), then flashes white
 * again and settles (0.95-1.2 s). Copying the target is not modelled, so the
 * sprite itself stays the same.
 */
export class Transform {
  static async play(refs: BattleStageRefs) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const base = launchEl.style.transform;
    const white = 'brightness(0) invert(1) drop-shadow(0 0 4px #fff)';
    // translateY(37.5%) keeps the slab's bottom edge where the sprite stands.
    const slab = `${base} translateY(37.5%) scale(1.15,.25)`;
    const body = Fx.anim(launchEl, [
      { transform: `${base} scale(1)`, filter: 'none' },
      { transform: `${base} scale(1)`, filter: white, offset: 0.1 },
      { transform: `${base} scale(1)`, filter: 'none', offset: 0.17 },
      { transform: slab, filter: 'none', offset: 0.375 },
      { transform: `${base} translateY(25%) scale(1.1,.5)`, filter: 'none', offset: 0.5 },
      { transform: `${base} translateY(20%) scale(1.1,.6)`, filter: 'none', offset: 0.58 },
      { transform: `${base} translateY(8%) scale(1.04,.84)`, filter: 'none', offset: 0.68 },
      { transform: `${base} translateY(4%) scale(1.02,.92)`, filter: 'none', offset: 0.76 },
      { transform: `${base} scale(1)`, filter: 'none', offset: 0.8 },
      { transform: `${base} scale(1)`, filter: white, offset: 0.86 },
      { transform: `${base} scale(1)`, filter: 'none' }
    ], { duration: 1200, easing: 'linear', fill: 'none' });

    // 0.45-0.95 s: a flickering mosaic of pixel blocks over the sprite.
    const cols = 6;
    const rows = 6;
    const bw = r.width / cols;
    const bh = r.height / rows;
    const tones = ['#8A8A96', '#B8B8C4', '#9C88B8', '#C8B8E0', '#6E6E7A'];
    const blocks: Promise<unknown>[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() < 0.25) continue;
        const block = Fx.box(bw + 0.5, bh + 0.5, `left:${r.left - f.left + col * bw}px;top:${r.top - f.top + row * bh}px;background:${tones[Math.floor(Math.random() * tones.length)]}`);
        fxEl.appendChild(block);
        const frames: Keyframe[] = [];
        for (let k = 0; k <= 8; k++) frames.push({ opacity: k === 0 || k === 8 ? 0 : Math.random() < 0.6 ? 0.85 : 0.15 });
        blocks.push(Fx.anim(block, frames, { duration: 500, delay: 450, easing: 'steps(1)' }).then(() => block.remove()));
      }
    }
    await Promise.all([body, ...blocks]);
  }
}
