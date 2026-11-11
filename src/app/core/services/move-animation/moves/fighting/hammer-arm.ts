import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Hammer Arm, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/0/08/Hammerarm_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/4/42/Hammerarm_Gen5.png
 *
 * A big grey hammer is raised above the target and swings down onto it,
 * trailing white puffs (0-0.45 s). On the hit (0.45 s) the target turns into
 * a black silhouette for a moment while a white burst flares and the field
 * shakes; the hammer bounces off and fades (to ~1.05 s). Then the user's
 * Speed falls: blue bubbles drift down over it (1.05-1.95 s).
 */
export class HammerArm {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const w = Math.max(tr.width * 0.9, 70);

    // The swing: the hammer pivots on a point beside the target and comes down from above.
    const pivot = document.createElement('div');
    pivot.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    const hammer = HammerArm.hammerGlyph(w);
    hammer.style.left = `${-w * 0.2}px`;
    hammer.style.top = `${-w * 0.25}px`;
    pivot.appendChild(hammer);
    const hub = { x: target.x + v.dir * w * 0.72, y: target.y - tr.height * 0.1 };
    Fx.place(pivot, hub);
    fxEl.appendChild(pivot);
    // Raised up, then down onto the target: the head ends pointing from the hub back at the target.
    const from = v.dir > 0 ? -70 : -110;
    const to = v.dir > 0 ? -180 : 0;
    const swing = Fx.anim(pivot, [
      { transform: `rotate(${from}deg)`, opacity: 0 },
      { transform: `rotate(${from + (to - from) * 0.15}deg)`, opacity: 1, offset: 0.2 },
      { transform: `rotate(${to}deg)`, opacity: 1 }
    ], { duration: 450, easing: 'ease-in', fill: 'forwards' });
    const trail: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      trail.push(
        Fx.wait(150 + i * 70).then(() => {
          const t = (150 + i * 70) / 450;
          const ang = ((from + (to - from) * t * t) * Math.PI) / 180;
          const d = w * 0.7;
          return FxEffects.smokePuff(fxEl, { x: hub.x + Math.cos(ang) * d, y: hub.y + Math.sin(ang) * d }, w * 0.35);
        })
      );
    }
    await swing;

    // The hit: black silhouette, white burst, the hammer bounces off.
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.8, 64), '#B8C0D0', '#FFFFFF', '#FFFFFF');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 0.8);
    await Promise.all([
      ...trail,
      Fx.anim(targetEl, [{ filter: 'brightness(0)' }, { filter: 'brightness(0)', offset: 0.7 }, { filter: 'brightness(1)' }], { duration: 300, fill: 'none' }),
      Fx.anim(burst, [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.15)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }).then(() => burst.remove()),
      Fx.anim(pivot, [
        { transform: `rotate(${to}deg)`, opacity: 1 },
        { transform: `rotate(${to - (to - from) * 0.12}deg)`, opacity: 1, offset: 0.4 },
        { transform: `rotate(${to - (to - from) * 0.08}deg)`, opacity: 0 }
      ], { duration: 600, easing: 'ease-out' }).then(() => pivot.remove())
    ]);

    // The user's Speed falls.
    await FxEffects.statDownBubbles(refs, launch);
  }

  /** A grey sledgehammer `w` px long, pointing right: wooden handle with the head at the right end. */
  private static hammerGlyph(w: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${w * 1.1}px;height:${w * 0.5}px;pointer-events:none;filter:drop-shadow(0 0 2px #00000066)`;
    el.innerHTML =
      '<svg viewBox="0 0 110 50" width="100%" height="100%" style="display:block">' +
      '<rect x="0" y="21" width="78" height="8" rx="3" fill="#A8743C" stroke="#5A3A18" stroke-width="1.5"/>' +
      '<rect x="74" y="4" width="32" height="42" rx="5" fill="#9AA2B2" stroke="#3A404C" stroke-width="2"/>' +
      '<rect x="78" y="8" width="8" height="34" rx="3" fill="#D8DEE8"/>' +
      '<rect x="74" y="4" width="6" height="42" fill="#6A7282"/>' +
      '</svg>';
    return el;
  }
}
