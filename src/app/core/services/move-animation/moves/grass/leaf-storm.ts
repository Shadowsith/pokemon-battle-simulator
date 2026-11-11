import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Leaf Storm, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/23/Bl%C3%A4ttersturm_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/6b/Bl%C3%A4ttersturm_Gen5.png
 *
 * The scene turns light green with soft white clouds (0-0.25 s). A storm of
 * spinning leaves streams from the user over to the target in wavy lines
 * (0.25-1.4 s); a green energy burst flares on the target as the storm
 * reaches it and the target flashes white (hit at 0.85 s). The scene clears
 * (1.4-1.65 s), then the user's Sp. Atk falls sharply: blue bubbles drift
 * down over it (1.65-2.55 s).
 */
export class LeafStorm {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);

    const bg = Fx.backdrop(fieldEl, LeafStorm.SKY);
    await Fx.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The storm: leaves stream over in wavy lines, spinning as they go.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const storm: Promise<void>[] = [];
    for (let i = 0; i < 30; i++) {
      const leaf = FxGlyphs.leafGlyph(12 + Math.random() * 10);
      Fx.place(leaf, launch);
      fxEl.appendChild(leaf);
      const lane = (Math.random() * 2 - 1) * Math.max(tr.height * 0.5, 30);
      const amp = 10 + Math.random() * 16;
      const phase = Math.random() * Math.PI * 2;
      const spin = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const off = lane * Math.sin(t * Math.PI) + amp * Math.sin(phase + t * Math.PI * 3);
        // Past the target the leaves fly on a little and fade.
        const reach = t * 1.25;
        frames.push({
          transform: `translate(${dx * reach + nx * off}px,${dy * reach + ny * off}px) rotate(${spin * t}deg)`,
          opacity: t === 0 ? 0 : t > 0.85 ? (1 - t) / 0.15 : 1
        });
      }
      storm.push(Fx.anim(leaf, frames, { duration: 750, delay: i * 15, easing: 'linear', fill: 'backwards' }).then(() => leaf.remove()));
    }
    await Fx.wait(600);

    // The burst: a green flare on the target, which flashes white.
    const flare = document.createElement('div');
    const fs = Math.max(tr.width, tr.height) * 0.9;
    flare.style.cssText = `position:absolute;width:${fs}px;height:${fs}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 12%,#C8FF8A 30%,#5FE04A99 55%,#2AA83A00 72%)`;
    Fx.place(flare, target);
    fxEl.appendChild(flare);
    Fx.shake(targetEl, 7);
    setTimeout(() => Fx.shake(targetEl, 5), 260);
    await Promise.all([
      ...storm,
      Fx.anim(flare, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out' }).then(() => flare.remove()),
      Fx.anim(targetEl, [
        { filter: 'brightness(1)' },
        { filter: 'brightness(0) invert(1)', offset: 0.15 },
        { filter: 'brightness(0) invert(1)', offset: 0.6 },
        { filter: 'brightness(1)' }
      ], { duration: 400, fill: 'none' })
    ]);

    await Fx.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    bg.remove();

    // The user's Sp. Atk falls sharply.
    await FxEffects.statDownBubbles(refs, launch);
  }

  /** Light green sky with soft white cloud ellipses. */
  private static readonly SKY =
    'background:radial-gradient(ellipse 14% 5% at 18% 22%,#ffffffcc,#ffffff00),' +
    'radial-gradient(ellipse 16% 5% at 62% 14%,#ffffffcc,#ffffff00),' +
    'radial-gradient(ellipse 12% 4% at 85% 40%,#ffffffbb,#ffffff00),' +
    'radial-gradient(ellipse 15% 5% at 35% 58%,#ffffffbb,#ffffff00),' +
    'radial-gradient(ellipse 14% 5% at 75% 78%,#ffffffaa,#ffffff00),' +
    'linear-gradient(180deg,#B8F0A0,#8EDC78 55%,#A8E890)';
}
