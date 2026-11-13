import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Hone Claws, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/5/5a/Klauenwetzer_Gen5.png
 *
 * The user shuffles back and forth twice, scraping its claws (0-0.6 s); each
 * scrape leaves a white glint streak at its front (0.1 s, 0.4 s). Then a
 * burst of glowing orange sparks rises round it as Attack and Accuracy go up
 * (0.6-1.8 s).
 */
export class HoneClaws {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, launchEl } = refs;
    const lr = Fx.rect(launchEl);
    const top = lr.top - Fx.rect(refs.fieldEl).top;
    const dir = target.x >= launch.x ? 1 : -1;
    const original = launchEl.style.transform;
    const shuffle = Fx.anim(launchEl, [
      { transform: `${original} translateX(0)` },
      { transform: `${original} translateX(${dir * 8}px)`, offset: 0.2 },
      { transform: `${original} translateX(${-dir * 6}px)`, offset: 0.45 },
      { transform: `${original} translateX(${dir * 8}px)`, offset: 0.7 },
      { transform: `${original} translateX(0)` }
    ], { duration: 600, easing: 'ease-in-out', fill: 'none' });

    const glints: Promise<void>[] = [];
    for (let k = 0; k < 2; k++) {
      await Fx.wait(k ? 300 : 100);
      const at: Point = { x: launch.x + dir * lr.width * 0.3, y: launch.y + (k ? -1 : 1) * lr.height * 0.1 };
      for (let j = 0; j < 3; j++) {
        const streak = document.createElement('div');
        const len = Math.max(lr.width * 0.35, 24);
        streak.style.cssText =
          `position:absolute;width:${len}px;height:3px;border-radius:2px;pointer-events:none;` +
          'background:linear-gradient(90deg,#FFFFFF00,#FFFFFF,#FFFFFF00);box-shadow:0 0 4px #FFFFFF';
        Fx.place(streak, { x: at.x + (j - 1) * 6, y: at.y + (j - 1) * 7 });
        fxEl.appendChild(streak);
        glints.push(
          Fx.anim(streak, [
            { transform: 'rotate(-35deg) scaleX(0)', opacity: 1 },
            { transform: 'rotate(-35deg) scaleX(1)', opacity: 1, offset: 0.5 },
            { transform: 'rotate(-35deg) scaleX(1.1)', opacity: 0 }
          ], { duration: 260, delay: j * 30, easing: 'ease-out' }).then(() => streak.remove())
        );
      }
      const star = FxGlyphs.sparkStar(14, '#FFFFFF');
      Fx.place(star, at);
      fxEl.appendChild(star);
      glints.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 1 },
          { transform: 'scale(1.2) rotate(45deg)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 300, delay: 80, easing: 'ease-out' }).then(() => star.remove())
      );
    }
    await Promise.all([shuffle, ...glints]);

    // Orange sparks rise round the user.
    await Promise.all([FxEffects.orangeSparkles(refs, launch, top + lr.height * 0.1), FxEffects.statUpAura(refs, launch)]);
  }
}
