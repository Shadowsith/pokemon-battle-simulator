import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Sludge Wave, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/4/42/Schlammwoge_Gen5.png
 *
 * The user heaves itself up (0-0.3 s) and a wave of purple sludge rolls
 * out along the ground to the target (0.3-0.9 s). At the hit (0.9 s) the
 * sludge washes over the target, which glows purple, and purple bubbles
 * well up and pop round it (0.9-1.8 s).
 */
export class SludgeWave {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    await Fx.anim(launchEl, [
      { transform: `${original} translateY(0) scale(1,1)`, transformOrigin: 'center bottom' },
      { transform: `${original} translateY(-6px) scale(.94,1.1)`, transformOrigin: 'center bottom', offset: 0.6 },
      { transform: `${original} translateY(0) scale(1,1)`, transformOrigin: 'center bottom' }
    ], { duration: 300, easing: 'ease-out', fill: 'none' });

    // A wave of sludge rolls along the ground: blobs pour from the user's feet to the target's.
    const from: Point = { x: launch.x, y: launch.y + lr.height * 0.35 };
    const to: Point = { x: target.x, y: target.y + tr.height * 0.3 };
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const s = 16 + Math.random() * 14;
      const blob = document.createElement('div');
      blob.style.cssText =
        `width:${s * 1.5}px;height:${s}px;border-radius:50% 50% 40% 40%;pointer-events:none;` +
        'background:radial-gradient(ellipse at 40% 30%,#C890F0,#8A3AD0 45%,#5A1A9A 80%,#5A1A9A00)';
      const jitter = (Math.random() * 2 - 1) * 10;
      Fx.place(blob, { x: from.x, y: from.y + jitter });
      fxEl.appendChild(blob);
      effects.push(
        Fx.anim(blob, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${(to.x - from.x) * 0.2}px,${(to.y - from.y) * 0.2 - 8}px) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) scale(1.1)`, opacity: 1, offset: 0.85 },
          { transform: `translate(${to.x - from.x}px,${to.y - from.y - 6}px) scale(1.3)`, opacity: 0 }
        ], { duration: 600, delay: i * 25, easing: 'ease-in', fill: 'backwards' }).then(() => blob.remove())
      );
    }
    await Fx.wait(600);

    // The hit: the target glows purple, bubbles well up and pop.
    Fx.shake(targetEl, 5);
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(4) hue-rotate(230deg) brightness(.9)', offset: 0.25 },
        { filter: 'sepia(1) saturate(4) hue-rotate(230deg) brightness(.9)', offset: 0.7 },
        { filter: 'none' }
      ], { duration: 800, fill: 'none' })
    );
    for (let i = 0; i < 10; i++) {
      const bubble = FxGlyphs.poisonBubble(9 + Math.random() * 9);
      Fx.place(bubble, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.4, y: target.y + tr.height * (0.3 - Math.random() * 0.3) });
      fxEl.appendChild(bubble);
      const rise = 20 + Math.random() * tr.height * 0.6;
      effects.push(
        Fx.anim(bubble, [
          { transform: 'translateY(0) scale(.3)', opacity: 0 },
          { transform: `translateY(${-rise * 0.6}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translateY(${-rise}px) scale(1.5)`, opacity: 0 }
        ], { duration: 550, delay: 50 + Math.random() * 350, easing: 'ease-out', fill: 'backwards' }).then(() => bubble.remove())
      );
    }
    await Promise.all(effects);
  }
}
