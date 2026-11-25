import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The user slips away until `AWAY` (ms), lies in wait, and darts back in from `BACK` (ms). */
const AWAY = 300;
const BACK = 600;

/**
 * Snatch, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/3e/%C3%9Cbernahme_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/42/%C3%9Cbernahme_Gen5.png
 *
 * The user slips away backward and fades out of sight (0-0.3 s), lies in
 * wait (0.3-0.6 s), then darts back in to its spot with a dark afterimage
 * trailing it (0.6-0.85 s). A white glint flashes on it as it gets ready to
 * snatch (0.85-1.15 s).
 */
export class Snatch {
  static async play(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const original = launchEl.style.transform;
    const away = -v.dir * Math.max(r.width * 1.2, 70);
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(0)`, opacity: 1 },
      { transform: `${original} translateX(${away}px)`, opacity: 0 }
    ], { duration: AWAY, easing: 'ease-in' });
    await Fx.wait(BACK - AWAY);
    // A dark copy of the sprite trails it; no slot id, so sprite lookups by `data-slot` keep finding the real one.
    const ghost = launchEl.cloneNode(false) as HTMLElement;
    ghost.removeAttribute('data-slot');
    ghost.classList.remove('acting');
    ghost.style.pointerEvents = 'none';
    ghost.style.filter = 'brightness(0) opacity(.45)';
    launchEl.before(ghost);
    const trail = Fx.anim(ghost, [
      { transform: `${original} translateX(${away}px)`, opacity: 0 },
      { transform: `${original} translateX(${away * 0.25}px)`, opacity: 0.6, offset: 0.7 },
      { transform: `${original} translateX(0)`, opacity: 0 }
    ], { duration: 320, delay: 40, easing: 'ease-out' }).then(() => ghost.remove());
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(${away}px)`, opacity: 0 },
      { transform: `${original} translateX(0)`, opacity: 1 }
    ], { duration: 250, easing: 'ease-out' });
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;
    await Promise.all([
      trail,
      Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.35, 18), '#ffffff'), { x: launch.x + v.dir * r.width * 0.25, y: launch.y - r.height * 0.25 }, [
        { transform: 'scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0) rotate(90deg)', opacity: 0 }
      ], { duration: 300, easing: 'ease-out' })
    ]);
  }
}
