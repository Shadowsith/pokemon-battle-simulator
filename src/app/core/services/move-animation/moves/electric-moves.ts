import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../animation.types';
import { DIM_BACKDROP } from '../animation.constants';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Electric-type moves. */
export class ElectricMoveAnimations {
  /** Hand-made Electric move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    thunder: (refs, _launch, target) => ElectricMoveAnimations.playThunder(refs, target),
    thunderbolt: (refs, _launch, target) => ElectricMoveAnimations.playThunderbolt(refs, target),
    thunderwave: (refs, _launch, target) => ElectricMoveAnimations.playThunderWave(refs, target),
    zapcannon: (refs, launch, target, v) => ElectricMoveAnimations.playZapCannon(refs, launch, target, v),
    thunderpunch: (refs, _launch, target) =>
      FxEffects.playElementalPunch(refs, target, 'yellow', '#FFE04A', () => FxGlyphs.sparkBolt())
  };

  /**
   * Thunder: the scene goes dark under a band of storm clouds along the top,
   * then a jagged yellow bolt strikes the target from the sky, with a ground
   * glow, sparks and flashes.
   */
  private static async playThunder(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, screenFxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const yellow = '#F6D33B';

    const sky = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#141418,#24242B 40%,#1A1A20)');
    // Storm clouds: overlapping soft grey blobs along the top edge, drifting slowly.
    const clouds = document.createElement('div');
    clouds.style.cssText = 'position:absolute;left:-10%;right:-10%;top:0;height:28%';
    for (let i = 0; i < 14; i++) {
      const cw = W * (0.14 + Math.random() * 0.12);
      const blob = document.createElement('div');
      blob.style.cssText = `position:absolute;left:${(i / 14) * 112 - 4}%;top:${-cw * 0.35 + Math.random() * 10}px;width:${cw}px;height:${cw * 0.55}px;border-radius:50%;background:radial-gradient(ellipse at 50% 60%,#4A4A52,#33333A 60%,#2A2A3000);filter:blur(2px)`;
      clouds.appendChild(blob);
    }
    sky.appendChild(clouds);
    clouds.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${W * 0.04}px)` }], {
      duration: 2600,
      easing: 'ease-in-out'
    });
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: 'ease-out' });
    await Fx.wait(350);

    // The bolt: jagged path from the sky to the target's feet, plus two thinner forks.
    const foot = Fx.footOf(targetEl, fieldEl);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${W}`);
    svg.setAttribute('height', `${H}`);
    svg.setAttribute('style', `position:absolute;left:0;top:0;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 6px ${yellow}) drop-shadow(0 0 14px ${yellow})`);
    const main = Fx.zigzagPoints(target.x + (Math.random() * 30 - 15), -10, foot.x, foot.y - 4, 14);
    const forkY = H * 0.25 + Math.random() * H * 0.15;
    const forks = [
      Fx.zigzagPoints(target.x - 10, forkY, target.x - 40 - Math.random() * 30, forkY + 70, 9),
      Fx.zigzagPoints(target.x + 8, forkY + 30, target.x + 35 + Math.random() * 30, forkY + 95, 9)
    ];
    svg.innerHTML =
      forks.map((f) => `<polyline points="${f}" fill="none" stroke="${yellow}" stroke-width="2.5" stroke-linejoin="bevel"/>`).join('') +
      `<polyline points="${main}" fill="none" stroke="${yellow}" stroke-width="7" stroke-linejoin="bevel"/>` +
      `<polyline points="${main}" fill="none" stroke="#FFFBE0" stroke-width="2.5" stroke-linejoin="bevel"/>`;
    fxEl.appendChild(svg);

    // Ground glow where the bolt lands.
    const rr = Fx.rect(targetEl);
    const gw = Math.max(rr.width * 1.3, 80);
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;width:${gw}px;height:${gw * 0.32}px;border-radius:50%;pointer-events:none;background:radial-gradient(ellipse,#FFFBE0,#E8F04Acc 35%,#9CD62A55 65%,transparent 75%)`;
    Fx.place(glow, foot);
    fxEl.insertBefore(glow, svg);

    // Strike - flicker - strike again.
    const strike = Fx.anim(svg, [
      { opacity: 0 },
      { opacity: 1, offset: 0.05 },
      { opacity: 0.25, offset: 0.25 },
      { opacity: 1, offset: 0.35 },
      { opacity: 0.4, offset: 0.55 },
      { opacity: 1, offset: 0.65 },
      { opacity: 0 }
    ], { duration: 900, easing: 'linear' }).then(() => svg.remove());
    Fx.anim(glow, [
      { transform: 'scale(.3)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.15 },
      { transform: 'scale(1.1)', opacity: 0.8, offset: 0.7 },
      { transform: 'scale(1.2)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-out' }).then(() => glow.remove());
    Fx.screenWash(screenFxEl, '#FFF6B088', 60, 140, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.flash(targetEl, yellow, 0.9);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.8);
    setTimeout(() => {
      Fx.flash(targetEl, '#FFFBE0', 0.9);
      Fx.shake(targetEl, 5);
    }, 320);

    // Sparks: glowing yellow-white motes bursting out around the target.
    const spread = Math.max(rr.width * 0.6, 40);
    for (let i = 0; i < 20; i++) {
      const sz = 5 + Math.random() * 7;
      const mote = document.createElement('div');
      mote.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#fff,#F4F47A 50%,#F6D33B00 75%);box-shadow:0 0 8px #F4F47A`;
      Fx.place(mote, { x: target.x + (Math.random() * 2 - 1) * spread * 0.4, y: foot.y - Math.random() * rr.height * 0.6 });
      fxEl.appendChild(mote);
      const ang = Math.random() * Math.PI * 2;
      const dist = spread * (0.5 + Math.random() * 0.7);
      Fx.anim(mote, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${Math.cos(ang) * dist * 0.5}px,${Math.sin(ang) * dist * 0.3}px) scale(1.2)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist * 0.5}px) scale(.5)`, opacity: 0 }
      ], { duration: 650 + Math.random() * 350, easing: 'ease-out', delay: Math.random() * 300 }).then(() => mote.remove());
    }

    await strike;
    await Fx.wait(250);
    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in' });
    sky.remove();
  }

  /**
   * Thunderbolt: thin yellow-green lightning bolts strike the target from
   * above one after another, each flickering and fading. From the first hit
   * on, a glowing spiky ball of electricity crackles on the target's centre.
   */
  private static async playThunderbolt(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const r = Fx.rect(targetEl);
    const bolt = '#E4F44A';
    const strikes = 4;
    const gap = 230;
    const ns = 'http://www.w3.org/2000/svg';

    const strikeOnce = (): Promise<void> => {
      const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
      svg.setAttribute('width', `${W}`);
      svg.setAttribute('height', `${H}`);
      svg.setAttribute('style', `position:absolute;left:0;top:0;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 5px ${bolt}) drop-shadow(0 0 10px ${bolt})`);
      const pts = Fx.zigzagPoints(target.x + (Math.random() * 2 - 1) * r.width * 0.25, -10, target.x + (Math.random() * 2 - 1) * 8, target.y, 8);
      svg.innerHTML =
        `<polyline points="${pts}" fill="none" stroke="${bolt}" stroke-width="5" stroke-linejoin="bevel"/>` +
        `<polyline points="${pts}" fill="none" stroke="#FCFFE0" stroke-width="1.8" stroke-linejoin="bevel"/>`;
      fxEl.appendChild(svg);
      Fx.flash(targetEl, bolt, 0.7);
      Fx.shake(targetEl, 4);
      return Fx.anim(svg, [
        { opacity: 0 },
        { opacity: 1, offset: 0.08 },
        { opacity: 0.35, offset: 0.35 },
        { opacity: 1, offset: 0.5 },
        { opacity: 0 }
      ], { duration: 360, easing: 'linear' }).then(() => svg.remove());
    };

    // First strike, then the electric ball lights up on the target.
    const hits: Promise<void>[] = [strikeOnce()];
    await Fx.wait(60);
    const size = Math.max(r.width * 0.9, 64);
    const ball = document.createElement('div');
    ball.style.cssText =
      `position:absolute;width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      `background:radial-gradient(circle,#fff 0 14%,#F6FF9A 26%,#E4F44A00 55%),repeating-conic-gradient(#F0FF7Add 0 3deg,#F0FF7A00 3deg 13deg);` +
      '-webkit-mask-image:radial-gradient(circle,#000 28%,transparent 70%);mask-image:radial-gradient(circle,#000 28%,transparent 70%);' +
      `filter:drop-shadow(0 0 8px ${bolt})`;
    Fx.place(ball, target);
    fxEl.appendChild(ball);
    const total = gap * (strikes - 1) + 600;
    const ballDone = Fx.anim(ball, [
      { transform: 'scale(.2) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1.1) rotate(20deg)', opacity: 1, offset: 0.12 },
      { transform: 'scale(.9) rotate(45deg)', opacity: 0.85, offset: 0.35 },
      { transform: 'scale(1.05) rotate(70deg)', opacity: 1, offset: 0.6 },
      { transform: 'scale(.95) rotate(95deg)', opacity: 0.9, offset: 0.85 },
      { transform: 'scale(1.3) rotate(110deg)', opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' }).then(() => ball.remove());

    // Little sparks crackle off the ball while it glows.
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
        const len = 14 + Math.random() * 16;
        svg.setAttribute('width', `${len}`);
        svg.setAttribute('height', `${len}`);
        svg.setAttribute('style', `position:absolute;left:${target.x}px;top:${target.y}px;overflow:visible;pointer-events:none;filter:drop-shadow(0 0 3px ${bolt})`);
        const ang = (Math.random() * 2 - 1) * 180;
        svg.innerHTML = `<polyline points="${Fx.zigzagPoints(0, size * 0.18, 0, size * 0.18 + len, 4)}" fill="none" stroke="#F6FF9A" stroke-width="1.6" transform="rotate(${ang})"/>`;
        fxEl.appendChild(svg);
        Fx.anim(svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'steps(2, end)' }).then(() => svg.remove());
      }, 80 + i * (total - 300) / 10);
    }

    for (let i = 1; i < strikes; i++) {
      await Fx.wait(gap);
      hits.push(strikeOnce());
    }
    await Promise.all([...hits, ballDone]);
  }

  /**
   * Thunder Wave: the scene goes dark, yellow electric arcs swirl in round the
   * target like a whirlpool, then the target is paralysed - its sprite turns
   * yellow while little lightning bolts crackle around it.
   */
  private static async playThunderWave(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);

    // 1. Darkness.
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });

    // 2. Whirlpool of electric arcs, spinning and closing in on the target.
    const big = Math.max(Math.max(r.width, r.height) * 1.9, 120);
    const glow = document.createElement('div');
    glow.style.cssText = `position:absolute;width:${big}px;height:${big}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#E8E04A55,#C8C02A33 45%,#C8C02A00 70%)`;
    Fx.place(glow, target);
    fxEl.appendChild(glow);
    Fx.anim(glow, [
      { transform: 'scale(.5)', opacity: 0 },
      { transform: 'scale(1)', opacity: 1, offset: 0.3 },
      { transform: 'scale(.6)', opacity: 0 }
    ], { duration: 1200, easing: 'ease-in-out' }).then(() => glow.remove());
    const arcs: Promise<void>[] = [];
    for (let i = 0; i < 7; i++) {
      const s = big * (0.55 + (i % 4) * 0.15);
      const w = 3 + Math.random() * 4;
      const arc = document.createElement('div');
      arc.style.cssText = `position:absolute;width:${s}px;height:${s}px;border-radius:50%;pointer-events:none;border:${w}px solid transparent;border-top-color:#F0E84A;border-right-color:#E8E04A99;filter:drop-shadow(0 0 4px #F0E84A)`;
      Fx.place(arc, target);
      fxEl.appendChild(arc);
      const rot0 = Math.random() * 360;
      arcs.push(
        Fx.anim(arc, [
          { transform: `rotate(${rot0}deg) scale(1.2)`, opacity: 0 },
          { transform: `rotate(${rot0 + 200}deg) scale(.9)`, opacity: 1, offset: 0.35 },
          { transform: `rotate(${rot0 + 520}deg) scale(.25)`, opacity: 0 }
        ], { duration: 900, easing: 'ease-in', delay: i * 70 }).then(() => arc.remove())
      );
    }
    await Promise.all(arcs);

    // 3. Paralysed: the sprite turns yellow and bolts crackle around it.
    const tint = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(4) hue-rotate(8deg) brightness(1.25)', offset: 0.15 },
      { filter: 'sepia(1) saturate(4) hue-rotate(8deg) brightness(1.1)', offset: 0.85 },
      { filter: 'none' }
    ], { duration: 1100, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        const b = FxGlyphs.sparkBolt();
        Fx.place(b, {
          x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.55, 28),
          y: target.y + (Math.random() * 2 - 1) * Math.max(r.height * 0.45, 24)
        });
        fxEl.appendChild(b);
        const rot = Math.random() * 60 - 30;
        Fx.anim(b, [
          { transform: `rotate(${rot}deg) scale(.4)`, opacity: 0 },
          { transform: `rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 240, easing: 'ease-out' }).then(() => b.remove());
        if (i % 4 === 0) Fx.shake(targetEl, 3);
      }, 40 + i * 65);
    }
    await tint;

    await Fx.anim(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }

  /**
   * Zap Cannon: the scene turns into a blue tunnel of rays round the target.
   * A crackling yellow ball of electricity charges up in front of the caster
   * and shoots across, then bursts on the target into several yellow balls
   * scarred with black zap marks while the target is paralysed.
   */
  private static async playZapCannon(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, screenFxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const r = Fx.rect(targetEl);
    const yellow = '#FFE84A';

    // 1. Blue backdrop: slowly turning rays and drifting light dots, centred on the target.
    const bg = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#3A78E0,#1E4FB8 60%,#0E2C80)');
    const reach = Math.hypot(W, H);
    const rays = document.createElement('div');
    rays.style.cssText =
      `position:absolute;left:${target.x - reach}px;top:${target.y - reach}px;width:${reach * 2}px;height:${reach * 2}px;` +
      'background:radial-gradient(circle,#BFE0FF 0,#7FB4F2 6%,#7FB4F200 22%),' +
      'radial-gradient(circle,#0E2C8000 30%,#0E2C80cc 48%),' +
      'repeating-conic-gradient(from 0deg,#2A62D2 0 7deg,#5C9AEE 7deg 10deg,#3A74DC 10deg 16deg,#2A62D2 16deg 23deg)';
    bg.appendChild(rays);
    rays.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(35deg)' }], { duration: 1900, easing: 'linear' });
    for (let i = 0; i < 14; i++) {
      const dot = document.createElement('div');
      const sz = 3 + Math.random() * 3;
      dot.style.cssText = `width:${sz}px;height:${sz}px;border-radius:50%;background:#CFE6FF;box-shadow:0 0 4px #9CC8FF`;
      Fx.place(dot, { x: target.x, y: target.y });
      bg.appendChild(dot);
      const ang = Math.random() * Math.PI * 2;
      const d0 = 30 + Math.random() * 120;
      const d1 = d0 + 80 + Math.random() * 120;
      dot.animate([
        { transform: `translate(${Math.cos(ang) * d0}px,${Math.sin(ang) * d0}px)`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { transform: `translate(${Math.cos(ang) * d1}px,${Math.sin(ang) * d1}px)`, opacity: 0 }
      ], { duration: 1500, delay: Math.random() * 400, easing: 'ease-out', fill: 'both' });
    }
    const bgIn = Fx.anim(bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });

    // 2. The ball charges in front of the caster (0 - 0.26 s) ...
    const muzzle: Point = { x: launch.x + v.dir * Math.max(lr.width * 0.4, 30), y: launch.y };
    const size = 34;
    const ball = document.createElement('div');
    ball.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;overflow:visible;` +
      `background:radial-gradient(circle,#fff 0 22%,#FFF6A0 40%,${yellow} 62%,#E8B42A00 72%);filter:drop-shadow(0 0 6px ${yellow})`;
    Fx.place(ball, muzzle);
    fxEl.appendChild(ball);
    const stopCrackle = ElectricMoveAnimations.crackle(ball, size);
    await Promise.all([
      bgIn,
      Fx.anim(ball, [{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 260, easing: 'ease-out' })
    ]);

    // ... then shoots across to the target.
    await Fx.anim(ball, [
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${target.x - muzzle.x}px,${target.y - muzzle.y}px) scale(1.25)` }
    ], { duration: 280, easing: 'ease-in' });
    stopCrackle();
    ball.remove();

    // 3. Impact: flash, then yellow balls with black zap marks pop up over the target.
    Fx.screenWash(screenFxEl, '#FFF6B088', 50, 120, `${((target.x / W) * 100).toFixed(0)}%`);
    Fx.flash(targetEl, yellow, 0.9);
    Fx.shake(targetEl, 6);
    Fx.shakeField(fieldEl, 0.6);
    const spread = Math.max(r.width * 0.42, 26);
    const blobs: Promise<void>[] = [];
    for (let i = 0; i < 5; i++) {
      const bs = Math.max(r.width * 0.42, 34) * (0.8 + Math.random() * 0.4);
      const blob = ElectricMoveAnimations.zapBall(bs);
      const ang = (i / 5) * Math.PI * 2 + Math.random() * 0.6;
      Fx.place(blob, { x: target.x + Math.cos(ang) * spread * (i ? 1 : 0.2), y: target.y + Math.sin(ang) * spread * 0.8 * (i ? 1 : 0.2) });
      fxEl.appendChild(blob);
      blobs.push(
        Fx.anim(blob, [
          { transform: 'scale(.2)', opacity: 0 },
          { transform: 'scale(1.1)', opacity: 1, offset: 0.2 },
          { transform: 'scale(.95)', opacity: 0.6, offset: 0.45 },
          { transform: 'scale(1)', opacity: 1, offset: 0.6 },
          { transform: 'scale(1.15)', opacity: 0 }
        ], { duration: 520, delay: i * 70, easing: 'ease-out' }).then(() => blob.remove())
      );
    }
    setTimeout(() => Fx.shake(targetEl, 4), 180);

    // 4. Paralysis (~0.82 s): the target turns yellow while sparks crackle around it.
    await Fx.wait(260);
    const tint = Fx.anim(targetEl, [
      { filter: 'none' },
      { filter: 'sepia(1) saturate(4) hue-rotate(8deg) brightness(1.25)', offset: 0.2 },
      { filter: 'sepia(1) saturate(4) hue-rotate(8deg) brightness(1.1)', offset: 0.8 },
      { filter: 'none' }
    ], { duration: 650, easing: 'ease-in-out', fill: 'none' });
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const b = FxGlyphs.sparkBolt();
        Fx.place(b, {
          x: target.x + (Math.random() * 2 - 1) * Math.max(r.width * 0.55, 28),
          y: target.y + (Math.random() * 2 - 1) * Math.max(r.height * 0.45, 24)
        });
        fxEl.appendChild(b);
        const rot = Math.random() * 60 - 30;
        Fx.anim(b, [
          { transform: `rotate(${rot}deg) scale(.4)`, opacity: 0 },
          { transform: `rotate(${rot}deg) scale(1.1)`, opacity: 1, offset: 0.3 },
          { transform: `rotate(${rot}deg) scale(1)`, opacity: 0 }
        ], { duration: 220, easing: 'ease-out' }).then(() => b.remove());
      }, i * 65);
    }
    await Promise.all([...blobs, tint]);

    await Fx.anim(bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    bg.remove();
  }

  /** Keeps short jagged sparks flickering off the edge of `el` (a ball of `size` px); returns a stop function. */
  private static crackle(el: HTMLElement, size: number): () => void {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg') as unknown as HTMLElement;
    svg.setAttribute('width', `${size}`);
    svg.setAttribute('height', `${size}`);
    svg.setAttribute('style', 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none');
    el.appendChild(svg);
    const c = size / 2;
    const draw = () => {
      let html = '';
      for (let k = 0; k < 3; k++) {
        const ang = Math.random() * 360;
        const len = size * (0.35 + Math.random() * 0.4);
        const pts = Fx.zigzagPoints(0, c * 0.7, 0, c * 0.7 + len, 4);
        html += `<polyline points="${pts}" fill="none" stroke="#FFF6A0" stroke-width="1.8" transform="translate(${c},${c}) rotate(${ang})"/>`;
      }
      svg.innerHTML = html;
    };
    draw();
    const t = setInterval(draw, 60);
    return () => clearInterval(t);
  }

  /** A glowing yellow ball of electricity scarred with black spiky zap marks (Zap Cannon impact). */
  private static zapBall(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText =
      `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;` +
      'background:radial-gradient(circle at 45% 40%,#FFFBD0 0 18%,#FFE84A 45%,#F2C81E 68%,#F2C81E00 72%);filter:drop-shadow(0 0 5px #FFE84A)';
    let marks = '';
    for (let m = 0; m < 2; m++) {
      const cx = 30 + Math.random() * 40;
      const cy = 30 + Math.random() * 40;
      const spikes = 6 + Math.floor(Math.random() * 3);
      const pts: string[] = [];
      for (let i = 0; i < spikes * 2; i++) {
        const a = (Math.PI * 2 * i) / (spikes * 2) + Math.random() * 0.3;
        const rad = i % 2 ? 4 + Math.random() * 2 : 11 + Math.random() * 9;
        pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`);
      }
      marks += `<polygon points="${pts.join(' ')}" fill="#1A1A1A"/>`;
    }
    el.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block;overflow:visible">${marks}</svg>`;
    return el;
  }
}
