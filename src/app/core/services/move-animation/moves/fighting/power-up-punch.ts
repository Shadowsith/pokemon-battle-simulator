import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Power-Up Punch, after the XY animation:
 * https://www.pokewiki.de/images/0/0a/Steigerungshieb_Gen6.png
 *
 * A glowing red-white orb charges at the user's fist, orange sparks spinning
 * round it (0-0.55 s); the user darts in and the scene washes white as a red
 * fist slams into the target inside a spiky burst (0.55-1.0 s; hit at 0.65 s),
 * then the user's Attack rises (1.0-1.8 s).
 */
export class PowerUpPunch {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dir = target.x >= launch.x ? 1 : -1;
    const fist: Point = { x: launch.x + dir * lr.width * 0.4, y: launch.y };
    const orb = Math.max(lr.width * 0.55, 40);
    const charge: Promise<unknown>[] = [
      Fx.spawn(fxEl, Fx.box(orb, orb, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 35%,#FF6A7A 55%,#E0203A00 72%);box-shadow:0 0 14px #FF3A4A'), fist, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.6 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 550, easing: 'ease-out' })
    ];
    for (let i = 0; i < 5; i++) {
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const a = (i / 5 + k / 8) * Math.PI * 2;
        frames.push({ transform: `translate(${Math.cos(a) * orb * 0.7}px,${Math.sin(a) * orb * 0.7}px)`, opacity: k === 0 || k === 6 ? 0 : 1 });
      }
      charge.push(Fx.spawn(fxEl, Fx.box(7, 7, 'border-radius:50%;background:#FFB03A;box-shadow:0 0 6px #FF8A2A'), fist, frames, { duration: 500, easing: 'linear' }));
    }
    await Promise.all(charge);

    const dart = FxEffects.dart(launchEl, dir);
    await Fx.wait(110);
    const wash = Fx.backdrop(fieldEl, 'background:#F4F0EC');
    Fx.flash(targetEl, '#FF3A4A', 0.6);
    Fx.shake(targetEl, 6);
    const burst = Math.max(tr.width * 1.1, 80);
    await Promise.all([
      dart,
      Fx.anim(wash, [{ opacity: 0 }, { opacity: 0.95, offset: 0.15 }, { opacity: 0.95, offset: 0.6 }, { opacity: 0 }], { duration: 450, easing: 'linear' }).then(() => wash.remove()),
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(burst, '#FFE8A0', '#FFF6D8', '#ffffff'), target, [
        { transform: 'scale(.3)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1.05)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }),
      Fx.spawn(fxEl, FxGlyphs.fistGlyph(burst * 0.45, 'red'), target, [
        { transform: `translateX(${-dir * 30}px) scale(.6)`, opacity: 0 },
        { transform: 'translateX(0) scale(1.1)', opacity: 1, offset: 0.25 },
        { transform: 'translateX(0) scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'translateX(0) scale(1)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' })
    ]);
    await FxEffects.statUpAura(refs, launch);
  }
}
