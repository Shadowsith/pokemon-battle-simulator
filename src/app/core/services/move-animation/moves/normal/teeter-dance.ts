import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The user sways for `DANCE` ms; then birds circle the target for `DIZZY` ms. */
const DANCE = 1100;
const DIZZY = 1000;

/**
 * Teeter Dance, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/ca/Taumeltanz_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e5/Taumeltanz_Gen5.png
 *
 * The user teeters from side to side, three wobbly sways (0-1.1 s), while
 * music notes in white and pink float up off it (0-1.0 s). Then the target
 * gets confused: three little yellow birds circle its head under twinkling
 * stars (1.1-2.1 s).
 */
export class TeeterDance {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const sway = Math.max(lr.width * 0.15, 8);
    const steps: Keyframe[] = [];
    for (let k = 0; k <= 12; k++) {
      const x = k === 0 || k === 12 ? 0 : Math.sin((k / 12) * Math.PI * 6) * sway;
      steps.push({ transform: `${original} translate(${x}px,${-Math.abs(x) * 0.3}px)` });
    }
    const effects: Promise<void>[] = [Fx.anim(launchEl, steps, { duration: DANCE, easing: 'ease-in-out', fill: 'none' })];
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const note = FxGlyphs.musicNote(16 + (i % 3) * 3, i % 3 === 1 ? '#FF8AD8' : '#ffffff', i % 2 ? '♫' : '♪');
      effects.push(Fx.spawn(fxEl, note, { x: launch.x + side * lr.width * 0.45, y: launch.y - lr.height * 0.2 }, [
        { transform: 'translate(0,0) scale(.5)', opacity: 0 },
        { transform: `translate(${side * 8}px,-14px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${-side * 6}px,-30px) scale(1)`, opacity: 1, offset: 0.65 },
        { transform: `translate(${side * 10}px,-46px) scale(.9)`, opacity: 0 }
      ], { duration: 520, delay: i * 90, easing: 'ease-out' }));
    }
    await Promise.all(effects);
    const rx = Math.max(tr.width * 0.4, 24);
    await FxEffects.dizzyBirds(fxEl, { x: target.x, y: target.y - tr.height * 0.45 }, rx, rx * 0.3, DIZZY);
  }
}
