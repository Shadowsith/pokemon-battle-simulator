import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { HEAT_BACKDROP, DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FireFlames } from './fire-flames';
import { HeatCrash } from './heat-crash';

/** Hand-made animations for Fire-type contact moves: punches, kicks and charges (Heat Crash lives in `heat-crash.ts`). */
export class FireStrikeMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    blazekick: (refs, _launch, target) => FireStrikeMoveAnimations.playBlazeKick(refs, target),
    firepunch: (refs, _launch, target) => FireStrikeMoveAnimations.playFirePunch(refs, target),
    flareblitz: (refs, launch, target, v) => FireStrikeMoveAnimations.playFlareBlitz(refs, launch, target, v),
    heatcrash: (refs, launch, target) => HeatCrash.play(refs, launch, target)
  };

  /**
   * Blaze Kick: a black foot stamps onto the target (0.17 s), then fire puffs
   * flare and flicker all round it while sparkles twinkle among them.
   */
  private static async playBlazeKick(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width * 0.5, 44);

    // The foot stamps in: shrinks onto the target from a large size.
    const foot = FxGlyphs.footGlyph(w);
    Fx.place(foot, target);
    fxEl.appendChild(foot);
    await Fx.anim(foot, [
      { transform: 'scale(2.2)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 170, easing: 'ease-in' });
    Fx.flash(targetEl, '#FF6A2A', 0.8);
    Fx.shake(targetEl, 6);

    // Fire puffs flare up round the foot and flicker; sparkles among them.
    const effects: Promise<void>[] = [
      Fx.anim(foot, [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.05)', opacity: 1, offset: 0.8 },
        { transform: 'scale(1.1)', opacity: 0 }
      ], { duration: 800, easing: 'ease-in' }).then(() => foot.remove())
    ];
    const rx = w * 0.95;
    const ry = w * 1.1;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      const d = 0.75 + Math.random() * 0.4;
      const puff = FxGlyphs.firePuff(w * (0.45 + Math.random() * 0.3), i % 3 ? 'hot' : 'red');
      Fx.place(puff, { x: target.x + Math.cos(a) * rx * d, y: target.y + Math.sin(a) * ry * d });
      fxEl.appendChild(puff);
      const frames: Keyframe[] = [{ transform: 'scale(.2)', opacity: 0 }];
      for (let k = 1; k <= 5; k++) {
        frames.push({ transform: `translateY(${-k * 2}px) scale(${k % 2 ? 1.1 : 0.9})`, opacity: 1, offset: 0.1 + k * 0.14 });
      }
      frames.push({ transform: 'translateY(-14px) scale(.6)', opacity: 0 });
      effects.push(Fx.anim(puff, frames, { duration: 650 + Math.random() * 200, delay: Math.random() * 120, easing: 'ease-in-out' }).then(() => puff.remove()));
    }
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(8 + Math.random() * 8, '#FFE04A');
      Fx.place(star, {
        x: target.x + (Math.random() * 2 - 1) * rx * 1.1,
        y: target.y + (Math.random() * 2 - 1) * ry * 1.1
      });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1.1) rotate(45deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(90deg)', opacity: 0 }
        ], { duration: 400, delay: 60 + Math.random() * 450, easing: 'ease-in-out' }).then(() => star.remove())
      );
    }
    setTimeout(() => Fx.shake(targetEl, 4), 250);
    await Promise.all(effects);
  }

  /**
   * Fire Punch: the backdrop turns red-hot, then a red fist slams onto the
   * target and a cloud of little flickering flames bursts up around it.
   */
  private static async playFirePunch(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);

    // 1. Red-hot backdrop.
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    await Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. The fist slams in, flames burst around it.
    const fist = FxGlyphs.fistGlyph(Math.max(r.width * 0.45, 36), 'red');
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 150, easing: 'ease-in' });
    Fx.flash(targetEl, '#FF8A3C', 0.7);
    Fx.shake(targetEl, 5);

    const spreadX = Math.max(r.width * 0.55, 34);
    const spreadY = Math.max(r.height * 0.5, 30);
    const flames: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      // Denser near the middle, with a few further out. burnFlame stands on this point.
      const ang = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const base = { x: target.x + Math.cos(ang) * spreadX * d, y: target.y + 10 + Math.sin(ang) * spreadY * d };
      flames.push(FireFlames.burnFlame(fxEl, base, 12 + Math.random() * 10, '#E8401C', 600 + Math.random() * 200, Math.random() * 350));
    }
    Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all(flames);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Flare Blitz, in three phases:
   * 1. lots of small flames rise straight up off the caster,
   * 2. the backdrop goes dark,
   * 3. the caster lunges and the target is hit by a big red flame blast with
   *    sparks over a bright blue backdrop; the caster takes recoil.
   */
  private static async playFlareBlitz(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const f = Fx.rect(fieldEl);

    // --- phase 1: flames rise off the caster ------------------------------
    const rise: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const x = lr.left - f.left + lr.width * (0.15 + Math.random() * 0.7);
      const y = lr.top - f.top + lr.height * (0.25 + Math.random() * 0.65);
      const up = 70 + Math.random() * 60;
      rise.push(
        FireFlames.fireStream(fxEl, { x, y }, { x, y: y - up }, {
          count: 5,
          gap: 90,
          travel: 520,
          size: [8, 14],
          grow: [1, 0.3],
          jitter: 3,
          wave: 2,
          delay: Math.random() * 250
        })
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => Fx.flash(launchEl, v.color, 0.45), i * 320);
    await Promise.all(rise);

    // --- phase 2: darkness -----------------------------------------------
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: 'ease-out' });
    await Fx.wait(150);

    // --- phase 3: lunge and flame blast ------------------------------------
    const original = launchEl.style.transform;
    const lunge = v.dir * 46;
    await Fx.anim(launchEl, [
      { transform: `${original} translateX(${-v.dir * 8}px)` },
      { transform: `${original} translateX(${lunge}px)` }
    ], { duration: 170, easing: 'ease-in' });

    const blue = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${target.x}px ${target.y}px,#C8ECFF 0,#5AA8EE 25%,#2463C2 60%,#123A86)`
    );
    dim.after(blue);
    const blueDone = Fx.anim(blue, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: 1300,
      easing: 'linear'
    }).then(() => blue.remove());
    Fx.flash(targetEl, '#FF5A3C', 0.9);
    Fx.shake(targetEl, 7);
    Fx.shakeField(fieldEl, 0.9);

    // The blast: red flame bursting outward in every direction, plus a burning core.
    const tr = Fx.rect(targetEl);
    const reach = Math.max(tr.width * 0.75, 55);
    const blast: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
      const d = reach * (0.7 + Math.random() * 0.4);
      blast.push(
        FireFlames.fireStream(fxEl, target, { x: target.x + Math.cos(a) * d, y: target.y + Math.sin(a) * d }, {
          count: 4,
          gap: 55,
          travel: 420,
          size: [22, 34],
          grow: [0.6, 1.9],
          jitter: 8,
          wave: 3,
          tone: 'red'
        })
      );
    }
    blast.push(FireFlames.fireStream(fxEl, target, target, { count: 8, gap: 60, travel: 420, size: [40, 56], grow: [0.7, 1.6], jitter: 6, wave: 0, tone: 'red' }));
    // Sparkling flames fly out past the blast; dark embers speckle it.
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const spark = i % 3 ? FxGlyphs.firePuff(7 + Math.random() * 5) : FxGlyphs.sparkStar(9, '#FFE38A');
      Fx.place(spark, target);
      fxEl.appendChild(spark);
      const d = reach * (1.1 + Math.random() * 0.7);
      Fx.anim(spark, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(a) * d * 0.5}px,${Math.sin(a) * d * 0.5}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.4)`, opacity: 0 }
      ], { duration: 650, easing: 'ease-out', delay: 60 + Math.random() * 250 }).then(() => spark.remove());
    }
    for (let i = 0; i < 14; i++) {
      const ember = document.createElement('div');
      const sz = 3 + Math.random() * 3;
      ember.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:#7A0E0E`;
      Fx.place(ember, { x: target.x + (Math.random() * 2 - 1) * reach * 0.8, y: target.y + (Math.random() * 2 - 1) * reach * 0.7 });
      fxEl.appendChild(ember);
      Fx.anim(ember, [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 0 }], {
        duration: 600,
        delay: 120 + Math.random() * 300
      }).then(() => ember.remove());
    }

    // Back to the start spot, then recoil.
    await Fx.anim(launchEl, [{ transform: `${original} translateX(${lunge}px)` }, { transform: original }], {
      duration: 220,
      easing: 'ease-out'
    });
    launchEl.getAnimations?.().forEach((a) => a.cancel());
    launchEl.style.transform = original;
    setTimeout(() => {
      Fx.flash(launchEl, '#E06666', 0.5);
      Fx.shake(launchEl, 4);
    }, 300);
    await Promise.all(blast);
    await blueDone;
    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in' });
    dim.remove();
  }
}
