import { Point, BattleStageRefs, MoveAnimRegistry, MoveVisual } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';
import { HeadSmash } from './rock/head-smash';
import { PowerGem } from './rock/power-gem';
import { RockPolish } from './rock/rock-polish';
import { RockWrecker } from './rock/rock-wrecker';
import { StealthRock } from './rock/stealth-rock';
import { StoneEdge } from './rock/stone-edge';

/** Hand-made animations for Rock-type moves (Head Smash, Power Gem, Rock Polish, Rock Wrecker, Stealth Rock and Stone Edge live in `rock/`). */
export class RockMoveAnimations {
  /** Hand-made Rock move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    diamondstorm: (refs, launch, target, v) => RockMoveAnimations.playDiamondStorm(refs, launch, target, v),
    headsmash: (refs, _launch, target, v) => HeadSmash.play(refs, target, v),
    powergem: (refs, launch, target) => PowerGem.play(refs, launch, target),
    rockpolish: (refs, launch) => RockPolish.play(refs, launch),
    rockslide: (refs, _launch, target) => RockMoveAnimations.playRockSlide(refs, target),
    rockwrecker: (refs, launch, target, v) => RockWrecker.play(refs, launch, target, v),
    sandstorm: (refs) => RockMoveAnimations.playSandstorm(refs),
    stealthrock: (refs, launch, target) => StealthRock.play(refs, launch, target),
    stoneedge: (refs, _launch, target) => StoneEdge.play(refs, target)
  };

  /**
   * Diamond Storm, after the XY animation: a white glow swells at the user
   * (0-0.35 s) and turns into a big faceted diamond round it with pink gems
   * popping out (0.35-0.75 s). The scene turns magenta (0.75-0.95 s) and a
   * storm of pink diamond shards and sparkles sweeps over to the target
   * (0.9-1.8 s), where a pink burst hits it amid pink gems (1.3-1.8 s); the
   * scene clears (to ~2.1 s).
   */
  private static async playDiamondStorm(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    // A white glow swells into a faceted diamond round the user, with pink gems popping out.
    const size = Math.max(lr.height * 1.2, 90);
    const glow = document.createElement('div');
    glow.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,#ffffff 0 35%,#FFF4E0cc 50%,#FFE8A000 70%)`;
    Fx.place(glow, launch);
    fxEl.appendChild(glow);
    await Fx.anim(glow, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 350, easing: 'ease-out', fill: 'forwards' });
    const diamond = RockMoveAnimations.diamondGlyph(size * 1.1);
    Fx.place(diamond, launch);
    fxEl.appendChild(diamond);
    const gems: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      const gem = RockMoveAnimations.pinkGem(8 + Math.random() * 8);
      Fx.place(gem, launch);
      fxEl.appendChild(gem);
      const ang = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const d = size * (0.55 + Math.random() * 0.2);
      gems.push(
        Fx.anim(gem, [
          { transform: 'translate(0,0) scale(.3)', opacity: 0 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d}px) scale(1)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${Math.cos(ang) * d * 1.15}px,${Math.sin(ang) * d * 1.15}px) scale(.8)`, opacity: 0 }
        ], { duration: 600, delay: i * 20, easing: 'ease-out' }).then(() => gem.remove())
      );
    }
    await Fx.anim(diamond, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 400, easing: 'ease-out', fill: 'forwards' });

    // The scene turns magenta as the diamond fades.
    const back = Fx.backdrop(fieldEl, 'background:radial-gradient(circle at 50% 50%,#B03A78,#7A1A50 60%,#4A0A30)');
    await Promise.all([
      Fx.anim(back, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 200, easing: 'ease-out', fill: 'forwards' }),
      Fx.anim(diamond, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' }),
      Fx.anim(glow, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' })
    ]);
    diamond.remove();
    glow.remove();

    // The storm: pink shards and sparkles sweep over to the target.
    const storm: Promise<void>[] = [...gems];
    for (let i = 0; i < 30; i++) {
      const shard = RockMoveAnimations.pinkGem(8 + Math.random() * 10);
      const from: Point = { x: launch.x + (Math.random() * 2 - 1) * W * 0.12, y: launch.y + (Math.random() * 2 - 1) * H * 0.25 };
      const to: Point = { x: target.x + v.dir * W * 0.15 + (Math.random() * 2 - 1) * W * 0.1, y: target.y + (Math.random() * 2 - 1) * H * 0.25 };
      Fx.place(shard, from);
      fxEl.appendChild(shard);
      const spin = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360);
      storm.push(
        Fx.anim(shard, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
          { transform: `translate(${(to.x - from.x) * 0.15}px,${(to.y - from.y) * 0.15}px) rotate(${spin * 0.15}deg)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${to.x - from.x}px,${to.y - from.y}px) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 450 + Math.random() * 150, delay: i * 18, easing: 'linear' }).then(() => shard.remove())
      );
    }
    for (let i = 0; i < 16; i++) {
      const dot = FxGlyphs.sparkStar(6 + Math.random() * 6, '#FFB0E0');
      Fx.place(dot, { x: Math.random() * W, y: Math.random() * H });
      fxEl.appendChild(dot);
      storm.push(
        Fx.anim(dot, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(0)', opacity: 0 }], {
          duration: 400,
          delay: Math.random() * 700,
          easing: 'ease-out'
        }).then(() => dot.remove())
      );
    }

    // The pink burst on the target, with gems popping round it.
    await Fx.wait(400);
    const burst = FxGlyphs.spikyBurst(Math.max(tr.width * 1.1, 80), '#FF5AB0', '#FFB0D8', '#ffffff');
    Fx.place(burst, target);
    fxEl.appendChild(burst);
    Fx.shake(targetEl, 6);
    storm.push(
      Fx.anim(burst, [
        { transform: 'scale(.3) rotate(0deg)', opacity: 1 },
        { transform: 'scale(1) rotate(10deg)', opacity: 1, offset: 0.35 },
        { transform: 'scale(1.2) rotate(18deg)', opacity: 0 }
      ], { duration: 450, easing: 'ease-out' }).then(() => burst.remove())
    );
    for (let i = 0; i < 6; i++) {
      const gem = RockMoveAnimations.pinkGem(10 + Math.random() * 6);
      Fx.place(gem, { x: target.x + (Math.random() * 2 - 1) * tr.width * 0.6, y: target.y + (Math.random() * 2 - 1) * tr.height * 0.5 });
      fxEl.appendChild(gem);
      storm.push(
        Fx.anim(gem, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.4 }, { transform: 'scale(.6)', opacity: 0 }], {
          duration: 450,
          delay: 100 + i * 50,
          easing: 'ease-out'
        }).then(() => gem.remove())
      );
    }
    await Promise.all(storm);
    await Fx.anim(back, [{ opacity: 0.9 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    back.remove();
  }

  /** A big faceted blue-white diamond `size` px tall, see-through, with bright facets. */
  private static diamondGlyph(size: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${size}px;height:${size}px;pointer-events:none;filter:drop-shadow(0 0 8px #C8E0FF)`;
    el.innerHTML =
      '<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block">' +
      '<polygon points="50,2 85,20 98,55 75,92 25,92 2,55 15,20" fill="#C8DCFF55" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M15 20 L50 40 L85 20 M50 2 L50 40 M2 55 L50 40 L98 55 M25 92 L50 40 L75 92" stroke="#ffffffbb" stroke-width="1" fill="none"/>' +
      '<polygon points="15,20 50,2 50,40" fill="#ffffff66"/><polygon points="50,40 98,55 75,92" fill="#A8C8FF55"/></svg>';
    return el;
  }

  /** A small pink diamond shard `s` px tall. */
  private static pinkGem(s: number): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `width:${s * 0.7}px;height:${s}px;pointer-events:none;clip-path:polygon(50% 0,100% 40%,50% 100%,0 40%);background:linear-gradient(135deg,#ffffff,#FF8AC8 45%,#D0408A)`;
    return el;
  }

  /**
   * Sandstorm: a sandy haze sweeps over the whole scene, sprites included,
   * while gusts of sand streak across it, grains whip past and big dust
   * clouds roll through; then it clears.
   */
  private static async playSandstorm(refs: BattleStageRefs) {
    const { fieldEl, fxEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const total = 1500;

    // The haze sits on the effects layer, so it veils the sprites too.
    const storm = document.createElement('div');
    storm.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;background:linear-gradient(180deg,#D9A868aa,#C88A4Ebb 55%,#B87A40aa)';
    fxEl.appendChild(storm);

    // Wind: sand-coloured streaks rushing left to right.
    FxEffects.speedLines(storm, W, H, 1, ['#F2D3A0', '#A8743C']);

    // Big, soft dust clouds rolling through.
    for (let i = 0; i < 6; i++) {
      const cw = W * (0.3 + Math.random() * 0.25);
      const cloud = document.createElement('div');
      cloud.style.cssText = `position:absolute;left:0;top:${Math.random() * H - cw * 0.2}px;width:${cw}px;height:${cw * 0.45}px;border-radius:50%;background:radial-gradient(ellipse,#E6BE8288,#D4A26A44 55%,#D4A26A00 72%);filter:blur(4px)`;
      storm.appendChild(cloud);
      cloud.animate([
        { transform: `translateX(${-cw}px)` },
        { transform: `translateX(${W}px)` }
      ], { duration: 900 + Math.random() * 500, delay: -Math.random() * 900, iterations: Infinity, easing: 'linear' });
    }

    // Grains: small specks whipping past on a slight wavy path.
    const grains = ['#F6E0B4', '#C8955A', '#8E5E2C', '#E8C48C'];
    for (let i = 0; i < 90; i++) {
      const sz = 1.5 + Math.random() * 2.5;
      const y = Math.random() * H;
      const wave = (Math.random() * 2 - 1) * 14;
      const g = document.createElement('div');
      g.style.cssText = `position:absolute;left:0;top:${y}px;width:${sz}px;height:${sz}px;border-radius:50%;background:${grains[i % grains.length]}`;
      storm.appendChild(g);
      g.animate([
        { transform: 'translate(-10px,0)' },
        { transform: `translate(${W * 0.5}px,${wave}px)` },
        { transform: `translate(${W + 10}px,${-wave * 0.5}px)` }
      ], { duration: 350 + Math.random() * 300, delay: -Math.random() * 600, iterations: Infinity, easing: 'linear' });
    }

    Fx.shakeField(fieldEl, 0.25);
    await Fx.anim(storm, [
      { opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { opacity: 1, offset: 0.77 },
      { opacity: 0 }
    ], { duration: total, easing: 'ease-in-out' });
    storm.remove();
  }

  /**
   * Rock Slide: a hail of stones falls from above onto the target. Each one
   * lands somewhere on the sprite, bounces off and fades, while the target
   * shakes under the hits and the ground shakes at the end.
   */
  private static async playRockSlide(refs: BattleStageRefs, target: Point) {
    const { fxEl, fieldEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const spreadX = Math.max(r.width * 0.5, 34);
    const spreadY = Math.max(r.height * 0.4, 28);
    const count = 26;
    const span = 1100;

    const stones: Promise<void>[] = [];
    for (let i = 0; i < count; i++) {
      const size = 14 + Math.random() * 14;
      const stone = FxGlyphs.rockChunk(size);
      const land: Point = {
        x: target.x + (Math.random() * 2 - 1) * spreadX,
        y: target.y + (Math.random() * 2 - 1) * spreadY
      };
      Fx.place(stone, land);
      fxEl.appendChild(stone);
      const fall = 150 + land.y + r.height * 0.5;
      const drift = (Math.random() * 2 - 1) * 18;
      const bounceX = (Math.random() * 2 - 1) * 26;
      const spin = (Math.random() * 2 - 1) * 200;
      const delay = (i / count) * span + Math.random() * 60;
      stones.push(
        Fx.anim(stone, [
          { transform: `translate(${-drift}px,${-fall}px) rotate(0deg)`, opacity: 1, easing: 'ease-in' },
          { transform: 'translate(0,0) rotate(' + spin * 0.6 + 'deg)', opacity: 1, offset: 0.55, easing: 'ease-out' },
          { transform: `translate(${bounceX * 0.6}px,-14px) rotate(${spin * 0.8}deg)`, opacity: 1, offset: 0.75, easing: 'ease-in' },
          { transform: `translate(${bounceX}px,${spreadY * 0.6}px) rotate(${spin}deg)`, opacity: 0 }
        ], { duration: 620, delay }).then(() => stone.remove())
      );
    }

    // The target flinches under the hits.
    for (let t = 340; t < span + 340; t += 220) {
      setTimeout(() => {
        Fx.flash(targetEl, '#F2CF6B', 0.35);
        Fx.shake(targetEl, 4);
      }, t);
    }
    setTimeout(() => Fx.shakeField(fieldEl, 0.5), span);
    await Promise.all(stones);
  }
}
