import { Point, BattleStageRefs } from '../../animation.types';
import { DIM_BACKDROP } from '../../animation.constants';
import { Fx } from '../../fx';
import { FxGlyphs } from '../../fx-glyphs';
import { FxEffects } from '../../fx-effects';

/** The shards fly from `SHOOT` (ms) and hit at `HIT` (ms). */
const SHOOT = 400;
const HIT = 650;
const SHARDS = 4;

/**
 * Ice Shard, after the Gen 4 / Gen 5 animation:
 * - Gen 4: https://www.pokewiki.de/images/d/d2/Eissplitter_Gen4.png
 * - Gen 5: https://www.pokewiki.de/images/6/63/Eissplitter_Gen5.png
 *
 * The scene dims and a cold white mist puffs up round the user
 * (0-0.4 s). Four ice shards shoot out of it straight at the target
 * (0.4-0.65 s) and shatter there in white starbursts while the target
 * flashes and shakes; glints twinkle round it (0.65-1.15 s). The scene
 * clears (1.15-1.35 s).
 */
export class IceShard {
  static async play(refs: BattleStageRefs, launch: Point, target: Point) {
    const { fieldEl, fxEl, launchEl, targetEl } = refs;
    const lr = Fx.rect(launchEl);
    const tr = Fx.rect(targetEl);
    const dim = Fx.backdrop(fieldEl, DIM_BACKDROP);
    const effects: Promise<void>[] = [
      Fx.anim(dim, [{ opacity: 0 }, { opacity: 0.6 }], { duration: 200, easing: 'ease-out' }),
      FxEffects.smokeCloud(fxEl, launch, lr.width * 0.8, lr.height * 0.6, ['#F4FAFF', '#D4E6F4'], 8, 450, 150)
    ];
    const dx = target.x - launch.x;
    const dy = target.y - launch.y;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    for (let i = 0; i < SHARDS; i++) {
      const off = (i - (SHARDS - 1) / 2) * 10;
      const shard = FxGlyphs.iceShard(12);
      const wrap = Fx.box(12, 17, 'filter:drop-shadow(0 0 4px #CFF0FF)');
      shard.style.left = '0';
      shard.style.top = '0';
      wrap.appendChild(shard);
      effects.push(Fx.spawn(fxEl, wrap, { x: launch.x, y: launch.y + off }, [
        { transform: `translate(0,0) rotate(${ang}deg) scale(.5)`, opacity: 0 },
        { transform: `translate(${dx * 0.1}px,${dy * 0.1}px) rotate(${ang}deg) scale(1)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${dx}px,${dy - off * 0.5}px) rotate(${ang}deg) scale(1)`, opacity: 1 }
      ], { duration: HIT - SHOOT, delay: SHOOT + i * 30, easing: 'ease-in' }));
      effects.push(Fx.wait(HIT + i * 30).then(() => Fx.spawn(fxEl, FxGlyphs.spikyBurst(Math.max(tr.width * 0.35, 22), '#ffffff', '#E4F4FF', '#ffffff'),
        { x: target.x + off * 1.5, y: target.y + ((i % 2) - 0.5) * tr.height * 0.3 }, [
          { transform: 'scale(.3)', opacity: 1 },
          { transform: 'scale(1)', opacity: 1, offset: 0.4 },
          { transform: 'scale(1.1)', opacity: 0 }
        ], { duration: 280, easing: 'ease-out' })));
    }
    effects.push(Fx.wait(HIT).then(() => {
      Fx.flash(targetEl, '#E4F4FF', 0.6);
      Fx.shake(targetEl, 5);
      return Promise.all(Array.from({ length: 5 }, (_, i) => Fx.spawn(fxEl, FxGlyphs.sparkStar(10, '#ffffff'),
        { x: target.x + (i - 2) * tr.width * 0.2, y: target.y + (((i * 3) % 5) / 4 - 0.5) * tr.height * 0.6 }, [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'scale(0)', opacity: 0 }
        ], { duration: 300, delay: 150 + i * 60, easing: 'ease-out' }))).then(() => void 0);
    }));
    await Promise.all(effects);
    await Fx.anim(dim, [{ opacity: 0.6 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
    dim.remove();
  }
}
