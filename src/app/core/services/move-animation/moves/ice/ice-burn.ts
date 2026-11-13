import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Ice Burn, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/8/8e/Frosthauch_Gen5.png
 *
 * Turn 1 (charge): a freezing white mist billows round the user while white
 * sparkles twinkle in it and the user turns pale (0-1.1 s).
 *
 * Turn 2 (attack): the scene goes dark (0-0.25 s). A wide icy ring sweeps
 * from the user to the target, spinning flat (0.25-0.75 s). At the hit
 * (0.75 s) a blue ray backdrop opens on the target, white frost puffs burst
 * on it and it turns pale, then flushes red as it burns (0.75-1.6 s); the
 * scene clears (to ~1.9 s).
 */
export class IceBurn {
  static async charge(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const rad = Math.max(lr.width * 0.5, 30);
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [{ filter: 'none' }, { filter: 'brightness(1.7) saturate(.2)', offset: 0.5 }, { filter: 'none' }], {
        duration: 1100,
        fill: 'none'
      })
    ];
    for (let i = 0; i < 8; i++) {
      const at: Point = { x: launch.x + (Math.random() * 2 - 1) * rad, y: launch.y + (Math.random() * 2 - 1) * rad * 0.8 };
      effects.push(Fx.wait(i * 90).then(() => FxEffects.smokePuff(fxEl, at, rad * (0.7 + Math.random() * 0.4), ['#FFFFFFcc', '#DCE8F0aa'])));
    }
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#FFFFFF');
      Fx.place(star, { x: launch.x + (Math.random() * 2 - 1) * rad * 1.1, y: launch.y + (Math.random() * 2 - 1) * rad });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 400, delay: 150 + Math.random() * 550, easing: 'ease-in-out' }).then(() => star.remove())
      );
    }
    await Promise.all(effects);
  }

  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });

    // The icy ring sweeps across to the target.
    const size = Math.max(tr.width * 1.6, 110);
    const ring = document.createElement('div');
    ring.style.cssText =
      `width:${size}px;height:${size * 0.35}px;border-radius:50%;pointer-events:none;` +
      'border:6px solid #C8F0F8cc;border-top-color:#FFFFFFee;border-right-color:#7ACCE800;box-shadow:0 0 10px #A8E4F4,inset 0 0 8px #E8FAFF';
    Fx.place(ring, launch);
    fxEl.appendChild(ring);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    await Fx.anim(ring, [
      { transform: 'translate(0,0) rotate(-20deg) scale(.5)', opacity: 0 },
      { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) rotate(-10deg) scale(.9)`, opacity: 1, offset: 0.3 },
      { transform: `translate(${dx}px,${dy}px) rotate(15deg) scale(1.1)`, opacity: 0.9 }
    ], { duration: 500, easing: 'ease-in' });
    ring.remove();

    // The hit: blue rays (opening under the fading dark), frost puffs, the target pales then burns.
    const opening = FxEffects.burstBackdrop(fieldEl, target, 'blue');
    Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }).then(() => dim.remove());
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    const rad = Math.max(tr.width * 0.4, 26);
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * rad, y: target.y + (Math.random() * 2 - 1) * rad * 0.8 };
      puffs.push(Fx.wait(i * 70).then(() => FxEffects.smokePuff(fxEl, at, rad * 1.1, ['#FFFFFFdd', '#E0ECF4bb'])));
    }
    await Promise.all([
      ...puffs,
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(1.8) saturate(.2)', offset: 0.3 },
        { filter: 'sepia(.6) saturate(3) hue-rotate(-30deg) brightness(.95)', offset: 0.7 },
        { filter: 'none' }
      ], { duration: 850, easing: 'ease-in-out', fill: 'none' })
    ]);

    const back = await opening;
    await Fx.anim(back, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    back.remove();
  }
}
