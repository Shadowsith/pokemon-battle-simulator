import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The icy mist rolls over the target from `MIST` (ms); the target freezes white at `FREEZE` (ms). */
const MIST = 400;
const FREEZE = 550;

/**
 * Sheer Cold, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/b/bb/Eisesk%C3%A4lte_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/f/fb/Eisesk%C3%A4lte_Gen5.png
 *
 * The scene goes dark (0-0.3 s) and big see-through ice crystals with pale
 * violet rims drift slowly across it (0.2-1.45 s). A cold white mist rolls
 * in over the target (0.4-1.25 s) and the target freezes into a white,
 * glittering block (0.55-1.3 s). The scene clears (1.3-1.6 s).
 */
export class SheerCold {
  static async play(refs: BattleStageRefs, target: Point) {
    const { fieldEl, fxEl, targetEl } = refs;
    const f = Fx.rect(fieldEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.95 }], { duration: 300, easing: 'ease-out' })];
    for (let i = 0; i < 9; i++) {
      const s = 34 + (i % 3) * 14;
      const crystal = FxGlyphs.hexagon(s, 'radial-gradient(circle,#B8B0E000 45%,#D8D0FF66 75%,#F4F0FFcc 92%)', '#B8A8FF');
      const at: Point = { x: f.width * ((i * 0.37) % 1), y: f.height * (0.12 + ((i * 0.29) % 0.7)) };
      const drift = (i % 2 ? 1 : -1) * 40;
      effects.push(Fx.spawn(fxEl, crystal, at, [
        { transform: 'translate(0,0) rotate(0deg) scale(.6)', opacity: 0 },
        { transform: `translate(${drift * 0.3}px,8px) rotate(20deg) scale(1)`, opacity: 0.9, offset: 0.25 },
        { transform: `translate(${drift * 0.75}px,20px) rotate(45deg) scale(1)`, opacity: 0.9, offset: 0.75 },
        { transform: `translate(${drift}px,28px) rotate(60deg) scale(.9)`, opacity: 0 }
      ], { duration: 1150, delay: 200 + (i % 4) * 30, easing: 'linear' }));
    }
    effects.push(Fx.wait(MIST).then(() =>
      FxEffects.smokeCloud(fxEl, { x: target.x, y: target.y + tr.height * 0.2 }, tr.width * 1.4, tr.height * 0.7, ['#F4F6FF', '#C8CCE0'], 12, 550, 300)
    ));
    effects.push(Fx.glow(targetEl, 'brightness(0) invert(1) drop-shadow(0 0 6px #DDE6FF)', 750, FREEZE));
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5;
      effects.push(Fx.spawn(fxEl, FxGlyphs.sparkStar(12, '#ffffff'), { x: target.x + Math.cos(a) * tr.width * 0.45, y: target.y + Math.sin(a) * tr.height * 0.4 }, [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1, offset: 0.4 },
        { transform: 'scale(0)', opacity: 0 }
      ], { duration: 320, delay: FREEZE + 150 + i * 80, easing: 'ease-out' }));
    }
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.95 }, { opacity: 0 }], { duration: 300, easing: 'ease-in' });
    dim.remove();
  }
}
