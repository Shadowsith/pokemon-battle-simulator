import { BattleStageRefs, MoveAnimRegistry, Point } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { ClawStyle, FxEffects } from '../fx-effects';

/** Dragon Claw's marks: black with a white edge and a blue light on the tip. */
const DRAGON_CLAW: ClawStyle = { glow: ['#ffffff', '#ffffffaa'], tip: '#3FA8FF' };

/** Sprite filter that turns a Pokémon magenta red, with a pink glow (Dragon Claw, Dragon Dance). */
const DRAGON_RED = 'grayscale(1) brightness(.55) sepia(1) saturate(12) hue-rotate(-40deg) drop-shadow(0 0 6px #FF3C8C)';

/** Hand-made animations for Dragon-type moves. */
export class DragonMoveAnimations {
  /** Hand-made Dragon move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    dragonclaw: (refs, launch, target) => DragonMoveAnimations.playDragonClaw(refs, launch, target),
    dragondance: (refs, launch) => DragonMoveAnimations.playDragonDance(refs, launch),
    outrage: (refs, launch) => DragonMoveAnimations.playOutrage(refs, launch)
  };

  /**
   * Dragon Dance: the user turns magenta red inside a swirling dark red storm
   * while small cyan lightning sparks flicker all over it (0-1.5 s); then
   * orange stat sparkles drift down (from ~1.55 s).
   */
  private static async playDragonDance(refs: BattleStageRefs, launch: Point) {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const total = 1500;
    const tint = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: DRAGON_RED, offset: 0.15 },
      { filter: DRAGON_RED, offset: 0.85 },
      { filter: 'none' }
    ], { duration: total, easing: 'ease-in-out' });

    // The storm: dark red clouds on a turning wheel, stretched tall round the sprite.
    const reach = Math.max(r.width, r.height) * 0.42;
    const storm = document.createElement('div');
    storm.style.cssText = `position:absolute;left:${launch.x}px;top:${launch.y}px;width:0;height:0;pointer-events:none;transform:scale(1,1.2)`;
    const wheel = document.createElement('div');
    wheel.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0';
    storm.appendChild(wheel);
    for (let i = 0; i < 10; i++) {
      const size = Math.max(r.width, 50) * (0.35 + Math.random() * 0.25);
      const ang = (i / 10) * Math.PI * 2;
      const dist = reach * (0.55 + Math.random() * 0.5);
      const cloud = document.createElement('div');
      cloud.style.cssText = `position:absolute;left:${Math.cos(ang) * dist - size / 2}px;top:${Math.sin(ang) * dist - size / 2}px;width:${size}px;height:${size * 0.7}px;border-radius:50%;background:radial-gradient(ellipse,#D8182Cdd,#9A0A18aa 50%,#9A0A1800 72%);filter:blur(4px)`;
      wheel.appendChild(cloud);
    }
    fxEl.appendChild(storm);
    const spin = Fx.anim(wheel, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-540deg)' }], { duration: total, easing: 'linear' });
    const fade = Fx.anim(storm, [
      { opacity: 0, transform: 'scale(.6,.72)' },
      { opacity: 1, transform: 'scale(1,1.2)', offset: 0.15 },
      { opacity: 1, transform: 'scale(1,1.2)', offset: 0.85 },
      { opacity: 0, transform: 'scale(1.15,1.38)' }
    ], { duration: total, easing: 'ease-in-out' });

    // Small cyan lightning scribbles flicker on and off all over the user.
    for (let i = 0; i < 22; i++) {
      const w = 18 + Math.random() * 18;
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
      svg.setAttribute('width', `${w}`);
      svg.setAttribute('height', `${w}`);
      svg.setAttribute('style', 'position:absolute;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 3px #3FD8F0)');
      const line = document.createElementNS(ns, 'polyline');
      const pts: string[] = [];
      for (let k = 0; k <= 5; k++) pts.push(`${((k / 5) * w).toFixed(1)},${(w / 2 + (Math.random() * 2 - 1) * w * 0.3).toFixed(1)}`);
      line.setAttribute('points', pts.join(' '));
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#8CF2FF');
      line.setAttribute('stroke-width', '1.6');
      line.setAttribute('stroke-linejoin', 'bevel');
      svg.appendChild(line);
      svg.style.left = `${launch.x + (Math.random() * 2 - 1) * r.width * 0.55 - w / 2}px`;
      svg.style.top = `${launch.y + (Math.random() * 2 - 1) * r.height * 0.55 - w / 2}px`;
      svg.style.transform = `rotate(${Math.random() * 360}deg)`;
      svg.style.opacity = '0';
      fxEl.appendChild(svg);
      // Two quick hard flickers.
      Fx.anim(svg, [
        { opacity: 1, easing: 'step-end' },
        { opacity: 0, offset: 0.35, easing: 'step-end' },
        { opacity: 1, offset: 0.55, easing: 'step-end' },
        { opacity: 0 }
      ], { duration: 200, delay: 200 + Math.random() * (total - 500) }).then(() => svg.remove());
    }

    await Promise.all([tint, spin, fade]);
    storm.remove();
    await FxEffects.orangeSparkles(refs, launch, launch.y - r.height / 2);
  }

  /**
   * Dragon Claw: the user glows magenta red while pink light streaks and
   * white sparkles rise from its feet (0-0.75 s); then three black claw marks
   * with white edges and blue tips rip down the left side of the target (hit
   * at 0.92 s) and three more down its right side (hit at 1.27 s).
   */
  private static async playDragonClaw(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const foot = Fx.footOf(launchEl, fieldEl);

    // 1. Power up: magenta red tint + rising pink streaks and white sparkles.
    const tint = Fx.anim(launchEl, [
      { filter: 'none' },
      { filter: DRAGON_RED, offset: 0.2 },
      { filter: DRAGON_RED, offset: 0.8 },
      { filter: 'none' }
    ], { duration: 750, easing: 'ease-in-out' });
    const rise = Math.max(lr.height * 1.4, 90);
    for (let i = 0; i < 18; i++) {
      const pink = i % 3 !== 2;
      const w = pink ? 6 + Math.random() * 5 : 2 + Math.random() * 2;
      const h = pink ? w * (2.2 + Math.random()) : 20 + Math.random() * 30;
      const p = document.createElement('div');
      p.style.cssText = pink
        ? `position:absolute;width:${w}px;height:${h}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFD0E4,#FF6EB0 55%,#FF3C8C00 80%)`
        : `position:absolute;width:${w}px;height:${h}px;border-radius:${w}px;pointer-events:none;background:linear-gradient(0deg,#ffffff00,#ffffff 50%,#ffffff00)`;
      Fx.place(p, { x: foot.x + (Math.random() * 2 - 1) * lr.width * 0.55, y: foot.y - Math.random() * lr.height * 0.4 });
      fxEl.appendChild(p);
      const up = rise * (0.6 + Math.random() * 0.4);
      Fx.anim(p, [
        { transform: 'translateY(0)', opacity: 0 },
        { transform: `translateY(${-up * 0.25}px)`, opacity: 1, offset: 0.25 },
        { transform: `translateY(${-up}px)`, opacity: 0 }
      ], { duration: 550 + Math.random() * 200, easing: 'ease-out', delay: Math.random() * 250 }).then(() => p.remove());
    }
    await tint;
    await Fx.wait(50);

    // 2. Two rakes of three claw marks: left side, then right side.
    const r = Fx.rect(targetEl);
    const len = Math.max(r.height * 0.6, 48);
    const gap = Math.max(r.width * 0.1, 9);
    const marks: Promise<void>[] = [];
    for (const side of [-1, 1]) {
      const centre: Point = { x: target.x + side * r.width * 0.2, y: target.y };
      for (const k of [-1, 0, 1]) {
        marks.push(FxEffects.clawMark(fxEl, { x: centre.x + k * gap, y: centre.y + k * gap * 0.4 }, len, 64, DRAGON_CLAW));
      }
      await Fx.wait(120);
      Fx.flash(targetEl, '#ffffff', 0.5);
      Fx.shake(targetEl, 5);
      await Fx.wait(230);
    }
    await Promise.all(marks);
  }

  /**
   * Outrage: the scene goes dark, then a wall of purple and magenta dragon
   * fire rolls across the background from left to right, glowing hot behind
   * the raging caster, which flares with pulsing orange sparkles while the
   * target is battered.
   */
  private static async playOutrage(refs: BattleStageRefs, launch: Point) {
    const { fieldEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1800;

    // 1. Darkness.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Magenta sky, a hot glow behind the caster and two rolling rows of flames.
    const fire = document.createElement('div');
    fire.style.cssText =
      'position:absolute;inset:0;overflow:hidden;' +
      `background:radial-gradient(circle at ${launch.x}px ${launch.y + H * 0.1}px,#FFF2A0,#FFC24A88 14%,#FFC24A00 32%),` +
      'linear-gradient(180deg,#E04E8C,#E070B0 45%,#C8A0E8)';
    dim.appendChild(fire);
    fire.appendChild(DragonMoveAnimations.flameRow(W, H, 0.95, '#8A1E62', 700));
    fire.appendChild(DragonMoveAnimations.flameRow(W, H, 0.6, '#B23A86', 520));
    await Fx.anim(fire, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // The caster rages: pulsing orange sparkles; the target is battered.
    const rage = DragonMoveAnimations.rageSparkles(refs, launch, total - 300);
    for (let i = 0; i < 3; i++) setTimeout(() => { Fx.flash(targetEl, '#FF9A2A', 0.5); Fx.shake(targetEl, 5); }, 450 + i * 400);
    for (let i = 0; i < 5; i++) setTimeout(() => Fx.flash(launchEl, '#FF8A1A', 0.7), i * 300);
    await rage;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * A row of flame tongues along the bottom of the field, `reach` × field
   * height tall, scrolling endlessly left to right (`period` ms per flame)
   * and flickering. Lives until its layer is removed.
   */
  private static flameRow(W: number, H: number, reach: number, color: string, period: number): HTMLElement {
    const n = 7;
    const gap = W / n;
    const row = document.createElement('div');
    row.style.cssText = `position:absolute;left:${-gap}px;bottom:0;width:${W + gap * 2}px;height:${H}px`;
    for (let i = 0; i < n + 2; i++) {
      const h = H * reach * (0.7 + Math.random() * 0.3);
      const flame = document.createElement('div');
      flame.style.cssText = `position:absolute;left:${i * gap - gap * 0.15}px;bottom:${-H * 0.05}px;width:${gap * 1.3}px;height:${h}px;transform-origin:50% 100%`;
      flame.innerHTML =
        `<svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%"><path d="M55 0C62 22 88 38 86 66C84 88 68 100 50 100C32 100 14 88 14 66C14 46 34 40 40 22C44 30 50 30 55 0Z" fill="${color}"/></svg>`;
      row.appendChild(flame);
      flame.animate(
        [{ transform: 'scale(1,1) skewX(0deg)' }, { transform: `scale(.92,1.12) skewX(${-6 - Math.random() * 6}deg)` }, { transform: 'scale(1,1) skewX(0deg)' }],
        { duration: 260 + Math.random() * 200, iterations: Infinity, easing: 'ease-in-out', delay: -Math.random() * 400 }
      );
    }
    // One flame gap per period: the row looks endless.
    row.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${gap}px)` }], { duration: period, iterations: Infinity, easing: 'linear' });
    return row;
  }

  /** Orange sparkles pop on and around the caster in pulses for `duration` ms. */
  private static async rageSparkles(refs: BattleStageRefs, launch: Point, duration: number): Promise<void> {
    const { fxEl, launchEl } = refs;
    const r = Fx.rect(launchEl);
    const pops: Promise<void>[] = [];
    const pulses = Math.round(duration / 300);
    for (let p = 0; p < pulses; p++) {
      for (let i = 0; i < 4; i++) {
        const star = FxGlyphs.sparkStar(12 + Math.random() * 14, i % 2 ? '#FF8A1A' : '#FFC24A');
        Fx.place(star, {
          x: launch.x + (Math.random() * 2 - 1) * r.width * 0.5,
          y: launch.y + (Math.random() * 2 - 1) * r.height * 0.5
        });
        fxEl.appendChild(star);
        pops.push(
          Fx.anim(star, [
            { transform: 'scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'scale(1.2) rotate(25deg)', opacity: 1, offset: 0.4 },
            { transform: 'scale(0) rotate(45deg)', opacity: 0 }
          ], { duration: 380, easing: 'ease-out', delay: Math.random() * 80 }).then(() => star.remove())
        );
      }
      await Fx.wait(300);
    }
    await Promise.all(pops);
  }
}
