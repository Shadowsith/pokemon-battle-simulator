import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The user bursts at `BURST` (ms); the light shoots over and hits at `HIT` (ms). */
const BURST = 300;
const HIT = 750;

/**
 * Metal Burst, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/f/ff/Metallsto%C3%9F_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/cb/Metallsto%C3%9F_Gen5.png
 *
 * The scene darkens (0-0.3 s). Silvery white sparks spray up off the user
 * as it flashes steel-white (0.3-0.75 s) and thin streaks of light shoot
 * from it to the target (0.5-0.75 s). The damage it took bursts back on the
 * target in a yellow-white spiky flash (0.75-1.15 s); the scene clears.
 */
export class MetalBurst {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.85 }], { duration: BURST, easing: 'ease-out' }),
      Fx.glow(launchEl, 'brightness(1.8) saturate(0)', 450, BURST)
    ];
    for (let i = 0; i < 12; i++) {
      const x = launch.x + (((i * 5) % 9) / 8 - 0.5) * lr.width * 0.9;
      effects.push(Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#ffffff;box-shadow:0 0 5px #DDE4F0'), { x, y: launch.y + lr.height * 0.35 }, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: `translate(${(i % 2 ? 1 : -1) * 6}px,${-lr.height * 0.4}px)`, opacity: 1, offset: 0.4 },
        { transform: `translate(${(i % 2 ? 1 : -1) * 10}px,${-lr.height * 0.8}px)`, opacity: 0 }
      ], { duration: 450, delay: BURST + (i * 37) % 200, easing: 'ease-out' }));
    }
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    for (let i = 0; i < 3; i++) {
      const off = (i - 1) * 8;
      const streak = Fx.box(len, 2, `left:${launch.x}px;top:${launch.y + off}px;transform-origin:0 50%;background:linear-gradient(90deg,#ffffff00,#ffffff 60%,#ffffff00);filter:drop-shadow(0 0 3px #ffffff)`);
      fxEl.appendChild(streak);
      effects.push(Fx.anim(streak, [
        { transform: `rotate(${ang}deg) scaleX(0)`, opacity: 1 },
        { transform: `rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.6 },
        { transform: `rotate(${ang}deg) scaleX(1)`, opacity: 0 }
      ], { duration: 380, delay: 500 + i * 40, easing: 'ease-in' }).then(() => streak.remove()));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#FFF6C0', 0.7);
      Fx.shake(targetEl, 6);
      return Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.8, 50), '#FFE04A', '#FFF6C0', '#ffffff'), target, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(1.15) rotate(20deg)', opacity: 0 }
      ], { duration: 400, easing: 'ease-out' });
    }));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.85 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }
}
