import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Water Gun, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/1/1a/Aquaknarre_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/e/e4/Aquaknarre_Gen5.png
 *
 * A stream of glowing cyan-white droplets squirts from the user's mouth to the
 * target in a gentle arc (0-0.6 s, first droplet lands at 0.3 s): the target
 * flashes blue, small white splashes pop on it and bubbles drift up off it
 * (to ~0.9 s).
 */
export class WaterGun {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.25, y: launch.y - lr.height * 0.1 };
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const arc = -Math.max(Math.abs(dx) * 0.08, 10);
    const count = 14;
    const flight = 300;
    const step = 22;

    const effects: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const s = 7 + Math.random() * 5;
      const jitter = (Math.random() * 2 - 1) * 5;
      const drop = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff,#A8E8FF 45%,#3AA0F0);box-shadow:0 0 6px #7FD4FF');
      effects.push(
        Fx.spawn(fxEl, drop, from, [
          { transform: 'translate(0,0) scale(.5)', opacity: 0 },
          { transform: `translate(${dx * 0.15}px,${dy * 0.15 + arc * 0.5}px) scale(1)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc + jitter}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${dx}px,${dy + jitter}px) scale(1.2)`, opacity: 0.9 }
        ], { duration: flight, easing: 'linear', delay: i * step })
      );
    }

    // The target gets hit while the stream keeps landing.
    const splashes: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const t = flight + i * 70;
      const at: Point = { x: target.x - v.dir * tr.width * 0.15 + (Math.random() * 2 - 1) * 10, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.2 };
      splashes.push(
        Fx.spawn(fxEl, FxGlyphs.spikyBurst(18 + Math.random() * 10, '#6FC8FF', '#E8F8FF', '#ffffff'), at, [
          { transform: 'scale(.3) rotate(0deg)', opacity: 0.95 },
          { transform: 'scale(1) rotate(20deg)', opacity: 0.9, offset: 0.4 },
          { transform: 'scale(1.1) rotate(30deg)', opacity: 0 }
        ], { duration: 260, easing: 'ease-out', delay: t })
      );
      setTimeout(() => {
        Fx.flash(targetEl, '#6FB8FF', 0.4);
        if (i % 2 === 0) Fx.shake(targetEl, 3);
      }, t);
    }
    for (let i = 0; i < 5; i++) {
      const s = 6 + Math.random() * 6;
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.35, y: target.y + tr.height * 0.1 };
      splashes.push(
        Fx.spawn(fxEl, FxGlyphs.bubbleGlyph(s), at, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: 'translate(0,-10px) scale(1)', opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.random() * 12 - 6}px,-34px) scale(.8)`, opacity: 0 }
        ], { duration: 450, easing: 'ease-out', delay: flight + 120 + i * 50 })
      );
    }
    await Promise.all([...effects, ...splashes]);
  }
}
