import { Point, BattleStageRefs, MoveVisual, MoveAnimRegistry } from '../../animation.types';
import { HEAT_BACKDROP, DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { DeliveryAnimations } from '../../delivery-animations';
import { FxEffects } from '../../fx-effects';
import { FireFlames } from './fire-flames';

/** Hand-made animations for Fire-type ranged attacks: flames, blasts and fire orbs. */
export class FireRangedMoveAnimations {
  /** By @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    blastburn: (refs, launch, target) => FireRangedMoveAnimations.playBlastBurn(refs, launch, target),
    ember: (refs, _launch, _target, v) => FireRangedMoveAnimations.playGroundFlame(refs, v),
    eruption: (refs, launch, target) => FireRangedMoveAnimations.playEruption(refs, launch, target),
    fireblast: (refs, launch, target, v) => FireRangedMoveAnimations.playFireBlast(refs, launch, target, v),
    firespin: async (refs, launch, target, v) => {
      await DeliveryAnimations.playDelivery(refs, launch, target, v);
      await FireRangedMoveAnimations.playVortex(refs, v);
    },
    flamethrower: (refs, launch, target, v) => FireRangedMoveAnimations.playFlamethrower(refs, launch, target, v),
    sacredfire: (refs, _launch, target) => FireRangedMoveAnimations.playSacredFire(refs, target)
  };

  /**
   * Eruption: the scene glows red-hot (0-0.3 s); a volcano erupts from the
   * top of the user - a fountain of fire, embers and glowing stones shoots up
   * out of the screen (0.3-1.1 s); then hot stones rain down round the
   * target, landing with a puff of white smoke and a flame (1.45-2.05 s).
   */
  private static async playEruption(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    await Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 1. The eruption: fire, embers and stones burst up from the user's top.
    const vent: Point = { x: launch.x, y: launch.y - lr.height * 0.3 };
    const up = vent.y + 60;
    const burst: Promise<void>[] = [];
    Fx.flash(launchEl, '#FF8A2A', 0.6);
    Fx.shake(launchEl, 4);
    for (let i = 0; i < 26; i++) {
      const kind = i % 6 === 5 ? 'stone' : i % 3 === 2 ? 'ember' : 'fire';
      const el =
        kind === 'stone'
          ? FireRangedMoveAnimations.hotStone(10 + Math.random() * 8)
          : kind === 'fire'
            ? FxGlyphs.firePuff(Math.max(lr.width * 0.35, 26) * (0.7 + Math.random() * 0.6), i % 2 ? 'hot' : 'red')
            : FireRangedMoveAnimations.ember(3 + Math.random() * 3);
      Fx.place(el, { x: vent.x + (Math.random() * 2 - 1) * lr.width * 0.15, y: vent.y });
      fxEl.appendChild(el);
      const dx = (Math.random() * 2 - 1) * lr.width * (kind === 'fire' ? 0.35 : 0.8);
      const rise = up * (kind === 'fire' ? 0.5 + Math.random() * 0.5 : 1);
      burst.push(
        Fx.anim(el, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${dx * 0.3}px,${-rise * 0.25}px) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${dx}px,${-rise}px) scale(${kind === 'fire' ? 1.4 : 1})`, opacity: kind === 'fire' ? 0 : 1 }
        ], { duration: 550 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 300, fill: 'backwards' }).then(() => el.remove())
      );
    }
    for (let i = 0; i < 3; i++) setTimeout(() => FxEffects.smokePuff(fxEl, vent, Math.max(lr.width * 0.5, 40), ['#9A8A86', '#6A5A56']), i * 200);
    // The stones start falling at 1.1 s, while the last of the fountain still rises.
    await Fx.wait(800);

    // 2. Hot stones rain down round the target, landing at 1.45 / 1.6 / 1.75 / 1.9 / 2.05 s.
    const ground = target.y + tr.height * 0.35;
    const spots = [-0.35, 0.3, -0.05, 0.5, -0.55];
    const falls: Promise<void>[] = [];
    spots.forEach((k, i) => {
      const stone = FireRangedMoveAnimations.hotStone(Math.max(tr.width * 0.22, 18));
      const land: Point = { x: target.x + k * tr.width, y: ground + (i % 2 ? -6 : 6) };
      Fx.place(stone, land);
      fxEl.appendChild(stone);
      const drift = -40 + Math.random() * 20;
      falls.push(
        Fx.anim(stone, [
          { transform: `translate(${drift}px,${-(land.y + 30)}px) rotate(0deg)`, opacity: 1 },
          { transform: 'translate(0,0) rotate(200deg)', opacity: 1 }
        ], { duration: 350, easing: 'ease-in', delay: i * 150, fill: 'backwards' }).then(async () => {
          FxEffects.smokePuff(fxEl, land, Math.max(tr.width * 0.45, 36));
          const flame = FxGlyphs.firePuff(Math.max(tr.width * 0.3, 24));
          Fx.place(flame, { x: land.x, y: land.y - 8 });
          fxEl.appendChild(flame);
          Fx.anim(flame, [
            { transform: 'translateY(0) scale(.4)', opacity: 1 },
            { transform: 'translateY(-16px) scale(1.1)', opacity: 0 }
          ], { duration: 420, easing: 'ease-out' }).then(() => flame.remove());
          Fx.flash(targetEl, '#FF8A2A', 0.5);
          Fx.shake(targetEl, 6);
          Fx.shakeField(fieldEl, 0.35);
          // The stone rolls on a little and cools off.
          await Fx.anim(stone, [
            { transform: 'translate(0,0) rotate(200deg)', opacity: 1 },
            { transform: `translate(${k < 0 ? -14 : 14}px,-4px) rotate(260deg)`, opacity: 1, offset: 0.5 },
            { transform: `translate(${k < 0 ? -20 : 20}px,0) rotate(290deg)`, opacity: 0 }
          ], { duration: 500, easing: 'ease-out' });
          stone.remove();
        })
      );
    });
    await Promise.all([...burst, ...falls]);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /** A glowing hot volcanic stone, `size` px wide: brown with a molten orange highlight and glow (Eruption). */
  private static hotStone(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size * 0.92}px;border-radius:52% 48% 46% 54% / 55% 50% 50% 45%;pointer-events:none;background:radial-gradient(circle at 35% 30%,#FFD27A,#E08A32 30%,#9A5622 60%,#5A3012);box-shadow:0 0 6px #FF8A2A,0 0 12px #FF5A1A88`;
    return el;
  }

  /** A tiny glowing ember (Eruption). */
  private static ember(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF6C0,#FF9A2A 60%);box-shadow:0 0 4px #FF7A1A`;
    return el;
  }

  /**
   * Blast Burn: the scene glows red-hot (0 - 0.3 s); jets of fire shoot up one
   * after another in a circle round the caster (0.3 - 1.0 s); a ring of flames
   * flares up round the target (1.0 s); then two rings of fire whirl round the
   * target in opposite directions as it burns (1.5 - 2.3 s).
   */
  private static async playBlastBurn(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;

    // Phase 1: red-hot screen.
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    Fx.screenWash(screenFxEl, '#FF6A3A55', 200, 1900, `${((target.x / W) * 100).toFixed(0)}%`);
    await Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Phase 2: fire jets shoot up round the caster, going round the circle.
    const lr = Fx.rect(launchEl);
    const lfoot = Fx.footOf(launchEl, fieldEl);
    const jets = 8;
    const jetDone: Promise<void>[] = [];
    for (let j = 0; j < jets; j++) {
      const a = (j / jets) * Math.PI * 2;
      const base: Point = {
        x: launch.x + Math.cos(a) * Math.max(lr.width * 0.6, 40),
        y: lfoot.y - lr.height * 0.1 + Math.sin(a) * Math.max(lr.height * 0.12, 10)
      };
      jetDone.push(FireRangedMoveAnimations.fireJet(fxEl, base, Math.max(lr.height * 1.1, 70), j * 70));
    }
    await Fx.wait(jets * 70 + 140);

    // Phase 3 (1.0 s): a ring of flames flares up round the target.
    const tr = Fx.rect(targetEl);
    const rx = Math.max(tr.width * 0.6, 40);
    const ry = Math.max(tr.height * 0.45, 30);
    const ring: Promise<void>[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const puff = FxGlyphs.firePuff(Math.max(tr.width * 0.28, 22) * (0.85 + Math.random() * 0.3), i % 3 ? 'hot' : 'red');
      Fx.place(puff, { x: target.x + Math.cos(a) * rx, y: target.y + Math.sin(a) * ry });
      fxEl.appendChild(puff);
      ring.push(
        Fx.anim(puff, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1.15)', opacity: 1, offset: 0.25 },
          { transform: 'scale(.95)', opacity: 1, offset: 0.5 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.75 },
          { transform: 'translateY(-6px) scale(.8)', opacity: 0 }
        ], { duration: 560, delay: i * 15, easing: 'ease-out' }).then(() => puff.remove())
      );
    }
    Fx.flash(targetEl, '#FF6A3A', 0.6);
    Fx.shake(targetEl, 5);
    await Fx.wait(500);

    // Phase 4 (1.5 s): two rings of fire whirl round the target in opposite directions.
    Fx.shakeField(fieldEl, 0.8);
    const whirl = [
      ...FireRangedMoveAnimations.flameOrbit(fxEl, target, rx * 1.05, ry * 0.9, 1, Math.max(tr.width * 0.26, 20)),
      ...FireRangedMoveAnimations.flameOrbit(fxEl, target, rx * 0.6, ry * 0.55, -1, Math.max(tr.width * 0.22, 18))
    ];
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        Fx.flash(targetEl, i % 2 ? '#FFD25A' : '#FF6A3A', 0.7);
        Fx.shake(targetEl, 5);
      }, i * 180);
    }
    await Promise.all([...jetDone, ...ring, ...whirl]);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /** A jet of fire shooting straight up `height` px from `base`: a column of fire puffs with flying embers. */
  private static fireJet(fxEl: HTMLElement, base: Point, height: number, delay: number): Promise<void> {
    const parts: Promise<void>[] = [];
    for (let i = 0; i < 6; i++) {
      const puff = FxGlyphs.firePuff(16 + Math.random() * 8, i % 2 ? 'hot' : 'red');
      Fx.place(puff, base);
      fxEl.appendChild(puff);
      const rise = height * (0.6 + Math.random() * 0.4);
      const sway = (Math.random() * 2 - 1) * 6;
      parts.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.4)', opacity: 0 },
          { transform: `translate(${sway * 0.5}px,${-rise * 0.4}px) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${sway}px,${-rise}px) scale(.5)`, opacity: 0 }
        ], { duration: 420, delay: delay + i * 35, easing: 'ease-out' }).then(() => puff.remove())
      );
    }
    for (let i = 0; i < 3; i++) {
      const ember = document.createElement('div');
      ember.style.cssText = 'width:5px;height:5px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF6C0,#FFC53C 55%,#F0803C);box-shadow:0 0 5px #FFC53C';
      Fx.place(ember, base);
      fxEl.appendChild(ember);
      const dx = (Math.random() * 2 - 1) * 30;
      const up = height * (0.5 + Math.random() * 0.6);
      parts.push(
        Fx.anim(ember, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${dx * 0.5}px,${-up * 0.7}px)`, opacity: 1, offset: 0.4 },
          { transform: `translate(${dx}px,${-up}px)`, opacity: 0 }
        ], { duration: 600, delay: delay + 80 + i * 60, easing: 'ease-out' }).then(() => ember.remove())
      );
    }
    return Promise.all(parts).then(() => void 0);
  }

  /**
   * A ring of fire puffs whirling round `c` on an `rx` x `ry` ellipse for
   * 0.8 s; `spin` 1 runs clockwise on screen, -1 counter-clockwise.
   */
  private static flameOrbit(fxEl: HTMLElement, c: Point, rx: number, ry: number, spin: 1 | -1, size: number): Promise<void>[] {
    const count = 10;
    const steps = 12;
    const sweep = Math.PI * 1.5;
    return Array.from({ length: count }, (_, i) => {
      const a0 = (i / count) * Math.PI * 2;
      const puff = FxGlyphs.firePuff(size * (0.85 + Math.random() * 0.3), i % 3 ? 'hot' : 'red');
      Fx.place(puff, c);
      fxEl.appendChild(puff);
      const frames: Keyframe[] = [];
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const a = a0 + spin * sweep * t;
        frames.push({
          transform: `translate(${Math.cos(a) * rx}px,${Math.sin(a) * ry}px) scale(${t < 0.15 ? 0.3 + t * 4.6 : 1 + (k % 2 ? 0.1 : -0.05)})`,
          opacity: t === 1 ? 0 : t < 0.1 ? t * 10 : 1
        });
      }
      return Fx.anim(puff, frames, { duration: 800, easing: 'linear' }).then(() => puff.remove());
    });
  }

  /**
   * Sacred Fire: the scene goes dark (0 - 0.3 s), cool blue flames rise along
   * the bottom while a glowing purple orb lights up on the target and a
   * purple ring closes in on it (0.3 - 1.1 s); then the orb bursts into many
   * small purple flames all over the target.
   */
  private static async playSacredFire(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const r = Fx.rect(targetEl);
    const purple = '#8A3AE0';

    // Phase 1: darkness.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // Phase 2: cool blue fire behind everything ...
    const blue = document.createElement('div');
    blue.style.cssText = 'position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#0A0E2A,#121A44 55%,#16285A)';
    dim.appendChild(blue);
    for (let i = 0; i < 12; i++) {
      const fw = W * (0.12 + Math.random() * 0.08);
      const fh = H * (0.35 + Math.random() * 0.3);
      const tongue = document.createElement('div');
      tongue.style.cssText =
        `position:absolute;left:${(i / 12) * W - fw * 0.3}px;bottom:0;width:${fw}px;height:${fh}px;transform-origin:50% 100%;` +
        'clip-path:polygon(0 100%,8% 55%,22% 70%,30% 30%,42% 52%,50% 0,58% 48%,70% 25%,78% 62%,92% 45%,100% 100%);' +
        'background:linear-gradient(0deg,#1A4E8A,#2E86C8 45%,#5AC8E8cc 80%,#9CEAF2 100%);opacity:.75';
      blue.appendChild(tongue);
      tongue.animate([
        { transform: 'scaleY(.9) skewX(-3deg)' },
        { transform: 'scaleY(1.08) skewX(3deg)' },
        { transform: 'scaleY(.9) skewX(-3deg)' }
      ], { duration: 500 + Math.random() * 300, delay: -Math.random() * 500, iterations: Infinity });
    }
    for (let i = 0; i < 16; i++) {
      const mote = document.createElement('div');
      mote.style.cssText = `position:absolute;left:${Math.random() * W}px;top:${Math.random() * H * 0.7}px;width:3px;height:3px;border-radius:50%;background:#E4D8FF;box-shadow:0 0 4px #B89CFF`;
      blue.appendChild(mote);
      mote.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 600 + Math.random() * 500, delay: -Math.random() * 600, iterations: Infinity });
    }
    const blueIn = Fx.anim(blue, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // ... a purple orb on the target, and a purple ring closing in on it.
    const orbSize = Math.max(r.width * 0.75, 56);
    const orb = document.createElement('div');
    orb.style.cssText = `width:${orbSize}px;height:${orbSize}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff 0 30%,#F0E4FF 40%,#B880FF 58%,${purple}88 70%,${purple}00 74%);filter:drop-shadow(0 0 10px ${purple})`;
    Fx.place(orb, target);
    fxEl.appendChild(orb);
    const orbIn = Fx.anim(orb, [
      { transform: 'scale(.1)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.35 },
      { transform: 'scale(.9)', opacity: 1, offset: 0.65 },
      { transform: 'scale(.55)', opacity: 1 }
    ], { duration: 800, easing: 'ease-in-out' });
    const ringSize = Math.max(r.width, r.height) * 2.2;
    const ring = document.createElement('div');
    ring.style.cssText = `width:${ringSize}px;height:${ringSize}px;border-radius:50%;pointer-events:none;border:4px solid #A86CF0;box-shadow:0 0 10px ${purple},inset 0 0 10px ${purple}`;
    Fx.place(ring, target);
    fxEl.appendChild(ring);
    const ringIn = Fx.anim(ring, [
      { transform: 'scale(1)', opacity: 0 },
      { transform: 'scale(.85)', opacity: 1, offset: 0.2 },
      { transform: 'scale(.15)', opacity: 0.9 }
    ], { duration: 800, easing: 'ease-in' }).then(() => ring.remove());
    await Promise.all([blueIn, orbIn, ringIn]);

    // Phase 3 (1.1 s): the orb bursts into many small purple flames.
    Fx.anim(orb, [
      { transform: 'scale(.55)', opacity: 1 },
      { transform: 'scale(1.4)', opacity: 0 }
    ], { duration: 260, easing: 'ease-out' }).then(() => orb.remove());
    Fx.flash(targetEl, purple, 0.8);
    Fx.shake(targetEl, 6);
    const flames: Promise<void>[] = [];
    const spreadX = Math.max(r.width * 0.75, 44);
    const spreadY = Math.max(r.height * 0.6, 36);
    for (let i = 0; i < 18; i++) {
      const ang = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random());
      const base = { x: target.x + Math.cos(ang) * d * spreadX, y: target.y + Math.sin(ang) * d * spreadY + 10 };
      flames.push(
        FireFlames.burnFlame(fxEl, base, 14 + Math.random() * 10, purple, 650 + Math.random() * 250, d * 220, ['#C8A0FF', '#F0E4FF'])
      );
    }
    setTimeout(() => Fx.shake(targetEl, 4), 300);
    await Promise.all(flames);

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /** A single small flame that flares up at the target's feet and flickers out (Ember). */
  private static async playGroundFlame(refs: BattleStageRefs, v: MoveVisual) {
    const { fxEl, fieldEl, targetEl } = refs;
    const w = Math.min(Math.max(Fx.rect(targetEl).width * 0.28, 22), 36);
    const done = FireFlames.burnFlame(fxEl, Fx.footOf(targetEl, fieldEl), w, v.color, 900);
    await Fx.wait(200);
    Fx.flash(targetEl, v.color, 0.35);
    Fx.shake(targetEl, 3);
    await done;
  }

  /**
   * Flamethrower: the backdrop glows red-hot, a stream of fire pours from the
   * caster into the target, then the target turns red and burns briefly.
   */
  private static async playFlamethrower(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, targetEl } = refs;
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    await Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    // Heat shimmer: the red glow pulses gently.
    heat.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.15)' }, { filter: 'brightness(1)' }], {
      duration: 500,
      iterations: Infinity
    });

    // Fire stream: puffs leave the caster in quick succession and swell as they fly.
    const puffs = 42;
    const gap = 24;
    const travel = 380;
    const stream = FireFlames.fireStream(fxEl, launch, target, { count: puffs, gap, travel });
    // The target shakes under the stream.
    for (let t = travel * 0.8; t < puffs * gap + travel; t += 260) setTimeout(() => Fx.shake(targetEl, 4), t);
    await Fx.wait(travel * 0.8);
    targetEl.style.filter = `sepia(1) saturate(5) hue-rotate(-25deg) brightness(.95) drop-shadow(0 0 8px ${v.color})`;
    await stream;

    // Burning: a few flames flicker over the reddened target.
    const r = Fx.rect(targetEl);
    const foot = Fx.footOf(targetEl, fieldEl);
    const fw = Math.min(Math.max(r.width * 0.26, 20), 34);
    const burns: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const base = {
        x: target.x + (Math.random() * 2 - 1) * r.width * 0.32,
        y: foot.y - Math.random() * r.height * 0.5
      };
      burns.push(FireFlames.burnFlame(fxEl, base, fw * (0.8 + Math.random() * 0.4), v.color, 750, i * 110));
    }
    await Promise.all(burns);
    targetEl.style.filter = '';

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * Fire Blast, in three phases, all built from flowing fire streams (like
   * Flamethrower) so the fire keeps moving instead of sitting as orbs:
   * 1. flames stream in from around the caster and gather in it,
   * 2. a burning fireball flies to the target over a red-hot backdrop,
   * 3. it bursts into the five-armed blast shape over a yellow sunburst.
   */
  private static async playFireBlast(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);

    // --- phase 1: gather -------------------------------------------------
    const ringR = Math.max(lr.width * 0.65, 46);
    const gather: Promise<void>[] = [];
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
      const from = { x: launch.x + Math.cos(ang) * ringR, y: launch.y + Math.sin(ang) * ringR * 0.8 };
      gather.push(
        FireFlames.fireStream(fxEl, from, launch, {
          count: 7,
          gap: 45,
          travel: 420,
          grow: [1.1, 0.4],
          jitter: 4,
          wave: 4,
          delay: i * 35
        })
      );
    }
    Fx.flash(launchEl, v.color, 0.4);
    setTimeout(() => Fx.flash(launchEl, '#FFC53C', 0.5), 500);
    await Promise.all(gather);

    // --- phase 2: a burning fireball flies over a red-hot backdrop ------------
    const heat = Fx.backdrop(fieldEl, HEAT_BACKDROP);
    const heatIn = Fx.anim(heat, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out' });
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const flight = 480;
    // The ball: a few puffs churning around a shared centre.
    const ball = document.createElement('div');
    ball.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
    Fx.place(ball, launch);
    for (const [size, ox, oy, turn] of [
      [42, 0, 0, 1],
      [30, -9, -6, -1.4],
      [28, 8, 5, 1.8],
      [24, 3, -10, -2.2]
    ]) {
      const puff = FxGlyphs.firePuff(size);
      puff.style.left = `${ox - size / 2}px`;
      puff.style.top = `${oy - size / 2}px`;
      ball.appendChild(puff);
      puff.animate([{ transform: 'rotate(0deg) scale(1)' }, { transform: `rotate(${turn * 180}deg) scale(1.15)` }, { transform: `rotate(${turn * 360}deg) scale(1)` }], {
        duration: 300,
        iterations: Infinity
      });
    }
    fxEl.appendChild(ball);
    // Flames shed behind the ball as it flies.
    for (let i = 0; i < 22; i++) {
      const t = i / 22;
      const trail = FxGlyphs.firePuff(16 + Math.random() * 10);
      Fx.place(trail, { x: launch.x + dx * t, y: launch.y + dy * t });
      fxEl.appendChild(trail);
      const rot = Math.random() * 180;
      Fx.anim(trail, [
        { transform: `rotate(${rot}deg) scale(.9)`, opacity: 0.95 },
        { transform: `translate(${-v.dir * 10}px,-10px) rotate(${rot + 120}deg) scale(.3)`, opacity: 0 }
      ], { duration: 300, easing: 'ease-out', delay: t * flight }).then(() => trail.remove());
    }
    await Fx.anim(ball, [
      { transform: 'translate(0,0) scale(.6)' },
      { transform: `translate(${dx * 0.15}px,${dy * 0.15}px) scale(1)`, offset: 0.2 },
      { transform: `translate(${dx}px,${dy}px) scale(1.2)` }
    ], { duration: flight, easing: 'ease-in' });
    await heatIn;
    ball.remove();

    // --- phase 3: five-armed blast over a sunburst -----------------------------
    const cx = `${target.x}px ${target.y}px`;
    const burst = Fx.backdrop(
      fieldEl,
      `background:radial-gradient(circle at ${cx},#FFFDE8 0,#FFF6A0 12%,transparent 34%),` +
        `radial-gradient(circle at ${cx},transparent 30%,#F0602Acc 85%,#C8301A),` +
        `repeating-conic-gradient(from 0deg at ${cx},#FFE95A 0deg 5deg,#FFC23C 5deg 10deg)`
    );
    // Sunburst goes above the heat layer (both stay behind platforms and sprites).
    heat.after(burst);
    Fx.anim(burst, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], {
      duration: 1500,
      easing: 'linear'
    }).then(() => burst.remove());
    Fx.flash(targetEl, '#FFF6A0', 0.9);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.9);

    // Arms: up, left, right, down-left, down-right (screen angles, y points down).
    const armLen = Math.max(Math.min(W, H) * 0.32, 70);
    const blasts: Promise<void>[] = [];
    for (const deg of [-90, 180, 0, 135, 45]) {
      const a = (deg * Math.PI) / 180;
      const end = { x: target.x + Math.cos(a) * armLen, y: target.y + Math.sin(a) * armLen };
      blasts.push(
        FireFlames.fireStream(fxEl, target, end, {
          count: 16,
          gap: 40,
          travel: 460,
          size: [18, 30],
          grow: [0.6, 1.6],
          jitter: 6,
          wave: 4
        })
      );
    }
    // The core keeps burning on the target while the arms stream out.
    blasts.push(FireFlames.fireStream(fxEl, target, target, { count: 14, gap: 45, travel: 420, size: [24, 36], grow: [0.7, 1.5], jitter: 12, wave: 0 }));
    setTimeout(() => Fx.shake(targetEl, 5), 450);
    await Promise.all(blasts);

    await Fx.anim(heat, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    heat.remove();
  }

  /**
   * A ring of flames that ignites at the target's feet and spirals up around
   * it. Flames on the back half of the ring are smaller and dimmer, so the
   * ring reads as circling the sprite rather than sitting on top of it.
   */
  private static async playVortex(refs: BattleStageRefs, v: MoveVisual) {
    const { fxEl, fieldEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const ground = Fx.footOf(targetEl, fieldEl);
    const rx = Math.max(r.width * 0.55, 34);
    const ry = rx * 0.3;
    const rise = Math.max(r.height * 1.1, 70);
    const spin = v.dir * Math.PI * 2.5;
    const colors = [v.color, '#FFD25A', '#FF5A1F'];

    // Glowing scorch ring on the ground where the vortex starts.
    const base = document.createElement('div');
    base.style.cssText = `position:absolute;width:${rx * 2}px;height:${ry * 2}px;border-radius:50%;border:3px solid ${v.color};box-shadow:0 0 14px ${v.color},inset 0 0 12px ${v.color};background:radial-gradient(ellipse,${v.color}55,transparent 70%)`;
    Fx.place(base, ground);
    fxEl.appendChild(base);
    Fx.anim(base, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.25 },
      { transform: 'scale(1.05)', opacity: 0.8, offset: 0.75 },
      { transform: 'scale(1.1)', opacity: 0 }
    ], { duration: 1500, easing: 'ease-out' }).then(() => base.remove());

    // Three stacked rings of flames, each spinning upwards a little later.
    const waves = 3;
    const perWave = 14;
    const dur = 1100;
    const steps = 12;
    for (let w = 0; w < waves; w++) {
      for (let i = 0; i < perWave; i++) {
        const a0 = (Math.PI * 2 * i) / perWave + w * 0.4;
        const size = 14 + v.power * 10 + Math.random() * 6;
        const flame = document.createElement('div');
        const c = colors[(i + w) % colors.length];
        flame.style.cssText = `position:absolute;width:${size}px;height:${size}px;pointer-events:none;border-radius:50% 0 50% 50%;background:radial-gradient(circle at 60% 40%,#fff,${c} 45%,${c}00 80%);filter:drop-shadow(0 0 4px ${c})`;
        Fx.place(flame, ground);
        fxEl.appendChild(flame);
        const frames: Keyframe[] = [];
        for (let k = 0; k <= steps; k++) {
          const t = k / steps;
          const a = a0 + spin * t;
          const front = Math.sin(a) > 0;
          const x = Math.cos(a) * rx * (1 - t * 0.25);
          const y = Math.sin(a) * ry - t * rise;
          const scale = (1 - t * 0.55) * (front ? 1 : 0.7);
          const fade = Math.min(1, t * 6, (1 - t) * 3);
          frames.push({
            transform: `translate(${x}px,${y}px) rotate(-45deg) scale(${scale})`,
            opacity: fade * (front ? 1 : 0.55)
          });
        }
        Fx.anim(flame, frames, { duration: dur, easing: 'linear', delay: w * 180 }).then(() => flame.remove());
      }
    }

    // The target flickers while it is engulfed.
    for (let i = 0; i < 4; i++) setTimeout(() => Fx.flash(targetEl, v.color, 0.45), 200 + i * 280);
    await Fx.wait(dur + (waves - 1) * 180);
  }
}
