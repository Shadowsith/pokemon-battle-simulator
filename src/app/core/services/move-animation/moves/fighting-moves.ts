import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Fighting-type moves. */
export class FightingMoveAnimations {
  /** Hand-made Fighting move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    highjumpkick: (refs, _launch, target, v) => FightingMoveAnimations.playHighJumpKick(refs, target, v)
  };

  /**
   * High Jump Kick: the caster darts forward and back, then jagged comic-style
   * impact bursts - a big red one, a yellow-orange one over it, then a
   * smaller one - pop on the target while red specks scatter.
   */
  private static async playHighJumpKick(refs: BattleStageRefs, target: Point, v: MoveVisual) {
    const { launchEl, targetEl, fieldEl, fxEl } = refs;
    const r = targetEl.getBoundingClientRect();
    const size = Math.max(r.width * 0.9, 64);

    await FxEffects.dart(launchEl, v.dir);

    // [x offset, y offset, size factor, outer colour, inner colour, delay]
    const bursts: [number, number, number, string, string, number][] = [
      [-0.15, -0.1, 1, '#E8281C', '#FF6A2A', 0],
      [0.18, 0.08, 0.85, '#FF9A1A', '#FFE84A', 70],
      [-0.05, 0.22, 0.55, '#E8281C', '#FFB02A', 150]
    ];
    const pops = bursts.map(([ox, oy, f, outer, inner, delay]) =>
      Fx.wait(delay).then(() => {
        const s = size * f;
        const el = FxGlyphs.spikyBurst(s, outer, inner);
        Fx.place(el, { x: target.x + ox * size, y: target.y + oy * size });
        fxEl.appendChild(el);
        const rot = Math.random() * 30 - 15;
        return Fx.anim(el, [
          { transform: `scale(.3) rotate(${rot}deg)`, opacity: 1 },
          { transform: `scale(1.1) rotate(${rot}deg)`, opacity: 1, offset: 0.25 },
          { transform: `scale(1) rotate(${rot}deg)`, opacity: 1, offset: 0.7 },
          { transform: `scale(1.05) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: 480, easing: 'ease-out' }).then(() => el.remove());
      })
    );

    // Red specks scatter out, some landing on the platform.
    for (let i = 0; i < 12; i++) {
      const s = 4 + Math.random() * 4;
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#FF8A70,#E0281C 60%,#A01010)`;
      Fx.place(d, target);
      fxEl.appendChild(d);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (0.5 + Math.random() * 0.5);
      Fx.anim(d, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 12}px)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.6 + 16}px)`, opacity: 0 }
      ], { duration: 600 + Math.random() * 200, easing: 'ease-out' }).then(() => d.remove());
    }
    Fx.flash(targetEl, '#FF6A2A', 0.7);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.5);
    await Promise.all(pops);
  }
}
