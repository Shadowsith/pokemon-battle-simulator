import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The user hops at these times (ms); the blow lands at `HIT`. */
const HOPS = [0, 300];
const HIT = 700;

/**
 * Return, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/86/R%C3%BCckkehr_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/3/33/R%C3%BCckkehr_Gen5.png
 *
 * The user hops happily twice in place (0-0.25 s and 0.3-0.55 s). Then a
 * heartfelt blow lands (0.7 s): a white starburst flashes on the target,
 * pale blue sparkles drift up off it and it shakes (to ~1.2 s).
 */
export class Return {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const lr = Fx.rect(launchEl);
    const base = launchEl.style.transform;
    const hop = Math.max(lr.height * 0.18, 10);
    const effects: Promise<void>[] = HOPS.map((t) =>
      Fx.anim(launchEl, [
        { transform: base, easing: 'ease-out' },
        { transform: `${base} translateY(${-hop}px)`, offset: 0.5, easing: 'ease-in' },
        { transform: base }
      ], { duration: 250, delay: t, easing: 'linear', fill: 'none' })
    );
    await Fx.wait(HIT);
    Fx.flash(targetEl, '#ffffff', 0.5);
    Fx.shake(targetEl, 5);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(r.width * 0.5, 32), '#E0E8F8', '#ffffff', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 280, easing: 'ease-out' })
    );
    for (let i = 0; i < 7; i++) {
      const p: Point = { x: target.x + (Math.random() * 2 - 1) * r.width * 0.4, y: target.y + (Math.random() * 2 - 1) * r.height * 0.3 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.ringSparkle(10 + Math.random() * 5, '#A8C8FF', '#D8E8FF'), p, [
          { transform: 'translateY(0) scale(.3)', opacity: 0 },
          { transform: 'translateY(-8px) scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'translateY(-20px) scale(.6)', opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: 60 + i * 30 })
      );
    }
    await Promise.all(effects);
  }
}
