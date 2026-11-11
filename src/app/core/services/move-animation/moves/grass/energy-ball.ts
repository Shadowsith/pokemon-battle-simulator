import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';

/** Energy Ball's greens: light core, body, dark edge. */
const GREEN = ['#E8FFC8', '#5FE04A', '#2AA83A'] as const;

/**
 * Energy Ball, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/3/36/Energieball_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/d/d4/Energieball_Gen5.png
 *
 * The scene goes dark brown (0-0.25 s) and a spiky green aura flares round
 * the user while green motes gather in (0.25-0.75 s). A green ball of energy
 * flies to the target trailing sparkles (0.75-1.1 s) and bursts there into
 * little green bubbles and sparkles (hit at 1.1 s, to ~1.85 s); the scene
 * clears (to ~2.15 s).
 */
export class EnergyBall {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const dim = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 45%,#3A2A18,#120A04)');
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });

    // The aura: a pulsing spiky green glow round the user, motes drawn in.
    const auraSize = Math.max(lr.width, lr.height) * 1.1;
    const aura = FxGlyphs.spikyBurst(auraSize, `${GREEN[2]}aa`, `${GREEN[1]}cc`, `${GREEN[0]}00`);
    Fx.place(aura, launch);
    fxEl.appendChild(aura);
    const pulse = Fx.anim(aura, [
      { transform: 'scale(.5)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.85, offset: 0.35 },
      { transform: 'scale(.9)', opacity: 0.7, offset: 0.65 },
      { transform: 'scale(1.05)', opacity: 0 }
    ], { duration: 500, easing: 'ease-in-out' }).then(() => aura.remove());
    for (let i = 0; i < 10; i++) {
      const mote = EnergyBall.mote(3 + Math.random() * 3);
      const ang = Math.random() * Math.PI * 2;
      const d = auraSize * (0.6 + Math.random() * 0.3);
      Fx.place(mote, launch);
      fxEl.appendChild(mote);
      Fx.anim(mote, [
        { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`, opacity: 0 },
        { transform: `translate(${Math.cos(ang) * d * 0.7}px,${Math.sin(ang) * d * 0.7}px)`, opacity: 1, offset: 0.3 },
        { transform: 'translate(0,0)', opacity: 0 }
      ], { duration: 400, delay: Math.random() * 150, easing: 'ease-in' }).then(() => mote.remove());
    }
    await pulse;

    // The shot: the ball flies over in a shallow arc, dropping sparkles.
    const size = Math.max(Math.max(lr.width, lr.height) * 0.35, 30);
    const ball = EnergyBall.ball(size);
    Fx.place(ball, launch);
    fxEl.appendChild(ball);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 30;
    const frames: Keyframe[] = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      frames.push({ transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * lift}px) scale(${0.6 + t * 0.4})` });
    }
    const flight = 350;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        const t = i / 6;
        const mote = EnergyBall.mote(3 + Math.random() * 2);
        Fx.place(mote, { x: launch.x + dx * t, y: launch.y + dy * t - Math.sin(t * Math.PI) * lift });
        fxEl.appendChild(mote);
        Fx.anim(mote, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(10px)', opacity: 0 }], { duration: 400, easing: 'ease-out' }).then(() => mote.remove());
      }, (i / 6) * flight);
    }
    await Fx.anim(ball, frames, { duration: flight, easing: 'linear' });
    ball.remove();

    // The burst: little bubbles spread out and pop, sparkles twinkle.
    Fx.flash(targetEl, GREEN[1], 0.8);
    Fx.shake(targetEl, 6);
    const effects: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const bubble = EnergyBall.ball(size * (0.4 + Math.random() * 0.25));
      Fx.place(bubble, target);
      fxEl.appendChild(bubble);
      const ang = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
      const d = Math.max(tr.width, 50) * (0.25 + Math.random() * 0.15);
      const end = `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px)`;
      effects.push(
        Fx.anim(bubble, [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `${end} scale(1)`, opacity: 1, offset: 0.6 },
          { transform: `${end} scale(1.3)`, opacity: 0 }
        ], { duration: 550, easing: 'ease-out' }).then(() => bubble.remove())
      );
    }
    for (let i = 0; i < 12; i++) {
      const mote = EnergyBall.mote(3 + Math.random() * 3);
      Fx.place(mote, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.5, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.4 });
      fxEl.appendChild(mote);
      effects.push(
        Fx.anim(mote, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.3)', opacity: 1, offset: 0.4 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 400, delay: 100 + Math.random() * 250, easing: 'ease-in-out' }).then(() => mote.remove())
      );
    }
    await Promise.all(effects);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }

  /** A glossy green energy ball, `s` px wide, with a light rim and a highlight. */
  private static ball(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#ffffff 0 10%,${GREEN[0]} 18%,${GREEN[1]} 50%,${GREEN[2]} 80%);border:1.5px solid ${GREEN[0]};box-shadow:0 0 ${s * 0.4}px ${GREEN[1]}`;
    return el;
  }

  /** A tiny glowing yellow-green mote, `s` px wide. */
  private static mote(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:#E8FF8A;box-shadow:0 0 4px #B8F05A`;
    return el;
  }
}
