import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/**
 * Stone Edge, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/83/Steinkante_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/8/8f/Steinkante_Gen5.png
 *
 * Pointed stones pop out of the ground round the target and circle it, rising
 * (0-0.65 s). One after another they stab into the target (hits at
 * 0.7-1.0 s, first at 0.7 s), each with a white impact star and a golden
 * light streak shooting upward; the streaks fade by ~1.35 s.
 */
export class StoneEdge {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const rx = Math.max(tr.width * 0.7, 45);
    const ry = Math.max(tr.height * 0.18, 12);

    const parts: Promise<void>[] = [];
    const count = 6;
    const circle = 650;
    for (let i = 0; i < count; i++) {
      const w = 14 + Math.random() * 6;
      const rock = FxGlyphs.pointedRock(w);
      Fx.place(rock, target);
      fxEl.appendChild(rock);
      const a0 = (Math.PI * 2 * i) / count;
      const lift = tr.height * (0.1 + 0.08 * i);
      const stabAt = 700 + i * 60;
      const dur = stabAt + 60;
      // Circle the target on an ellipse round its feet while rising, then dart into its centre.
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const a = a0 + t * Math.PI * 1.5;
        const x = Math.cos(a) * rx;
        const y = foot.y - target.y + Math.sin(a) * ry - lift * t;
        frames.push({ transform: `translate(${x}px,${y}px) scale(${0.4 + 0.6 * Math.min(1, t * 3)})`, opacity: Math.min(1, t * 4), offset: (t * circle) / dur });
      }
      const aEnd = a0 + Math.PI * 1.5;
      frames.push({ transform: `translate(${Math.cos(aEnd) * rx}px,${foot.y - target.y + Math.sin(aEnd) * ry - lift}px) scale(1)`, opacity: 1, offset: (stabAt - 60) / dur });
      frames.push({ transform: 'translate(0,0) scale(.8)', opacity: 1, offset: stabAt / dur });
      frames.push({ transform: 'translate(0,0) scale(.4)', opacity: 0 });
      parts.push(Fx.anim(rock, frames, { duration: dur, easing: 'linear' }).then(() => rock.remove()));
      setTimeout(() => StoneEdge.stab(refs, target, tr, parts, i === 0), stabAt);
    }
    await Fx.wait(700 + count * 60 + 20);
    await Promise.all(parts);
  }

  /** One stab: a white star on the target and a golden streak shooting up from it. */
  private static stab(refs: BattleStageRefs, target: Point, tr: DOMRect, parts: Promise<void>[], first: boolean) {
    const { fxEl, targetEl } = refs;
    const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.25, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.2 };
    if (first) Fx.flash(targetEl, '#ffffff', 0.6);
    Fx.shake(targetEl, first ? 6 : 3);
    const star = FxGlyphs.sparkStar(22, '#FFFFFF');
    Fx.place(star, at);
    fxEl.appendChild(star);
    parts.push(
      Fx.anim(star, [
        { transform: 'scale(.2) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: 0.4 },
        { transform: 'scale(.4) rotate(40deg)', opacity: 0 }
      ], { duration: 260, easing: 'ease-out' }).then(() => star.remove())
    );
    const h = Math.max(tr.height * 1.1, 70);
    const streak = document.createElement('div');
    streak.style.cssText = `position:absolute;left:${at.x - 2}px;top:${at.y - h}px;width:4px;height:${h}px;pointer-events:none;border-radius:2px;background:linear-gradient(0deg,#FFFFFF,#FFE070 30%,#C8A020 70%,#C8A02000);box-shadow:0 0 6px #FFE070`;
    fxEl.appendChild(streak);
    parts.push(
      Fx.anim(streak, [
        { transform: 'scaleY(0)', transformOrigin: '50% 100%', opacity: 1 },
        { transform: 'scaleY(1)', transformOrigin: '50% 100%', opacity: 1, offset: 0.35 },
        { transform: `translateY(${-h * 0.3}px) scaleY(.6)`, transformOrigin: '50% 100%', opacity: 0 }
      ], { duration: 380, easing: 'ease-out' }).then(() => streak.remove())
    );
  }
}
