import { Point, BattleStageRefs, MoveAnimRegistry } from '../animation.types';
import { Fx } from '../fx';
import { FxGlyphs } from '../fx-glyphs';
import { FxEffects } from '../fx-effects';

/** Hand-made animations for Rock-type moves. */
export class RockMoveAnimations {
  /** Hand-made Rock move animations, by @pkmn/sim move id. */
  static readonly anims: MoveAnimRegistry = {
    rockslide: (refs, _launch, target) => RockMoveAnimations.playRockSlide(refs, target),
    sandstorm: (refs) => RockMoveAnimations.playSandstorm(refs)
  };

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
