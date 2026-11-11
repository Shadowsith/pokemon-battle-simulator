import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Nasty Plot, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/5/5d/R%C3%A4nkeschmied_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/5f/R%C3%A4nkeschmied_Gen5.png
 *
 * A grey smoke puff rises at the user's head (0-0.5 s) and three "?" clouds
 * pop up round it one after another, their marks wobbling (0.25-1.15 s). The
 * clouds puff away and a white hand pops up with its finger raised and yellow
 * shine lines - the idea (1.15-1.75 s). Orange stat sparkles drift down
 * over the user (1.75-2.95 s).
 */
export class NastyPlot {
  static async play(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);
    const head: Point = { x: launch.x, y: r.top - f.top + r.height * 0.2 };
    const cw = Math.max(r.width * 0.45, 40);

    const smoke = FxEffects.smokePuff(fxEl, head, Math.max(r.width * 0.8, 60), ['#B8BAC4', '#8C8E9A']);

    // Three "?" clouds: left, top, right of the head.
    const spots: Point[] = [
      { x: head.x - cw * 0.9, y: head.y + cw * 0.15 },
      { x: head.x, y: head.y - cw * 0.35 },
      { x: head.x + cw * 0.9, y: head.y + cw * 0.15 }
    ];
    const clouds = spots.map((p, i) => {
      const cloud = FxGlyphs.questionCloud(cw);
      Fx.place(cloud, p);
      fxEl.appendChild(cloud);
      Fx.anim(cloud, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1)', opacity: 1 }
      ], { duration: 260, delay: 250 + i * 130, easing: 'ease-out' });
      Fx.anim(cloud.lastElementChild as HTMLElement, [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-14deg)', offset: 0.3 },
        { transform: 'rotate(12deg)', offset: 0.7 },
        { transform: 'rotate(0deg)' }
      ], { duration: 450, delay: 600 + i * 60, easing: 'ease-in-out' });
      return cloud;
    });
    await Fx.wait(1150);

    // The clouds puff away; the hand with its raised finger pops up.
    for (const cloud of clouds) {
      Fx.anim(cloud, [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'translateY(-8px) scale(1.4)', opacity: 0 }
      ], { duration: 250, easing: 'ease-out' }).then(() => cloud.remove());
    }
    const hw = Math.max(r.width * 0.3, 26);
    const hand = FxGlyphs.pointingHandGlyph(hw);
    Fx.place(hand, { x: head.x, y: head.y - hw * 0.3 });
    fxEl.appendChild(hand);
    const handDone = Fx.anim(hand, [
      { transform: 'translateY(10px) scale(.4)', opacity: 0 },
      { transform: 'translateY(0) scale(1.1)', opacity: 1, offset: 0.25 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.8 },
      { transform: 'translateY(-4px) scale(1)', opacity: 0 }
    ], { duration: 600, easing: 'ease-out' }).then(() => hand.remove());
    // Yellow shine lines flick out round the fingertip.
    const tip: Point = { x: head.x, y: head.y - hw * 0.95 };
    const shines = [-80, -40, 0, 40, 80].map((deg, i) => {
      const line = document.createElement('div');
      line.style.cssText = `position:absolute;left:${tip.x}px;top:${tip.y - 1.5}px;width:${hw * 0.5}px;height:3px;border-radius:2px;pointer-events:none;transform-origin:0 50%;background:#FFE040;box-shadow:0 0 4px #FFC020`;
      fxEl.appendChild(line);
      const rot = `rotate(${deg - 90}deg)`;
      return Fx.anim(line, [
        { transform: `${rot} translateX(${hw * 0.3}px) scaleX(0)`, opacity: 1 },
        { transform: `${rot} translateX(${hw * 0.55}px) scaleX(1)`, opacity: 1, offset: 0.5 },
        { transform: `${rot} translateX(${hw * 0.8}px) scaleX(.2)`, opacity: 0 }
      ], { duration: 300, delay: 120 + (i % 2) * 60, easing: 'ease-out' }).then(() => line.remove());
    });
    await Promise.all([smoke, handDone, ...shines]);

    await FxEffects.orangeSparkles(refs, launch, head.y);
  }
}
