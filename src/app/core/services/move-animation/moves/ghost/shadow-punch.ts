import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** The shadow fist sets off at `THROW` (ms) and lands at `HIT` (ms). */
const THROW = 250;
const HIT = 600;

/**
 * Shadow Punch, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/7/72/Finsterfaust_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e2/Finsterfaust_Gen5.png
 *
 * The user fades to a dark shadow of itself (0-0.25 s, back to normal by
 * 0.95 s). A see-through shadow fist shoots out of it with streaks of
 * shadow trailing behind (0.25-0.6 s) and lands on the target with a
 * yellow-black impact burst (0.6 s); the target shakes and darkens, and the
 * burst fades (0.6-0.95 s).
 */
export class ShadowPunch {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const w = Math.max(tr.width * 0.55, 30);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const effects: Promise<void>[] = [
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(.15) opacity(.75)', offset: 0.25 },
        { filter: 'brightness(.15) opacity(.75)', offset: 0.65 },
        { filter: 'none' }
      ], { duration: 950, easing: 'ease-in-out', fill: 'none' })
    ];
    const fist = FxGlyphs.fistGlyph(w, 'dark');
    fist.style.opacity = '0';
    fist.style.filter = 'drop-shadow(0 0 4px #6A4A9A)';
    // The fist points its knuckles the way it flies.
    const face = v.dir > 0 ? '' : ' scaleX(-1)';
    effects.push(Fx.spawn(fxEl, fist, launch, [
      { transform: `translate(0,0) scale(.5)${face}`, opacity: 0 },
      { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) scale(.8)${face}`, opacity: 0.75, offset: 0.2 },
      { transform: `translate(${dx}px,${dy}px) scale(1.1)${face}`, opacity: 0.75 }
    ], { duration: HIT - THROW, delay: THROW, easing: 'ease-in' }));
    for (let i = 0; i < 5; i++) {
      const len = Math.max(Math.abs(dx) * 0.35, 40);
      const streak = Fx.box(len, 3, `border-radius:2px;background:linear-gradient(${v.dir > 0 ? 90 : 270}deg,#3A2A5A00,#3A2A5Acc)`);
      const off = (i - 2) * 7;
      effects.push(Fx.spawn(fxEl, streak, { x: launch.x + dx * 0.3, y: launch.y + dy * 0.3 + off }, [
        { transform: 'translate(0,0) scaleX(.3)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scaleX(1)`, opacity: 0.8, offset: 0.5 },
        { transform: `translate(${dx * 0.6}px,${dy * 0.6}px) scaleX(.6)`, opacity: 0 }
      ], { duration: 350, delay: THROW + 40 + i * 20, easing: 'linear' }));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.shake(targetEl, 6);
      return Promise.all([
        Fx.anim(targetEl, [{ filter: 'brightness(.35)' }, { filter: 'none' }], { duration: 250, fill: 'none' }),
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(w * 1.3, '#FFE04A', '#2A2238'), target, [
          { transform: 'scale(.4)', opacity: 1 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.25)', opacity: 0 }
        ], { duration: 350, easing: 'ease-out' })
      ]).then(() => void 0);
    }));
    await Promise.all(effects);
  }
}
