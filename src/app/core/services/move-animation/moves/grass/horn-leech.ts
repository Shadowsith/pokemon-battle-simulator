import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Horn Leech, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/e/e2/Holzgeweih_Gen5.png
 *
 * The user rams the target head first (0-0.5 s); at the hit (0.25 s) a pale
 * green spiky flash pops on the target. Then cyan-green sparkles and green
 * light orbs well up round the user as it drains HP (0.6-1.5 s).
 */
export class HornLeech {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.3;
    const dy = (target.y - launch.y) * 0.3;
    const ram = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)` },
      { transform: `${original} translate(${dx}px,${dy}px)`, offset: 0.45 },
      { transform: `${original} translate(0,0)` }
    ], { duration: 500, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(250);

    const at: Point = { x: target.x - v.dir * tr.width * 0.1, y: target.y };
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 0.55, 44), '#B8F07A', '#E8FFC8', '#FFFFFF');
    Fx.place(burst, at);
    fxEl.appendChild(burst);
    Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, 5);
    await Promise.all([
      ram,
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.1) rotate(15deg)', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => burst.remove())
    ]);

    // The drained HP wells up round the user.
    const rad = Math.max(lr.width * 0.45, 28);
    const bits: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const p: Point = { x: launch.x + (Math.random() * 2 - 1) * rad, y: launch.y + Math.random() * rad };
      let el: HTMLElement;
      if (i % 3 === 2) {
        el = document.createElement('div');
        const s = 10 + Math.random() * 6;
        el.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#E8FFC8,#5AD84Aaa 55%,#5AD84A00 75%)`;
      } else {
        el = FxGlyphs.sparkStar(9 + Math.random() * 7, i % 2 ? '#7AF0D8' : '#FFFFFF');
      }
      Fx.place(el, p);
      fxEl.appendChild(el);
      bits.push(
        Fx.anim(el, [
          { transform: 'translateY(0) scale(0)', opacity: 0 },
          { transform: 'translateY(-8px) scale(1.2)', opacity: 1, offset: 0.4 },
          { transform: 'translateY(-22px) scale(0)', opacity: 0 }
        ], { duration: 600, delay: Math.random() * 300, easing: 'ease-out' }).then(() => el.remove())
      );
    }
    Fx.flash(launchEl, '#7AF0A8', 0.5);
    setTimeout(() => Fx.flash(launchEl, '#7AF0A8', 0.35), 350);
    await Promise.all(bits);
  }
}
