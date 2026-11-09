import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Mystical Fire, after the XY animation: a faint green aura glows round the
 * user while a flame tip draws a ring of fire in the air in front of it
 * (0-0.6 s). The ring flares (to 0.8 s) and flies at the target, swelling
 * (to 1.1 s), where it bursts into a huge yellow-orange fireball with a
 * bright wash (1.1-1.75 s). Then the Sp. Atk drop: a purple cloud rains onto
 * the target (to ~2.8 s).
 */
export class MysticalFire {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // Green aura round the user.
    const auraSize = Math.max(lr.height * 1.3, 100);
    const aura = document.createElement('div');
    aura.style.cssText = `width:${auraSize}px;height:${auraSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#40E06000 45%,#40E06055 62%,#40E06000 72%)`;
    Fx.place(aura, launch);
    fxEl.appendChild(aura);
    const auraDone = Fx.anim(aura, [
      { transform: 'scale(.6)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.4 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 800, easing: 'ease-out' }).then(() => aura.remove());

    // The ring of fire, drawn by a flame tip running round it.
    const R = Math.max(lr.height * 0.32, 26);
    const centre: Point = { x: launch.x + v.dir * lr.width * 0.55, y: launch.y - lr.height * 0.1 };
    const box = R * 2 + 24;
    const ring = document.createElement('div');
    ring.style.cssText = `width:${box}px;height:${box}px;pointer-events:none;filter:drop-shadow(0 0 6px #FF8A20)`;
    const circ = 2 * Math.PI * R;
    ring.innerHTML =
      `<svg viewBox="0 0 ${box} ${box}" width="100%" height="100%" style="display:block;overflow:visible">` +
      `<circle cx="${box / 2}" cy="${box / 2}" r="${R}" fill="none" stroke="#FF7A1A" stroke-width="9" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"/>` +
      `<circle cx="${box / 2}" cy="${box / 2}" r="${R}" fill="none" stroke="#FFE070" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ}"/></svg>`;
    Fx.place(ring, centre);
    fxEl.appendChild(ring);
    const draw = 600;
    const strokes = Array.from(ring.querySelectorAll('circle')).map((c) =>
      Fx.anim(c, [{ strokeDashoffset: circ }, { strokeDashoffset: 0 }], { duration: draw, easing: 'ease-in-out' })
    );
    const tip = FxGlyphs.firePuff(R * 0.8);
    Fx.place(tip, centre);
    fxEl.appendChild(tip);
    const path: Keyframe[] = [];
    for (let k = 0; k <= 16; k++) {
      // Clockwise from 3 o'clock, where the SVG stroke starts too.
      const a = (k / 16) * Math.PI * 2;
      path.push({ transform: `translate(${Math.cos(a) * R}px,${Math.sin(a) * R}px)` });
    }
    await Promise.all([...strokes, Fx.anim(tip, path, { duration: draw, easing: 'ease-in-out' })]);
    tip.remove();

    // The ring flares up, then flies at the target, swelling.
    await Fx.anim(ring, [
      { transform: 'scale(1)', filter: 'drop-shadow(0 0 6px #FF8A20)' },
      { transform: 'scale(1.15)', filter: 'drop-shadow(0 0 14px #FFC040) brightness(1.3)' }
    ], { duration: 200, easing: 'ease-out' });
    const dx = target.x - centre.x;
    const dy = target.y - centre.y;
    await Fx.anim(ring, [
      { transform: 'translate(0,0) scale(1.15)', opacity: 1 },
      { transform: `translate(${dx}px,${dy}px) scale(${Math.max(tr.width / box, 1) * 1.6})`, opacity: 0.9 }
    ], { duration: 300, easing: 'ease-in' });
    ring.remove();

    // The fireball on the target.
    Fx.screenWash(screenFxEl, '#FFD86099', 80, 400, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.flash(targetEl, '#FFC040', 0.9);
    Fx.shake(targetEl, 7);
    await Promise.all([auraDone, FxEffects.fireBlastCloud(fxEl, target, Math.max(tr.width * 1.5, 110), 12, '#FFE45A')]);

    await FxEffects.statDropCloud(refs, target);
  }
}
