import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The light builds on the user until `SHOOT` (ms) and hits at `HIT` (ms). */
const SHOOT = 650;
const HIT = 950;

/**
 * Mirror Shot, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/12/Spiegelsalve_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/2c/Spiegelsalve_Gen5.png
 *
 * White glints twinkle round the user as a dazzling white glow swells over
 * it like light off a mirror (0-0.65 s). A burst of glittering light orbs
 * and a bright ring shoot to the target (0.65-0.95 s), which flashes white
 * and shakes; glints twinkle over it (0.95-1.35 s).
 */
export class MirrorShot {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const s = Math.max(lr.width, lr.height, 60);
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, Fx.box(s * 1.1, s * 1.1, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 25%,#F4F0FFcc 45%,#E8E0FF44 62%,#E8E0FF00 72%)'), launch, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: SHOOT + 250, easing: 'ease-out' })
    ];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(10, '#ffffff'), { x: launch.x + Math.cos(a) * s * 0.5, y: launch.y + Math.sin(a) * s * 0.4 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(45deg)', opacity: 1, offset: 0.5 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 320, delay: (i * 83) % 400, easing: 'ease-out' }));
    }
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let i = 0; i < 8; i++) {
      const sz = 6 + (i % 3) * 4;
      const jx = (((i * 5) % 7) / 6 - 0.5) * 30;
      const jy = (((i * 3) % 5) / 4 - 0.5) * 24;
      effects.push(Fx.spawn(fxEl, Fx.box(sz, sz, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 40%,#F0E8FF88 65%,#F0E8FF00 75%)'), launch, [
        { transform: `translate(${jx * 0.3}px,${jy * 0.3}px)`, opacity: 0 },
        { transform: `translate(${dx * 0.2 + jx}px,${dy * 0.2 + jy}px)`, opacity: 1, offset: 0.2 },
        { transform: `translate(${dx + jx * 0.4}px,${dy + jy * 0.4}px)`, opacity: 0.8 }
      ], { duration: HIT - SHOOT, delay: SHOOT + i * 15, easing: 'ease-in' }));
    }
    effects.push(Fx.spawn(fxEl, Fx.box(18, 18, 'border-radius:50%;border:3px solid #ffffff;box-shadow:0 0 6px #E8E0FF'), launch, [
      { transform: 'translate(0,0) scale(.5)', opacity: 0 },
      { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 1 }
    ], { duration: HIT - SHOOT, delay: SHOOT, easing: 'ease-in' }));
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#ffffff', 0.7);
      Fx.shake(targetEl, 5);
      return Promise.all(Array.from({ length: 5 }, (_, i) => Fx.spawn(fxEl, FxGlyphs.sparkStar(9, '#ffffff'),
        { x: target.x + (i - 2) * tr.width * 0.2, y: target.y + (((i * 3) % 5) / 4 - 0.5) * tr.height * 0.6 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 300, delay: 50 + i * 50, easing: 'ease-out' }))).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
