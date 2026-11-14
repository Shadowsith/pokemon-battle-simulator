import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Searing Shot, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/6/6c/Flammenball_Gen5.png
 *
 * The scene turns black (0-0.25 s) and a glowing orange fireball swells on
 * the user (0.25-0.55 s). It bursts: fiery explosions pop all over the
 * field, the target included (0.55-1.25 s, hit 0.7 s). A red backdrop with
 * yellow rays opens round the user as the black fades (1.25-1.5 s), the
 * target glows red (1.5-2.2 s), then the rays fade (to ~2.45 s).
 */
export class SearingShot {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const tr = Fx.rect(targetEl);
    const black = Fx.backdrop(fieldEl, 'background:#000');
    await Fx.anim(black, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // A fireball swells on the user.
    const ball = FxGlyphs.firePuff(Math.max(Fx.rect(launchEl).width * 0.7, 44), 'hot');
    Fx.place(ball, launch);
    fxEl.appendChild(ball);
    await Fx.anim(ball, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1.15)', opacity: 1 }
    ], { duration: 300, easing: 'ease-out' });
    ball.remove();

    // It bursts: explosions all over the field, the target included.
    const effects: Promise<void>[] = [];
    const spots: Point[] = [target];
    for (let i = 0; i < 9; i++) spots.push({ x: W * (0.1 + Math.random() * 0.8), y: H * (0.15 + Math.random() * 0.7) });
    spots.forEach((at, i) => {
      const delay = i === 0 ? 150 : Math.random() * 600;
      effects.push(Fx.wait(delay).then(() => FxEffects.fireBlastCloud(fxEl, at, i === 0 ? Math.max(tr.width, 60) : 36 + Math.random() * 24, 5, '#FFE07A')));
    });
    await Fx.wait(150);
    Fx.flash(targetEl, '#FF8A2A', 0.7);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.5);
    await Fx.wait(550);

    // A red ray backdrop opens under the fading black round the user, the target glows red.
    const opening = FxEffects.burstBackdrop(fieldEl, launch, 'red');
    Fx.anim(black, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => black.remove());
    const rays = await opening;
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(7) hue-rotate(-35deg) brightness(.95)', offset: 0.25 },
        { filter: 'sepia(1) saturate(7) hue-rotate(-35deg) brightness(.95)', offset: 0.75 },
        { filter: 'none' }
      ], { duration: 700, fill: 'none' })
    );
    await Fx.wait(350);
    await Promise.all(effects);
    await Fx.anim(rays, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 });
    rays.remove();
  }
}
