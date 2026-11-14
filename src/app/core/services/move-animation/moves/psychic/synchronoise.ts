import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Synchronoise, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/e/e6/Synchrol%C3%A4rm_Gen5.png
 *
 * The scene darkens (0-0.3 s). Rainbow ripple rings (magenta, green,
 * yellow) spread over the ground from the user while yellow sparks crackle
 * round it (0.3-1.35 s). At the hit (1.0 s) white rings pulse round the
 * target and small rings drift up from it (1.0-1.9 s); the scene clears
 * (to ~2.15 s).
 */
export class Synchronoise {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });

    // Rainbow ripples over the ground, yellow sparks round the user.
    const foot: Point = { x: launch.x, y: launch.y + lr.height * 0.4 };
    const width = Math.max(lr.width * 3.2, 240);
    const effects: Promise<void>[] = [
      FxEffects.groundRipples(fxEl, foot, width, ['#E040C0', '#FF7AE0'], 2, 260, 600),
      Fx.wait(90).then(() => FxEffects.groundRipples(fxEl, foot, width, ['#5AE04A', '#A8FF8A'], 2, 260, 600)),
      Fx.wait(180).then(() => FxEffects.groundRipples(fxEl, foot, width, ['#F8E030', '#FFF6A0'], 2, 260, 600))
    ];
    for (let i = 0; i < 8; i++) {
      const spark = FxGlyphs.sparkStar(10 + Math.random() * 6, '#FFE84A');
      const ang = Math.random() * Math.PI * 2;
      const r = Math.max(lr.width, 50) * (0.5 + Math.random() * 0.3);
      Fx.place(spark, { x: launch.x + Math.cos(ang) * r, y: launch.y + Math.sin(ang) * r * 0.6 });
      fxEl.appendChild(spark);
      effects.push(
        Fx.anim(spark, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 260, delay: 50 + i * 70, easing: 'ease-out', fill: 'backwards' }).then(() => spark.remove())
      );
    }
    await Fx.wait(700);

    // The hit: white rings pulse round the target, small rings drift up.
    Fx.flash(targetEl, '#FFFFFF', 0.6);
    Fx.shake(targetEl, 5);
    const size = Math.max(tr.width, tr.height, 50) * 0.9;
    for (let i = 0; i < 4; i++) {
      const ring = Synchronoise.ring(size * (0.45 + (i % 2) * 0.15), 4);
      const ang = (Math.PI * 2 * i) / 4;
      Fx.place(ring, { x: target.x + Math.cos(ang) * size * 0.3, y: target.y + Math.sin(ang) * size * 0.25 });
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [
          { transform: 'scale(.3)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.2)', opacity: 0 }
        ], { duration: 400, delay: i * 60, easing: 'ease-out', fill: 'backwards' }).then(() => ring.remove())
      );
    }
    for (let i = 0; i < 7; i++) {
      const ring = Synchronoise.ring(6 + Math.random() * 6, 1.5);
      Fx.place(ring, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.6, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.3 });
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [
          { transform: 'translateY(0)', opacity: 0 },
          { transform: 'translateY(-8px)', opacity: 1, offset: 0.3 },
          { transform: 'translateY(-30px)', opacity: 0 }
        ], { duration: 550, delay: 200 + Math.random() * 150, easing: 'ease-out', fill: 'backwards' }).then(() => ring.remove())
      );
    }
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 250 });
    dim.remove();
  }

  /** A white ring `s` px wide with a `w` px rim. */
  private static ring(s: number, w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:${w}px solid #FFFFFFee;box-shadow:0 0 4px #FFFFFF`;
    return el;
  }
}
