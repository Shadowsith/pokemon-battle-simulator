import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxEffects } from '../../fx-effects';

/**
 * Shadow Claw, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/4/4d/Dunkelklaue_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/9/9e/Dunkelklaue_Gen5.png
 *
 * Three black shadow claws rip down across the target with red glints
 * (0-0.75 s, hit at 0.1 s) while red specks scatter off it (0.1-0.9 s).
 * A black smoke cloud puffs up on the target (0.45-1.0 s).
 */
export class ShadowClaw {
  static async play(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const len = Math.max(tr.height * 0.9, 60);

    // The claws rake down from the upper side facing the user.
    const parts: Promise<void>[] = [0, 1, 2].map(
      (i) =>
        new Promise<void>((done) =>
          setTimeout(() => {
            const at: Point = { x: target.x + (i - 1) * tr.width * 0.18, y: target.y - tr.height * 0.05 };
            FxEffects.clawMark(fxEl, at, len, v.dir > 0 ? 60 : 120, { glow: ['#5A1A5A', '#200A2Aaa'], tip: '#FF2A2A' }).then(done);
          }, i * 60)
        )
    );
    await Fx.wait(100);
    Fx.flash(targetEl, '#3A1A4A', 0.6);
    Fx.shake(targetEl, 6);

    // Red specks scatter off the target.
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FF8A8A,#D01A1A 60%,#8A0A0A);box-shadow:0 0 3px #FF2A2A`;
      Fx.place(dot, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.25, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.25 });
      fxEl.appendChild(dot);
      const ang = Math.random() * Math.PI * 2;
      const d = tr.width * (0.3 + Math.random() * 0.4);
      parts.push(
        Fx.anim(dot, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d * 0.6}px,${Math.sin(ang) * d * 0.6}px) scale(1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d + 10}px) scale(.6)`, opacity: 0 }
        ], { duration: 700, delay: Math.random() * 150, easing: 'ease-out', fill: 'backwards' }).then(() => dot.remove())
      );
    }

    // A black smoke cloud puffs up on the target.
    await Fx.wait(350);
    parts.push(FxEffects.smokePuff(fxEl, { x: target.x, y: target.y - tr.height * 0.1 }, Math.max(tr.width * 0.9, 70), ['#3A3242', '#141018']));
    await Promise.all(parts);
  }
}
