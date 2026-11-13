import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Foul Play, after the Gen 5 animation:
 * - Gen 5: https://www.pokewiki.de/images/4/4f/Schmarotzer_Gen5.png
 *
 * The user turns dark and see-through and sneaks toward the target
 * (0-0.6 s). At the hit (0.3 s) a soft yellow ring of light flares up round
 * the target and widens while the target flashes (0.3-0.8 s); orange specks
 * scatter off it and drift down (0.6-1.2 s).
 */
export class FoulPlay {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = (target.x - launch.x) * 0.3;
    const dy = (target.y - launch.y) * 0.3;
    const sneak = Fx.anim(launchEl, [
      { transform: `${original} translate(0,0)`, opacity: 1, filter: 'brightness(1)' },
      { transform: `${original} translate(${dx}px,${dy}px)`, opacity: 0.45, filter: 'brightness(.25) saturate(.4)', offset: 0.45 },
      { transform: `${original} translate(0,0)`, opacity: 1, filter: 'brightness(1)' }
    ], { duration: 600, easing: 'ease-in-out', fill: 'none' });
    await Fx.wait(300);

    // The hit: a soft yellow ring of light round the target.
    const size = Math.max(tr.width, tr.height) * 1.1;
    const ring = document.createElement('div');
    ring.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle,#FFE86A00 42%,#FFE86Acc 52%,#F2C83A 58%,#FFE86A88 64%,#FFE86A00 74%);filter:blur(1px)';
    Fx.place(ring, target);
    fxEl.appendChild(ring);
    Fx.flash(targetEl, '#FFE86A', 0.6);
    Fx.shake(targetEl, 5);
    const effects: Promise<void>[] = [
      sneak,
      Fx.anim(ring, [
        { transform: 'scale(.5)', opacity: 0 },
        { transform: 'scale(.9)', opacity: 1, offset: 0.3 },
        { transform: 'scale(1.25)', opacity: 0 }
      ], { duration: 500, easing: 'ease-out' }).then(() => ring.remove())
    ];

    // Orange specks scatter off the target and drift down.
    for (let i = 0; i < 12; i++) {
      const speck = document.createElement('div');
      const s = 3 + Math.random() * 2;
      speck.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#FF8A2A;box-shadow:0 0 3px #FFB04A`;
      Fx.place(speck, target);
      fxEl.appendChild(speck);
      const ang = -Math.PI / 2 + (Math.random() * 2 - 1) * Math.PI * 0.8;
      const d = size * (0.35 + Math.random() * 0.3);
      const x = Math.cos(ang) * d - v.dir * 6;
      const y = Math.sin(ang) * d;
      effects.push(
        Fx.anim(speck, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${x}px,${y}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${x * 1.1}px,${y + tr.height * 0.35}px)`, opacity: 0 }
        ], { duration: 600, delay: 300 + Math.random() * 120, easing: 'ease-out' }).then(() => speck.remove())
      );
    }
    await Promise.all(effects);
  }
}
