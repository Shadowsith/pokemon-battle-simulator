import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Orange orbs gather into the user until `GATHERED`; green orbs fly from `RELEASE` and the first lands at `HIT` (ms). */
const GATHERED = 750;
const RELEASE = 850;
const HIT = 1100;
const TOTAL = 1550;

/**
 * Hidden Power, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/e/e2/Kraftreserve_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/f/f4/Kraftreserve_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/8/87/Kraftreserve_Gen5.png
 *
 * The scene darkens (0-0.2 s). Glowing orange orbs appear round the user and
 * spiral in until they merge into it (0.15-0.75 s); the user flares white
 * (0.75-0.9 s). Then spiky green orbs burst out of it with an expanding ring
 * and fly at the target (0.85 s on, first lands at 1.1 s): the target flashes
 * green and shakes. The scene clears (to ~1.55 s).
 */
export class HiddenPower {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const radius = Math.max(lr.width, lr.height, 50) * 0.6;

    const dim = Fx.backdrop(fieldEl, `${DIM_BACKDROP};opacity:0`);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [
        { opacity: 0 },
        { opacity: 0.85, offset: 200 / TOTAL },
        { opacity: 0.85, offset: 1300 / TOTAL },
        { opacity: 0 }
      ], { duration: TOTAL, easing: 'linear' }),
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(1.4) drop-shadow(0 0 6px #FFB040)', offset: 0.6 },
        { filter: 'brightness(3) drop-shadow(0 0 12px #ffffff)', offset: 0.85 },
        { filter: 'none' }
      ], { duration: 900, easing: 'ease-in', fill: 'none' })
    ];

    // Orange orbs spiral in.
    const orbs = 6;
    for (let i = 0; i < orbs; i++) {
      const a0 = (Math.PI * 2 * i) / orbs;
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 6; k++) {
        const u = k / 6;
        const a = a0 + u * Math.PI * 1.5;
        const rr = radius * (1 - u);
        frames.push({ transform: `translate(${Math.cos(a) * rr}px,${Math.sin(a) * rr * 0.6}px) scale(${1 - u * 0.5})`, opacity: k === 0 ? 0 : 1 });
      }
      frames[frames.length - 1]['opacity'] = 0;
      const orb = Fx.box(18, 18, 'border-radius:50%;background:radial-gradient(circle,#FFF6D0,#FFB040 45%,#F0702000 75%)');
      effects.push(Fx.spawn(fxEl, orb, launch, frames, { duration: GATHERED - 150, easing: 'ease-in', delay: 150 }));
    }

    // Green orbs burst out and fly at the target.
    effects.push(
      Fx.spawn(fxEl, Fx.box(radius * 2, radius * 1.2, 'border-radius:50%;border:2px solid #C8FFB0;box-shadow:0 0 8px #7AF060'), launch, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1.6)', opacity: 0 }
      ], { duration: 400, easing: 'ease-out', delay: RELEASE })
    );
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const shots = 6;
    for (let i = 0; i < shots; i++) {
      const spread = (i - (shots - 1) / 2) * 16;
      const delay = RELEASE + i * 40;
      const flight = HIT - RELEASE;
      const out = { x: v.dir * (10 + Math.random() * 20), y: spread };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(20 + Math.random() * 8, '#3AC830', '#B8FF90', '#F0FFE0'), launch, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${out.x}px,${out.y}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx + (Math.random() * 2 - 1) * tr.width * 0.2}px,${dy + spread * 0.4}px) scale(.9)`, opacity: 1, offset: 0.9 },
          { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 0 }
        ], { duration: flight / 0.9, easing: 'ease-in', delay })
      );
    }
    for (let t = HIT; t <= HIT + 200; t += 100) {
      setTimeout(() => {
        Fx.flash(targetEl, '#7AF060', 0.5);
        Fx.shake(targetEl, 4);
      }, t);
    }
    await Promise.all(effects);
    dim.remove();
  }
}
