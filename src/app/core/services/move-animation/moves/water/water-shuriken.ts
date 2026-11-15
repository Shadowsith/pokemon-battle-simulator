import { Point, BattleStageRefs, MoveVisual } from '../../animation.types';
import { Fx } from '../../fx';

/**
 * Water Shuriken, after the XY animation:
 * https://www.pokewiki.de/images/7/77/Wasser-Shuriken_Gen6.png
 *
 * For every hit (`v.hits`, 0.5 s each): the user crouches and flings a
 * spinning blue water star (0-0.3 s) that bursts on the target in a
 * white-blue splash with flying droplets (0.3-0.5 s).
 */
export class WaterShuriken {
  static async play(refs: BattleStageRefs, launch: Point, target: Point, v: MoveVisual) {
    const { fxEl, launchEl, targetEl } = refs;
    const tr = Fx.rect(targetEl);
    const original = launchEl.style.transform;
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    for (let hit = 0; hit < Math.max(v.hits, 1); hit++) {
      Fx.anim(launchEl, [
        { transform: `${original} translateY(0) scale(1,1)` },
        { transform: `${original} translateY(4px) scale(1.05,.93)`, offset: 0.4 },
        { transform: `${original} translateY(0) scale(1,1)` }
      ], { duration: 260, easing: 'ease-out', fill: 'none' });
      await Fx.wait(80);
      await Fx.spawn(fxEl, WaterShuriken.star(26), launch, [
        { transform: 'translate(0,0) rotate(0deg) scale(.6)' },
        { transform: `translate(${dx}px,${dy}px) rotate(900deg) scale(1)` }
      ], { duration: 220, easing: 'linear' });
      Fx.flash(targetEl, '#7AC8FF', 0.5);
      Fx.shake(targetEl, 4);
      const splash: Promise<void>[] = [
        Fx.spawn(fxEl, Fx.box(Math.max(tr.width * 0.7, 46), Math.max(tr.width * 0.7, 46), 'border-radius:50%;background:radial-gradient(circle,#ffffff 0 25%,#BFE6FFcc 45%,#4AA8FF00 70%)'), target, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1.1)', opacity: 0 }
        ], { duration: 260, easing: 'ease-out' })
      ];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
        const d = 22 + Math.random() * 16;
        splash.push(
          Fx.spawn(fxEl, Fx.box(6, 6, 'border-radius:50% 50% 50% 0;background:#E8F6FF;box-shadow:0 0 3px #4AA8FF'), target, [
            { transform: 'translate(0,0)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d + 8}px)`, opacity: 0 }
          ], { duration: 280, easing: 'ease-out' })
        );
      }
      await Promise.all(splash);
    }
  }

  /** A four-pointed blue water star `s` px across, white at the centre. */
  private static star(s: number): HTMLElement {
    const el = Fx.box(s, s, 'filter:drop-shadow(0 0 4px #4AA8FF)');
    el.appendChild(Fx.box(s, s, 'left:0;top:0;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);background:radial-gradient(circle,#ffffff 0 15%,#8AD0FF 40%,#2A7AE0)'));
    return el;
  }
}
