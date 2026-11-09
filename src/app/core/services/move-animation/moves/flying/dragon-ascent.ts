import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Dragon Ascent, after the ORAS animation: the scene goes black and the user
 * glows orange-gold (0.25-0.6 s), then shoots up out of sight (to 0.9 s). A
 * starry nebula appears; the user crosses it as a tiny green streak
 * (1.05-1.45 s) and vanishes in a bright star flash with green shards
 * (to 1.75 s). The scene goes dark and a green comet dives onto the target
 * (1.87-2.12 s), erupting in a big green-white blast (to 2.72 s). The user is
 * back in its place and its Defense and Sp. Def drop (2.97 s to ~3.8 s).
 */
export class DragonAscent {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl: el } = refs;
    el.getAnimations?.().forEach((a) => a.cancel());
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;

    // Black scene; the user glows orange-gold, then shoots up out of sight with a trail.
    const dark = Fx.backdrop(fieldEl, 'background:#030305');
    await Fx.anim(dark, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    await Fx.anim(el, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(4) hue-rotate(-10deg) brightness(1.2) drop-shadow(0 0 10px #FFA020)' }
    ], { duration: 350, easing: 'ease-in', fill: 'forwards' });
    const lr = Fx.rect(el);
    const trail = document.createElement('div');
    trail.style.cssText = `position:absolute;left:${launch.x - 6}px;top:${launch.y - H}px;width:12px;height:${H}px;transform-origin:50% 100%;pointer-events:none;border-radius:6px;background:linear-gradient(0deg,#FFE070,#6AF08A 40%,#6AF08A00);filter:blur(1px)`;
    fxEl.appendChild(trail);
    Fx.anim(trail, [{ transform: 'scaleY(0)', opacity: 1 }, { transform: 'scaleY(1)', opacity: 1, offset: 0.6 }, { transform: 'scaleY(1)', opacity: 0 }], { duration: 450, easing: 'ease-out' })
      .then(() => trail.remove());
    await Fx.anim(el, [
      { transform: 'translateY(0)', filter: 'sepia(1) saturate(4) hue-rotate(-10deg) brightness(1.2) drop-shadow(0 0 10px #FFA020)' },
      { transform: `translateY(${-H - lr.height}px)`, filter: 'sepia(1) saturate(4) hue-rotate(-10deg) brightness(1.2) drop-shadow(0 0 10px #FFA020)' }
    ], { duration: 300, easing: 'ease-in', fill: 'forwards' });

    // The nebula: a tiny streak crosses it and vanishes in a star flash.
    const space = document.createElement('div');
    space.style.cssText =
      'position:absolute;inset:0;' +
      'background:radial-gradient(circle at 30% 35%,#6A2AB8aa,#6A2AB800 40%),radial-gradient(circle at 65% 55%,#2A4AD8aa,#2A4AD800 45%),radial-gradient(circle at 75% 25%,#3AA87A66,#3AA87A00 35%),' +
      'radial-gradient(circle at 20% 70%,#ffffff 0 1px,#0000 1.5px) 0 0/37px 41px,radial-gradient(circle at 60% 30%,#ffffffcc 0 1px,#0000 1.5px) 0 0/53px 47px,#06061A';
    dark.appendChild(space);
    await Fx.anim(space, [{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
    const flashAt: Point = { x: W * 0.55, y: H * 0.4 };
    const streak = document.createElement('div');
    streak.style.cssText = 'width:4px;height:30px;border-radius:2px;pointer-events:none;background:linear-gradient(0deg,#6AF08A00,#B8FFC8);box-shadow:0 0 6px #6AF08A';
    Fx.place(streak, { x: flashAt.x - v.dir * W * 0.2, y: H * 0.95 });
    fxEl.appendChild(streak);
    const sx = v.dir * W * 0.2;
    const sy = flashAt.y - H * 0.95;
    const sAngle = (Math.atan2(sx, -sy) * 180) / Math.PI;
    await Fx.anim(streak, [
      { transform: `translate(0,0) rotate(${sAngle}deg)`, opacity: 1 },
      { transform: `translate(${sx}px,${sy}px) rotate(${sAngle}deg) scale(.5)`, opacity: 1 }
    ], { duration: 400, easing: 'ease-out' });
    streak.remove();
    await DragonAscent.starFlash(fxEl, flashAt);

    // Darkness again, and the green comet dives onto the target.
    await Fx.anim(space, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' });
    const from: Point = { x: target.x - v.dir * W * 0.35, y: -40 };
    const cdx = target.x - from.x;
    const cdy = target.y - from.y;
    const angle = (Math.atan2(cdy, cdx) * 180) / Math.PI;
    const tail = Math.max(lr.width * 2, 140);
    const comet = document.createElement('div');
    comet.style.cssText = `position:absolute;left:${from.x - tail}px;top:${from.y - 12}px;width:${tail + 12}px;height:24px;transform-origin:${tail}px 50%;pointer-events:none;border-radius:12px;background:linear-gradient(90deg,#6AF08A00,#6AF08Aaa 60%,#E8FFE8);box-shadow:0 0 14px #40E070`;
    fxEl.appendChild(comet);
    await Fx.anim(comet, [
      { transform: `translate(0,0) rotate(${angle}deg)` },
      { transform: `translate(${cdx}px,${cdy}px) rotate(${angle}deg)` }
    ], { duration: 250, easing: 'ease-in' });
    comet.remove();
    await DragonAscent.blast(refs, target);

    // The darkness clears, the user is back in its place, and its defences drop.
    el.getAnimations?.().forEach((a) => a.cancel());
    await Promise.all([
      Fx.anim(dark, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' }),
      Fx.anim(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'none' })
    ]);
    dark.remove();
    await FxEffects.statDownBubbles(refs, launch);
  }

  /** A bright star flash with lens-flare rings and green shards flying out. */
  private static async starFlash(fxEl: HTMLElement, at: Point): Promise<void> {
    const done: Promise<void>[] = [];
    const star = FxGlyphs.sparkStar(46, '#ffffff');
    Fx.place(star, at);
    fxEl.appendChild(star);
    done.push(Fx.anim(star, [{ transform: 'scale(0) rotate(0deg)', opacity: 1 }, { transform: 'scale(1.4) rotate(45deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(.6) rotate(90deg)', opacity: 0 }], { duration: 300, easing: 'ease-out' })
      .then(() => star.remove()));
    for (const [k, s] of [[0.3, 40], [0.6, 26], [-0.4, 30]] as const) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:2px solid #A8E8FF88;background:#A8E8FF22`;
      Fx.place(ring, { x: at.x + k * 120, y: at.y + k * 50 });
      fxEl.appendChild(ring);
      done.push(Fx.anim(ring, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 300, easing: 'ease-out' }).then(() => ring.remove()));
    }
    for (let i = 0; i < 10; i++) {
      const shard = document.createElement('div');
      const s = 6 + Math.random() * 8;
      shard.style.cssText = `width:${s}px;height:${s * 1.6}px;pointer-events:none;clip-path:polygon(50% 0,100% 100%,0 100%);background:#6AF08A`;
      Fx.place(shard, at);
      fxEl.appendChild(shard);
      const ang = Math.random() * Math.PI * 2;
      const d = 60 + Math.random() * 80;
      done.push(
        Fx.anim(shard, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], { duration: 300, easing: 'ease-out' }).then(() => shard.remove())
      );
    }
    await Promise.all(done);
  }

  /** A big green-white blast on the target with green arcs and shards. */
  private static async blast(refs: BattleStageRefs, target: Point): Promise<void> {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const size = Math.max(r.width * 1.8, 130);
    const glow = document.createElement('div');
    glow.style.cssText = `width:${size * 1.4}px;height:${size * 1.4}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 22%,#D8FFE0dd 36%,#6AF08A88 55%,#30C05000 72%)`;
    const burst = FxGlyphs.spikyBurst(size, '#30C050', '#8AF0A0', '#ffffff');
    Fx.place(glow, target);
    Fx.place(burst, target);
    fxEl.append(glow, burst);
    Fx.flash(targetEl, '#8AF0A0', 0.9);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 0.9);
    const done: Promise<void>[] = [
      Fx.anim(glow, [{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(1.15)', opacity: 0 }], { duration: 600, easing: 'ease-out' })
        .then(() => glow.remove()),
      Fx.anim(burst, [{ transform: 'scale(.3) rotate(0deg)', opacity: 1 }, { transform: 'scale(1) rotate(12deg)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.25) rotate(20deg)', opacity: 0 }], { duration: 600, easing: 'ease-out' })
        .then(() => burst.remove())
    ];
    for (const [delay, k] of [[0, 1], [120, 1.3]] as const) {
      const arc = document.createElement('div');
      const w = size * k;
      arc.style.cssText = `width:${w}px;height:${w * 0.6}px;border-radius:50%;pointer-events:none;border:5px solid #6AF08A;border-bottom-color:#6AF08A00;box-shadow:0 0 10px #40E070`;
      Fx.place(arc, target);
      fxEl.appendChild(arc);
      done.push(Fx.anim(arc, [{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 500, delay, easing: 'ease-out' }).then(() => arc.remove()));
    }
    await Promise.all(done);
  }
}
