import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The user charges until `FIRE` (ms); the beam reaches the target at `HIT` (ms) and fades by `END` (ms). */
const FIRE = 850;
const HIT = 980;
const END = 1350;

/**
 * Charge Beam, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/ac/Ladestrahl_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/a/a0/Ladestrahl_Gen5.png
 *
 * The scene darkens (0-0.25 s). Pale green-yellow bolts flicker round the
 * user while yellow sparks gather into it (0.15-0.75 s); it lights up in a
 * swelling yellow ball of light (0.6-0.85 s). A white-yellow beam shoots to
 * the target (0.85-0.98 s), which glows yellow and crackles until the beam
 * fades (0.98-1.35 s). The scene clears (1.35-1.6 s).
 */
export class ChargeBeam {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out' })];

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      const reach = Math.max(lr.width, 60) * 0.9;
      const bolt = FxGlyphs.lightning(f.width, f.height, { x: launch.x + Math.cos(a) * reach, y: launch.y + Math.sin(a) * reach * 0.8 }, { x: launch.x + Math.cos(a) * reach * 0.3, y: launch.y + Math.sin(a) * reach * 0.25 }, 10, '#F4FFD0', '#C8E84A', 2);
      fxEl.appendChild(bolt);
      effects.push(Fx.anim(bolt, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 0.3, offset: 0.5 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], {
        duration: 300, delay: 150 + i * 120, easing: 'linear'
      }).then(() => bolt.remove()));
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const reach = Math.max(lr.width, 60) * 0.75;
      effects.push(Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#FFF27A;box-shadow:0 0 4px #FFE04A'), launch, [
        { transform: `translate(${Math.cos(a) * reach}px,${Math.sin(a) * reach * 0.7}px)`, opacity: 0 },
        { transform: `translate(${Math.cos(a) * reach * 0.7}px,${Math.sin(a) * reach * 0.5}px)`, opacity: 1, offset: 0.3 },
        { transform: 'translate(0,0)', opacity: 0.8 }
      ], { duration: 400, delay: 200 + (i * 41) % 350, easing: 'ease-in' }));
    }
    const ball = Math.max(lr.width, 60) * 0.9;
    effects.push(Fx.spawn(fxEl, Fx.box(ball, ball, 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 20%,#FFF27Add 40%,#FFE04A55 60%,#FFE04A00 72%)'), launch, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.45 },
      { transform: 'scale(1.1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: FIRE - 600 + 300, delay: 600, easing: 'ease-out' }));
    effects.push(Fx.glow(launchEl, 'brightness(1.6) sepia(1) saturate(4) hue-rotate(10deg)', 500, 550));

    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const len = Math.hypot(dx, dy);
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const beam = Fx.box(len, 12, `left:${launch.x}px;top:${launch.y - 6}px;transform-origin:0 50%;border-radius:6px;background:linear-gradient(180deg,#FFF27A00,#FFF6B0 25%,#ffffff 50%,#FFF6B0 75%,#FFF27A00);filter:drop-shadow(0 0 6px #FFE04A)`);
    fxEl.appendChild(beam);
    effects.push(Fx.anim(beam, [
      { transform: `rotate(${ang}deg) scaleX(0)`, opacity: 1, offset: 0 },
      { transform: `rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: (HIT - FIRE) / (END - FIRE) },
      { transform: `rotate(${ang}deg) scaleX(1) scaleY(1.3)`, opacity: 1, offset: 0.7 },
      { transform: `rotate(${ang}deg) scaleX(1) scaleY(.2)`, opacity: 0, offset: 1 }
    ], { duration: END - FIRE, delay: FIRE, easing: 'ease-out' }).then(() => beam.remove()));

    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 5);
      const stop = FxEffects.crackleOver(fxEl, target, Math.max(tr.width, tr.height, 50) * 1.1, '#FFF27A');
      return Fx.glow(targetEl, 'brightness(1.7) sepia(1) saturate(4) hue-rotate(10deg)', END - HIT).then(stop);
    }));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    dim.remove();
  }
}
