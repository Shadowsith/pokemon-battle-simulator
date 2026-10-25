import { Point, BattleStageRefs, MoveVisual, Fleck, MeleeStyle } from './animation.types';
import { TYPE_STYLE, FLECK_COLOR, FIST_TONES } from './animation.constants';
import { Fx } from './fx';
import { FxGlyphs } from './fx-glyphs';

/** Composed effects reused by the generic deliveries and by hand-made move animations of several types. */
export class FxEffects {
  /** One hit landing: burst + flash + shake, all scaled by power. */
  static async impact(refs: BattleStageRefs, target: Point, v: MoveVisual, hitIndex: number) {
    const strong = 0.35 + v.power * 0.65;
    FxEffects.emitBurst(refs.fxEl, target, v, 6 + Math.round(v.power * 8), 24 + v.power * 34);
    Fx.flash(refs.targetEl, v.color, strong);
    Fx.shake(refs.targetEl, 3 + v.power * 6);
    if (hitIndex === 0 && (v.spread || v.power > 0.8)) {
      Fx.screenWash(refs.screenFxEl, `${v.color}44`, 120, 260, v.dir === 1 ? '65%' : '35%');
      Fx.shakeField(refs.fieldEl, 0.5 + v.power * 0.5);
    }
    await Fx.wait(v.hits > 1 ? 140 : 90);
  }

  /** Cosmetic tail: status fleck, drain tendrils, caster recoil. */
  static afterImpact(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    if (v.fleck) FxEffects.fleck(refs.fxEl, target, v);
    if (v.drain) {
      FxEffects.streamParticles(refs.fxEl, target, launch, { ...v, type: 'Grass' }, 10, 520);
      setTimeout(() => Fx.flash(refs.launchEl, FLECK_COLOR.statUp, 0.35), 260);
    }
    if (v.recoil) {
      setTimeout(() => {
        Fx.flash(refs.launchEl, '#E06666', 0.4);
        Fx.shake(refs.launchEl, 4);
      }, 120);
    }
  }

  private static emitBurst(fxEl: HTMLElement, c: Point, v: MoveVisual, count: number, radius: number) {
    const spins = TYPE_STYLE[v.type]?.spin ?? false;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = radius * (0.5 + Math.random() * 0.7);
      const size = 6 + v.power * 9 + Math.random() * 4;
      const g = FxGlyphs.glyph(v, size);
      Fx.place(g, c);
      fxEl.appendChild(g);
      const spin = spins ? Math.random() * 720 - 360 : 0;
      Fx.anim(g, [
        { transform: 'translate(0,0) scale(.4) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 14}px) scale(1) rotate(${spin}deg)`,
          opacity: 0
        }
      ], { duration: 360 + Math.random() * 260, easing: 'cubic-bezier(.2,.6,.3,1)' }).then(() => g.remove());
    }
  }

  static streamParticles(
    fxEl: HTMLElement,
    from: Point,
    to: Point,
    v: MoveVisual,
    count: number,
    dur: number,
    jitter = 12
  ) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    for (let i = 0; i < count; i++) {
      const g = FxGlyphs.glyph(v, 5 + v.power * 6 + Math.random() * 4);
      const ox = from.x + (Math.random() * jitter * 2 - jitter);
      const oy = from.y + (Math.random() * jitter * 2 - jitter);
      Fx.place(g, { x: ox, y: oy });
      fxEl.appendChild(g);
      Fx.anim(g, [
        { transform: 'translate(0,0)', opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1}px)`, opacity: 0.95, offset: 0.15 },
        { transform: `translate(${dx}px,${dy}px)`, opacity: 0 }
      ], { duration: dur, easing: 'ease-in', delay: (i / count) * dur * 0.6 }).then(() => g.remove());
    }
  }

  static meleeGlyph(fxEl: HTMLElement, at: Point, v: MoveVisual) {
    const el = document.createElement('div');
    const c = v.color;
    const shapes: Record<MeleeStyle, string> = {
      hit: `width:44px;height:44px;clip-path:polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%);background:radial-gradient(circle,#fff,${c})`,
      punch: `width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#fff,${c});box-shadow:0 0 12px ${c}`,
      bite: `width:46px;height:46px;border-radius:50%;background:conic-gradient(${c} 0 30deg,transparent 30deg 60deg,${c} 60deg 90deg,transparent 90deg 120deg,${c} 120deg 150deg,transparent 150deg 180deg,${c} 180deg 210deg,transparent 210deg 240deg,${c} 240deg 270deg,transparent 270deg 300deg,${c} 300deg 330deg,transparent 330deg)`,
      kick: `width:50px;height:14px;border-radius:7px;background:linear-gradient(90deg,transparent,${c},#fff)`,
      slash: `width:56px;height:10px;border-radius:6px;background:linear-gradient(90deg,transparent,#fff,${c},transparent)`
    };
    el.style.cssText = `position:absolute;left:${at.x}px;top:${at.y}px;margin:-24px 0 0 -24px;${shapes[v.meleeStyle]}`;
    fxEl.appendChild(el);
    // Mirror the directional glyphs (kick/slash gradients, slash tilt) so an
    // opponent -> player strike reads the same as a player -> opponent one.
    const pre = `scaleX(${v.dir}) ${v.meleeStyle === 'slash' ? 'rotate(-35deg) ' : ''}`;
    Fx.anim(el, [
      { transform: `${pre}scale(.4)`, opacity: 0.2 },
      { transform: `${pre}scale(1)`, opacity: 1, offset: 0.4 },
      { transform: `${pre}scale(1.3)`, opacity: 0 }
    ], { duration: 300, easing: 'ease-out' }).then(() => el.remove());
  }

  static fleck(fxEl: HTMLElement, at: Point, v: MoveVisual) {
    if (!v.fleck) return;
    const color = FLECK_COLOR[v.fleck];
    const glyphs: Record<Exclude<Fleck, null>, string> = {
      burn: `border-radius:50% 50% 50% 0;background:radial-gradient(circle,#fff,${color})`,
      freeze: `clip-path:polygon(50% 0,100% 100%,0 100%);background:linear-gradient(${color},#fff)`,
      paralyze: `clip-path:polygon(60% 0,20% 55%,50% 55%,30% 100%,90% 45%,55% 45%);background:${color}`,
      poison: `border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff,${color});border:1px solid ${color}`,
      sleep: `border-radius:2px;background:${color};clip-path:polygon(0 0,100% 0,0 100%,100% 100%)`,
      flinch: `clip-path:polygon(50% 0,61% 35%,100% 50%,61% 65%,50% 100%,39% 65%,0 50%,39% 35%);background:${color}`,
      confusion: `border-radius:50%;border:3px solid ${color};border-right-color:transparent`,
      statUp: `clip-path:polygon(50% 0,100% 100%,0 100%);background:${color}`,
      statDown: `clip-path:polygon(0 0,100% 0,50% 100%);background:${color}`
    };
    const rising = v.fleck === 'statUp' || v.fleck === 'sleep';
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('div');
      const s = 12 + Math.random() * 6;
      el.style.cssText = `position:absolute;width:${s}px;height:${s}px;left:${at.x + (Math.random() * 44 - 22)}px;top:${at.y + (Math.random() * 30 - 15)}px;${glyphs[v.fleck]}`;
      fxEl.appendChild(el);
      Fx.anim(el, [
        { transform: 'translateY(0) scale(.5) rotate(0deg)', opacity: 0 },
        { transform: 'translateY(0) scale(1) rotate(40deg)', opacity: 1, offset: 0.3 },
        { transform: `translateY(${rising ? -28 : 16}px) scale(.6) rotate(120deg)`, opacity: 0 }
      ], { duration: 620, easing: 'ease-out', delay: i * 60 }).then(() => el.remove());
    }
  }

  static async chargeUp(refs: BattleStageRefs, launch: Point, v: MoveVisual) {
    const { launchEl, fxEl } = refs;
    const glow = document.createElement('div');
    const size = 30 + v.power * 24;
    glow.style.cssText = `position:absolute;left:${launch.x - size / 2}px;top:${launch.y - size / 2}px;width:${size}px;height:${size}px;border-radius:50%;background:radial-gradient(circle,#fff,${v.color} 60%,transparent);opacity:0`;
    fxEl.appendChild(glow);
    for (let i = 0; i < 10; i++) {
      const s = 5 + Math.random() * 4;
      const m = document.createElement('div');
      const ang = Math.random() * Math.PI * 2;
      const r = 50 + Math.random() * 30;
      m.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;background:${v.color};left:${launch.x + Math.cos(ang) * r}px;top:${launch.y + Math.sin(ang) * r}px`;
      fxEl.appendChild(m);
      Fx.anim(m, [
        { transform: 'translate(0,0)', opacity: 0.9 },
        { transform: `translate(${-Math.cos(ang) * r}px,${-Math.sin(ang) * r}px) scale(.2)`, opacity: 0.3 }
      ], { duration: 420, easing: 'ease-in', delay: Math.random() * 120 }).then(() => m.remove());
    }
    Fx.flash(launchEl, v.color, 0.5);
    await Fx.anim(glow, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 0.9, offset: 0.7 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: 480, easing: 'ease-out' });
    glow.remove();
  }

  /** The user drops back into view from above, after being away (Fly, Bounce, …). */
  static async dropBackIn(el: HTMLElement) {
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.opacity = '1';
    await Fx.anim(el, [
      { transform: 'translateY(-46px) scale(.6)', opacity: 0 },
      { transform: 'translateY(0) scale(1)', opacity: 1 }
    ], { duration: 260, easing: 'ease-out' });
    el.style.transform = '';
  }

  /** The caster darts quickly toward the target and straight back (Headbutt, High Jump Kick). */
  static dart(el: HTMLElement, dir: 1 | -1): Promise<void> {
    return Fx.anim(el, [
      { transform: 'translateX(0)' },
      { transform: `translateX(${dir * 46}px)`, offset: 0.45 },
      { transform: 'translateX(0)' }
    ], { duration: 260, easing: 'ease-in-out', fill: 'none' });
  }

  /** HP gain: twinkling green stars and a soft green glow around the caster (drain moves). */
  static async healSparkles(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const green = FLECK_COLOR.statUp;
    const r = launchEl.getBoundingClientRect();
    const rad = Math.max(r.width * 0.45, 28);
    for (let i = 0; i < 12; i++) {
      const star = FxGlyphs.sparkStar(9 + Math.random() * 8, i % 2 ? green : '#fff');
      Fx.place(star, {
        x: launch.x + (Math.random() * 2 - 1) * rad,
        y: launch.y + (Math.random() * 2 - 1) * rad
      });
      fxEl.appendChild(star);
      Fx.anim(star, [
        { transform: 'translateY(0) scale(0) rotate(0deg)', opacity: 0 },
        { transform: 'translateY(-6px) scale(1.2) rotate(90deg)', opacity: 1, offset: 0.4 },
        { transform: 'translateY(-18px) scale(0) rotate(180deg)', opacity: 0 }
      ], { duration: 650, easing: 'ease-out', delay: Math.random() * 450 }).then(() => star.remove());
    }
    Fx.flash(launchEl, green, 0.5);
    setTimeout(() => Fx.flash(launchEl, green, 0.35), 350);
    await Fx.wait(900);
  }

  /** A fiery explosion cloud: hot puffs swell out from a point while sparks scatter. */
  static fireBlastCloud(fxEl: HTMLElement, hit: Point, size: number, count: number, sparkColor: string): Promise<void> {
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const puff = FxGlyphs.firePuff(size * (0.5 + Math.random() * 0.5), i < 4 ? 'hot' : 'red');
      const ang = Math.random() * Math.PI * 2;
      const dist = i < 4 ? 0 : size * (0.25 + Math.random() * 0.3);
      Fx.place(puff, hit);
      fxEl.appendChild(puff);
      const end = `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.8}px)`;
      puffs.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.2)', opacity: 1 },
          { transform: `${end} scale(1.2)`, opacity: 1, offset: 0.45 },
          { transform: `${end} translateY(-8px) scale(1.4)`, opacity: 0 }
        ], { duration: 650 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 120 }).then(() => puff.remove())
      );
    }
    for (let i = 0; i < 14; i++) {
      const s = 5 + Math.random() * 4;
      const spark = document.createElement('div');
      spark.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 35% 35%,#fff,${sparkColor} 55%,${sparkColor}88)`;
      Fx.place(spark, hit);
      fxEl.appendChild(spark);
      const ang = Math.random() * Math.PI * 2;
      const dist = size * (1 + Math.random() * 0.8);
      Fx.anim(spark, [
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist * 0.8}px,${Math.sin(ang) * dist * 0.8}px)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist}px)`, opacity: 0 }
      ], { duration: 700 + Math.random() * 200, easing: 'ease-out' }).then(() => spark.remove());
    }
    return Promise.all(puffs).then(() => void 0);
  }

  /**
   * Elemental punch (Ice Punch, Thunder Punch): a coloured fist slams onto the
   * target while element particles burst out around it, tumbling and drifting
   * as they fade.
   */
  static async playElementalPunch(
    refs: BattleStageRefs,
    target: Point,
    tone: keyof typeof FIST_TONES,
    flashColor: string,
    particle: () => HTMLElement
  ) {
    const { fxEl, targetEl } = refs;
    const r = targetEl.getBoundingClientRect();

    const fist = FxGlyphs.fistGlyph(Math.max(r.width * 0.45, 36), tone);
    Fx.place(fist, target);
    fxEl.appendChild(fist);
    await Fx.anim(fist, [
      { transform: 'scale(1.8)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 150, easing: 'ease-in' });
    Fx.flash(targetEl, flashColor, 0.7);
    Fx.shake(targetEl, 5);

    const bits: Promise<void>[] = [];
    for (let i = 0; i < 16; i++) {
      const bit = particle();
      Fx.place(bit, target);
      fxEl.appendChild(bit);
      const ang = (Math.PI * 2 * i) / 16 + Math.random() * 0.4;
      const dist = Math.max(r.width * 0.7, 46) * (0.6 + Math.random() * 0.7);
      const x = Math.cos(ang) * dist;
      const y = Math.sin(ang) * dist * 0.75;
      const spin = (Math.random() * 2 - 1) * 200;
      bits.push(
        Fx.anim(bit, [
          { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 0 },
          { transform: `translate(${x * 0.6}px,${y * 0.6}px) scale(1) rotate(${spin * 0.4}deg)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${x}px,${y - 6}px) scale(1) rotate(${spin}deg)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${x * 1.05}px,${y - 10}px) scale(.8) rotate(${spin * 1.1}deg)`, opacity: 0 }
        ], { duration: 800 + Math.random() * 250, easing: 'ease-out', delay: Math.random() * 120 }).then(() => bit.remove())
      );
    }
    Fx.anim(fist, [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.7 },
      { transform: 'scale(.9)', opacity: 0 }
    ], { duration: 700, easing: 'ease-in' }).then(() => fist.remove());
    await Promise.all(bits);
  }
}
