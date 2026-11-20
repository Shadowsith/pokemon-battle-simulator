import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The whirl spins up until `DASH`, the user rams the target at `HIT` (ms). */
const DASH = 500;
const HIT = 650;
const TOTAL = 1000;

/**
 * Rapid Spin, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/e/e2/Turbodreher_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0a/Turbodreher_Gen5.png
 *
 * A white whirlwind ring spins up round the user, which bobs as if spinning
 * (the sprite itself never turns) (0-0.5 s). Wrapped in the whirl it darts
 * into the target (0.5-0.65 s, hit at 0.65 s): a white starburst flashes, and
 * the user slides back home as the whirl fades (0.65-1.0 s).
 */
export class RapidSpin {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const size = Math.max(r.width, r.height, 50) * 1.15;
    const base = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.65;
    const dy = (target.y - launch.y) * 0.65;
    const at = (ms: number) => ms / TOTAL;
    const spin = v.dir * 360;

    const whirl = Fx.box(size, size * 0.8,
      'border-radius:50%;background:repeating-conic-gradient(#ffffff00 0deg 20deg,#ffffffcc 30deg 40deg,#E0F0FF66 50deg,#ffffff00 60deg 90deg);' +
      '-webkit-mask-image:radial-gradient(closest-side,#0000 45%,#000 60%,#000 85%,#0000 100%);mask-image:radial-gradient(closest-side,#0000 45%,#000 60%,#000 85%,#0000 100%)');
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, whirl, launch, [
        { transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0 },
        { transform: `translate(0,0) rotate(${spin}deg) scale(1)`, opacity: 1, offset: at(200) },
        { transform: `translate(0,0) rotate(${spin * 3}deg) scale(1)`, opacity: 1, offset: at(DASH), easing: 'ease-in' },
        { transform: `translate(${dx}px,${dy}px) rotate(${spin * 4}deg) scale(1)`, opacity: 1, offset: at(HIT), easing: 'ease-out' },
        { transform: `translate(0,0) rotate(${spin * 5.5}deg) scale(1.1)`, opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' })
    ];
    const bob: Keyframe[] = [{ transform: base }];
    for (let i = 1; i <= 4; i++) bob.push({ transform: `${base} translateY(${i % 2 ? -5 : 0}px)`, offset: at(i * 110) });
    bob.push(
      { transform: base, offset: at(DASH), easing: 'ease-in' },
      { transform: `${base} translate(${dx}px,${dy}px)`, offset: at(HIT), easing: 'ease-out' },
      { transform: base }
    );
    effects.push(Fx.anim(launchEl, bob, { duration: TOTAL, easing: 'linear', fill: 'none' }));

    await Fx.wait(HIT);
    Fx.flash(targetEl, '#ffffff', 0.5);
    Fx.shake(targetEl, 5);
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(Fx.rect(targetEl).width * 0.5, 32), '#D8E8F8', '#ffffff', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
      ], { duration: 260, easing: 'ease-out' })
    );
    await Promise.all(effects);
  }
}
