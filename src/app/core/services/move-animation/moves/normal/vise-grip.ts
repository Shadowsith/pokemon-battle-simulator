import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Vise Grip, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/ce/Klammer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/5/5b/Klammer_Gen5.png
 *
 * Two dark olive pincer jaws rise up wide on either side of the target
 * (0-0.25 s) and snap in on it (0.25-0.4 s, hit at 0.4 s): the jaws glow red,
 * the target is squeezed and pink-white sparkles spray out (to ~0.85 s). The
 * jaws hold it (to 0.9 s), then part and fade (0.9-1.15 s).
 */
export class ViseGrip {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const h = Math.max(r.height * 0.9, 56);
    const w = Math.max(h * 0.16, 9);
    const open = Math.max(r.width * 0.75, 52);
    const shut = Math.max(r.width * 0.32, 22);
    const total = 1150;

    const jaws = ([-1, 1] as const).map((side) => {
      const jaw = Fx.box(w, h, 'border-radius:3px;background:linear-gradient(90deg,#24200A,#5C5622 50%,#24200A);box-shadow:0 0 0 1px #14120588');
      const red = Fx.box(w, h, 'left:0;top:0;border-radius:3px;background:linear-gradient(90deg,#B0101A,#FF3040 50%,#B0101A);box-shadow:0 0 10px #FF2030;opacity:0');
      jaw.appendChild(red);
      Fx.place(jaw, target);
      fxEl.appendChild(jaw);
      const glow = Fx.anim(red, [
        { opacity: 0 },
        { opacity: 0, offset: 380 / total },
        { opacity: 1, offset: 420 / total },
        { opacity: 0.8, offset: 600 / total },
        { opacity: 0, offset: 760 / total },
        { opacity: 0 }
      ], { duration: total, easing: 'linear' });
      const move = Fx.anim(jaw, [
        { transform: `translateX(${side * open}px) translateY(14px) scaleY(.4)`, opacity: 0 },
        { transform: `translateX(${side * open}px) translateY(0) scaleY(1)`, opacity: 1, offset: 250 / total },
        { transform: `translateX(${side * shut}px) scaleY(1)`, opacity: 1, offset: 400 / total },
        { transform: `translateX(${side * shut * 1.08}px) scaleY(1)`, opacity: 1, offset: 900 / total },
        { transform: `translateX(${side * open * 0.8}px) scaleY(1)`, opacity: 0 }
      ], { duration: total, easing: 'ease-in' });
      return Promise.all([glow, move]).then(() => jaw.remove());
    });

    await Fx.wait(400);
    Fx.flash(targetEl, '#FF6070', 0.55);
    Fx.shake(targetEl, 4);
    const original = targetEl.style.transform;
    const effects: Promise<unknown>[] = [
      ...jaws,
      Fx.anim(targetEl, [
        { transform: original },
        { transform: `${original} scaleX(.86)`, offset: 0.2 },
        { transform: `${original} scaleX(.9)`, offset: 0.8 },
        { transform: original }
      ], { duration: 550, easing: 'ease-out', fill: 'none' })
    ];
    for (let i = 0; i < 9; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * 10, y: target.y + (Math.random() * 2 - 1) * r.height * 0.3 };
      const a = Math.random() * Math.PI * 2;
      const d = 22 + Math.random() * 22;
      const color = i % 3 ? '#FFC8D8' : '#FFFFFF';
      effects.push(
        Fx.spawn(fxEl, Fx.box(7, 7, `border-radius:50%;background:radial-gradient(circle,#fff,${color} 55%,#FF80A0);box-shadow:0 0 6px #FF90B0`), at, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(a) * d * 0.5}px,${Math.sin(a) * d * 0.5}px) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 8}px) scale(.5)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: i * 25 })
      );
    }
    effects.push(
      Fx.spawn(fxEl, FxGlyphs.sparkStar(Math.max(r.width * 0.4, 26), '#FFFFFF'), target, [
        { transform: 'scale(.2)', opacity: 1 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: 260, easing: 'ease-out' })
    );
    await Promise.all(effects);
  }
}
