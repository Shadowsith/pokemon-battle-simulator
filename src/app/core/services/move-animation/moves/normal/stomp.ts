import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Stomp, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/6/63/Stampfer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/0/0f/Stampfer_Gen5.png
 *
 * A big black footprint comes down on the target from above (0-0.22 s) and
 * stamps it (hit at 0.22 s): the target blacks out and is squashed, yellow
 * and green sparkles burst round it and orange specks bounce off
 * (0.22-0.85 s) while the footprint lifts and fades (0.22-0.6 s).
 */
export class Stomp {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.5, 36);
    const at: Point = { x: target.x, y: target.y - r.height * 0.05 };
    const foot = FxGlyphs.footGlyph(w);
    Fx.place(foot, at);
    fxEl.appendChild(foot);
    await Fx.anim(foot, [
      { transform: 'translateY(-50px) scale(1.6)', opacity: 0 },
      { transform: 'translateY(-20px) scale(1.25)', opacity: 1, offset: 0.5 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 220, easing: 'ease-in' });

    const base = targetEl.style.transform;
    const effects: Promise<unknown>[] = [
      Fx.anim(foot, [
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'translateY(-10px) scale(1.05)', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => foot.remove()),
      Fx.glow(targetEl, 'brightness(0)', 380),
      Fx.anim(targetEl, [
        { transform: `${base} scale(1)` },
        { transform: `${base} translateY(4%) scale(1.08,.86)`, offset: 0.25 },
        { transform: `${base} scale(1)` }
      ], { duration: 320, easing: 'ease-out', fill: 'none' })
    ];
    for (let i = 0; i < 10; i++) {
      const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const d = w * (0.8 + Math.random() * 0.5);
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d * 0.75;
      effects.push(
        Fx.spawn(fxEl, FxGlyphs.sparkStar(10 + Math.random() * 6, i % 3 ? '#FFE04A' : '#9AE85A'), at, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${x}px,${y}px) scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `translate(${x * 1.1}px,${y * 1.1}px) scale(.4)`, opacity: 0 }
        ], { duration: 380, easing: 'ease-out' })
      );
    }
    for (let i = 0; i < 6; i++) {
      const x = (Math.random() * 2 - 1) * w;
      const up = 14 + Math.random() * 16;
      effects.push(
        Fx.spawn(fxEl, Fx.box(6, 6, 'border-radius:50%;background:#FF9A30;box-shadow:0 0 4px #FF7A10'), { x: target.x + x * 0.4, y: at.y }, [
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: `translate(${x * 0.5}px,${-up}px)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${x}px,6px)`, opacity: 0 }
        ], { duration: 600, delay: 40, easing: 'ease-out' })
      );
    }
    await Promise.all(effects);
  }
}
