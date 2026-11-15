import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Techno Blast, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/0/00/Techblaster_Gen5.png
 *
 * The user lights up with a cold cyan glow (0-0.6 s) while a white orb
 * swells in front of it (0.3-0.7 s). The orb shoots to the target
 * (0.7-0.95 s, hit at 0.95 s) and bursts into white sparkles with a few red
 * glints that twinkle round the target (to ~1.6 s).
 */
export class TechnoBlast {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, dir: 1 | -1) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(1.5) sepia(.4) hue-rotate(110deg) saturate(1.8) drop-shadow(0 0 8px #7CFFD8)', offset: 0.35 },
        { filter: 'brightness(1.5) sepia(.4) hue-rotate(110deg) saturate(1.8) drop-shadow(0 0 8px #7CFFD8)', offset: 0.7 },
        { filter: 'none' }
      ], { duration: 800, fill: 'none' })
    ];

    // The orb swells in front of the user.
    const size = Math.max(lr.width * 0.45, 34);
    const orb = document.createElement('div');
    orb.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#fff 0 45%,#EAF6FF 60%,#ffffff00 72%);box-shadow:0 0 16px #fff,0 0 30px #D8F0FF';
    const start: Point = { x: launch.x + dir * lr.width * 0.3, y: launch.y };
    Fx.place(orb, start);
    fxEl.appendChild(orb);
    await Fx.wait(300);
    await Fx.anim(orb, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 400, easing: 'ease-out' });

    // It shoots to the target.
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    await Fx.anim(orb, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${dx}px,${dy}px) scale(.8)` }
    ], { duration: 250, easing: 'ease-in' });
    orb.remove();

    // Hit: sparkles and red glints twinkle round the target.
    Fx.flash(targetEl, '#ffffff', 0.8);
    Fx.shake(targetEl, 6);
    const spread = Math.max(tr.width, 60);
    for (let i = 0; i < 14; i++) {
      const red = i % 5 === 4;
      const star = red ? TechnoBlast.glint() : FxGlyphs.sparkStar(8 + Math.random() * 8, '#F4FAFF');
      Fx.place(star, { x: target.x + (Math.random() * 2 - 1) * spread * 0.55, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.5 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-4px) scale(1.1)', opacity: 1, offset: 0.35 },
          { transform: 'translateY(-14px) scale(.3)', opacity: 0 }
        ], { duration: 450, delay: Math.random() * 250, easing: 'ease-out', fill: 'backwards' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);
  }

  /** A tiny red glint between the sparkles. */
  private static glint(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = 'width:5px;height:5px;border-radius:50%;pointer-events:none;background:#E83A3A;box-shadow:0 0 4px #FF6A6A';
    return el;
  }
}
