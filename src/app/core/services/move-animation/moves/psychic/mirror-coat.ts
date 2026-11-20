import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The reflected blow leaves the panel at `FIRE` and hits the target at `HIT` (ms). */
const FIRE = 750;
const HIT = 950;

/**
 * Mirror Coat, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/2/20/Spiegelcape_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/2/28/Spiegelcape_Gen5.png
 *
 * A pale blue glass panel in a white frame grows in front of the user
 * (0-0.3 s), a glint sweeps across it and sparkles twinkle round it
 * (0.3-0.75 s). Then it flashes and flings the blow back: a bright cyan-white
 * streak shoots to the target (0.75-0.95 s, hit at 0.95 s), which flashes and
 * shakes, and the panel fades (to ~1.2 s).
 */
export class MirrorCoat {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.9, 50);
    const h = Math.max(r.height * 0.9, 50);
    const total = 1200;
    const at = (ms: number) => ms / total;

    const panel = Fx.box(w, h,
      'border:3px solid #ffffff;box-sizing:border-box;box-shadow:0 0 8px #CFF4FF,inset 0 0 10px #ffffffaa;overflow:hidden;' +
      'background:linear-gradient(160deg,#C8F0FFaa,#7FD0F088 50%,#A8E4FFaa)');
    const glint = Fx.box(w * 0.3, h * 1.6, 'left:0;top:0;background:linear-gradient(90deg,#ffffff00,#ffffffdd,#ffffff00)');
    panel.appendChild(glint);
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, panel, launch, [
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1)', opacity: 0.95, offset: at(300) },
        { transform: 'scale(1)', opacity: 0.95, offset: at(FIRE), filter: 'brightness(1)' },
        { transform: 'scale(1.04)', opacity: 1, offset: at(FIRE + 60), filter: 'brightness(1.8)' },
        { transform: 'scale(1)', opacity: 0.9, offset: at(1000), filter: 'brightness(1)' },
        { transform: 'scale(1)', opacity: 0, filter: 'brightness(1)' }
      ], { duration: total, easing: 'linear' }),
      Fx.anim(glint, [
        { transform: `translate(${-w * 0.4}px,${-h * 0.3}px) rotate(20deg)` },
        { transform: `translate(${w * 1.1}px,${-h * 0.3}px) rotate(20deg)` }
      ], { duration: 400, easing: 'ease-in-out', delay: 330 })
    ];
    for (let i = 0; i < 5; i++) {
      const p: Point = { x: launch.x + (Math.random() - 0.5) * w * 1.1, y: launch.y + (Math.random() - 0.5) * h * 1.1 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 5, '#BFF0FF'), p, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 300, easing: 'ease-in-out', delay: 300 + i * 80 })
      );
    }

    // The reflected blow.
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const streak = Fx.box(len * 0.35, 8, 'border-radius:4px;background:linear-gradient(90deg,#7FE0FF00,#BFF4FF,#ffffff);box-shadow:0 0 10px #7FE0FF');
    effects.push(
      Fx.spawn(fxEl, streak, launch, [
        { transform: `rotate(${angle}deg) translateX(0) scaleX(.3)`, opacity: 0 },
        { transform: `rotate(${angle}deg) translateX(${len * 0.3}px) scaleX(1)`, opacity: 1, offset: 0.3 },
        { transform: `rotate(${angle}deg) translateX(${len * 0.85}px) scaleX(.6)`, opacity: 1, offset: 0.95 },
        { transform: `rotate(${angle}deg) translateX(${len}px) scaleX(.3)`, opacity: 0 }
      ], { duration: (HIT - FIRE) / 0.95, easing: 'linear', delay: FIRE })
    );
    setTimeout(() => {
      Fx.flash(targetEl, '#9FE8FF', 0.6);
      Fx.shake(targetEl, 5);
    }, HIT);
    await Promise.all(effects);
  }
}
