import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The thread reaches the target at `REACH`, the web spreads at `WEB` (ms). */
const REACH = 250;
const WEB = 550;
const TOTAL = 1400;

/**
 * Spider Web, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/58/Spinnennetz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/7/78/Spinnennetz_Gen5.png
 *
 * A white silk thread shoots from the user to the target (0-0.25 s) and winds
 * round it in a spinning white spiral (0.25-0.6 s). A sticky web spreads over
 * the target (0.55-0.75 s), holds (to 1.15 s) and fades (to ~1.4 s).
 */
export class SpiderWeb {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const len = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const size = Math.max(tr.width, tr.height, 50) * 1.15;
    const at = (ms: number) => ms / TOTAL;

    const thread = Fx.box(len, 2, 'background:linear-gradient(90deg,#ffffff00,#ffffff 30%,#ffffff);box-shadow:0 0 4px #ffffff;transform-origin:0 50%');
    thread.style.left = `${from.x}px`;
    thread.style.top = `${from.y - 1}px`;
    fxEl.appendChild(thread);
    const shoot = Fx.anim(thread, [
      { transform: `rotate(${angle}deg) scaleX(0)`, opacity: 1 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: REACH / 450 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0 }
    ], { duration: 450, easing: 'linear' }).then(() => thread.remove());

    const spiral = Fx.box(size * 0.7, size * 0.7,
      'border-radius:50%;background:repeating-conic-gradient(#ffffff00 0deg 25deg,#ffffffcc 35deg 45deg,#ffffff00 55deg 90deg);' +
      '-webkit-mask-image:radial-gradient(closest-side,#000 70%,#0000 100%);mask-image:radial-gradient(closest-side,#000 70%,#0000 100%)');
    const wind = Fx.spawn(fxEl, spiral, target, [
      { transform: 'rotate(0deg) scale(.3)', opacity: 0 },
      { transform: 'rotate(360deg) scale(1)', opacity: 1, offset: 0.6 },
      { transform: 'rotate(600deg) scale(1.1)', opacity: 0 }
    ], { duration: WEB - REACH + 100, easing: 'ease-out', delay: REACH });

    const webEl = FxGlyphs.webGlyph(size, '#ffffff', '#E8F0FF', 1.6);
    webEl.style.position = 'absolute';
    const web = Fx.spawn(fxEl, webEl, target, [
      { transform: 'scale(.2)', opacity: 0 },
      { transform: 'scale(.2)', opacity: 0, offset: at(WEB) },
      { transform: 'scale(1)', opacity: 1, offset: at(WEB + 200) },
      { transform: 'scale(1)', opacity: 1, offset: at(1150) },
      { transform: 'scale(1.05)', opacity: 0 }
    ], { duration: TOTAL, easing: 'ease-out' });
    setTimeout(() => Fx.shake(targetEl, 3), WEB + 200);
    await Promise.all([shoot, wind, web]);
  }
}
