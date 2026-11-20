import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** When the wild blows land on the target, ms from the start. */
const BLOWS = [750, 900];

/**
 * Flail, after the Gen 4 / Gen 5 animation:
 * - Gen 4 (DP): https://www.pokewiki.de/images/f/f9/Dreschflegel_DP.png
 * - Gen 4 (PtHGSS): https://www.pokewiki.de/images/c/c2/Dreschflegel_PtHGSS.png
 * - Gen 5: https://www.pokewiki.de/images/a/a8/Dreschflegel_Gen5.png
 *
 * The user flails about frantically, jerking back and forth (0-0.7 s), while
 * cyan sweat drops fly off it in arcs. Then two wild blows land on the target
 * (0.75 and 0.9 s): a white-orange burst each, and the target shakes (to
 * ~1.15 s).
 */
export class Flail {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const base = launchEl.style.transform;

    const frames: Keyframe[] = [{ transform: base }];
    for (let i = 1; i < 10; i++) {
      const x = (i % 2 ? 1 : -1) * (4 + Math.random() * 4);
      const y = -Math.random() * 6;
      frames.push({ transform: `${base} translate(${x}px,${y}px) skewX(${-x}deg)`, offset: i / 10 });
    }
    frames.push({ transform: base });
    const flail = Fx.anim(launchEl, frames, { duration: 700, easing: 'linear', fill: 'none' });

    const effects: Promise<void>[] = [flail];
    for (let i = 0; i < 12; i++) {
      const s = 5 + Math.random() * 4;
      const drop = Fx.box(s, s * 1.3, 'border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;background:radial-gradient(circle at 40% 35%,#ffffff,#8AE8F8 50%,#2AB0D8);box-shadow:0 0 3px #A8F0FF');
      const side = Math.random() < 0.5 ? -1 : 1;
      const at: Point = { x: launch.x + side * lr.width * 0.2, y: launch.y - lr.height * (0.1 + Math.random() * 0.25) };
      const dx = side * (20 + Math.random() * 30);
      effects.push(
        Fx.spawn(fxEl, drop, at, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.5}px,-18px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${dx}px,6px) scale(.8)`, opacity: 0 }
        ], { duration: 420, easing: 'ease-out', delay: Math.random() * 400 })
      );
    }
    for (const [i, t] of BLOWS.entries()) {
      const at: Point = { x: target.x - v.dir * tr.width * 0.1 + (i ? 1 : -1) * tr.width * 0.12, y: target.y + (i ? -1 : 1) * tr.height * 0.1 };
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.45, 30), '#F89A30', '#FFE6A0', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1) rotate(15deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 0 }
        ], { duration: 240, easing: 'ease-out', delay: t })
      );
      setTimeout(() => {
        Fx.flash(targetEl, '#ffffff', 0.5);
        Fx.shake(targetEl, 4);
      }, t);
    }
    await Promise.all(effects);
  }
}
