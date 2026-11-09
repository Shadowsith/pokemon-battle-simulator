import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxEffects } from '../fx-effects';
import { FxGlyphs } from '../fx-glyphs';

/** Hand-made animations for Poison-type moves. */
export class PoisonMoveAnimations {
  /** Hand-made Poison move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    acid: (refs, launch, target) => PoisonMoveAnimations.playAcidSpit(refs, launch, target),
    belch: (refs, launch, target) => PoisonMoveAnimations.playBelch(refs, launch, target),
    sludgebomb: (refs, launch, target) => PoisonMoveAnimations.playSludgeBomb(refs, launch, target),
    toxic: (refs, _launch, target) => PoisonMoveAnimations.playToxic(refs, target)
  };

  /**
   * Belch, after the XY animation: the user rears up and a pink gas puff with
   * yellow sparks bursts at its mouth (0-0.4 s). The scene turns a dusky
   * maroon and pink-orange sound rings travel to the target, swelling
   * (0.4-1.1 s); rings close in round it with a pink zigzag ring
   * (1.0-1.6 s), then pink gas bursts all round the target (1.5-2.1 s) and the
   * scene clears (to ~2.4 s).
   */
  private static async playBelch(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const pink: [string, string] = ['#FFB0D8', '#F070B0'];
    const dir = target.x >= launch.x ? 1 : -1;

    // The user rears up and burps a pink gas puff with sparks.
    const original = launchEl.style.transform;
    const rear = Fx.anim(launchEl, [
      { transform: `${original} translateY(0) scale(1,1)` },
      { transform: `${original} translateY(-6px) scale(.97,1.05)`, offset: 0.4 },
      { transform: `${original} translateY(0) scale(1.03,.97)`, offset: 0.7 },
      { transform: `${original} translateY(0) scale(1,1)` }
    ], { duration: 500, easing: 'ease-out', fill: 'none' });
    const mouth: Point = { x: launch.x + dir * lr.width * 0.3, y: launch.y - lr.height * 0.15 };
    const effects: Promise<unknown>[] = [rear, Fx.wait(150).then(() => FxEffects.smokePuff(fxEl, mouth, Math.max(lr.width * 0.6, 50), pink))];
    for (let i = 0; i < 3; i++) {
      const spark = FxGlyphs.sparkStar(10, '#FFE04A');
      Fx.place(spark, { x: mouth.x + dir * (10 + i * 8), y: mouth.y + (i - 1) * 10 });
      fxEl.appendChild(spark);
      effects.push(
        Fx.anim(spark, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(0)', opacity: 0 }], {
          duration: 300,
          delay: 200 + i * 60,
          easing: 'ease-out'
        }).then(() => spark.remove())
      );
    }
    await Fx.wait(400);

    // A dusky scene; sound rings travel to the target, swelling.
    const dusk = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#9A4A60,#6A2A40 60%,#3A1424)');
    effects.push(Fx.anim(dusk, [{ opacity: 0 }, { opacity: 0.85, offset: 0.1 }, { opacity: 0.85, offset: 0.85 }, { opacity: 0 }], { duration: 2000, easing: 'linear' }).then(() => dusk.remove()));
    const ringSize = Math.max(tr.height * 0.9, 70);
    const dx = target.x - mouth.x;
    const dy = target.y - mouth.y;
    for (let i = 0; i < 5; i++) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${ringSize}px;height:${ringSize}px;border-radius:50%;pointer-events:none;border:4px solid #FF9AC0;box-shadow:0 0 8px #FFA060,inset 0 0 8px #FFA060`;
      Fx.place(ring, mouth);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [
          { transform: 'translate(0,0) scale(.2)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${dy * 0.3}px) scale(.6)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${dx}px,${dy}px) scale(1.3)`, opacity: 0 }
        ], { duration: 500, delay: i * 100, easing: 'ease-in' }).then(() => ring.remove())
      );
    }
    await Fx.wait(600);

    // Rings close in round the target with a pink zigzag ring.
    for (const [delay, k] of [[0, 1.6], [120, 1.3], [240, 1.0]] as const) {
      const ring = document.createElement('div');
      ring.style.cssText = `width:${ringSize * k}px;height:${ringSize * k}px;border-radius:50%;pointer-events:none;border:4px solid #FF7AB8;box-shadow:0 0 8px #FF5AA0`;
      Fx.place(ring, target);
      fxEl.appendChild(ring);
      effects.push(
        Fx.anim(ring, [{ transform: 'scale(1.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.3 }, { transform: 'scale(.4)', opacity: 0 }], {
          duration: 550,
          delay,
          easing: 'ease-in'
        }).then(() => ring.remove())
      );
    }
    const zig = PoisonMoveAnimations.zigzagRing(ringSize * 0.8);
    Fx.place(zig, target);
    fxEl.appendChild(zig);
    effects.push(
      Fx.anim(zig, [
        { transform: 'scale(.4) rotate(0deg)', opacity: 0 },
        { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.3 },
        { transform: 'scale(.9) rotate(40deg)', opacity: 1, offset: 0.7 },
        { transform: 'scale(1.2) rotate(60deg)', opacity: 0 }
      ], { duration: 600, easing: 'ease-out' }).then(() => zig.remove())
    );
    Fx.shake(targetEl, 4);
    await Fx.wait(500);

    // Pink gas bursts all round the target.
    Fx.shake(targetEl, 6);
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(3) hue-rotate(-60deg) brightness(1.1)', offset: 0.3 },
        { filter: 'none' }
      ], { duration: 600, easing: 'ease-out', fill: 'none' })
    );
    for (let i = 0; i < 4; i++) {
      const at: Point = { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.45, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.35 };
      effects.push(Fx.wait(i * 80).then(() => FxEffects.smokePuff(fxEl, at, Math.max(tr.width * 0.8, 60), pink)));
    }
    await Promise.all(effects);
  }

  /** A pink zigzag (star-edged) ring `size` px across. */
  private static zigzagRing(size: number): HTMLElement {
    const pts: string[] = [];
    const spikes = 18;
    for (let i = 0; i < spikes * 2; i++) {
      const a = (Math.PI * 2 * i) / (spikes * 2);
      const rad = i % 2 ? 40 : 46;
      pts.push(`${(50 + Math.cos(a) * rad).toFixed(1)},${(50 + Math.sin(a) * rad).toFixed(1)}`);
    }
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 4px #FF5AA0)`;
    el.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block"><polygon points="${pts.join(' ')}" fill="none" stroke="#FF8AC8" stroke-width="2.5"/></svg>`;
    return el;
  }

  /** Poison palette: body, shadow, bubble highlight. */
  private static readonly PURPLE = '#7A2E9E';
  private static readonly DARK = '#3A0F55';
  private static readonly BUBBLE = '#D77CF0';

  /** A glossy pink-purple poison bubble (Toxic, Sludge Bomb). */
  private static poisonBubble(size: number): HTMLElement {
    const { PURPLE, BUBBLE } = PoisonMoveAnimations;
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#FFF3FF,${BUBBLE} 40%,${PURPLE}CC 85%);box-shadow:0 0 6px ${BUBBLE}`;
    return b;
  }

  /** A lumpy, cloud-like glob of purple sludge, `size` px across. */
  private static sludgeGlob(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:46% 54% 50% 50%/52% 48% 52% 48%;` +
      'background:radial-gradient(circle at 30% 32%,#C88AE6 0 16%,#C88AE600 30%),' +
      'radial-gradient(circle at 68% 40%,#B474D8 0 12%,#B474D800 26%),' +
      'radial-gradient(circle at 45% 70%,#8A3AB0 0 20%,#8A3AB000 36%),' +
      `radial-gradient(circle,#9A4CC2,${PoisonMoveAnimations.PURPLE} 55%,${PoisonMoveAnimations.DARK}cc 72%,${PoisonMoveAnimations.DARK}00 74%);` +
      'filter:blur(.4px)';
    return el;
  }

  /**
   * Sludge Bomb: a trail of lumpy purple sludge globs is hurled in an arc at
   * the target and bursts there (0.52 s) into a wobbling mass of sludge,
   * with poison bubbles bobbing around it while the target turns purple.
   */
  private static async playSludgeBomb(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const { PURPLE } = PoisonMoveAnimations;
    const r = Fx.rect(targetEl);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 50 + Math.abs(dx) * 0.12;
    const travel = 440;

    // 1. The bomb: a lead glob with smaller globs trailing behind it.
    const flights: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const size = (30 - i * 4) * (0.9 + Math.random() * 0.2);
      const glob = PoisonMoveAnimations.sludgeGlob(size);
      Fx.place(glob, launch);
      fxEl.appendChild(glob);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        const wob = k % 2 ? 1.12 : 0.9;
        frames.push({
          transform: `translate(${dx * t}px,${dy * t - Math.sin(t * Math.PI) * lift}px) scale(${(0.5 + t * 0.6) * wob},${(0.5 + t * 0.6) / wob})`,
          opacity: t === 0 ? 0 : 1 - i * 0.12
        });
      }
      flights.push(Fx.anim(glob, frames, { duration: travel, delay: 40 + i * 45, easing: 'linear' }).then(() => glob.remove()));
    }
    await Fx.wait(40 + travel);

    // 2. Burst (0.52 s): a wobbling mass of sludge covers the target.
    Fx.flash(targetEl, PURPLE, 0.5);
    Fx.shake(targetEl, 5);
    const effects: Promise<void>[] = [...flights];
    const spreadX = Math.max(r.width * 0.42, 26);
    const spreadY = Math.max(r.height * 0.35, 22);
    for (let i = 0; i < 8; i++) {
      const size = Math.max(r.width * 0.5, 36) * (0.75 + Math.random() * 0.5);
      const glob = PoisonMoveAnimations.sludgeGlob(size);
      Fx.place(glob, {
        x: target.x + (Math.random() * 2 - 1) * spreadX * 0.7,
        y: target.y + (Math.random() * 2 - 1) * spreadY * 0.6
      });
      fxEl.appendChild(glob);
      const frames: Keyframe[] = [{ transform: 'scale(.2)', opacity: 0 }];
      for (let k = 1; k <= 6; k++) {
        const wob = k % 2 ? 1.1 : 0.92;
        frames.push({ transform: `scale(${wob},${2 - wob})`, opacity: 0.95, offset: 0.1 + k * 0.12 });
      }
      frames.push({ transform: 'scale(1.15,.8)', opacity: 0 });
      effects.push(Fx.anim(glob, frames, { duration: 950, delay: i * 25, easing: 'ease-in-out' }).then(() => glob.remove()));
    }

    // Poison bubbles bob up and wobble around the sludge.
    for (let i = 0; i < 14; i++) {
      const size = 8 + Math.random() * 12;
      const b = PoisonMoveAnimations.poisonBubble(size);
      const ang = Math.random() * Math.PI * 2;
      Fx.place(b, {
        x: target.x + Math.cos(ang) * spreadX * (0.8 + Math.random() * 0.5),
        y: target.y + Math.sin(ang) * spreadY * (0.8 + Math.random() * 0.5)
      });
      fxEl.appendChild(b);
      const rise = 14 + Math.random() * 18;
      const sway = 4 + Math.random() * 5;
      effects.push(
        Fx.anim(b, [
          { transform: 'translate(0,0) scale(.2)', opacity: 0 },
          { transform: `translate(${sway}px,${-rise * 0.3}px) scale(1)`, opacity: 0.95, offset: 0.25 },
          { transform: `translate(${-sway}px,${-rise * 0.6}px) scale(1.1,.9)`, opacity: 0.95, offset: 0.55 },
          { transform: `translate(${sway * 0.5}px,${-rise * 0.85}px) scale(.95,1.05)`, opacity: 0.85, offset: 0.8 },
          { transform: `translate(0,${-rise}px) scale(1.3)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 300, easing: 'ease-in-out', delay: 60 + Math.random() * 300 }).then(() => b.remove())
      );
    }

    // Poisoned (0.65 s): the sprite turns purple for a moment.
    await Fx.wait(130);
    effects.push(
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(1.05)', offset: 0.2 },
        { filter: 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(.95)', offset: 0.8 },
        { filter: 'none' }
      ], { duration: 800, easing: 'ease-in-out', fill: 'none' })
    );
    setTimeout(() => Fx.shake(targetEl, 2), 250);
    await Promise.all(effects);
  }

  /**
   * Toxic: a glowing purple poison pool spreads on the ground under the target,
   * pink-purple bubbles well up around it and the sprite turns purple.
   */
  private static async playToxic(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const purple = PoisonMoveAnimations.PURPLE;
    const dark = PoisonMoveAnimations.DARK;
    const r = Fx.rect(targetEl);
    const spreadX = Math.max(r.width * 0.55, 30);
    const spreadY = Math.max(r.height * 0.5, 28);

    // 1. Ground layer: above the platforms, below HUD and sprites.
    const ground = document.createElement('div');
    ground.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none';
    fieldEl.insertBefore(ground, fieldEl.querySelector('.hud') ?? fieldEl.querySelector('.sprite'));
    const foot = Fx.footOf(targetEl, fieldEl);
    const w = Math.max(r.width * 1.7, 110);
    const pool = document.createElement('div');
    pool.style.cssText = `position:absolute;width:${w}px;height:${w * 0.32}px;border-radius:50%;background:radial-gradient(ellipse at 50% 50%,#FFE8FF 0%,#F2B8FF 18%,${purple} 42%,${dark} 72%,${dark}00 100%);box-shadow:0 0 18px ${purple}`;
    Fx.place(pool, foot);
    ground.appendChild(pool);
    const poolDur = 1900;
    const poolDone = Fx.anim(pool, [
      { transform: 'scale(.15)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.95, offset: 0.22 },
      { transform: 'scale(1.04)', opacity: 0.85, offset: 0.55 },
      { transform: 'scale(1)', opacity: 0.95, offset: 0.8 },
      { transform: 'scale(1.08)', opacity: 0 }
    ], { duration: poolDur, easing: 'ease-out' });
    await Fx.wait(300);

    // 2. Poisoned: the sprite turns purple while bubbles rise around it.
    const tint = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(1.05)', offset: 0.15 },
      { filter: 'sepia(1) saturate(3.5) hue-rotate(240deg) brightness(.95)', offset: 0.85 },
      { filter: 'none' }
    ], { duration: 1400, easing: 'ease-in-out', fill: 'none' });
    const bubbles: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const size = 9 + Math.random() * 14;
      const b = PoisonMoveAnimations.poisonBubble(size);
      Fx.place(b, {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (0.2 + Math.random() * 0.8) * spreadY
      });
      fxEl.appendChild(b);
      const rise = 26 + Math.random() * spreadY;
      const drift = Math.random() * 14 - 7;
      bubbles.push(
        Fx.anim(b, [
          { transform: 'translate(0,0) scale(.2)', opacity: 0 },
          { transform: `translate(${drift * 0.4}px,${-rise * 0.3}px) scale(1)`, opacity: 0.9, offset: 0.3 },
          { transform: `translate(${drift}px,${-rise}px) scale(1.25)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 250, easing: 'ease-out', delay: i * 60 }).then(() => b.remove())
      );
      if (i % 5 === 0) setTimeout(() => Fx.shake(targetEl, 2), i * 60);
    }
    await Promise.all([tint, ...bubbles, poolDone]);
    ground.remove();
  }

  /**
   * Acid:the caster spits a quick volley of dark purple poison droplets that
   * fly in a shallow arc and splash on the target.
   */
  private static async playAcidSpit(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const purple = '#5A1F8C';
    const dark = '#2A0B45';
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const lift = 36 + Math.abs(dx) * 0.08;
    const drops = 7;
    const gap = 75;
    const travel = 440;
    const steps = 8;

    const landed: Promise<void>[] = [];
    for (let i = 0; i < drops; i++) {
      const size = 11 + Math.random() * 7;
      const drop = document.createElement('div');
      drop.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;background:radial-gradient(circle at 35% 30%,#C79BEA,${purple} 45%,${dark});box-shadow:0 0 5px ${purple}`;
      Fx.place(drop, { x: launch.x + (Math.random() * 10 - 5), y: launch.y + (Math.random() * 10 - 5) });
      fxEl.appendChild(drop);
      // Each droplet lands a little off-centre so the volley spreads over the target.
      const hx = dx + (Math.random() * 30 - 15);
      const hy = dy + (Math.random() * 24 - 12);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const wobble = k % 2 ? 1.15 : 0.88;
        frames.push({
          transform: `translate(${hx * t}px,${hy * t - Math.sin(t * Math.PI) * lift}px) scale(${(0.6 + t * 0.5) * wobble},${(0.6 + t * 0.5) / wobble})`,
          opacity: t === 0 ? 0 : 1
        });
      }
      landed.push(
        Fx.anim(drop, frames, { duration: travel, easing: 'linear', delay: i * gap }).then(() => {
          drop.remove();
          PoisonMoveAnimations.acidSplash(fxEl, { x: launch.x + hx, y: launch.y + hy }, purple);
          if (i === 0) Fx.flash(targetEl, purple, 0.45);
          if (i % 2 === 0) Fx.shake(targetEl, 3);
        })
      );
    }
    await Promise.all(landed);
    Fx.flash(targetEl, purple, 0.5);
    await Fx.wait(250);
  }

  /** A few dark purple specks that burst out where a poison droplet hits. */
  private static acidSplash(fxEl: HTMLElement, at: Point, color: string) {
    for (let i = 0; i < 4; i++) {
      const s = 4 + Math.random() * 4;
      const speck = document.createElement('div');
      speck.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:${color}`;
      Fx.place(speck, at);
      fxEl.appendChild(speck);
      const ang = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 14;
      Fx.anim(speck, [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 8}px) scale(.4)`, opacity: 0 }
      ], { duration: 320, easing: 'ease-out' }).then(() => speck.remove());
    }
  }
}
