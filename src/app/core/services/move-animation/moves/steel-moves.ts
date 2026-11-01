import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Silver tones of Steel moves: sparkle, dust light, dust shade. */
const SILVER = '#DDE2EC';
const DUST: [string, string] = ['#E4E8F0', '#A9B0BE'];

/** Hand-made animations for Steel-type moves. */
export class SteelMoveAnimations {
  /** Hand-made Steel move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    irontail: (refs, launch, target, v) => SteelMoveAnimations.playIronTail(refs, launch, target, v)
  };

  /**
   * Iron Tail: the caster glints with silver sparkles, then a wide silver
   * swipe sweeps across the target in the attack direction (left to right
   * for the player), kicking up glittering iron dust clouds along its path.
   */
  private static async playIronTail(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    await SteelMoveAnimations.silverGlint(refs, launch);
    await SteelMoveAnimations.ironSwipe(refs, target, v.dir);
  }

  /** Silver four-point sparkles twinkle around the caster while it flashes silver. */
  private static async silverGlint(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const sparkles: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const star = FxGlyphs.sparkStar(12 + Math.random() * 14, SILVER);
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * r.width * 0.5,
        y: launch.y + (Math.random() * 2 - 1) * r.height * 0.45
      });
      fxEl.appendChild(star);
      sparkles.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(25deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(45deg)', opacity: 0 }
        ], { duration: 420, easing: 'ease-in-out', delay: i * 70 }).then(() => star.remove())
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, '#F0F3FA', 0.6), 80 + i * 220);
    await Promise.all(sparkles);
  }

  /**
   * A wide, flat silver arc is drawn across the target from the attack side
   * to the far side; dust clouds and sparkles follow the blade's tip.
   */
  private static async ironSwipe(refs: BattleStageRefs, target: Point, dir: 1 | -1) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 1.9, 120);
    const h = Math.max(r.height * 0.55, 34);
    const sweep = 380;

    const arc = document.createElement('div');
    arc.style.cssText = `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;border:6px solid #F2F4F8;border-top-color:#ffffff;border-bottom-color:#B8BFCC;background:radial-gradient(ellipse at 50% 50%,#ffffff00 55%,#DDE2EC55 70%,#ffffff00 74%);filter:drop-shadow(0 0 6px #ffffffcc)`;
    Fx.place(arc, target);
    fxEl.appendChild(arc);
    // Reveal from the attack side (left for the player) to the far side.
    const from = dir > 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
    const arcDone = Fx.anim(arc, [
      { clipPath: from, opacity: 1 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1, offset: 0.6 },
      { clipPath: 'inset(0 0 0 0)', opacity: 0 }
    ], { duration: sweep / 0.6, easing: 'ease-out' }).then(() => arc.remove());

    // Dust clouds and glints trail the blade's tip along the arc.
    const steps = 5;
    const effects: Promise<void>[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const x = target.x + dir * (t - 0.5) * w * 0.85;
      const y = target.y + Math.sin(t * Math.PI) * h * 0.35;
      effects.push(
        Fx.wait(t * sweep).then(async () => {
          const star = FxGlyphs.sparkStar(14 + Math.random() * 10, SILVER);
          Fx.place(star, { x, y: y - h * 0.3 });
          fxEl.appendChild(star);
          Fx.anim(star, [
            { transform: 'scale(.2)', opacity: 1 },
            { transform: 'scale(1) rotate(30deg)', opacity: 0 }
          ], { duration: 420, easing: 'ease-out' }).then(() => star.remove());
          await FxEffects.smokePuff(fxEl, { x, y }, Math.max(r.width * 0.45, 36), DUST);
        })
      );
    }
    await Fx.wait(sweep * 0.45);
    Fx.flash(targetEl, '#ffffff', 0.7);
    Fx.shake(targetEl, 5);
    await Promise.all([arcDone, ...effects]);
  }
}
