import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Water Pledge, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/d/dc/Wassers%C3%A4ulen_Gen5.png
 *
 * Three glowing pillars of water shoot up round the target one after the
 * other, left (0-0.6 s), right (0.2-0.8 s) and a big one in the centre
 * (0.4-1.1 s, hit at 0.5 s), each topped by a pale blue orb and kicking up
 * white spray at its foot. The orbs float up and fade (to ~1.4 s).
 */
export class WaterPledge {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const w = Math.max(tr.width, 60);
    const foot: Point = { x: target.x, y: target.y + tr.height * 0.4 };
    const height = Math.max(tr.height * 1.6, 110);
    const pillars: { off: number; scale: number; delay: number }[] = [
      { off: -0.5, scale: 0.75, delay: 0 },
      { off: 0.55, scale: 0.75, delay: 200 },
      { off: 0, scale: 1, delay: 400 }
    ];
    const effects = pillars.map((p) => WaterPledge.pillar(fxEl, { x: foot.x + p.off * w, y: foot.y }, w * 0.32 * p.scale, height * p.scale, p.delay));
    await Fx.wait(500);
    Fx.flash(targetEl, '#9AD8FF', 0.7);
    Fx.shake(targetEl, 6);
    await Promise.all(effects);
  }

  /** One pillar of water `pw` × `ph` px rising from `base` after `delay` ms, with an orb on top and spray at its foot. */
  private static async pillar(fxEl: HTMLElement, base: Point, pw: number, ph: number, delay: number) {
    await Fx.wait(delay);
    const col = document.createElement('div');
    col.style.cssText =
      `width:${pw}px;height:${ph}px;pointer-events:none;border-radius:${pw / 2}px ${pw / 2}px 30% 30%;transform-origin:50% 100%;` +
      'background:linear-gradient(90deg,#6AB8FF00,#8ED0FFcc 25%,#F0FAFF 50%,#8ED0FFcc 75%,#6AB8FF00);filter:drop-shadow(0 0 6px #7CC8FF)';
    Fx.place(col, { x: base.x, y: base.y - ph / 2 });
    fxEl.appendChild(col);

    const orbSize = pw * 1.5;
    const orb = document.createElement('div');
    orb.style.cssText =
      `width:${orbSize}px;height:${orbSize}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#FFFFFF 0 20%,#BEE6FF 45%,#6AB8FF88 62%,#6AB8FF00 72%)';
    Fx.place(orb, { x: base.x, y: base.y - ph });
    fxEl.appendChild(orb);

    const parts: Promise<void>[] = [
      Fx.anim(col, [
        { transform: 'scaleY(0)', opacity: 0.9 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.35 },
        { transform: 'scaleY(1) scaleX(.8)', opacity: 0.9, offset: 0.7 },
        { transform: 'scaleY(1) scaleX(.3)', opacity: 0 }
      ], { duration: 650, easing: 'ease-out' }).then(() => col.remove()),
      Fx.anim(orb, [
        { transform: `translateY(${ph}px) scale(.4)`, opacity: 0 },
        { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.3 },
        { transform: 'translateY(-10px) scale(.9)', opacity: 0.9, offset: 0.65 },
        { transform: 'translateY(-30px) scale(.6)', opacity: 0 }
      ], { duration: 900, easing: 'ease-out' }).then(() => orb.remove())
    ];
    for (let i = 0; i < 6; i++) {
      const drop = FxGlyphs.bubbleGlyph(5 + Math.random() * 5);
      Fx.place(drop, base);
      fxEl.appendChild(drop);
      const dx = (Math.random() * 2 - 1) * pw * 1.6;
      parts.push(
        Fx.anim(drop, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${dx * 0.6}px,${-20 - Math.random() * 20}px)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,4px)`, opacity: 0 }
        ], { duration: 550, delay: 60, easing: 'ease-out', fill: 'backwards' }).then(() => drop.remove())
      );
    }
    await Promise.all(parts);
  }
}
