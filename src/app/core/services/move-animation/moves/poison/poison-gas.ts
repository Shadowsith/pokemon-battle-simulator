import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Poison Gas, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/c8/Giftwolke_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/ca/Giftwolke_Gen5.png
 *
 * Pink-purple gas billows out of the user and streams over to the target in
 * a widening trail of puffs (0-0.6 s). It wraps the target in a thick cloud
 * that turns it purple (0.55-1.2 s; hit at 0.6 s), then a few poison bubbles
 * rise off it as the cloud clears (to ~1.5 s).
 */
export class PoisonGas {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const big = Math.max(tr.width * 0.55, 40);
    const effects: Promise<unknown>[] = [];

    // The trail: puffs leave the user one after another and swell on the way.
    for (let i = 0; i < 12; i++) {
      const s = big * (0.5 + Math.random() * 0.3);
      const wob = (Math.random() * 2 - 1) * 14;
      const puff = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 40% 40%,#FFC8F0ee,#E070D0cc 50%,#B050C000 72%)');
      effects.push(
        Fx.spawn(fxEl, puff, launch, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${dx * 0.4}px,${dy * 0.4 + wob}px) scale(.7)`, opacity: 0.95, offset: 0.4 },
          { transform: `translate(${dx}px,${dy + wob * 0.4}px) scale(1.2)`, opacity: 0.8, offset: 0.85 },
          { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 0 }
        ], { duration: 460, delay: i * 18, easing: 'ease-out' })
      );
    }
    await Fx.wait(600);

    // The cloud wraps the target and poisons it.
    Fx.shake(targetEl, 4);
    effects.push(
      FxEffects.smokePuff(fxEl, target, Math.max(tr.width * 1.2, 80), ['#F0A0E8dd', '#C060D0bb']),
      Fx.wait(250).then(() => FxEffects.smokePuff(fxEl, { x: target.x, y: target.y - tr.height * 0.15 }, Math.max(tr.width, 70), ['#F8C0F0cc', '#D070D8aa'])),
      Fx.glow(targetEl, 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(1.05)', 750)
    );
    setTimeout(() => Fx.shake(targetEl, 3), 300);
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: target.y - Math.random() * tr.height * 0.3 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.poisonBubble(7 + Math.random() * 6), at, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: 'translate(0,-10px) scale(1)', opacity: 1, offset: 0.35 },
          { transform: `translate(${Math.random() * 10 - 5}px,-34px) scale(.7)`, opacity: 0 }
        ], { duration: 500, delay: 400 + i * 70, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
