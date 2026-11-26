import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** Hearts leave the user from `SEND` (ms) and reach the target at `ARRIVE` (ms). */
const SEND = 500;
const ARRIVE = 1150;

/**
 * Captivate, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/19/Liebreiz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0c/Liebreiz_Gen5.png
 *
 * Pink hearts pop up round the user among twinkling white sparkles
 * (0-0.6 s), then four hearts float over to the target on wavy paths
 * (0.5-1.15 s). The target flashes pink and its Sp. Atk drops sharply: it
 * turns blue under stat-down bubbles (1.25-2.15 s).
 */
export class Captivate {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const s = Math.max(r.width * 0.22, 16);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const at: Point = { x: launch.x + Math.cos(a) * r.width * 0.4, y: launch.y + Math.sin(a) * r.height * 0.35 };
      effects.push(Fx.spawn(fxEl, FxGlyphs.heartGlyph(s), at, [
        { transform: 'translateY(0) scale(.2)', opacity: 0 },
        { transform: 'translateY(-6px) scale(1.1)', opacity: 1, offset: 0.35 },
        { transform: 'translateY(-16px) scale(.8)', opacity: 0 }
      ], { duration: 500, delay: (i * 67) % 250, easing: 'ease-out' }));
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(s * 0.7, '#ffffff'), { x: launch.x - Math.cos(a) * r.width * 0.3, y: launch.y - Math.sin(a) * r.height * 0.3 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 300, delay: 60 + (i * 89) % 300, easing: 'ease-out' }));
    }
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let i = 0; i < 4; i++) {
      const wave = (i % 2 ? 1 : -1) * 18;
      effects.push(Fx.spawn(fxEl, FxGlyphs.heartGlyph(s * 1.1), { x: launch.x, y: launch.y - r.height * 0.15 }, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: `translate(${dx * 0.33}px,${dy * 0.33 + wave}px) scale(1)`, opacity: 1, offset: 0.33 },
        { transform: `translate(${dx * 0.66}px,${dy * 0.66 - wave}px) scale(1)`, opacity: 1, offset: 0.66 },
        { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 }
      ], { duration: ARRIVE - SEND - 120, delay: SEND + i * 40, easing: 'ease-in-out' }));
    }
    await Promise.all(effects);
    Fx.flash(targetEl, '#FF9AD0', 0.6);
    await Fx.wait(100);
    await FxEffects.blueStatDrop(refs, target);
  }
}
