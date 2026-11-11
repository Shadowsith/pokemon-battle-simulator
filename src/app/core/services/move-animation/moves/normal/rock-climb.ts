import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Rock Climb, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/a/a8/Kraxler_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/b/bc/Kraxler_Gen5.png
 *
 * Olive dust and small rocks kick up round the user's feet and rise while it
 * bobs up twice as if climbing (0-0.6 s). It charges the target (0.6-0.9 s);
 * on the hit (0.73 s) a yellowish dust cloud bursts on the target, rocks and
 * dark grit scatter and the target shakes (to ~1.45 s).
 */
export class RockClimb {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const feet: Point = { x: launch.x, y: launch.y + lr.height * 0.4 };
    const original = launchEl.style.transform;

    // Climbing: two bobs up while dust and pebbles rise round the user.
    const climb = Fx.anim(launchEl, [
      { transform: `${original} translateY(0)` },
      { transform: `${original} translateY(-10px)`, offset: 0.25 },
      { transform: `${original} translateY(0)`, offset: 0.5 },
      { transform: `${original} translateY(-10px)`, offset: 0.75 },
      { transform: `${original} translateY(0)` }
    ], { duration: 600, easing: 'ease-in-out', fill: 'none' });
    const parts: Promise<void>[] = [climb];
    for (let i = 0; i < 12; i++) {
      const rock = i % 3 === 0;
      const s = rock ? 7 + Math.random() * 5 : 14 + Math.random() * 12;
      const el = rock ? FxGlyphs.rockChunk(s) : RockClimb.dust(s);
      Fx.place(el, { x: feet.x + (Math.random() * 2 - 1) * lr.width * 0.5, y: feet.y });
      fxEl.appendChild(el);
      const up = lr.height * (0.4 + Math.random() * 0.5);
      parts.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${(Math.random() * 2 - 1) * 10}px,${-up * 0.5}px) scale(1)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${(Math.random() * 2 - 1) * 16}px,${-up}px) scale(1.2)`, opacity: 0 }
        ], { duration: 500, delay: (i / 12) * 300, easing: 'ease-out', fill: 'backwards' }).then(() => el.remove())
      );
    }
    await climb;

    // The charge.
    const dx = (target.x - launch.x) * 0.35;
    parts.push(
      Fx.anim(launchEl, [
        { transform: `${original} translateX(0)` },
        { transform: `${original} translateX(${dx}px)`, offset: 0.45 },
        { transform: `${original} translateX(0)` }
      ], { duration: 300, easing: 'ease-in-out', fill: 'none' })
    );
    await Fx.wait(130);

    // Hit: dust cloud, flying rocks and grit.
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    setTimeout(() => Fx.shake(targetEl, 4), 250);
    const size = Math.max(tr.width, tr.height);
    parts.push(FxEffects.smokePuff(fxEl, target, size * 0.9, ['#E0D088', '#A89440']));
    for (let i = 0; i < 12; i++) {
      const rock = i % 2 === 0;
      const el = rock ? FxGlyphs.rockChunk(6 + Math.random() * 6) : RockClimb.grit(3 + Math.random() * 3);
      Fx.place(el, target);
      fxEl.appendChild(el);
      const ang = -Math.PI / 2 + v.dir * (Math.random() * 1.6 - 0.2);
      const d = size * (0.4 + Math.random() * 0.4);
      parts.push(
        Fx.anim(el, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6 + 26}px)`, opacity: 0 }
        ], { duration: 550 + Math.random() * 150, delay: Math.random() * 80, easing: 'ease-out' }).then(() => el.remove())
      );
    }
    await Promise.all(parts);
  }

  /** A soft olive dust puff, `s` px wide. */
  private static dust(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#C8C070,#8A8434 60%,#6A662800 75%)`;
    return el;
  }

  /** A tiny dark speck of grit, `s` px wide. */
  private static grit(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${s}px;height:${s}px;pointer-events:none;background:#3A2A1A`;
    return el;
  }
}
