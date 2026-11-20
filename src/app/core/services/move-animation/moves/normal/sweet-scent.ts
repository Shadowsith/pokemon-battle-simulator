import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Total length of the scent part, ms; then the evasion drop follows. */
const SCENT = 1250;

/**
 * Sweet Scent, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/02/Lockduft_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/1/1d/Lockduft_Gen5.png
 *
 * A sweet pink haze washes over the scene (0-0.3 s) while pink petals drift
 * across and pale pink rings float up (0.1-1.1 s); the target turns pink
 * (0.4-1.0 s) and the haze clears (1.0-1.25 s). Then its evasion drops: it
 * turns blue under stat-down bubbles (1.25 s to ~2.15 s).
 */
export class SweetScent {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = Fx.rect(fieldEl).width || 640;
    const r = Fx.rect(targetEl);
    const at = (ms: number) => ms / SCENT;

    // A pink haze over the whole scene, sprites included.
    const haze = Fx.box(0, 0, 'inset:0;width:auto;height:auto;background:#FF9AC8;mix-blend-mode:screen;opacity:0');
    fxEl.appendChild(haze);
    const effects: Promise<void>[] = [
      Fx.anim(haze, [
        { opacity: 0 },
        { opacity: 0.4, offset: at(300) },
        { opacity: 0.4, offset: at(1000) },
        { opacity: 0 }
      ], { duration: SCENT, easing: 'linear' }),
      Fx.glow(targetEl, 'sepia(1) saturate(3) hue-rotate(290deg) brightness(1.2)', 600, 400)
    ];
    for (let i = 0; i < 12; i++) {
      const start: Point = { x: W * (0.05 + Math.random() * 0.5), y: 30 + Math.random() * 150 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.petalGlyph(9 + Math.random() * 5, '#FF8AB8'), start, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          { transform: 'translate(60px,10px) rotate(120deg)', opacity: 1, offset: 0.3 },
          { transform: 'translate(150px,40px) rotate(300deg)', opacity: 1, offset: 0.75 },
          { transform: 'translate(200px,55px) rotate(400deg)', opacity: 0 }
        ], { duration: 800, easing: 'linear', delay: 100 + Math.random() * 250 })
      );
    }
    for (let i = 0; i < 5; i++) {
      const p: Point = { x: target.x + (Math.random() * 2 - 1) * r.width * 0.6, y: target.y + r.height * 0.2 };
      effects.push(
        Fx.spawn(fxEl, Fx.box(14, 14, 'border-radius:50%;border:2px solid #FFC0DC;box-shadow:0 0 4px #FF9AC8'), p, [
          { transform: 'translateY(0) scale(.5)', opacity: 0 },
          { transform: 'translateY(-15px) scale(1)', opacity: 0.9, offset: 0.4 },
          { transform: 'translateY(-40px) scale(1.2)', opacity: 0 }
        ], { duration: 600, easing: 'ease-out', delay: 250 + i * 120 })
      );
    }
    await Promise.all(effects);
    haze.remove();
    await FxEffects.blueStatDrop(refs, target);
  }
}
