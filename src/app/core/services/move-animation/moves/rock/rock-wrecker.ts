import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/**
 * Rock Wrecker, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/8/8d/Felswerfer_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/c/c3/Felswerfer_Gen5.png
 *
 * The scene darkens (0-0.25 s) and turns into a blazing orange-yellow sky
 * with speed lines (0.25-0.5 s). Rocks rise round the user while it glows
 * golden (0.5-1.0 s); a huge boulder swells in front of it (0.9-1.1 s) and
 * hurtles at the target (1.1-1.45 s). It smashes into a yellow dust cloud
 * with flying debris (hit at 1.45 s, to ~2.1 s); the scene clears (2.1-2.35 s).
 */
export class RockWrecker {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const W = fieldEl.clientWidth;
    const H = fieldEl.clientHeight;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);

    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    await Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.9 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    const sky = Fx.backdrop(fieldEl, 'background:linear-gradient(180deg,#FFB040,#FFE070 40%,#FFD040 60%,#FF7A20)');
    dim.after(sky);
    FxEffects.speedLines(sky, W, H, v.dir, ['#FFF4C0', '#FF5A10']);
    await Fx.anim(sky, [{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' });
    dim.remove();

    // Rocks rise round the user, which glows golden.
    const parts: Promise<void>[] = [];
    parts.push(
      Fx.anim(launchEl, [
        { filter: 'none' },
        { filter: 'brightness(1.3) sepia(.7) saturate(2.5) drop-shadow(0 0 8px #FFE070)', offset: 0.3 },
        { filter: 'brightness(1.3) sepia(.7) saturate(2.5) drop-shadow(0 0 8px #FFE070)', offset: 0.8 },
        { filter: 'none' }
      ], { duration: 800, easing: 'ease-in-out', fill: 'none' })
    );
    for (let i = 0; i < 9; i++) {
      const rock = FxGlyphs.rockChunk(9 + Math.random() * 9);
      Fx.place(rock, { x: launch.x + (Math.random() * 2 - 1) * lr.width * 0.8, y: launch.y + lr.height * (0.3 + Math.random() * 0.2) });
      fxEl.appendChild(rock);
      const rise = lr.height * (0.5 + Math.random() * 0.6);
      parts.push(
        Fx.anim(rock, [
          { transform: 'translateY(0) rotate(0deg)', opacity: 0 },
          { transform: `translateY(${-rise * 0.6}px) rotate(60deg)`, opacity: 1, offset: 0.4 },
          { transform: `translateY(${-rise}px) rotate(120deg)`, opacity: 1, offset: 0.85 },
          { transform: `translateY(${-rise - 10}px) rotate(140deg)`, opacity: 0 }
        ], { duration: 600, delay: i * 40, easing: 'ease-out', fill: 'backwards' }).then(() => rock.remove())
      );
    }
    await Fx.wait(400);

    // The boulder swells in front of the user, then hurtles at the target.
    const size = Math.max(lr.height * 0.9, 70);
    const from: Point = { x: launch.x + v.dir * lr.width * 0.4, y: launch.y - lr.height * 0.1 };
    const boulder = FxGlyphs.rockChunk(size);
    boulder.style.filter = 'drop-shadow(0 0 6px #FFF0A0)';
    Fx.place(boulder, from);
    fxEl.appendChild(boulder);
    await Fx.anim(boulder, [{ transform: 'scale(0) rotate(0deg)' }, { transform: 'scale(1) rotate(-20deg)' }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
    await Promise.all(parts);
    const dx = target.x - from.x;
    const dy = target.y - from.y;
    const trails = [0.55, 0.3].map((o, i) => {
      const ghost = FxGlyphs.rockChunk(size);
      ghost.style.opacity = `${o}`;
      Fx.place(ghost, from);
      fxEl.appendChild(ghost);
      return Fx.anim(ghost, [
        { transform: 'translate(0,0) scale(1) rotate(-20deg)', opacity: o },
        { transform: `translate(${dx}px,${dy}px) scale(.8) rotate(${-20 + 300 * v.dir}deg)`, opacity: 0 }
      ], { duration: 350, delay: (i + 1) * 50, easing: 'ease-in' }).then(() => ghost.remove());
    });
    await Fx.anim(boulder, [
      { transform: 'translate(0,0) scale(1) rotate(-20deg)' },
      { transform: `translate(${dx * 0.5}px,${dy * 0.5 - H * 0.08}px) scale(.9) rotate(${-20 + 150 * v.dir}deg)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) scale(.8) rotate(${-20 + 300 * v.dir}deg)` }
    ], { duration: 350, easing: 'ease-in' });
    boulder.remove();

    // Smash: yellow dust cloud and flying debris.
    Fx.flash(targetEl, '#FFF0A0', 0.7);
    Fx.shake(targetEl, 8);
    Fx.shakeField(fieldEl, 1);
    const hit: Promise<void>[] = [...trails];
    const dust = Math.max(tr.width * 1.4, 110);
    hit.push(FxEffects.smokePuff(fxEl, target, dust, ['#E8E070', '#B8A840']));
    setTimeout(() => hit.push(FxEffects.smokePuff(fxEl, { x: target.x, y: target.y - tr.height * 0.15 }, dust * 0.8, ['#F0E890', '#C8B850'])), 150);
    for (let i = 0; i < 10; i++) {
      const bit = FxGlyphs.rockChunk(6 + Math.random() * 8);
      Fx.place(bit, target);
      fxEl.appendChild(bit);
      const ang = Math.random() * Math.PI * 2;
      const d = dust * (0.5 + Math.random() * 0.4);
      hit.push(
        Fx.anim(bit, [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * d}px,${Math.sin(ang) * d * 0.6 + 20}px) rotate(${200 * (Math.random() * 2 - 1)}deg)`, opacity: 0 }
        ], { duration: 550, delay: Math.random() * 80, easing: 'ease-out' }).then(() => bit.remove())
      );
    }
    await Fx.wait(250);
    await Promise.all(hit);

    await Fx.anim(sky, [{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'ease-in' });
    sky.remove();
  }
}
