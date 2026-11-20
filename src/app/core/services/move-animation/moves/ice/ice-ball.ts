import { Point, BattleStageRefs } from '../../animation.types';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The ball smashes into the target at `HIT` (ms); the shards are gone at ~0.95 s. */
const HIT = 500;
/** How many ice shards burst off the target. */
const SHARDS = 10;

/**
 * Ice Ball, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/c/ca/Frostbeule_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/69/Frostbeule_Gen5.png
 *
 * A glowing white-blue ball of ice rolls through the air from the user to
 * the target, trailing frosty mist (0-0.5 s). It smashes into the target
 * (0.5 s), which flashes icy blue and shakes, and ice shards burst off it in
 * all directions (0.5-0.95 s).
 */
export class IceBall {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fxEl, targetEl } = refs;
    const r = Fx.rect(targetEl);
    const w = Math.max(r.width, 50);
    const s = Math.max(w * 0.35, 24);
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const arc = -Math.max(Math.abs(dx) * 0.12, 20);

    const ball = Fx.box(s, s, 'border-radius:50%;background:radial-gradient(circle at 35% 35%,#ffffff,#CFF4FF 40%,#6AC8F0 75%,#3A8AC8);box-shadow:0 0 10px #CFF4FF,inset -3px -3px 6px #2A6AA8');
    const glint = FxGlyphs.sparkStar(s * 0.5, '#ffffff');
    glint.style.left = `${s * 0.1}px`;
    glint.style.top = `${s * 0.05}px`;
    ball.appendChild(glint);
    const effects: Promise<void>[] = [
      Fx.spawn(fxEl, ball, launch, [
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${dx * 0.15}px,${dy * 0.15 + arc * 0.5}px) scale(.8)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.5 + arc}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px,${dy}px) scale(1.1)`, opacity: 1, offset: 0.92 },
        { transform: `translate(${dx}px,${dy}px) scale(1.4)`, opacity: 0 }
      ], { duration: HIT + 40, easing: 'linear' })
    ];
    for (let i = 1; i <= 3; i++) {
      const u = i / 4;
      effects.push(Fx.wait(HIT * u).then(() =>
        FxEffects.smokePuff(fxEl, { x: launch.x + dx * u, y: launch.y + dy * u + arc * Math.sin(Math.PI * u) }, s * 1.1, ['#F0FAFF', '#B8DCF0'])));
    }
    for (let i = 0; i < SHARDS; i++) {
      const a = (Math.PI * 2 * i) / SHARDS;
      const d = w * (0.55 + (i % 3) * 0.15);
      effects.push(Fx.spawn(fxEl, FxGlyphs.iceShard(10 + (i % 3) * 3), target, [
        { transform: `translate(0,0) rotate(${i * 40}deg) scale(.5)`, opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d * 0.75}px) rotate(${i * 40 + 120}deg) scale(1)`, opacity: 0 }
      ], { duration: 450, easing: 'ease-out', delay: HIT }));
    }
    setTimeout(() => {
      Fx.flash(targetEl, '#9AE0FF', 0.6);
      Fx.shake(targetEl, 5);
    }, HIT);
    await Promise.all(effects);
  }
}
