import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The user vanishes by `GONE` (ms), the jet reaches the target at `HIT` (ms), the user is back by `BACK` (ms). */
const GONE = 180;
const HIT = 480;
const BACK = 1050;

/**
 * Aqua Jet, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/09/Wasserd%C3%BCse_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/81/Wasserd%C3%BCse_Gen5.png
 *
 * The user shoots off toward the target and vanishes (0-0.18 s). A streak of
 * pale blue water rushes over to the target trailing spray (0.18-0.48 s) and
 * bursts up round it in a tall water column (0.48-0.85 s): the target flashes
 * and shakes while glittering droplets scatter and drift down (0.5-1.1 s).
 * The user fades back in at its spot (0.85-1.05 s).
 */
export class AquaJet {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;

    await Fx.anim(launchEl, [
      { transform: `${original} translateX(0)`, opacity: 1 },
      { transform: `${original} translateX(${v.dir * lr.width * 0.4}px)`, opacity: 0 }
    ], { duration: GONE, easing: 'ease-in', fill: 'forwards' });

    const effects: Promise<void>[] = [];
    const len = Math.max(lr.width * 0.9, 60);
    const jet = Fx.box(len, 16, 'border-radius:50%;background:linear-gradient(90deg,#5AB8FF00,#7AD0FFcc 40%,#E8F8FF);box-shadow:0 0 10px #7AD0FF');
    effects.push(Fx.spawn(fxEl, jet, launch, [
      { transform: `translate(0,0) rotate(${ang}deg) scaleX(.4)`, opacity: 0 },
      { transform: `translate(${dx * 0.2}px,${dy * 0.2}px) rotate(${ang}deg) scaleX(1)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${dx}px,${dy}px) rotate(${ang}deg) scaleX(1)`, opacity: 1 }
    ], { duration: HIT - GONE, easing: 'ease-in' }));
    for (let i = 0; i < 8; i++) {
      const u = (i + 1) / 9;
      effects.push(Fx.spawn(fxEl, Fx.box(5, 5, 'border-radius:50%;background:#E8F8FF;box-shadow:0 0 4px #7AD0FF'), { x: launch.x + dx * u, y: launch.y + dy * u }, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: 'translate(0,0)', opacity: 1, offset: 0.2 },
        { transform: `translate(${(i % 2 ? 1 : -1) * 6}px,14px)`, opacity: 0 }
      ], { duration: 400, delay: GONE + u * (HIT - GONE), easing: 'ease-out' }));
    }

    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#CFF0FF', 0.6);
      Fx.shake(targetEl, 5);
      const cw = Math.max(tr.width * 0.55, 36);
      const ch = Math.max(tr.height * 1.5, 100);
      const column = Fx.box(cw, ch, 'border-radius:45% 45% 20% 20%;transform-origin:50% 100%;background:linear-gradient(0deg,#ffffffee,#8FD8FFcc 45%,#5AB8FF00);filter:blur(1px)');
      const parts: Promise<void>[] = [Fx.spawn(fxEl, column, { x: target.x, y: target.y + tr.height * 0.45 - ch / 2 }, [
        { transform: 'scaleY(0)', opacity: 0.9 },
        { transform: 'scaleY(1)', opacity: 0.9, offset: 0.45 },
        { transform: 'scaleY(1.05) scaleX(1.3)', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' })];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const drop = i % 3 ? Fx.box(5, 5, 'border-radius:50%;background:#ffffff;box-shadow:0 0 4px #9ADCFF') : FxGlyphs.bubbleGlyph(9);
        parts.push(Fx.spawn(fxEl, drop, { x: target.x, y: target.y - tr.height * 0.1 }, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * tr.width * 0.5}px,${-Math.abs(Math.sin(a)) * tr.height * 0.6}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${Math.cos(a) * tr.width * 0.65}px,${tr.height * 0.2}px)`, opacity: 0 }
        ], { duration: 600, delay: 40 + (i * 37) % 120, easing: 'ease-out' }));
      }
      return Promise.all(parts).then(() => void 0);
    }));

    effects.push(Fx.wait(BACK - 200).then(() => Fx.anim(launchEl, [
      { transform: `${original} translateX(0)`, opacity: 0 },
      { transform: `${original} translateX(0)`, opacity: 1 }
    ], { duration: 200, easing: 'ease-out', fill: 'forwards' })).then(() => {
      launchEl.getAnimations?.().forEach((a) => a.cancel());
      launchEl.style.transform = original;
    }));
    await Promise.all(effects);
  }
}
