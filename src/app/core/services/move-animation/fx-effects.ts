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

  /**
   * One claw mark centred on `at`, `len` px long at `angle` degrees: a tapered
   * black stroke with a two-layer `glow` that rips in from its top end, holds,
   * then fades; with `tip` a small glowing orb sits on its top end (Crush Claw, Dragon Claw).
   */
  static clawMark(fxEl: HTMLElement, at: Point, len: number, angle: number, style: ClawStyle): Promise<void> {
    const th = Math.max(len * 0.11, 6);
    const rad = (angle * Math.PI) / 180;
    const [g1, g2] = style.glow;
    // Glow on a wrapper: clip-path on the same element would cut the drop-shadow off.
    const mark = document.createElement('div');
    mark.style.cssText = `position:absolute;left:${at.x - (Math.cos(rad) * len) / 2}px;top:${at.y - (Math.sin(rad) * len) / 2 - th / 2}px;width:${len}px;height:${th}px;pointer-events:none;transform-origin:0 50%;filter:drop-shadow(0 0 1.5px ${g1}) drop-shadow(0 0 3px ${g2})`;
    const stroke = document.createElement('div');
    stroke.style.cssText = 'width:100%;height:100%;clip-path:polygon(0 50%,12% 0,85% 20%,100% 50%,85% 80%,12% 100%);background:linear-gradient(90deg,#2A0A0A,#0A0A0A 30%,#141010 70%,#2A0A0A)';
    mark.appendChild(stroke);
    if (style.tip) {
      const orb = document.createElement('div');
      const os = th * 1.6;
      orb.style.cssText = `position:absolute;left:${-os * 0.35}px;top:${(th - os) / 2}px;width:${os}px;height:${os}px;border-radius:50%;background:radial-gradient(circle,#fff 0 25%,${style.tip} 60%,${style.tip}00);box-shadow:0 0 6px ${style.tip}`;
      mark.appendChild(orb);
    }
    fxEl.appendChild(mark);
    return Fx.anim(mark, [
      { transform: `rotate(${angle}deg) scale(0,1)`, opacity: 1 },
      { transform: `rotate(${angle}deg) scale(1,1.15)`, opacity: 1, offset: 0.2 },
      { transform: `rotate(${angle}deg) scale(1,1)`, opacity: 1, offset: 0.7 },
      { transform: `rotate(${angle}deg) scale(1,.6)`, opacity: 0 }
    ], { duration: 620, easing: 'ease-out' }).then(() => mark.remove());
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

  /** Glowing orange sparkles drift down over the caster, from `top` downward (Amnesia, Skull Bash). */
  static async orangeSparkles(refs: BattleStageRefs, launch: Point, top: number) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const spread = Math.max(r.width * 0.45, 30);
    for (let i = 0; i < 16; i++) {
      const s = 6 + Math.random() * 6;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFF3C4,#FFA62B 55%,#FF7A0000);box-shadow:0 0 6px #FFA62B`;
      Fx.place(dot, { x: launch.x + (Math.random() * 2 - 1) * spread, y: top + Math.random() * r.height * 0.6 });
      fxEl.appendChild(dot);
      Fx.anim(dot, [
        { transform: 'translateY(0) scale(0)', opacity: 0 },
        { transform: 'translateY(6px) scale(1.2)', opacity: 1, offset: 0.35 },
        { transform: 'translateY(22px) scale(.3)', opacity: 0 }
      ], { duration: 700, easing: 'ease-out', delay: Math.random() * 500 }).then(() => dot.remove());
    }
    Fx.flash(launchEl, '#FFA62B', 0.3);
    await Fx.wait(1200);
  }

  /**
   * Classic stat-up aura (~800 ms): bands of orange-red light scroll up
   * through an oval over the caster while it glows orange (Iron Defense).
   */
  static async statUpAura(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 1.05, 50);
    const h = Math.max(r.height * 1.05, 50);
    const aura = document.createElement('div');
    const mask = 'radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,#0000 100%)';
    aura.style.cssText =
      `position:absolute;width:${w}px;height:${h}px;pointer-events:none;mix-blend-mode:screen;` +
      'background:repeating-linear-gradient(0deg,#FF5A1A00 0 4px,#FF6A1Add 4px 9px,#FFC24Aee 9px 12px,#FF5A1A00 12px 22px);' +
      `-webkit-mask-image:${mask};mask-image:${mask}`;
    Fx.place(aura, launch);
    fxEl.appendChild(aura);
    const scroll = aura.animate([{ backgroundPosition: '0 0' }, { backgroundPosition: '0 -44px' }], { duration: 400, iterations: Infinity });
    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1) drop-shadow(0 0 0 #fff0)' },
      { filter: 'brightness(1.2) sepia(.6) saturate(2) hue-rotate(-20deg) drop-shadow(0 0 8px #FF7A2A)', offset: 0.3 },
      { filter: 'brightness(1.2) sepia(.6) saturate(2) hue-rotate(-20deg) drop-shadow(0 0 8px #FF7A2A)', offset: 0.7 },
      { filter: 'brightness(1) drop-shadow(0 0 0 #fff0)' }
    ], { duration: 800, easing: 'ease-in-out', fill: 'none' });
    await Fx.anim(aura, [
      { opacity: 0, transform: 'scaleY(.8)' },
      { opacity: 1, transform: 'scaleY(1)', offset: 0.2 },
      { opacity: 1, transform: 'scaleY(1)', offset: 0.75 },
      { opacity: 0, transform: 'scaleY(1.05)' }
    ], { duration: 800, easing: 'ease-in-out' });
    await glow;
    scroll.cancel();
    aura.remove();
  }

  /**
   * Classic stat-down shower (~900 ms): see-through blue bubbles drift down
   * over the caster while it glows a dull blue (Overheat).
   */
  static async statDownBubbles(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const w = Math.max(r.width * 0.9, 44);
    const h = Math.max(r.height * 0.9, 44);
    const glow = Fx.anim(launchEl, [
      { filter: 'brightness(1) drop-shadow(0 0 0 #5AB4FF00)' },
      { filter: 'brightness(.85) drop-shadow(0 0 8px #5AB4FF)', offset: 0.3 },
      { filter: 'brightness(.85) drop-shadow(0 0 8px #5AB4FF)', offset: 0.7 },
      { filter: 'brightness(1) drop-shadow(0 0 0 #5AB4FF00)' }
    ], { duration: 900, easing: 'ease-in-out', fill: 'none' });
    const drops: Promise<void>[] = [];
    for (let i = 0; i < 18; i++) {
      const s = 6 + Math.random() * 7;
      const bubble = document.createElement('div');
      bubble.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:1px solid #CFEAFF;background:radial-gradient(circle at 35% 35%,#FFFFFFcc,#8CCBFF88 45%,#3A8CE066)`;
      Fx.place(bubble, { x: launch.x + (Math.random() - 0.5) * w, y: launch.y - h * (0.35 + Math.random() * 0.25) });
      fxEl.appendChild(bubble);
      const fall = h * (0.45 + Math.random() * 0.3);
      const sway = (Math.random() * 2 - 1) * 6;
      drops.push(
        Fx.anim(bubble, [
          { transform: 'translate(0,0)', opacity: 0 },
          { transform: `translate(${sway}px,${fall * 0.3}px)`, opacity: 0.9, offset: 0.25 },
          { transform: `translate(${-sway}px,${fall}px)`, opacity: 0 }
        ], { duration: 550 + Math.random() * 150, easing: 'ease-in', delay: Math.random() * 300, fill: 'backwards' }).then(() => bubble.remove())
      );
    }
    await Promise.all([glow, ...drops]);
  }

  /** Sleep: "Z"s float up from `head` one after another, drifting sideways (`away`) and growing as they rise (Rest, Sleep Powder). */
  static sleepZs(fxEl: HTMLElement, head: Point, away: number, colors: string[]): Promise<void> {
    const zs: Promise<void>[] = [];
    for (let i = 0; i < 4; i++) {
      const z = FxGlyphs.sleepZ(18 + i * 5, colors[i % colors.length]);
      Fx.place(z, { x: head.x, y: head.y - 6 });
      fxEl.appendChild(z);
      const dx = away * (34 + Math.random() * 10);
      zs.push(
        Fx.anim(z, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${dx * 0.35}px,-18px) scale(.8)`, opacity: 1, offset: 0.25 },
          { transform: `translate(${dx * 0.75}px,-44px) scale(1.1)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${dx}px,-62px) scale(1.25)`, opacity: 0 }
        ], { duration: 1100, easing: 'ease-out', delay: i * 280 }).then(() => z.remove())
      );
    }
    return Promise.all(zs).then(() => void 0);
  }

  /**
   * The sprite runs `laps` times round a small circle that starts and ends at
   * its spot. Only its position moves, so it keeps facing its opponent.
   * `spin` 1 runs counter-clockwise on screen, -1 clockwise (Agility, Submission).
   */
  static async orbit(el: HTMLElement, radius: number, laps: number, duration: number, spin: 1 | -1) {
    const original = el.style.transform;
    const steps = 12 * laps;
    const path: Keyframe[] = [];
    for (let k = 0; k <= steps; k++) {
      const a = (k / steps) * Math.PI * 2 * laps;
      path.push({ transform: `${original} translate(${radius * Math.sin(a) * spin}px,${-radius * (1 - Math.cos(a))}px)` });
    }
    await Fx.anim(el, path, { duration, easing: 'ease-in-out' });
    el.getAnimations?.().forEach((a) => a.cancel());
    el.style.transform = original;
  }

  /**
   * Endless speed lines rushing across `layer` (`W` x `H` px) in direction
   * `flow` (1 = to the right), in the given colours (Agility, Extreme Speed).
   * They stop when the layer is removed.
   */
  static speedLines(layer: HTMLElement, W: number, H: number, flow: 1 | -1, colors: [string, string]): void {
    for (let i = 0; i < 34; i++) {
      const line = document.createElement('div');
      const len = W * (0.2 + Math.random() * 0.45);
      const thick = 1 + Math.random() * 4;
      const color = Math.random() < 0.6 ? colors[0] : colors[1];
      line.style.cssText = `position:absolute;left:0;top:${Math.random() * H}px;width:${len}px;height:${thick}px;border-radius:${thick}px;background:linear-gradient(90deg,transparent,${color},transparent);opacity:${0.5 + Math.random() * 0.5}`;
      layer.appendChild(line);
      line.animate(
        [
          { transform: `translateX(${flow > 0 ? -len : W}px)` },
          { transform: `translateX(${flow > 0 ? W : -len}px)` }
        ],
        { duration: 220 + Math.random() * 300, delay: -Math.random() * 500, iterations: Infinity, easing: 'linear' }
      );
    }
  }

  /**
   * A stat drop as in the XY games: a dark purple cloud gathers over the
   * target and rains violet streaks onto it while it darkens (~1.0 s;
   * Parting Shot, Mystical Fire).
   */
  static async statDropCloud(refs: BattleStageRefs, target: Point) {
    const { fxEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const cloudW = Math.max(tr.width * 1.1, 70);
    const top: Point = { x: target.x, y: target.y - Math.max(tr.height * 0.75, 45) };
    const cloud = document.createElement('div');
    cloud.style.cssText =
      `width:${cloudW}px;height:${cloudW * 0.3}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(ellipse,#E0B0FF 0 10%,#8A3AE0 40%,#4A1A90cc 60%,#2A0A6000 75%);box-shadow:0 0 10px #8A3AE0';
    Fx.place(cloud, top);
    fxEl.appendChild(cloud);
    const effects: Promise<void>[] = [
      Fx.anim(cloud, [
        { transform: 'scale(.2,.5)', opacity: 0 },
        { transform: 'scale(1,1)', opacity: 1, offset: 0.25 },
        { transform: 'scale(1.05,1)', opacity: 1, offset: 0.75 },
        { transform: 'scale(.9,.8)', opacity: 0 }
      ], { duration: 1000, easing: 'ease-out' }).then(() => cloud.remove()),
      Fx.anim(targetEl, [
        { filter: 'none' },
        { filter: 'brightness(.75) drop-shadow(0 0 5px #8A3AE0)', offset: 0.4 },
        { filter: 'none' }
      ], { duration: 1000, easing: 'ease-in-out', fill: 'none' })
    ];
    for (let i = 0; i < 14; i++) {
      const len = 10 + Math.random() * 14;
      const streak = document.createElement('div');
      streak.style.cssText = `width:2px;height:${len}px;border-radius:1px;pointer-events:none;background:linear-gradient(180deg,#B060FF00,#C080FF,#F0D8FF);box-shadow:0 0 3px #A050FF`;
      Fx.place(streak, { x: top.x + (Math.random() * 2 - 1) * cloudW * 0.4, y: top.y });
      fxEl.appendChild(streak);
      const fall = tr.height * (0.45 + Math.random() * 0.35);
      effects.push(
        Fx.anim(streak, [
          { transform: 'translateY(0)', opacity: 0 },
          { transform: `translateY(${fall * 0.2}px)`, opacity: 1, offset: 0.2 },
          { transform: `translateY(${fall}px)`, opacity: 0 }
        ], { duration: 420, delay: 200 + i * 45, easing: 'ease-in' }).then(() => streak.remove())
      );
    }
    await Promise.all(effects);
  }

  /** A burst of smoke puffs swelling out from `at` and fading: white by default (Substitute), grey dust (Extreme Speed). */
  static smokePuff(fxEl: HTMLElement, at: Point, size: number, tone: [string, string] = ['#ECEEF2', '#D4D8E0']): Promise<void> {
    const puffs: Promise<void>[] = [];
    for (let i = 0; i < 9; i++) {
      const s = size * (0.35 + Math.random() * 0.3);
      const puff = document.createElement('div');
      puff.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle at 40% 35%,#fff,${tone[0]} 55%,${tone[1]}00 75%)`;
      Fx.place(puff, at);
      fxEl.appendChild(puff);
      const ang = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
      const d = size * (0.25 + Math.random() * 0.2);
      const end = `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.8}px)`;
      puffs.push(
        Fx.anim(puff, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `${end} scale(1)`, opacity: 1, offset: 0.35 },
          { transform: `${end} translateY(-8px) scale(1.3)`, opacity: 0 }
        ], { duration: 520, easing: 'ease-out', delay: Math.random() * 60 }).then(() => puff.remove())
      );
    }
    return Promise.all(puffs).then(() => void 0);
  }

  /**
   * A backdrop with flickering burst rays centred on `at`, behind the sprites:
   * red with yellow rays (Dynamic Punch, Megahorn), blue with white rays
   * (Focus Punch), red-brown with peach rays (Psycho Boost), magenta with pink rays (Giga Impact) or orange on deep blue (Head Smash). Resolves once it has faded in; the caller fades it out and removes it.
   */
  static async burstBackdrop(fieldEl: HTMLElement, at: Point, tone: keyof typeof BURST_TONES = 'red'): Promise<HTMLElement> {
    const t = BURST_TONES[tone];
    const c = `${at.x}px ${at.y}px`;
    const back = Fx.backdrop(fieldEl, `background:radial-gradient(circle at ${c},${t.bg[0]},${t.bg[1]} 35%,${t.bg[2]} 85%)`);
    const rays = document.createElement('div');
    rays.style.cssText =
      `position:absolute;inset:0;transform-origin:${c};` +
      `background:radial-gradient(circle at ${c},${t.core} 0 6%,#0000 22%),` +
      `repeating-conic-gradient(from 0deg at ${c},#0000 0 8deg,${t.ray}dd 8deg 10deg,${t.rayHi} 10deg 11deg,#0000 11deg 20deg)`;
    back.appendChild(rays);
    rays.animate([
      { transform: 'scale(1) rotate(0deg)', opacity: 0.85 },
      { transform: 'scale(1.06) rotate(1.5deg)', opacity: 1 },
      { transform: 'scale(1) rotate(0deg)', opacity: 0.85 }
    ], { duration: 160, iterations: 8 });
    await Fx.anim(back, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    return back;
  }

  /**
   * A sun glowing in a corner at `sun`: a white-yellow glow `size` px wide
   * pulses three times over `total` ms while yellow sparkles twinkle round it
   * (Morning Sun, Sunny Day).
   */
  static cornerSun(fxEl: HTMLElement, sun: Point, size: number, total: number): Promise<void> {
    const effects: Promise<void>[] = [];
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#FFFFF4,#FFF6B0 25%,#FFE45A88 45%,#FFE45A00 70%)`;
    Fx.place(glow, sun);
    fxEl.appendChild(glow);
    effects.push(
      Fx.anim(glow, [
        { transform: 'scale(.4)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.12 },
        { transform: 'scale(.82)', opacity: 0.85, offset: 0.3 },
        { transform: 'scale(1.12)', opacity: 1, offset: 0.48 },
        { transform: 'scale(.85)', opacity: 0.85, offset: 0.66 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.84 },
        { transform: 'scale(1.2)', opacity: 0 }
      ], { duration: total, easing: 'ease-in-out' }).then(() => glow.remove())
    );
    for (let i = 0; i < 10; i++) {
      const star = FxGlyphs.sparkStar(10 + Math.random() * 10, '#FFE45A');
      Fx.place(star, { x: sun.x + Math.random() * size * 0.55, y: sun.y + Math.random() * size * 0.45 });
      fxEl.appendChild(star);
      effects.push(
        Fx.anim(star, [
          { transform: 'scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'scale(1) rotate(20deg)', opacity: 1, offset: 0.45 },
          { transform: 'scale(0) rotate(40deg)', opacity: 0 }
        ], { duration: 500, easing: 'ease-in-out', delay: 150 + Math.random() * (total - 700) }).then(() => star.remove())
      );
    }
    return Promise.all(effects).then(() => void 0);
  }

  /** HP gain: twinkling green stars and a soft green glow around the caster (drain moves). */
  static async healSparkles(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const green = FLECK_COLOR.statUp;
    const r = Fx.rect(launchEl);
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
    const r = Fx.rect(targetEl);

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

/** Colours of a {@link FxEffects.clawMark}: the two glow layers round the black stroke and an optional tip orb. */
export interface ClawStyle {
  glow: [string, string];
  tip?: string;
}

/** Colours of {@link FxEffects.burstBackdrop}: backdrop gradient (centre → edge), core glow and rays. */
const BURST_TONES = {
  red: { bg: ['#FF4A1A', '#D0140E', '#6A0404'], core: '#FFE07A', ray: '#FFB03A', rayHi: '#FFE87A' },
  blue: { bg: ['#D8F4FF', '#2AA8F0', '#0A3A8A'], core: '#FFFFFF', ray: '#E8F8FF', rayHi: '#FFFFFF' },
  ember: { bg: ['#D8521E', '#A8340E', '#4A1004'], core: '#FF3A4A', ray: '#F4A47A', rayHi: '#FFD8B8' },
  magenta: { bg: ['#FF6AA8', '#D0144E', '#5A0420'], core: '#FFFFFF', ray: '#FF9AC4', rayHi: '#FFE0EC' },
  orange: { bg: ['#FFF0C8', '#FF9A2A', '#1E4A78'], core: '#FFFFFF', ray: '#FF6A10', rayHi: '#FFD27A' }
};
